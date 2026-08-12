// Titler, canonical og hreflang for de fire sidene. Hver side finnes på to
// språk, og paret må peke på hverandre begge veier — ellers behandler en
// søkemotor dem som to konkurrerende sider i stedet for to versjoner av samme.

import type { Metadata } from "next";
import { ROUTES, SITE_URL } from "./site";
import type { Lang } from "./types";

export type PageKey = "home" | "cv";

const PATHS: Record<PageKey, Record<Lang, string>> = {
  home: { no: ROUTES.no.home, en: ROUTES.en.home },
  cv: { no: ROUTES.no.cv, en: ROUTES.en.cv },
};

// Titlene starter med navnet: det er søket siden skal vinne.
export const HOME_TITLE: Record<Lang, string> = {
  no: "Eivind Geiran — datateknologi ved NTNU, Trondheim",
  en: "Eivind Geiran — computer science at NTNU, Trondheim",
};

export const HOME_DESCRIPTION: Record<Lang, string> = {
  no:
    "Eivind Geiran er datateknologistudent ved NTNU i Trondheim. Portefølje, " +
    "erfaring og prosjekter — Kort Forklart, NHL ML Prediction Model og tilbudsscraper.",
  en:
    "Eivind Geiran is a computer science student at NTNU in Trondheim, Norway. " +
    "Portfolio, experience and projects — Kort Forklart, an NHL ML prediction " +
    "model and a grocery offer scraper.",
};

/** Absolutt URL for en side på et gitt språk. */
export function pageUrl(key: PageKey, lang: Lang): string {
  const path = PATHS[key][lang];
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

export function pageMeta(
  key: PageKey,
  lang: Lang,
  { title, description }: { title: string; description: string }
): Metadata {
  return {
    // absolute, ikke template: titlene inneholder allerede navnet, og
    // «… | Eivind Geiran» på toppen av det blir bare støy.
    title: { absolute: title },
    description,
    alternates: {
      canonical: PATHS[key][lang],
      languages: {
        "nb-NO": PATHS[key].no,
        en: PATHS[key].en,
        // Norsk er standardvalget for en besøkende uten språkpreferanse.
        "x-default": PATHS[key].no,
      },
    },
    openGraph: {
      type: "profile",
      url: pageUrl(key, lang),
      title,
      description,
      locale: lang === "no" ? "no_NO" : "en_US",
      alternateLocale: [lang === "no" ? "en_US" : "no_NO"],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
