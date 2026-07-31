"use client";

import { LINKS, type Copy } from "@/lib/copy";
import styles from "./Contact.module.css";

export default function Contact({ t }: { t: Copy }) {
  return (
    <section id="kontakt" className={styles.section}>
      <div className={styles.panel}>
        <div>
          <p className={styles.label}>
            <span className={styles.labelDot} />
            {t.cta.label}
          </p>
          <h2 className={styles.title}>{t.cta.title}</h2>
          <p className={styles.sub}>{t.cta.sub}</p>
        </div>
        <div className={styles.bottom}>
          <div className={styles.links}>
            <a href={LINKS.github} target="_blank" rel="noreferrer">
              github.com/egeiran
            </a>
            <a href={`mailto:${LINKS.email}`}>{LINKS.email}</a>
            <span className={styles.note}>{t.cta.note}</span>
          </div>
          <a href={LINKS.linkedin} target="_blank" rel="noreferrer" className={styles.pill}>
            LinkedIn <span className={styles.mono}>↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
