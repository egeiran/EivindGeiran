"use client";

import type { Copy, ProjectCopy } from "@/lib/copy";
import { LINKS } from "@/lib/copy";
import { useEffect, useState, type MouseEvent } from "react";
import { useReveal } from "@/lib/fx";
import headStyles from "./SectionHead.module.css";
import styles from "./Projects.module.css";

type Expansion = {
  phase: "positioned" | "expanding";
  rect: DOMRect;
};

function LivePreview({
  url,
  title,
  label,
  className,
}: {
  url: string;
  title: string;
  label: string;
  className: string;
}) {
  const [expansion, setExpansion] = useState<Expansion | null>(null);

  useEffect(() => {
    const resetPreview = () => setExpansion(null);

    // Back/forward kan gjenopprette siden fra BFCache med den gamle
    // overgangstilstanden. Previewet skal alltid komme tilbake som et kort.
    window.addEventListener("pageshow", resetPreview);
    window.addEventListener("popstate", resetPreview);
    return () => {
      window.removeEventListener("pageshow", resetPreview);
      window.removeEventListener("popstate", resetPreview);
    };
  }, []);

  useEffect(() => {
    if (!expansion) return;

    if (expansion.phase === "positioned") {
      const frame = window.requestAnimationFrame(() => {
        setExpansion((current) => (current ? { ...current, phase: "expanding" } : null));
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const timer = window.setTimeout(() => window.location.assign(url), 560);
    return () => window.clearTimeout(timer);
  }, [expansion, url]);

  function openProject(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.location.assign(url);
      return;
    }

    setExpansion({ phase: "positioned", rect: event.currentTarget.getBoundingClientRect() });
  }

  const previewStyle = expansion
    ? {
        top: expansion.rect.top,
        left: expansion.rect.left,
        width: expansion.rect.width,
        height: expansion.rect.height,
      }
    : undefined;

  return (
    <div
      className={`${className} ${expansion ? styles.previewExpanding : ""} ${
        expansion?.phase === "expanding" ? styles.previewExpanded : ""
      }`}
      style={previewStyle}
      aria-busy={expansion ? "true" : undefined}
    >
      <iframe
        src={url}
        title={`Forhåndsvisning av ${title}`}
        loading="lazy"
        tabIndex={-1}
        aria-hidden="true"
        // Previewene er kun visuelle — lyd fra embeddede apper skal aldri
        // spilles av på porteføljen.
        allow="autoplay 'none'; microphone 'none'; camera 'none'"
      />
      <a
        href={url}
        onClick={openProject}
        className={styles.previewOverlay}
        aria-label={`${label}: ${title}`}
      >
        <span className={styles.previewAction}>
          <span>{label}</span>
          <span>↗</span>
        </span>
      </a>
    </div>
  );
}

function Card({ p, delay }: { p: ProjectCopy; delay: number }) {
  const ref = useReveal<HTMLElement>(delay);
  return (
    <article ref={ref} className={styles.card}>
      <LivePreview url={p.webUrl} title={p.name} label={p.openLabel} className={styles.cardShot} />
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span className={`${styles.cardTag} ${p.tag === "LIVE" ? styles.cardTagLive : ""}`}>
            {p.tag}
          </span>
          <a href={p.url} target="_blank" rel="noreferrer" className={styles.cardLink}>
            {p.link} ↗
          </a>
        </div>
        <h3 className={styles.cardTitle}>{p.name}</h3>
        <p className={styles.cardDesc}>{p.description}</p>
        <div className={styles.cardStack}>
          {p.stack.map((s) => (
            <span key={s} className={styles.cardChip}>
              {s}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function Projects({ t }: { t: Copy }) {
  return (
    <section id="prosjekter" className={styles.section}>
      <div className={headStyles.head}>
        <h2 className={headStyles.title}>{t.workTitle}</h2>
        <p className={headStyles.aside}>{t.workLede}</p>
      </div>

      <article className={styles.featured}>
        <div className={styles.featuredBody}>
          <div className={styles.featuredMeta}>
            <span className={styles.featuredTag}>{t.featured}</span>
            <span className={styles.featuredUrl}>kort-forklart.no</span>
          </div>
          <h3 className={styles.featuredTitle}>Kort Forklart</h3>
          <p className={styles.featuredDesc}>{t.kfDesc}</p>
          <div className={styles.stack}>
            {t.kfStack.map((s) => (
              <span key={s} className={styles.stackChip}>
                {s}
              </span>
            ))}
          </div>
          <div className={styles.featuredActions}>
            <a href={LINKS.kortForklart} target="_blank" rel="noreferrer" className={styles.openBtn}>
              {t.openLive} <span className={styles.mono}>↗</span>
            </a>
          </div>
        </div>
        <LivePreview
          url={LINKS.kortForklart}
          title="Kort Forklart"
          label={t.openLive}
          className={styles.featuredPreview}
        />
      </article>

      <div className={styles.grid}>
        {t.projects.map((p, i) => (
          <Card key={p.name} p={p} delay={(i % 3) * 80} />
        ))}
      </div>
    </section>
  );
}
