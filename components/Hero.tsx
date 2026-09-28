"use client";

import { useEffect, useRef, useState } from "react";
import type { Copy } from "@/lib/copy";
import { prefersReducedMotion, useScrollFrame } from "@/lib/fx";
import type { GlyphRun } from "@/lib/light/mask";
import type { HeroLight } from "@/lib/light/renderer";
import { startScramble } from "@/lib/scramble";
import styles from "./Hero.module.css";

/** Så lenge uten pekerinput før lyset begynner å drive av seg selv. */
const IDLE_MS = 1600;
/** Andel av avstanden lyset tar igjen per 60 Hz-frame. */
const EASE = 0.09;
/** Ordmerket animerer inn så lenge; bokstavmasken tegnes hver frame imens. */
const INTRO_MS = 1500;
/** Når lyset tenner, målt fra mount — mens bokstavene lander. */
const LIGHTS_ON_MS = 650;
/** Så lenge introen venter på WebGPU før den tenner CSS-lyset i stedet. */
const GPU_WAIT_MS = 1400;
/** Tallene teller ikke før tallraden er animert inn (målt fra sidelasting). */
const STATS_COUNT_AT_MS = 900;
/**
 * Hvor mørkt glasset i bokstavene er: absorpsjon per em. En stamme er ~0.24 em bred, så 3.8
 * slipper ~40 % av lyset gjennom én stamme, og mindre gjennom tykke partier og overlapp.
 */
const GLASS_ABSORB_PER_EM = 1.6;
/** Scene-piksler lyset får regne på: finpeker (desktop) vs. berøringsskjerm. */
const BUDGET_FINE = 420_000;
const BUDGET_COARSE = 220_000;

/** Lysrør som tenner: to korte blink, så en myk rampe opp. */
function lightsOn(ms: number): number {
  if (ms < 0) return 0;
  if (ms < 60) return 0.5;
  if (ms < 150) return 0.06;
  if (ms < 200) return 0.75;
  if (ms < 300) return 0.18;
  const k = Math.min(1, (ms - 300) / 700);
  return 0.18 + 0.82 * (1 - Math.pow(1 - k, 3));
}

interface Props {
  t: Copy;
  ongoingCount: number;
  totalCount: number;
}

export default function Hero({ t, ongoingCount, totalCount }: Props) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const wordmarkRef = useRef<HTMLHeadingElement | null>(null);
  const maskRef = useRef<HTMLSpanElement | null>(null);
  const line1Refs = useRef<(HTMLSpanElement | null)[]>([]);
  const line2Refs = useRef<(HTMLSpanElement | null)[]>([]);
  const roleRef = useRef<HTMLSpanElement | null>(null);
  const statRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const rolesRef = useRef(t.roles);
  const [lit, setLit] = useState(false);

  const facts = [
    { value: ongoingCount, label: t.factRoles },
    { value: totalCount, label: t.factTotal },
    { value: 120, label: t.factCredits },
    { value: 3, label: t.factLive },
  ];

  // Rollelinja: scramble-loopen leser alltid gjeldende språkliste via ref, og
  // språkbytte tvinger en umiddelbar overgang så byttet leses som intendert.
  const ctrlRef = useRef<ReturnType<typeof startScramble> | null>(null);
  const firstLang = useRef(true);
  useEffect(() => {
    const el = roleRef.current;
    if (!el) return;
    ctrlRef.current = startScramble(el, () => rolesRef.current);
    return () => {
      ctrlRef.current?.stop();
      ctrlRef.current = null;
    };
  }, []);
  useEffect(() => {
    rolesRef.current = t.roles;
    if (firstLang.current) {
      firstLang.current = false;
      return;
    }
    ctrlRef.current?.bump();
  }, [t.roles]);

  // Parallax på ordmerket og rutenettet. Kalles både fra scroll-handleren og fra lys-loopen
  // rett før den tegner, så bokstavmasken alltid tegnes med de transformene som faktisk vises.
  const applyParallax = (y: number) => {
    const wm = wordmarkRef.current;
    if (wm) {
      wm.style.transform = `translate3d(0,${Math.min(y * 0.22, 150)}px,0)`;
      wm.style.opacity = String(Math.max(0.12, 1 - y / 720));
    }
    if (gridRef.current)
      gridRef.current.style.transform = `translate3d(0,${Math.min(y * 0.42, 260)}px,0)`;
    const split = Math.min(y * 0.11, 110);
    for (const el of line1Refs.current) if (el) el.style.transform = `translate3d(${-split}px,0,0)`;
    for (const el of line2Refs.current) if (el) el.style.transform = `translate3d(${split}px,0,0)`;
  };
  const parallaxRef = useRef(applyParallax);
  parallaxRef.current = applyParallax;

  // Lyset. Én rAF-loop eier pekerfølging, idle-drift, CSS-spotlighten over ordmerket og —
  // når nettleseren har WebGPU — det ekte lyset på lerretet bak. Uten WebGPU (eller hvis
  // GPU-en feiler underveis) står CSS-spotlighten og rutenettet igjen som før.
  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const mask = maskRef.current;
    const wordmark = wordmarkRef.current;
    const grid = gridRef.current;
    if (!section || !canvas || !mask || !wordmark || !grid) return;

    const still = prefersReducedMotion();
    const mountedAt = performance.now();
    const spot = { px: 0, py: 0, tx: 0, ty: 0, lastInput: -Infinity, placed: false };
    let light: HeroLight | null = null;
    let raf = 0;
    let last = mountedAt;
    let visible = true;
    let disposed = false;
    let gpuPending = !!navigator.gpu;
    let gpuReadyAt = Infinity;
    let lightsAt = Infinity;
    let shownLit = false;
    let needsRender = true;
    let lastExposure = -1;
    let maskScrollY = NaN;
    let lightRadius = 12;
    let glassAbsorb = 0;
    let runs: GlyphRun[] | null = null;
    // Skjermens egen frame-takt, målt før GPU-lyset starter (60, 120 — eller 30 i
    // strømsparing). En frame er treg først når den er klart lengre enn den.
    const baseline: number[] = [];
    let frames = 0;
    let gpuBusy = false;
    let slowFrames = 0;
    let sampledFrames = 0;

    const lines = () =>
      [line1Refs.current[0], line2Refs.current[0]].filter((el): el is HTMLSpanElement => !!el);

    const start = () => {
      if (raf || disposed || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const invalidate = () => {
      needsRender = true;
      start();
    };

    const measure = () => {
      const first = lines()[0];
      const size = first ? parseFloat(getComputedStyle(first).fontSize) : 120;
      lightRadius = Math.max(10, Math.min(19, size * 0.1));
      // Glasset absorberer per em, så en bokstavstamme slipper gjennom like mye lys uansett
      // skjermstørrelse.
      glassAbsorb = GLASS_ABSORB_PER_EM / size;
      runs = null;
      light?.invalidateMask();
      invalidate();
    };

    const fallBack = () => {
      light?.dispose();
      light = null;
      shownLit = false;
      setLit(false);
      invalidate();
    };

    const slowThreshold = () => {
      if (baseline.length < 8) return 40;
      const sorted = [...baseline].sort((a, b) => a - b);
      return Math.max(sorted[sorted.length >> 1] * 1.5, 22);
    };

    const frame = (now: number) => {
      raf = 0;
      if (disposed || !visible || document.hidden) return;
      const dt = Math.min(100, now - last);
      last = now;
      // Frames der GPU-en ikke fikk arbeid forrige runde, viser skjermens egen takt.
      frames += 1;
      if (!gpuBusy && frames > 3 && baseline.length < 60) baseline.push(dt);
      gpuBusy = false;

      if (!still) parallaxRef.current(window.scrollY);
      const sr = section.getBoundingClientRect();
      const mr = mask.getBoundingClientRect();
      const mx = mr.left - sr.left;
      const my = mr.top - sr.top;

      if (still) {
        // Fast lys til høyre mellom linjene: skygger begge veier uten bevegelse.
        spot.px = spot.tx = mx + mr.width * 0.8;
        spot.py = spot.ty = my + mr.height * 0.47;
      } else {
        if (!spot.placed) {
          spot.px = spot.tx = mx + mr.width * 0.5;
          spot.py = spot.ty = my + mr.height * 0.5;
          spot.placed = true;
        }
        if (now - spot.lastInput > IDLE_MS) {
          // Driver i en Lissajous-bane rundt ordmerket, men stor nok til å nå over og under
          // det — på mobil er ordmerket lavt, og lyset skal fylle hele høyden.
          const sec = (now - mountedAt) / 1000;
          const ax = Math.max(mr.width * 0.3, sr.width * 0.32);
          const ay = Math.max(mr.height * 0.28, sr.height * 0.22);
          spot.tx = mx + mr.width * 0.5 + ax * Math.sin(sec * 0.42);
          spot.ty = my + mr.height * 0.5 + ay * Math.sin(sec * 0.63 + 1.1);
        }
        const k = 1 - Math.pow(1 - EASE, dt / (1000 / 60));
        spot.px += (spot.tx - spot.px) * k;
        spot.py += (spot.ty - spot.py) * k;
      }

      const radius = Math.min(260, sr.width * 0.36);
      const g = `radial-gradient(circle ${Math.round(radius)}px at ${Math.round(
        spot.px - mx
      )}px ${Math.round(spot.py - my)}px, #000 0%, rgba(0,0,0,.35) 55%, transparent 100%)`;
      mask.style.webkitMaskImage = g;
      mask.style.maskImage = g;

      // Introen tenner lyset når WebGPU er klar, eller når vi har ventet lenge nok på den.
      if (gpuPending && now - mountedAt > GPU_WAIT_MS) gpuPending = false;
      if (lightsAt === Infinity && !gpuPending) lightsAt = Math.max(now, mountedAt + LIGHTS_ON_MS);
      const on = still ? 1 : lightsOn(now - lightsAt);
      mask.style.opacity = String(on);
      // Rutenettet er CSS-lysets gulv: det tennes sammen med lyset, og viker for flisene
      // når GPU-lyset tar over.
      grid.style.opacity = light ? "0" : String(on);

      const current = light;
      if (current) {
        // Bokstavene har flyttet seg (intro eller scroll): tegn masken på nytt.
        if (now - mountedAt < INTRO_MS || window.scrollY !== maskScrollY) {
          maskScrollY = window.scrollY;
          current.invalidateMask();
          needsRender = true;
        }
        // Kom GPU-en etter at lyset alt var tent, glir den inn i stedet for å flimre på nytt.
        const late = gpuReadyAt > lightsAt ? Math.min(1, (now - gpuReadyAt) / 600) : 1;
        const fade = Math.max(0, Math.min(1, 1 + sr.top / (sr.height * 0.9)));
        const exposure = (still ? 1 : on * late) * fade;
        // Mørkt to frames på rad: lerretet viser alt blekk, så GPU-en kan hvile. needsRender
        // står til lyset tennes, så første lyse frame får fersk maske.
        const dark = exposure === 0 && lastExposure === 0 && shownLit;
        if (!dark && (!still || needsRender)) {
          const drew = current.render({
            x: spot.px,
            y: spot.py,
            radius: lightRadius,
            exposure,
            absorb: glassAbsorb,
          });
          needsRender = false;
          gpuBusy = true;
          lastExposure = exposure;
          if (drew && !shownLit && light === current) {
            shownLit = true;
            setLit(true);
          }
        }
        // Henger ikke GPU-en med, senkes oppløsningen; hjelper ikke det, faller vi tilbake.
        if (!still && !dark && light === current && now - gpuReadyAt > 2500) {
          sampledFrames += 1;
          if (dt > slowThreshold()) slowFrames += 1;
          if (sampledFrames >= 90) {
            if (slowFrames > 45 && !current.degrade()) fallBack();
            sampledFrames = 0;
            slowFrames = 0;
          }
        }
      }

      // Med redusert bevegelse står alt stille: tegn bare på nytt når noe endrer seg.
      if (still) {
        needsRender = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    measure();

    const onPointer = (e: PointerEvent) => {
      if (still) return;
      const sr = section.getBoundingClientRect();
      spot.tx = e.clientX - sr.left;
      spot.ty = e.clientY - sr.top;
      spot.lastInput = performance.now();
    };
    section.addEventListener("pointermove", onPointer, { passive: true });
    section.addEventListener("pointerdown", onPointer, { passive: true });

    // Scroll endrer fade (og parallax); loopen oppdager selv at masken må tegnes på nytt.
    window.addEventListener("scroll", invalidate, { passive: true });

    const resize = new ResizeObserver(measure);
    resize.observe(wordmark);

    const io = new IntersectionObserver((entries) => {
      // Siste entry er den gjeldende; ved rask inn-og-ut kan de komme i samme batch.
      visible = entries[entries.length - 1].isIntersecting;
      invalidate();
    });
    io.observe(section);

    document.addEventListener("visibilitychange", start);

    start();

    void (async () => {
      if (!gpuPending) return;
      try {
        await document.fonts.ready;
        const [{ createHeroLight }, { drawRuns, measureRuns }] = await Promise.all([
          import("@/lib/light/renderer"),
          import("@/lib/light/mask"),
        ]);
        if (disposed) return;
        const created = await createHeroLight(canvas, {
          budget: window.matchMedia("(pointer: coarse)").matches ? BUDGET_COARSE : BUDGET_FINE,
          drawMask(ctx) {
            runs ??= measureRuns(lines(), ctx);
            drawRuns(ctx, runs, canvas.getBoundingClientRect());
          },
          onFailure: fallBack,
          requestRender: invalidate,
        });
        if (disposed) {
          created.dispose();
          return;
        }
        light = created;
        gpuReadyAt = performance.now();
        invalidate();
      } catch (error) {
        // Ingen brukbar WebGPU: CSS-spotlighten står allerede.
        if (process.env.NODE_ENV !== "production") console.warn("Hero-lyset er av:", error);
      } finally {
        gpuPending = false;
      }
    })();

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      section.removeEventListener("pointermove", onPointer);
      section.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", invalidate);
      document.removeEventListener("visibilitychange", start);
      resize.disconnect();
      io.disconnect();
      light?.dispose();
      light = null;
    };
  }, []);

  useScrollFrame(() => {
    const still = prefersReducedMotion();
    const vh = window.innerHeight;
    if (!still) applyParallax(window.scrollY);
    for (const el of statRefs.current) {
      if (!el || el.dataset.run) continue;
      const target = parseFloat(el.dataset.count || "0");
      if (still) {
        el.dataset.run = "1";
        el.textContent = String(target);
        continue;
      }
      if (el.getBoundingClientRect().top < vh * 0.92) {
        el.dataset.run = "1";
        const dec = target % 1 !== 0;
        el.textContent = "0";
        // performance.now() teller fra sidelasting, som er når tallradens intro starter.
        const t0 = Math.max(performance.now(), STATS_COUNT_AT_MS);
        const tick = () => {
          const k = Math.max(0, Math.min(1, (performance.now() - t0) / 1100));
          const v = target * (1 - Math.pow(1 - k, 3));
          el.textContent = dec ? v.toFixed(1) : String(Math.round(v));
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }
  });

  // Ordmerket rendres to ganger: en dempet kopi og en lime-kopi bak en radial maske som
  // følger lyset. Begge kopiene er aria-hidden — navnet leses fra .sr-only-linja i <h1>,
  // så det ikke dukker opp i duplikat.
  const stacked = (offset: number) => (
    <span className={styles.lines} aria-hidden="true">
      <span
        className={styles.line}
        ref={(el) => {
          line1Refs.current[offset] = el;
        }}
      >
        EIVIND
      </span>
      <span
        className={styles.line}
        ref={(el) => {
          line2Refs.current[offset] = el;
        }}
      >
        GEIRAN
      </span>
    </span>
  );

  return (
    <section ref={sectionRef} className={styles.section} data-light={lit ? "gpu" : "css"}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div ref={gridRef} className={styles.grid} />
      <div className={styles.stage}>
        {/* Sidens eneste h1. Ordmerket er dekorativt; den maskinlesbare
            overskriften er fullt navn + hva jeg driver med. */}
        <h1 ref={wordmarkRef} className={styles.wordmark}>
          <span className="sr-only">{t.heroHeading}</span>
          {stacked(0)}
          <span ref={maskRef} className={styles.mask}>
            {stacked(1)}
          </span>
        </h1>
        <div className={styles.below}>
          <div className={styles.roleRow}>
            <span className={styles.roleDot} />
            <span ref={roleRef} className={styles.roleText}>
              {t.roles[0]}
            </span>
          </div>
          <a href="#prosjekter" className={styles.cta}>
            {t.heroCta} <span className={styles.mono}>→</span>
          </a>
        </div>
      </div>
      <div className={styles.stats}>
        {facts.map((f, i) => (
          <div key={f.label} className={styles.stat}>
            <span
              ref={(el) => {
                statRefs.current[i] = el;
              }}
              data-count={f.value}
              className={styles.statValue}
            >
              {f.value}
            </span>
            <span className={styles.statLabel}>{f.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
