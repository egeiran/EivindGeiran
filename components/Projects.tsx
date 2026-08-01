"use client";

import type { Copy, ProjectCopy } from "@/lib/copy";
import { LINKS } from "@/lib/copy";
import { useReveal } from "@/lib/fx";
import headStyles from "./SectionHead.module.css";
import styles from "./Projects.module.css";

function Card({ p, delay }: { p: ProjectCopy; delay: number }) {
  const ref = useReveal<HTMLElement>(delay);
  return (
    <article ref={ref} className={styles.card}>
      <div className={styles.cardShot}>{p.shot}</div>
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span className={`${styles.cardTag} ${p.tag === "LIVE" ? styles.cardTagLive : ""}`}>
            {p.tag}
          </span>
          <a href={p.url} target="_blank" rel="noreferrer" className={styles.cardLink}>
            {p.link} ↗
          </a>
        </div>
        <h3 className={styles.cardTitle}>{p.name}</h3>
        <p className={styles.cardDesc}>{p.description}</p>
        <div className={styles.cardStack}>
          {p.stack.map((s) => (
            <span key={s} className={styles.cardChip}>
              {s}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function Projects({ t }: { t: Copy }) {
  return (
    <section id="prosjekter" className={styles.section}>
      <div className={headStyles.head}>
        <h2 className={headStyles.title}>{t.workTitle}</h2>
        <p className={headStyles.aside}>{t.workLede}</p>
      </div>

      <article className={styles.featured}>
        <div className={styles.featuredBody}>
          <div className={styles.featuredMeta}>
            <span className={styles.featuredTag}>{t.featured}</span>
            <span className={styles.featuredUrl}>kort-forklart.no</span>
          </div>
          <h3 className={styles.featuredTitle}>Kort Forklart</h3>
          <p className={styles.featuredDesc}>{t.kfDesc}</p>
          <div className={styles.stack}>
            {t.kfStack.map((s) => (
              <span key={s} className={styles.stackChip}>
                {s}
              </span>
            ))}
          </div>
          <div className={styles.featuredActions}>
            <a href={LINKS.kortForklart} target="_blank" rel="noreferrer" className={styles.openBtn}>
              {t.openLive} <span className={styles.mono}>↗</span>
            </a>
          </div>
        </div>
        <div className={styles.shotWell}>
          <div>
            <iframe src="https://www.kort-forklart.no" width="100%"></iframe>
            {/* <div className={styles.shotLabel}>{t.placeholder}</div>
            <div className={styles.shotSub}>quiz view + AI explanation</div> */}
          </div>
        </div>
      </article>

      <div className={styles.grid}>
        {t.projects.map((p, i) => (
          <Card key={p.name} p={p} delay={(i % 3) * 80} />
        ))}
      </div>
    </section>
  );
}
