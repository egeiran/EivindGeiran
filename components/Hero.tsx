"use client";

import { useEffect, useRef } from "react";
import type { Copy } from "@/lib/copy";
import { prefersReducedMotion, useScrollFrame } from "@/lib/fx";
import { startScramble } from "@/lib/scramble";
import styles from "./Hero.module.css";

const HERO_SPOTLIGHT = true;

interface Props {
  t: Copy;
  ongoingCount: number;
  totalCount: number;
}

export default function Hero({ t, ongoingCount, totalCount }: Props) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const wordmarkRef = useRef<HTMLHeadingElement | null>(null);
  const maskRef = useRef<HTMLSpanElement | null>(null);
  const line1Refs = useRef<(HTMLSpanElement | null)[]>([]);
  const line2Refs = useRef<(HTMLSpanElement | null)[]>([]);
  const roleRef = useRef<HTMLSpanElement | null>(null);
  const statRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const spot = useRef({ px: 0, py: 0, tx: 0, ty: 0, idle: 100, t0: 0 });
  const rolesRef = useRef(t.roles);

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

  // Spotlight-easing + idle-drift i egen rAF-loop.
  useEffect(() => {
    if (!HERO_SPOTLIGHT || prefersReducedMotion()) return;
    const s = spot.current;
    s.t0 = performance.now();
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const el = maskRef.current;
      if (!el) return;
      const w = el.offsetWidth || 1;
      const h = el.offsetHeight || 1;
      s.idle += 1;
      if (s.idle > 90) {
        const sec = (performance.now() - s.t0) / 1000;
        s.tx = w * (0.5 + 0.3 * Math.sin(sec * 0.42));
        s.ty = h * (0.5 + 0.28 * Math.sin(sec * 0.63 + 1.1));
      }
      s.px += (s.tx - s.px) * 0.09;
      s.py += (s.ty - s.py) * 0.09;
      const g = `radial-gradient(circle 260px at ${Math.round(s.px)}px ${Math.round(
        s.py
      )}px, #000 0%, rgba(0,0,0,.35) 55%, transparent 100%)`;
      el.style.webkitMaskImage = g;
      el.style.maskImage = g;
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useScrollFrame(() => {
    const still = prefersReducedMotion();
    const y = window.scrollY;
    const vh = window.innerHeight;
    if (!still) {
      const wm = wordmarkRef.current;
      if (wm) {
        wm.style.transform = `translate3d(0,${Math.min(y * 0.22, 150)}px,0)`;
        wm.style.opacity = String(Math.max(0.12, 1 - y / 720));
      }
      if (gridRef.current)
        gridRef.current.style.transform = `translate3d(0,${Math.min(y * 0.42, 260)}px,0)`;
      const split = Math.min(y * 0.11, 110);
      for (const el of line1Refs.current)
        if (el) el.style.transform = `translate3d(${-split}px,0,0)`;
      for (const el of line2Refs.current)
        if (el) el.style.transform = `translate3d(${split}px,0,0)`;
    }
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
        const t0 = performance.now();
        const dec = target % 1 !== 0;
        const tick = () => {
          const k = Math.min(1, (performance.now() - t0) / 900);
          const v = target * (1 - Math.pow(1 - k, 3));
          el.textContent = dec ? v.toFixed(1) : String(Math.round(v));
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }
  });

  const onMove = (e: React.MouseEvent) => {
    const el = maskRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const s = spot.current;
    s.tx = e.clientX - r.left;
    s.ty = e.clientY - r.top;
    s.idle = 0;
  };

  // Ordmerket rendres to ganger: en nesten usynlig kopi og en lime-kopi bak en
  // radial maske som følger pekeren. Begge kopiene er aria-hidden — navnet
  // leses fra .sr-only-linja i <h1>, så det ikke dukker opp i duplikat.
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
    <section className={styles.section} onMouseMove={onMove}>
      <div ref={gridRef} className={styles.grid} />
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
        <div className={styles.lede}>
          <div className={styles.roleRow}>
            <span className={styles.roleDot} />
            <span ref={roleRef} className={styles.roleText}>
              {t.roles[0]}
            </span>
          </div>
        </div>
        <div className={styles.ctaCol}>
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
