"use client";

import { useState } from "react";
import type { Copy } from "@/lib/copy";
import type { Lang } from "@/lib/types";
import styles from "./Header.module.css";

interface Props {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Copy;
}

export default function Header({ lang, setLang, t }: Props) {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "#na", label: t.navNow },
    { href: "#prosjekter", label: t.navWork },
    { href: "#erfaring", label: t.navExp },
    { href: "#studiet", label: t.navStudy },
    { href: "#glimt", label: t.navLife },
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
