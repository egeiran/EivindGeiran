"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TYPE_COLOR, type Copy } from "@/lib/copy";
import { rgba, type ExperienceVM } from "@/lib/derive";
import { prefersReducedMotion, useScrollFrame } from "@/lib/fx";
import { MONTHS, yearOf } from "@/lib/time";
import type { ExperienceType, Lang } from "@/lib/types";
import styles from "./GanttView.module.css";

const GANTT_SCRUB = true;
const BAND_ORDER: ExperienceType[] = ["Betalt", "Frivillig", "Utdanning"];

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

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const headRef = useRef<HTMLDivElement | null>(null);
  const yearRef = useRef<HTMLDivElement | null>(null);
  const monRef = useRef<HTMLDivElement | null>(null);
  const concRef = useRef<HTMLSpanElement | null>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const segRefs = useRef<(HTMLDivElement | null)[]>([]);

  useScrollFrame(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const vh = window.innerHeight;
    const r = wrap.getBoundingClientRect();
    const dist = Math.max(1, r.height - vh * 0.8);
    const p =
      prefersReducedMotion() || !GANTT_SCRUB
        ? 1
        : Math.max(0, Math.min(1, (110 - r.top) / dist));
    const year = minY + p * (maxY - minY);

    if (headRef.current) headRef.current.style.left = `${p * 100}%`;
    if (yearRef.current) {
      const yv = String(Math.min(yearOf(now), Math.floor(year)));
      if (yearRef.current.textContent !== yv) yearRef.current.textContent = yv;
    }
    if (monRef.current) {
      const mv = MONTHS[lang][Math.max(0, Math.min(11, Math.floor((year % 1) * 12)))];
      if (monRef.current.textContent !== mv) monRef.current.textContent = mv;
    }

    const live: Record<number, boolean> = {};
    for (let i = 0; i < segFlat.length; i++) {
      const s = segFlat[i];
      const el = segRefs.current[i];
      if (!el) continue;
      const k = Math.max(0, Math.min(1, (year - s.a) / Math.max(0.0001, s.b - s.a)));
      const fill = el.firstElementChild as HTMLElement | null;
      if (fill) fill.style.width = `${k * 100}%`;
      el.style.opacity = k > 0 ? "1" : "0.72";
      if (year >= s.a && year <= s.b) live[s.role] = true;
    }

    let conc = 0;
    for (let i = 0; i < roleFlat.length; i++) {
      const el = rowRefs.current[i];
      const vm = roleFlat[i];
      if (!el || !vm) continue;
      const act = !!live[i];
      if (act) conc += 1;
      el.style.opacity = act ? "1" : year > vm.eNum ? "0.55" : "0.45";
    }
    if (concRef.current) {
      const c = String(conc);
      if (concRef.current.textContent !== c) concRef.current.textContent = c;
    }
  }, [segFlat, roleFlat, minY, maxY, lang]);

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <div className={styles.sticky}>
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
                {t.ganttHint} · {t.pickHint}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.axisRow}>
          <span className={styles.axisLabel}>{t.roleCol}</span>
          <div className={styles.axis}>
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
          </div>
        </div>

        <div className={styles.chart}>
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
    </div>
  );
}
