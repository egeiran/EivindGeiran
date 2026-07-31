"use client";

import type { Copy } from "@/lib/copy";
import type { Lang } from "@/lib/types";
import styles from "./Header.module.css";

interface Props {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Copy;
}

export default function Header({ lang, setLang, t }: Props) {
  return (
    <header className={styles.header}>
      <a href="#top" className={styles.logo}>
        <span className={styles.logoMark}>EG</span>
        <span className={styles.eyebrow}>{t.eyebrow}</span>
      </a>
      <div className={styles.right}>
        <nav className={styles.nav}>
          <a href="#na">{t.navNow}</a>
          <a href="#prosjekter">{t.navWork}</a>
          <a href="#erfaring">{t.navExp}</a>
          <a href="#studiet">{t.navStudy}</a>
          <a href="#glimt">{t.navLife}</a>
        </nav>
        <div className={styles.langToggle}>
          {(["no", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`${styles.langBtn} ${lang === l ? styles.langBtnActive : ""}`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <a href="#kontakt" className={styles.contactPill}>
          {t.navContact}
        </a>
      </div>
    </header>
  );
}
