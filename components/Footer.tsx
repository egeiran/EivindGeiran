"use client";

import type { Copy } from "@/lib/copy";

export default function Footer({ t }: { t: Copy }) {
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
        color: "rgba(244,241,232,.35)",
      }}
    >
      <span>© 2026 Eivind Systad Geiran</span>
      <span>{t.footerNote}</span>
    </footer>
  );
}
