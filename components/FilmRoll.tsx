"use client";

import Image from "next/image";
import { GALLERY, type Copy } from "@/lib/copy";
import { useInView } from "@/lib/fx";
import styles from "./FilmRoll.module.css";

// Rammene er 280 px brede (224 på mobil). `sizes` er det som avgjør hvilken
// variant nettleseren faktisk laster ned — uten den ville Next servert bilder
// dimensjonert for full skjermbredde.
//
// Begge rullene viser de samme bildene, og den nederste er mindre. Får den sin
// egen `sizes` ender vi med to varianter av hvert motiv i stedet for én, og
// halvparten av nedlastingene er da bilder brukeren allerede har. Derfor deler
// rullene bredde: den lille rullen skalerer ned et bilde den uansett har i
// cachen.
const SIZES = "(max-width: 640px) 224px, 280px";

export default function FilmRoll({ t }: { t: Copy }) {
  const rollA = GALLERY.concat(GALLERY);
  const rollB = GALLERY.slice().reverse().concat(GALLERY.slice().reverse());
  // To uendelige CSS-animasjoner per rull pluss perforeringen går ellers i det
  // uendelige, også når seksjonen for lengst er scrollet forbi.
  const [sectionRef, inView] = useInView<HTMLElement>("200px");

  return (
    <section
      id="glimt"
      ref={sectionRef}
      className={styles.section}
      data-paused={inView ? undefined : "true"}
    >
      <div className={styles.head}>
        <h2 className={styles.title}>{t.lifeTitle}</h2>
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
              <Image
                src={g.src}
                alt={g.title}
                fill
                sizes={SIZES}
                style={{ objectPosition: g.objectPosition }}
              />
              <figcaption className={styles.caption}>
                {g.frame} · {g.title}
              </figcaption>
            </figure>
          ))}
        </div>
        <div className={`${styles.sprockets} ${styles.sprocketsBottom}`} />
      </div>
      <div className={styles.roll}>
        <div className={`${styles.sprockets} ${styles.sprocketsTop} ${styles.sprocketsReverse}`} />
        <div className={`${styles.track} ${styles.trackRev}`}>
          {rollB.map((g, i) => (
            <figure key={i} className={`${styles.frame} ${styles.frameSmall}`}>
              <Image
                src={g.src}
                alt={g.title}
                fill
                sizes={SIZES}
                style={{ objectPosition: g.objectPosition }}
              />
              <figcaption className={`${styles.caption} ${styles.captionFile}`}>{g.file}</figcaption>
            </figure>
          ))}
        </div>
        <div className={`${styles.sprockets} ${styles.sprocketsBottom} ${styles.sprocketsReverse}`} />
      </div>
    </section>
  );
}
