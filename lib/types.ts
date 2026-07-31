export type Lang = "no" | "en";

export type Localized = { no: string; en: string };

export type ExperienceType = "Betalt" | "Frivillig" | "Utdanning";

export interface Experience {
  id: string;
  title: Localized;
  organization: string;
  type: ExperienceType;
  /** Decimal year, e.g. 2025.625 ≈ Aug 2025. null i `to` betyr pågående. */
  from: number;
  to: number | null;
  /** Diskrete perioder (sesongarbeid). Utelatt = sammenhengende from→to. */
  segments?: [number, number][];
  note?: Localized;
  description: Localized;
  imagePath: string;
  tags: { no: string[]; en: string[] };
}

export interface Course {
  code: string;
  title: string;
}

export interface Semester {
  term: string;
  year: number;
  courses: Course[];
}
