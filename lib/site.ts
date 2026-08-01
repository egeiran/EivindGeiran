// Én kilde for identitet og URL-er som brukes av metadata, sitemap, robots og
// den strukturerte dataen (JSON-LD). Skal søkemotorene knytte navnet «Eivind
// Geiran» til dette domenet, må navn og lenker være identiske overalt.

export const SITE_URL = "https://eivindgeiran.no";

export const PERSON = {
  name: "Eivind Geiran",
  fullName: "Eivind Systad Geiran",
  jobTitle: "Datateknologistudent",
  email: "eivind.geiran@gmail.com",
  locality: "Trondheim",
  country: "Norge",
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

/** Undersider på egne subdomener — tas med i sitemap for oppdagelse. */
export const SUBSITES = [
  "https://nhl-ml.eivindgeiran.no/",
  "https://tilbud.eivindgeiran.no/",
  "https://towerdefense.eivindgeiran.no/",
] as const;
