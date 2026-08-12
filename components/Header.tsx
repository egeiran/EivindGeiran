"use client";

import { useState } from "react";
import type { Copy } from "@/lib/copy";
import { ROUTES } from "@/lib/site";
import type { Lang } from "@/lib/types";
import styles from "./Header.module.css";

interface Props {
  lang: Lang;
  t: Copy;
}

// Språkvalget er ekte lenker og ikke lokal state: engelsk må finnes på sin egen
// URL for at en crawler i det hele tatt skal se at teksten er oversatt.
const LANGS: { key: Lang; label: string; href: string }[] = [
  { key: "no", label: "NO", href: ROUTES.no.home },
  { key: "en", label: "EN", href: ROUTES.en.home },
];

export default function Header({ lang, t }: Props) {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "#na", label: t.navNow },
    { href: "#prosjekter", label: t.navWork },
    { href: "#erfaring", label: t.navExp },
    { href: "#studiet", label: t.navStudy },
    { href: "#glimt", label: t.navLife },
    { href: ROUTES[lang].cv, label: t.navCv },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <a href="#top" className={styles.logo} onClick={() => setOpen(false)}>
          <span className={styles.logoMark}>EG</span>
          <span className={styles.eyebrow}>{t.eyebrow}</span>
        </a>
        <div className={styles.right}>
          <nav className={styles.nav}>
            {links.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
          <div className={styles.langToggle}>
            {LANGS.map((l) => (
              <a
                key={l.key}
                href={l.href}
                hrefLang={l.key === "no" ? "nb-NO" : "en"}
                aria-current={lang === l.key ? "true" : undefined}
                className={`${styles.langBtn} ${lang === l.key ? styles.langBtnActive : ""}`}
              >
                {l.label}
              </a>
            ))}
          </div>
          <a href="#kontakt" className={styles.contactPill} onClick={() => setOpen(false)}>
            {t.navContact}
          </a>
          <button
            type="button"
            className={styles.menuBtn}
            aria-expanded={open}
            aria-controls="mobilmeny"
            aria-label={open ? t.menuCloseLabel : t.menuOpenLabel}
            onClick={() => setOpen((o) => !o)}
          >
            <span className={`${styles.menuIcon} ${open ? styles.menuIconOpen : ""}`}>
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>
      <nav
        id="mobilmeny"
        className={`${styles.mobileNav} ${open ? styles.mobileNavOpen : ""}`}
        aria-hidden={!open}
      >
        {links.map((l, i) => (
          <a
            key={l.href}
            href={l.href}
            tabIndex={open ? 0 : -1}
            onClick={() => setOpen(false)}
            style={{ transitionDelay: open ? `${i * 30}ms` : "0ms" }}
          >
            <span className={styles.mobileIndex}>0{i + 1}</span>
            {l.label}
          </a>
        ))}
        <a
          href="#kontakt"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          className={styles.mobileContact}
          style={{ transitionDelay: open ? `${links.length * 30}ms` : "0ms" }}
        >
          {t.navContact} <span aria-hidden="true">→</span>
        </a>
      </nav>
    </header>
  );
}
