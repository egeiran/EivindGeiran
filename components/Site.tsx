"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COPY } from "@/lib/copy";
import { deriveExperiences } from "@/lib/derive";
import { useScrollFrame } from "@/lib/fx";
import type { Experience, Lang } from "@/lib/types";
import Contact from "./Contact";
import ExperienceSection from "./Experience";
import FilmRoll from "./FilmRoll";
import Footer from "./Footer";
import Header from "./Header";
import Hero from "./Hero";
import Marquee from "./Marquee";
import Now from "./Now";
import Projects from "./Projects";
import Studies from "./Studies";

export default function Site({ experiences, now }: { experiences: Experience[]; now: number }) {
  const [lang, setLang] = useState<Lang>("no");
  const t = COPY[lang];
  const vms = useMemo(() => deriveExperiences(experiences, lang, now), [experiences, lang, now]);

  // Språkbyttet er rent klientside, så <html lang> må oppdateres manuelt —
  // ellers påstår dokumentet fortsatt bokmål mens innholdet er engelsk.
  useEffect(() => {
    document.documentElement.lang = lang === "no" ? "nb" : "en";
  }, [lang]);

  const barRef = useRef<HTMLDivElement | null>(null);
  useScrollFrame(() => {
    const el = barRef.current;
    if (!el) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    el.style.width = `${max > 0 ? Math.min(1, window.scrollY / max) * 100 : 0}%`;
  });

  const ongoing = vms.filter((v) => v.live).length;

  return (
    <>
      <div
        ref={barRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: 2,
          width: "0%",
          background: "var(--lime)",
          zIndex: 60,
          pointerEvents: "none",
        }}
      />
      <Header lang={lang} setLang={setLang} t={t} />
      <main id="top">
        <Hero t={t} ongoingCount={ongoing} totalCount={vms.length} />
        <Marquee t={t} />
        <Now t={t} />
        <Projects t={t} />
        <ExperienceSection t={t} lang={lang} vms={vms} now={now} />
        <Studies t={t} />
        <FilmRoll t={t} />
        <Contact t={t} />
      </main>
      <Footer t={t} />
    </>
  );
}
