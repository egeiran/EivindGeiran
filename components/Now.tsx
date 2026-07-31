"use client";

import type { Copy } from "@/lib/copy";
import { useReveal } from "@/lib/fx";
import styles from "./Now.module.css";

function Row({
  n,
  index,
  delay,
}: {
  n: Copy["now"][number];
  index: number;
  delay: number;
}) {
  const ref = useReveal<HTMLDivElement>(delay);
  return (
    <div ref={ref} className={styles.row}>
      <span className={styles.index}>0{index + 1}</span>
      <span className={styles.tag}>
        <span className={styles.dot} />
        {n.tag}
      </span>
      <div>
        <h3 className={styles.rowTitle}>{n.title}</h3>
        <p className={styles.rowDetail}>{n.detail}</p>
      </div>
      <span className={styles.since}>{n.since}</span>
    </div>
  );
}

export default function Now({ t }: { t: Copy }) {
  return (
    <section id="na" className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.title}>{t.nowTitle}</h2>
        <span className={styles.date}>{t.nowDate}</span>
      </div>
      <div className={styles.ledger}>
        {t.now.map((n, i) => (
          <Row key={n.title} n={n} index={i} delay={(i % 3) * 80} />
        ))}
      </div>
    </section>
  );
}
