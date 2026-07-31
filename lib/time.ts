import type { Lang } from "./types";

export const MONTHS: Record<Lang, string[]> = {
  no: ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

/** Desimal-år for midten av gitt måned (1–12), f.eks. toDecimalYear(2025, 8) ≈ 2025.625. */
export function toDecimalYear(year: number, month: number): number {
  return year + (month - 0.5) / 12;
}

/** Måned 1–12 fra et desimal-år. */
export function monthOf(v: number): number {
  return Math.max(0, Math.min(11, Math.floor((v % 1) * 12))) + 1;
}

export function yearOf(v: number): number {
  return Math.floor(v);
}

/** Dagens tidspunkt som desimal-år. */
export function nowDecimal(): number {
  const d = new Date();
  return toDecimalYear(d.getFullYear(), d.getMonth() + 1);
}

export function fmtDate(v: number, lang: Lang): string {
  return `${MONTHS[lang][monthOf(v) - 1]} ${yearOf(v)}`;
}
