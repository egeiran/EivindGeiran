// Én ferdig utledet CV-modell, delt av /cv-sidene, JSON-LD-en, /cv.json og
// /llms.txt. Alt springer ut av data/experiences.json og lib/copy.ts, så en ny
// rolle lagt inn via /admin dukker opp alle fire steder uten videre arbeid.

import data from "@/data/experiences.json";
import { COPY, COURSES, LINKS } from "./copy";
import { PERSON } from "./site";
import { fmtDate, toISOMonth, yearOf } from "./time";
import type { Experience, ExperienceType, Lang, Semester } from "./types";

const EXPERIENCES = data.experiences as Experience[];

/** Studiepoeng per emne ved NTNU. Alle emnene i COURSES er ordinære 7,5-emner. */
const CREDITS_PER_COURSE = 7.5;

/** Én rolle, ferdig oversatt og med datoer i et format maskiner forstår. */
export interface CvRole {
  id: string;
  title: string;
  organization: string;
  type: ExperienceType;
  typeLabel: string;
  description: string;
  note: string;
  tags: string[];
  /** ISO 8601 år-måned, f.eks. «2025-08». */
  startISO: string;
  /** null betyr pågående. */
  endISO: string | null;
  /** Halvdelene hver for seg, så de kan pakkes i hvert sitt `<time>`. */
  startLabel: string;
  endLabel: string;
  /** Lesbar periode, f.eks. «aug 2025 – nå». */
  periodLabel: string;
  live: boolean;
}

export interface CvProject {
  name: string;
  description: string;
  stack: string[];
  /** Kildekode. */
  repoUrl: string;
  /** Kjørende versjon. */
  webUrl: string;
  featured: boolean;
}

export interface Cv {
  lang: Lang;
  name: string;
  fullName: string;
  jobTitle: string;
  email: string;
  locality: string;
  country: string;
  summary: string;
  availability: string;
  work: CvRole[];
  volunteer: CvRole[];
  education: CvRole[];
  projects: CvProject[];
  courses: Semester[];
  /** Språk, rammeverk og verktøy — hentet fra prosjektenes stack. */
  tech: string[];
  /** Fagområder — hentet fra taggene på erfaringene. */
  domains: string[];
  totalCredits: number;
}

/** Bevarer rekkefølgen på første forekomst; brukes til ferdighetslistene. */
function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function toRole(e: Experience, lang: Lang, now: number): CvRole {
  const t = COPY[lang];
  const live = e.to === null;
  const end = e.to ?? now;
  const startLabel = fmtDate(e.from, lang);
  const endLabel = live ? t.cv.presentWord : fmtDate(end, lang);
  return {
    id: e.id,
    title: e.title[lang],
    organization: e.organization,
    type: e.type,
    typeLabel: t.filters[e.type],
    description: e.description[lang],
    note: e.note ? e.note[lang] : "",
    tags: e.tags[lang],
    startISO: toISOMonth(e.from),
    endISO: live ? null : toISOMonth(end),
    startLabel,
    endLabel,
    periodLabel: `${startLabel} – ${endLabel}`,
    live,
  };
}

export function buildCv(lang: Lang, now: number): Cv {
  const t = COPY[lang];
  // Nyeste først. Pågående roller sorterer naturlig øverst siden de starter sist.
  const roles = EXPERIENCES.slice().sort((a, b) => b.from - a.from);
  const ofType = (type: ExperienceType) =>
    roles.filter((e) => e.type === type).map((e) => toRole(e, lang, now));

  // Kort Forklart ligger i copy som egen «featured»-blokk og ikke i projects-
  // lista, så den må settes sammen her for at CV-en skal vise alle fire.
  const projects: CvProject[] = [
    {
      name: "Kort Forklart",
      description: t.kfDesc,
      stack: t.kfStack,
      repoUrl: LINKS.github,
      webUrl: LINKS.kortForklart,
      featured: true,
    },
    ...t.projects.map((p) => ({
      name: p.name,
      description: p.description,
      stack: p.stack,
      repoUrl: p.url,
      webUrl: p.webUrl,
      featured: false,
    })),
  ];

  const courseCount = COURSES.reduce((sum, s) => sum + s.courses.length, 0);

  return {
    lang,
    name: PERSON.name,
    fullName: PERSON.fullName,
    // Tittel og land følger sidens språk; navn og sted er språkuavhengige.
    jobTitle: t.cv.jobTitle,
    email: PERSON.email,
    locality: PERSON.locality,
    country: t.cv.countryName,
    summary: t.cv.summary,
    availability: t.cv.availability,
    work: ofType("Betalt"),
    volunteer: ofType("Frivillig"),
    education: ofType("Utdanning"),
    projects,
    courses: COURSES,
    tech: unique(projects.flatMap((p) => p.stack)),
    domains: unique(roles.flatMap((e) => e.tags[lang])),
    totalCredits: courseCount * CREDITS_PER_COURSE,
  };
}

/** Året den eldste registrerte erfaringen startet. */
export function firstActiveYear(): number {
  return yearOf(Math.min(...EXPERIENCES.map((e) => e.from)));
}
