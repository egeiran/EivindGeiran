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
      {/* Begge rullene er doblet for at løkka skal gå sømløst, og den andre
          rullen viser de samme bildene en gang til. Bare den første kopien i
          den første rullen beskriver noe nytt — resten merkes skjult, ellers
          leses hver bildetittel fire ganger. */}
      <div className={`${styles.roll} ${styles.rollFirst}`}>
        <div className={`${styles.sprockets} ${styles.sprocketsTop}`} />
        <div className={styles.track}>
          {rollA.map((g, i) => {
            const echo = i >= GALLERY.length;
            return (
              <figure key={i} className={styles.frame} aria-hidden={echo ? "true" : undefined}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g.src}
                  alt={echo ? "" : g.title}
                  loading="lazy"
                  style={{ objectPosition: g.objectPosition }}
                />
                <figcaption className={styles.caption}>
                  {g.frame} · {g.title}
                </figcaption>
              </figure>
            );
          })}
        </div>
        <div className={`${styles.sprockets} ${styles.sprocketsBottom}`} />
      </div>
      <div className={styles.roll} aria-hidden="true">
        <div className={`${styles.sprockets} ${styles.sprocketsTop} ${styles.sprocketsReverse}`} />
        <div className={`${styles.track} ${styles.trackRev}`}>
          {rollB.map((g, i) => (
            <figure key={i} className={`${styles.frame} ${styles.frameSmall}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.src} alt="" loading="lazy" style={{ objectPosition: g.objectPosition }} />
              <figcaption className={`${styles.caption} ${styles.captionFile}`}>{g.file}</figcaption>
            </figure>
          ))}
        </div>
        <div className={`${styles.sprockets} ${styles.sprocketsBottom} ${styles.sprocketsReverse}`} />
      </div>
    </section>
  );
}
