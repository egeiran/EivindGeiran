"use client";

import type { Copy } from "@/lib/copy";
import { LINKS } from "@/lib/copy";
import { MACHINE_ROUTES, ROUTES, SUBSITES } from "@/lib/site";
import type { Lang } from "@/lib/types";

// Faste, synlige lenker til egne subdomener. De er ellers bare nådd via
// preview-kortene i prosjektseksjonen, og en crawler som følger lenker fra
// forsiden trenger et sted der ankerteksten faktisk sier hva som ligger der.
const hostOf = (url: string) => new URL(url).hostname;

export default function Footer({ t, lang }: { t: Copy; lang: Lang }) {
  return (
    <footer
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        flexWrap: "wrap",
        padding: "24px var(--gutter) 48px",
        fontFamily: "var(--font-mono), monospace",
        fontSize: 11.5,
        color: "rgba(244, 241, 232, .35)",
      }}
    >
      <span>© 2026 Eivind Systad Geiran</span>
      <nav
        aria-label={t.footerSitesLabel}
        style={{ display: "flex", gap: 16, flexWrap: "wrap" }}
      >
        <a href={ROUTES[lang].cv} style={{ color: "inherit" }}>
          {t.navCv}
        </a>
        {/* Pekere til de maskinlesbare utgavene. En crawler som lander på
            forsiden finner dem bare hvis noe faktisk lenker dit. */}
        <a href={MACHINE_ROUTES.cvJson} style={{ color: "inherit" }}>
          cv.json
        </a>
        <a href={MACHINE_ROUTES.llmsTxt} style={{ color: "inherit" }}>
          llms.txt
        </a>
        {SUBSITES.map((url) => (
          <a key={url} href={url} style={{ color: "inherit" }}>
            {hostOf(url)}
          </a>
        ))}
        <a href={LINKS.github} rel="me noreferrer" target="_blank" style={{ color: "inherit" }}>
          GitHub
        </a>
        <a href={LINKS.linkedin} rel="me noreferrer" target="_blank" style={{ color: "inherit" }}>
          LinkedIn
        </a>
      </nav>
      <span>{t.footerNote}</span>
    </footer>
  );
}
