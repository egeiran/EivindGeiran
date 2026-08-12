// CV-en i JSON Resume-format (https://jsonresume.org/schema). Formatet er det
// nærmeste som finnes en de facto standard for maskinlesbare CV-er, så en
// parser slipper å gjette på strukturen vår.
//
// Innholdet er den engelske versjonen: feltnavnene i formatet er engelske, og
// det er internasjonale verktøy som konsumerer det. Den norske utgaven ligger
// på /cv, og begge språk er lenket fra meta.html.
//
// Ruta ligger på rot og ikke under /api/, som robots.txt holder utenfor crawl.

import { buildCv, type CvRole } from "@/lib/cv";
import { COPY } from "@/lib/copy";
import { MACHINE_ROUTES, ROUTES, SAME_AS, SITE_URL } from "@/lib/site";
import { nowDecimal } from "@/lib/time";

export const dynamic = "force-static";

/** JSON Resume vil ha hele datoer; vi kjenner bare måneden. */
const day = (isoMonth: string) => `${isoMonth}-01`;

const period = (r: CvRole) => ({
  startDate: day(r.startISO),
  ...(r.endISO ? { endDate: day(r.endISO) } : {}),
});

function network(url: string): string {
  const host = new URL(url).hostname.replace(/^www\./, "");
  if (host.includes("github")) return "GitHub";
  if (host.includes("linkedin")) return "LinkedIn";
  return host;
}

export function GET() {
  const now = nowDecimal();
  const cv = buildCv("en", now);
  const c = COPY.en.cv;

  // Emnelista hører til graden ved NTNU, ikke til videregående.
  const courses = cv.courses.flatMap((sem) =>
    sem.courses.map((course) => `${course.code} — ${course.title} (${sem.term} ${sem.year})`)
  );

  const resume = {
    $schema: "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    basics: {
      name: cv.fullName,
      label: cv.jobTitle,
      email: cv.email,
      url: SITE_URL,
      summary: `${cv.summary} ${cv.availability}`,
      // `region` er ment for fylke/delstat, ikke land — countryCode dekker det.
      location: { city: cv.locality, countryCode: "NO" },
      profiles: SAME_AS.map((url) => ({ network: network(url), url })),
    },
    work: cv.work.map((r) => ({
      name: r.organization,
      position: r.title,
      ...period(r),
      summary: r.description,
      highlights: r.note ? [r.note] : [],
      keywords: r.tags,
    })),
    volunteer: cv.volunteer.map((r) => ({
      organization: r.organization,
      position: r.title,
      ...period(r),
      summary: r.description,
    })),
    education: cv.education.map((r) => ({
      institution: r.organization,
      area: r.title,
      ...period(r),
      summary: r.description,
      ...(r.organization === "NTNU" ? { courses } : {}),
    })),
    projects: cv.projects.map((p) => ({
      name: p.name,
      description: p.description,
      url: p.webUrl,
      keywords: p.stack,
    })),
    skills: [
      { name: c.techLabel, keywords: cv.tech },
      { name: c.domainLabel, keywords: cv.domains },
    ],
    languages: [
      { language: "Norwegian", fluency: "Native speaker" },
      { language: "English", fluency: "Professional working proficiency" },
    ],
    meta: {
      canonical: `${SITE_URL}${MACHINE_ROUTES.cvJson}`,
      version: "v1.0.0",
      // Én dato per deploy, på linje med lastModified i sitemapet.
      lastModified: new Date().toISOString(),
      // Menneskevennlige versjoner av det samme innholdet.
      html: { no: `${SITE_URL}${ROUTES.no.cv}`, en: `${SITE_URL}${ROUTES.en.cv}` },
    },
  };

  return new Response(JSON.stringify(resume, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
