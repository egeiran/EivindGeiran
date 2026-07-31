"use client";

import { useMemo, useState } from "react";
import { TYPE_COLOR, type Copy } from "@/lib/copy";
import { rgba, type ExperienceVM } from "@/lib/derive";
import { MONTHS, yearOf } from "@/lib/time";
import type { ExperienceType, Lang } from "@/lib/types";
import styles from "./HeatView.module.css";

interface Props {
  t: Copy;
  lang: Lang;
  vms: ExperienceVM[];
  now: number;
}

export default function HeatView({ t, lang, vms, now }: Props) {
  const [cell, setCell] = useState<string | null>(null);

  const years = useMemo(() => {
    const min = vms.length ? Math.min(...vms.map((v) => yearOf(v.sNum))) : yearOf(now);
    const list: number[] = [];
    for (let y = yearOf(now); y >= min; y--) list.push(y);
    return list;
  }, [vms, now]);

  const hitsAt = (v: number) => vms.filter((e) => e.segs.some((s) => v >= s[0] && v <= s[1]));

  let readoutLabel = t.heatHint;
  let readoutRoles: { title: string; organization: string; color: string }[] = [];
  if (cell) {
    const [ys, ms] = cell.split("-");
    const v = Number(ys) + (Number(ms) + 0.5) / 12;
    readoutRoles = hitsAt(v).map((e) => ({
      title: e.title,
      organization: e.organization,
      color: e.color,
    }));
    readoutLabel = `${MONTHS[lang][Number(ms)]} ${ys}  ·  ${readoutRoles.length} ${t.rolesWord}`;
  }

  return (
    <div>
      <p className={styles.lede}>{t.heatLede}</p>
      <div className={styles.scroller}>
        <div className={styles.inner}>
          <div className={styles.headerRow}>
            <span />
            <div className={styles.months}>
              {MONTHS[lang].map((m) => (
                <span key={m} className={styles.monthLabel}>
                  {m}
                </span>
              ))}
            </div>
          </div>
          {years.map((y) => (
            <div key={y} className={styles.yearRow}>
              <span className={styles.yearLabel}>{y}</span>
              <div className={styles.cells}>
                {MONTHS[lang].map((_, m) => {
                  const v = y + (m + 0.5) / 12;
                  const hits = hitsAt(v);
                  const tally: Partial<Record<ExperienceType, number>> = {};
                  for (const h of hits) tally[h.typeKey] = (tally[h.typeKey] || 0) + 1;
                  let dom: ExperienceType = "Betalt";
                  let best = 0;
                  for (const k of Object.keys(tally) as ExperienceType[]) {
                    if ((tally[k] || 0) > best) {
                      best = tally[k] || 0;
                      dom = k;
                    }
                  }
                  const c = TYPE_COLOR[dom];
                  const key = `${y}-${m}`;
                  return (
                    <div
                      key={key}
                      onMouseEnter={() => setCell(key)}
                      className={styles.cell}
                      style={{
                        background: hits.length
                          ? rgba(c, 0.1 + Math.min(hits.length, 4) * 0.17)
                          : "rgba(244,241,232,.03)",
                        border: `1px solid ${
                          cell === key
                            ? "#f4f1e8"
                            : hits.length
                              ? rgba(c, 0.4)
                              : "rgba(244,241,232,.06)"
                        }`,
                        color: hits.length > 2 ? "#0c0e11" : "rgba(244,241,232,.6)",
                      }}
                    >
                      {hits.length ? hits.length : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.readout}>
        <span className={styles.readoutLabel}>{readoutLabel}</span>
        <div className={styles.pills}>
          {readoutRoles.map((r) => (
            <span key={`${r.title}-${r.organization}`} className={styles.pill}>
              <span className={styles.pillDot} style={{ background: r.color }} />
              {r.title}
              <span className={styles.pillOrg}>{r.organization}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
