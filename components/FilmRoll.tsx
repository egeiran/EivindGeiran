"use client";

import { GALLERY, type Copy } from "@/lib/copy";
import styles from "./FilmRoll.module.css";

export default function FilmRoll({ t }: { t: Copy }) {
  const rollA = GALLERY.concat(GALLERY);
  const rollB = GALLERY.slice().reverse().concat(GALLERY.slice().reverse());

  return (
    <section id="glimt" className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.title}>{t.lifeTitle}</h2>
        <p className={styles.lede}>{t.lifeLede}</p>
      </div>
      <div className={styles.meta}>
        <span className={styles.metaRoll}>{t.rollMeta}</span>
        <span className={styles.metaCount}>
          {GALLERY.length} {t.framesWord}
        </span>
      </div>
      <div className={`${styles.roll} ${styles.rollFirst}`}>
        <div className={`${styles.sprockets} ${styles.sprocketsTop}`} />
        <div className={styles.track}>
          {rollA.map((g, i) => (
            <figure key={i} className={styles.frame}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.src} alt={g.title} loading="lazy" />
              <figcaption className={styles.caption}>
                {g.frame} · {g.title}
              </figcaption>
            </figure>
          ))}
        </div>
        <div className={`${styles.sprockets} ${styles.sprocketsBottom}`} />
      </div>
      <div className={styles.roll}>
        <div className={`${styles.track} ${styles.trackRev}`}>
          {rollB.map((g, i) => (
            <figure key={i} className={`${styles.frame} ${styles.frameSmall}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.src} alt={g.title} loading="lazy" />
              <figcaption className={`${styles.caption} ${styles.captionFile}`}>{g.file}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
