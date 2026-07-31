"use client";

import type { Copy } from "@/lib/copy";
import styles from "./Marquee.module.css";

const MARQUEE_SECONDS = 48;

export default function Marquee({ t }: { t: Copy }) {
  const items = t.roles.concat(["Kort Forklart", "NHL ML", "Sorting Visualizer", "Tilbudsscraper"]);
  const doubled = items.concat(items);
  return (
    <div className={styles.band}>
      <div className={styles.track} style={{ animationDuration: `${MARQUEE_SECONDS}s` }}>
        {doubled.map((m, i) => (
          <span key={i} className={styles.item}>
            {m}
            <span className={styles.star}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
