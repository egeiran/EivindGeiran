"use client";

import type { Copy } from "@/lib/copy";
import styles from "./Marquee.module.css";

const MARQUEE_SECONDS = 48;

export default function Marquee({ t }: { t: Copy }) {
  // Prosjektnavnene hentes fra copy i stedet for å stå hardkodet her: lista
  // hadde kommet i utakt med prosjektseksjonen, og et navn som bare finnes ett
  // sted på siden svekker signalet om hva som faktisk er bygget.
  const items = t.roles.concat("Kort Forklart", ...t.projects.map((p) => p.name));
  // Andre halvdel er bare den visuelle løkka. Den merkes skjult så navnene
  // ikke leses og telles to ganger.
  const doubled = items.concat(items);
  return (
    <div className={styles.band}>
      <div className={styles.track} style={{ animationDuration: `${MARQUEE_SECONDS}s` }}>
        {doubled.map((m, i) => (
          <span
            key={i}
            className={styles.item}
            aria-hidden={i >= items.length ? "true" : undefined}
          >
            {m}
            <span className={styles.star} aria-hidden="true">
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
