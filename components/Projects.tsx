"use client";

import type { Copy, ProjectCopy } from "@/lib/copy";
import { LINKS } from "@/lib/copy";
import { useEffect, useState, type MouseEvent } from "react";
import { useDeferredMount, useReveal } from "@/lib/fx";
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
  // Iframen er en hel nettside til. Den skal ikke lastes mens heroen fortsatt
  // henter fonter og bilder — men den skal være ferdig lenge før man ser den.
  const [hostRef, showFrame] = useDeferredMount<HTMLDivElement>("1200px");

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

    const timer = window.setTimeout(() => {
      // window.open med kun "_blank" gir oss vindushåndtaket, så vi kan både
      // kutte opener-lenken og oppdage popup-blokkering (noopener i feature-
      // strengen hadde returnert null selv ved suksess).
      const opened = window.open(url, "_blank");
      if (opened) {
        opened.opener = null;
        setExpansion(null);
      } else {
        window.location.assign(url);
      }
    }, 560);
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

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    event.preventDefault();
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
      ref={hostRef}
      className={`${className} ${expansion ? styles.previewExpanding : ""} ${
        expansion?.phase === "expanding" ? styles.previewExpanded : ""
      }`}
      style={previewStyle}
      aria-busy={expansion ? "true" : undefined}
    >
      {showFrame ? (
        <iframe
          src={url}
          title={`Forhåndsvisning av ${title}`}
          tabIndex={-1}
          aria-hidden="true"
          // Previewene er kun visuelle — lyd fra embeddede apper skal aldri
          // spilles av på porteføljen.
          allow="autoplay 'none'; microphone 'none'; camera 'none'"
        />
      ) : null}
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
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

/**
 * Kortet for prosjekter som har en film. Der de andre previewene embedder selve
 * nettsiden, viser dette klippet av filmen — stumt, i loop og uten kontroller,
 * så det oppfører seg som et levende skjermbilde og ikke som en videospiller.
 *
 * Iframen lastes først når kortet er på vei inn i viewporten (og aldri hvis
 * brukeren har bedt om redusert bevegelse): fram til da står YouTubes eget
 * miniatyrbilde der, som koster ett bilde i stedet for en hel spiller.
 */
function FilmPreview({
  videoId,
  url,
  title,
  label,
  filmLabel,
  className,
}: {
  videoId: string;
  url: string;
  title: string;
  label: string;
  filmLabel: string;
  className: string;
}) {
  const [hostRef, near] = useDeferredMount<HTMLDivElement>("400px");
  const [allowed, setAllowed] = useState(true);
  // maxres finnes ikke for alle opplastinger; hqdefault gjør alltid det.
  const [thumb, setThumb] = useState(`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAllowed(false);
      return;
    }
    // Har brukeren bedt om datasparing, eller er linja så treg at klippet
    // uansett ville hakket, blir plakatbildet stående.
    const conn = (navigator as { connection?: { saveData?: boolean; effectiveType?: string } })
      .connection;
    if (conn && (conn.saveData || conn.effectiveType === "2g" || conn.effectiveType === "slow-2g")) {
      setAllowed(false);
    }
  }, []);

  const playing = near && allowed;

  // mute=1 er det som gjør at nettleseren i det hele tatt lar den starte selv;
  // loop trenger playlist-parameteren for å virke på én enkelt video.
  const embed =
    `https://www.youtube-nocookie.com/embed/${videoId}` +
    `?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1` +
    `&playsinline=1&rel=0&iv_load_policy=3&disablekb=1&fs=0`;

  return (
    <div ref={hostRef} className={`${className} ${styles.film}`}>
      {/* Plakatbildet blir liggende under spilleren, ikke byttet ut: da er det
          det man ser mens YouTube laster, og det som blir stående hvis embedden
          aldri kommer opp. Uten det blinker det hvitt i stedet. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumb}
        alt=""
        aria-hidden="true"
        loading="lazy"
        onError={() => setThumb(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`)}
      />
      {playing ? (
        <iframe
          src={embed}
          title={`Film om ${title}`}
          tabIndex={-1}
          aria-hidden="true"
          allow="autoplay; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : null}
      <a
        href={`https://www.youtube.com/watch?v=${videoId}`}
        target="_blank"
        rel="noreferrer"
        className={styles.filmLink}
      >
        <span aria-hidden="true">▶</span>
        {filmLabel}
      </a>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
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
      {p.videoId ? (
        <FilmPreview
          videoId={p.videoId}
          url={p.webUrl}
          title={p.name}
          label={p.openLabel}
          filmLabel={p.videoLabel ?? "YouTube"}
          className={styles.cardShot}
        />
      ) : (
        <LivePreview url={p.webUrl} title={p.name} label={p.openLabel} className={styles.cardShot} />
      )}
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
