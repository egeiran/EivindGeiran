"use client";

import { useEffect, useMemo, useState } from "react";
import type { Copy } from "@/lib/copy";
import { deriveAxis, type ExperienceVM } from "@/lib/derive";
import type { Lang } from "@/lib/types";
import BlameView from "./BlameView";
import GanttView from "./GanttView";
import HeatView from "./HeatView";
import ListView from "./ListView";
import headStyles from "./SectionHead.module.css";
import styles from "./Experience.module.css";

type View = "gantt" | "aktivitet" | "liste" | "blame";

const FILTERS = ["Alle", "Betalt", "Frivillig", "Utdanning"] as const;

interface Props {
  t: Copy;
  lang: Lang;
  vms: ExperienceVM[];
  now: number;
}

export default function ExperienceSection({ t, lang, vms, now }: Props) {
  const [view, setView] = useState<View | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Alle");
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 820);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const effective: View = view ?? (narrow ? "liste" : "gantt");
  const axis = useMemo(() => deriveAxis(vms, now), [vms, now]);
  const filtered = useMemo(
    () =>
      (filter === "Alle" ? vms : vms.filter((v) => v.typeKey === filter))
        .slice()
        .sort((a, b) => b.sNum - a.sNum),
    [vms, filter]
  );

  const views: { key: View; label: string }[] = [
    { key: "gantt", label: t.viewGantt },
    { key: "aktivitet", label: t.viewHeat },
    { key: "liste", label: t.viewList },
    { key: "blame", label: "git blame" },
  ];

  return (
    <section id="erfaring" className={styles.section}>
      <div className={headStyles.head}>
        <h2 className={headStyles.title}>{t.expTitle}</h2>
        <div className={styles.controls}>
          {FILTERS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`${styles.chip} ${filter === k ? styles.chipActive : ""}`}
            >
              {t.filters[k]}
            </button>
          ))}
          <div className={styles.switcher}>
            {views.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => setView(v.key)}
                className={`${styles.switchBtn} ${effective === v.key ? styles.switchBtnActive : ""}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {effective === "gantt" && (
        <GanttView t={t} lang={lang} vms={filtered} axis={axis} now={now} />
      )}
      {effective === "aktivitet" && <HeatView t={t} lang={lang} vms={filtered} now={now} />}
      {effective === "liste" && <ListView t={t} vms={filtered} />}
      {effective === "blame" && <BlameView t={t} vms={filtered} />}
    </section>
  );
}
