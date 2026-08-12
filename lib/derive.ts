import { COPY, TYPE_COLOR } from "./copy";
import { fmtDate, toISOMonth, yearOf } from "./time";
import type { Experience, ExperienceType, Lang } from "./types";

/** Ferdig utledet visningsmodell for én erfaring, brukt av alle fire views. */
export interface ExperienceVM {
  id: string;
  title: string;
  organization: string;
  description: string;
  imagePath: string;
  tags: string[];
  typeKey: ExperienceType;
  typeLabel: string;
  color: string;
  sNum: number;
  eNum: number;
  live: boolean;
  segs: [number, number][];
  note: string;
  startYear: number;
  period: string;
  /** ISO 8601 år-måned, så periodene kan pakkes i `<time datetime>`. */
  startISO: string;
  /** null betyr pågående. */
  endISO: string | null;
  startLabel: string;
  endLabel: string;
}

export function deriveExperiences(
  raw: Experience[],
  lang: Lang,
  now: number
): ExperienceVM[] {
  const t = COPY[lang];
  return raw.map((e) => {
    const live = e.to === null;
    const eNum = e.to ?? now;
    const startLabel = fmtDate(e.from, lang);
    const endLabel = live ? t.nowWord.toLowerCase() : fmtDate(eNum, lang);
    const period = `${startLabel} – ${endLabel}`;
    return {
      id: e.id,
      title: e.title[lang],
      organization: e.organization,
      description: e.description[lang],
      imagePath: e.imagePath,
      tags: e.tags[lang],
      typeKey: e.type,
      typeLabel: t.filters[e.type],
      color: TYPE_COLOR[e.type],
      sNum: e.from,
      eNum,
      live,
      segs: e.segments && e.segments.length ? e.segments : [[e.from, eNum]],
      note: e.note ? e.note[lang] : "",
      startYear: yearOf(e.from),
      period,
      startISO: toISOMonth(e.from),
      endISO: live ? null : toISOMonth(eNum),
      startLabel,
      endLabel,
    };
  });
}

/** Tidsaksen beregnes fra dataene så admin-endringer aldri faller utenfor. */
export function deriveAxis(vms: ExperienceVM[], now: number) {
  const minFrom = vms.length ? Math.min(...vms.map((v) => v.sNum)) : now - 1;
  return { minY: minFrom - 0.45, maxY: now + 0.25 };
}

export function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
