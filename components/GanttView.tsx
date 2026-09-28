"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TYPE_COLOR, type Copy } from "@/lib/copy";
import { rgba, type ExperienceVM } from "@/lib/derive";
import { prefersReducedMotion, useGlide, useScrollFrame } from "@/lib/fx";
import { MONTHS, yearOf } from "@/lib/time";
import type { ExperienceType, Lang } from "@/lib/types";
import { useQueryVariant } from "@/lib/variant";
import styles from "./GanttView.module.css";

const GANTT_SCRUB = true;
const BAND_ORDER: ExperienceType[] = ["Betalt", "Frivillig", "Utdanning"];

/* To måter å spole på mens vi tester dem (?gantt=auto gir den andre). Ingen av
   dem pinner diagrammet, så siden stopper aldri opp.
   «scroll»: playheaden spoler mens diagrammet scroller inn i bildet.
   «auto»: playheaden spiller av av seg selv når diagrammet kommer i syne, og
   tidsaksen kan dras i etterpå. */
const MODES = ["scroll", "auto"] as const;
// Scroll: spolingen starter når toppen av radene er 92 % ned i viewporten og
// er ferdig når den har nådd 30 %.
const SCRUB_FROM = 0.92;
const SCRUB_TO = 0.3;
const AUTO_MS = 2800;

interface Props {
  t: Copy;
  lang: Lang;
  vms: ExperienceVM[];
  axis: { minY: number; maxY: number };
  now: number;
}

interface FlatSeg {
  a: number;
  b: number;
  role: number;
}

export default function GanttView({ t, lang, vms, axis, now }: Props) {
  const { minY, maxY } = axis;
  const pos = (v: number) => ((v - minY) / (maxY - minY)) * 100;

  const { bands, roleFlat, segFlat, segStart } = useMemo(() => {
    const bands: { key: ExperienceType; roles: { vm: ExperienceVM; idx: number }[] }[] = [];
    const roleFlat: ExperienceVM[] = [];
    const segFlat: FlatSeg[] = [];
    const segStart: number[] = [];
    for (const key of BAND_ORDER) {
      const list = vms.filter((v) => v.typeKey === key);
      if (!list.length) continue;
      const roles = list.map((vm) => {
        const idx = roleFlat.length;
        roleFlat.push(vm);
        segStart.push(segFlat.length);
        for (const s of vm.segs) segFlat.push({ a: s[0], b: s[1], role: idx });
        return { vm, idx };
      });
      bands.push({ key, roles });
    }
    return { bands, roleFlat, segFlat, segStart };
  }, [vms]);

  // Detaljkortet er klikk-valgt — scrubbing endrer aldri valget. Default er
  // første betalte rolle (indeks 0).
  const [sel, setSel] = useState(0);
  useEffect(() => {
    if (sel >= roleFlat.length) setSel(0);
  }, [roleFlat.length, sel]);
  const d = roleFlat[Math.min(sel, Math.max(0, roleFlat.length - 1))];

  const ticks = useMemo(() => {
    const list: { year: number; x: number }[] = [];
    for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) list.push({ year: y, x: pos(y) });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minY, maxY]);

  const mode = useQueryVariant("gantt", MODES);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const axisRef = useRef<HTMLDivElement | null>(null);
  const knobRef = useRef<HTMLSpanElement | null>(null);
  const headRef = useRef<HTMLDivElement | null>(null);
  const yearRef = useRef<HTMLDivElement | null>(null);
  const monRef = useRef<HTMLDivElement | null>(null);
  const concRef = useRef<HTMLSpanElement | null>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const segRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Tegner diagrammet for en fremdrift p (0 = første år, 1 = aksens slutt).
  const render = (p: number) => {
    const year = minY + p * (maxY - minY);
    // Aksen har luft etter «nå» (maxY = now + margin); informasjonsverdiene
    // (måned, aktive roller, samtidighet) klampes til nå så slutt-tilstanden
    // aldri viser en fremtid der alt er «ferdig» — spesielt viktig under
    // prefers-reduced-motion, der p alltid er 1.
    const yEff = Math.min(year, now);

    // Identiske tilordninger trigger style recalc likevel, så alt sjekkes mot
    // inline-stilen først. Står p stille, blir hele skrivefasen en no-op i
    // stedet for 40+ oppdateringer per frame.
    const setStyle = (el: HTMLElement, prop: "left" | "width" | "opacity", v: string) => {
      if (el.style[prop] !== v) el.style[prop] = v;
    };

    if (headRef.current) setStyle(headRef.current, "left", `${p * 100}%`);
    if (knobRef.current) setStyle(knobRef.current, "left", `${p * 100}%`);
    if (yearRef.current) {
      const yv = String(Math.floor(yEff));
      if (yearRef.current.textContent !== yv) yearRef.current.textContent = yv;
    }
    if (monRef.current) {
      const mv = MONTHS[lang][Math.max(0, Math.min(11, Math.floor((yEff % 1) * 12)))];
      if (monRef.current.textContent !== mv) monRef.current.textContent = mv;
    }

    const live: Record<number, boolean> = {};
    for (let i = 0; i < segFlat.length; i++) {
      const s = segFlat[i];
      const el = segRefs.current[i];
      if (!el) continue;
      const k = Math.max(0, Math.min(1, (year - s.a) / Math.max(0.0001, s.b - s.a)));
      const fill = el.firstElementChild as HTMLElement | null;
      if (fill) setStyle(fill, "width", `${k * 100}%`);
      setStyle(el, "opacity", k > 0 ? "1" : "0.72");
      if (yEff >= s.a && yEff <= s.b) live[s.role] = true;
    }

    let conc = 0;
    for (let i = 0; i < roleFlat.length; i++) {
      const el = rowRefs.current[i];
      const vm = roleFlat[i];
      if (!el || !vm) continue;
      const act = !!live[i];
      if (act) conc += 1;
      setStyle(el, "opacity", act ? "1" : yEff > vm.eNum ? "0.55" : "0.45");
    }
    if (concRef.current) {
      const c = String(conc);
      if (concRef.current.textContent !== c) concRef.current.textContent = c;
    }
  };
  // Avspillingen går over flere frames og må alltid tegne med siste filter og
  // språk, ikke de som gjaldt da den startet.
  const renderRef = useRef(render);
  renderRef.current = render;

  // Scroll-modus: fremdriften glir etter scrollen i stedet for å hakke.
  const glide = useGlide(render, 140);

  // Auto-modus: avspilling, og dra i tidsaksen etterpå.
  const auto = useRef({ p: 0, raf: 0, played: false, drag: false }).current;

  const play = () => {
    cancelAnimationFrame(auto.raf);
    auto.played = true;
    let t0 = 0;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const k = Math.min(1, (ts - t0) / AUTO_MS);
      auto.p = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      renderRef.current(auto.p);
      auto.raf = k < 1 ? requestAnimationFrame(step) : 0;
    };
    auto.raf = requestAnimationFrame(step);
  };

  // Nytt filter: spill av på nytt neste gang diagrammet er i bildet.
  useEffect(() => {
    cancelAnimationFrame(auto.raf);
    auto.raf = 0;
    auto.played = false;
    auto.p = 0;
  }, [segFlat, auto]);

  useEffect(() => () => cancelAnimationFrame(auto.raf), [auto]);

  useScrollFrame(
    ({ vh }) => {
      const chart = chartRef.current;
      if (!chart) return;
      const r = chart.getBoundingClientRect();
      // Er diagrammet utenfor bildet står alle verdiene stille uansett.
      if (r.bottom < -200 || r.top > vh + 200) return;
      if (prefersReducedMotion() || !GANTT_SCRUB) {
        render(1);
        return;
      }
      if (mode === "scroll") {
        const p = (vh * SCRUB_FROM - r.top) / (vh * (SCRUB_FROM - SCRUB_TO));
        glide(Math.max(0, Math.min(1, p)));
        return;
      }
      if (!auto.played && r.top < vh * 0.72 && r.bottom > vh * 0.28) play();
      else if (!auto.raf) render(auto.p);
    },
    [segFlat, roleFlat, minY, maxY, lang, mode]
  );

  const scrubTo = (x: number) => {
    const el = axisRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    auto.p = Math.max(0, Math.min(1, (x - r.left) / Math.max(1, r.width)));
    render(auto.p);
  };

  const onAxisDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== "auto") return;
    cancelAnimationFrame(auto.raf);
    auto.raf = 0;
    auto.played = true;
    auto.drag = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Eldre nettlesere uten pointer capture — dra fungerer likevel.
    }
    scrubTo(e.clientX);
  };

  const onAxisMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (auto.drag) scrubTo(e.clientX);
  };

  const onAxisUp = () => {
    auto.drag = false;
  };

  return (
    <div className={styles.wrap} data-scrub={mode === "auto" ? "" : undefined}>
      <div className={styles.readout}>
        <div className={styles.readoutLeft}>
          <div className={styles.yearGroup}>
            <div ref={yearRef} className={styles.year}>
              {Math.ceil(minY)}
            </div>
            <div ref={monRef} className={styles.month}>
              {MONTHS[lang][0]}
            </div>
          </div>
          <div>
            <div className={styles.concRow}>
              <span ref={concRef} className={styles.conc}>
                0
              </span>
              <span className={styles.concLabel}>{t.concurrent}</span>
            </div>
            <p className={styles.hint}>
              {mode === "auto" ? t.ganttAutoHint : t.ganttHint} · {t.pickHint}
            </p>
          </div>
        </div>
        {mode === "auto" && (
          <button
            type="button"
            className={styles.replay}
            onClick={() => {
              auto.p = 0;
              play();
            }}
          >
            ↻ {t.ganttReplay}
          </button>
        )}
      </div>

      <div className={styles.axisRow}>
        <span className={styles.axisLabel}>{t.roleCol}</span>
        <div
          ref={axisRef}
          className={styles.axis}
          onPointerDown={onAxisDown}
          onPointerMove={onAxisMove}
          onPointerUp={onAxisUp}
          onPointerCancel={onAxisUp}
        >
          {ticks.map((tk) => (
            <span
              key={tk.year}
              className={styles.tick}
              style={{
                left: `${tk.x}%`,
                color: tk.year === yearOf(now) ? "var(--lime)" : "rgba(244,241,232,.34)",
              }}
            >
              {tk.year}
            </span>
          ))}
          <span ref={knobRef} className={styles.knob} />
        </div>
      </div>

      <div ref={chartRef} className={styles.chart}>
        <div className={styles.overlay}>
          {ticks.map((tk) => (
            <div
              key={tk.year}
              className={styles.gridline}
              style={{
                left: `${tk.x}%`,
                background:
                  tk.year === yearOf(now) ? "rgba(217,255,99,.14)" : "rgba(244,241,232,.05)",
              }}
            />
          ))}
          <div ref={headRef} className={styles.playhead} />
        </div>

        {bands.map((band) => {
          const hex = TYPE_COLOR[band.key];
          return (
            <div key={band.key} className={styles.band}>
              <div className={styles.bandHead} style={{ color: hex }}>
                <span className={styles.bandDot} style={{ background: hex }} />
                {t.filters[band.key]}
                <span className={styles.bandCount}>{band.roles.length}</span>
              </div>
              <div className={styles.bandBody} style={{ background: rgba(hex, 0.04) }}>
                {band.roles.map(({ vm, idx }) => (
                  <div
                    key={vm.id}
                    ref={(el) => {
                      rowRefs.current[idx] = el;
                    }}
                    onClick={() => setSel(idx)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSel(idx);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={sel === idx}
                    className={`${styles.row} ${sel === idx ? styles.rowSelected : ""}`}
                  >
                    <div className={styles.rowName} style={{ borderLeftColor: hex }}>
                      <span className={styles.rowTitle}>{vm.title}</span>
                      <span className={styles.rowOrg}>{vm.organization}</span>
                    </div>
                    <div className={styles.rowBars}>
                      {vm.segs.map((s, si) => {
                        const flatIdx = segStart[idx] + si;
                        return (
                          <div
                            key={si}
                            ref={(el) => {
                              segRefs.current[flatIdx] = el;
                            }}
                            className={styles.seg}
                            style={{
                              left: `${pos(s[0])}%`,
                              width: `${Math.max(1.1, pos(s[1]) - pos(s[0]))}%`,
                              background: rgba(hex, 0.22),
                              border: `1px solid ${rgba(hex, 0.6)}`,
                            }}
                          >
                            <span className={styles.segFill} style={{ background: hex }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {d && (
        <div className={styles.detail}>
          <div className={styles.detailLogo}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.imagePath} alt="" />
          </div>
          <div className={styles.detailBody}>
            <div className={styles.detailHead}>
              <h3 className={styles.detailTitle}>{d.title}</h3>
              <span className={styles.detailOrg}>{d.organization}</span>
              <span className={styles.detailPeriod}>{d.periodFull}</span>
            </div>
            <p className={styles.detailDesc}>{d.description}</p>
            {d.note && <p className={styles.detailNote}>↳ {d.note}</p>}
            <p className={styles.detailTags}>{d.tags.join("   ·   ")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
