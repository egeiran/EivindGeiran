// Én kilde for identitet og URL-er som brukes av metadata, sitemap, robots og
// den strukturerte dataen (JSON-LD). Skal søkemotorene knytte navnet «Eivind
// Geiran» til dette domenet, må navn og lenker være identiske overalt.

export const SITE_URL = "https://eivindgeiran.no";

// Navn og sted er de samme uansett språk. Stillingstittel og landsnavn er det
// ikke, og ligger derfor under `cv` i lib/copy.ts — én utgave per språk.
export const PERSON = {
  name: "Eivind Geiran",
  fullName: "Eivind Systad Geiran",
  email: "eivind.geiran@gmail.com",
  locality: "Trondheim",
} as const;

/**
 * Profiler og egne flater som beviser at det er samme person. `sameAs` er det
 * Google bruker for å slå sammen signalene til én entitet.
 */
export const SAME_AS = [
  "https://github.com/egeiran",
  "https://www.linkedin.com/in/eivind-systad-geiran-640231238/",
  "https://kort-forklart.no/",
  "https://nhl-ml.eivindgeiran.no/",
  "https://tilbud.eivindgeiran.no/",
  "https://towerdefense.eivindgeiran.no/",
] as const;

/**
 * Rutene på dette domenet. Forsiden finnes på norsk og engelsk som ekte URL-er
 * (ikke bare klientside-state), fordi en crawler bare ser språket som faktisk
 * ligger i HTML-en den blir servert.
 */
export const ROUTES = {
  no: { home: "/", cv: "/cv" },
  en: { home: "/en", cv: "/en/cv" },
} as const;

/** Flater som finnes for maskiner heller enn mennesker. */
export const MACHINE_ROUTES = {
  /** CV-en i JSON Resume-format (jsonresume.org). */
  cvJson: "/cv.json",
  /** Kort oppsummering for språkmodeller, jf. llmstxt.org. */
  llmsTxt: "/llms.txt",
} as const;

/** Undersider på egne subdomener — tas med i sitemap for oppdagelse. */
export const SUBSITES = [
  "https://nhl-ml.eivindgeiran.no/",
  "https://tilbud.eivindgeiran.no/",
  "https://towerdefense.eivindgeiran.no/",
] as const;
