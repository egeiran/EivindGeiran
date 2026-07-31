"use client";

import { useMemo, useState } from "react";
import type { Copy } from "@/lib/copy";
import type { ExperienceVM } from "@/lib/derive";
import styles from "./BlameView.module.css";

function hash7(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return `0000000${h.toString(16)}`.slice(-7);
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

interface Props {
  t: Copy;
  vms: ExperienceVM[];
}

export default function BlameView({ t, vms }: Props) {
  const [hover, setHover] = useState<string | null>(null);

  const rows = useMemo(() => {
    const out: {
      hash: string;
      meta: string;
      n: string;
      text: string;
      tone: string;
      commit: { title: string; organization: string; period: string };
    }[] = [];
    let ln = 0;
    vms.forEach((e, i) => {
      const h = hash7(e.title + e.organization + e.period);
      const date = `${e.startYear}-${pad2(((i * 7) % 12) + 1)}-${pad2(((i * 11) % 27) + 1)}`;
      const lines = [
        { text: `## ${e.title}`, tone: "#f4f1e8" },
        {
          text: `   org:  ${e.organization}   (${e.period} · ${e.typeLabel})`,
          tone: "rgba(217,255,99,.72)",
        },
        { text: `   ${e.description}`, tone: "rgba(244,241,232,.6)" },
        { text: `   tags: ${e.tags.join(", ")}`, tone: "rgba(244,241,232,.32)" },
      ];
      for (const l of lines) {
        ln += 1;
        out.push({
          hash: h,
          meta: `(Eivind ${date}`,
          n: `${ln})`,
          text: l.text,
          tone: l.tone,
          commit: { title: e.title, organization: e.organization, period: e.period },
        });
      }
    });
    return out;
  }, [vms]);

  const hovered = rows.find((r) => r.hash === hover);

  return (
    <div className={styles.box}>
      <div className={styles.header}>
        <span className={styles.cmd}>$ git blame erfaring.md</span>
        <span className={styles.meta}>
          {rows.length} {t.linesWord} · {vms.length} {t.commitsWord} · main
        </span>
      </div>
      <div className={styles.scroll}>
        <div className={styles.rows}>
          {rows.map((row, i) => {
            const hot = row.hash === hover;
            return (
              <div
                key={i}
                onMouseEnter={() => setHover(row.hash)}
                className={styles.row}
                style={{ background: hot ? "rgba(217,255,99,.07)" : "transparent" }}
              >
                <span
                  className={styles.hash}
                  style={{ color: hot ? "#d9ff63" : "rgba(244,241,232,.42)" }}
                >
                  {row.hash}
                </span>
                <span className={styles.rowMeta}>{row.meta}</span>
                <span className={styles.lineNo}>{row.n}</span>
                <span className={styles.text} style={{ color: row.tone }}>
                  {row.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.footer}>
        {hovered
          ? `${hovered.hash}  ${hovered.commit.title} · ${hovered.commit.organization} · ${hovered.commit.period}`
          : t.blameHint}
      </div>
    </div>
  );
}
