// llms.txt (https://llmstxt.org): en kort, flat markdown-oppsummering av hvem
// siden handler om, ment for språkmodeller som henter én fil framfor å crawle
// hele nettstedet. Genereres fra CV-modellen, så den aldri kommer ut av synk.
//
// Skrives på engelsk, som /cv.json — den norske utgaven ligger på /cv.

import { buildCv, type CvRole } from "@/lib/cv";
import { MACHINE_ROUTES, ROUTES, SAME_AS, SITE_URL } from "@/lib/site";
import { nowDecimal } from "@/lib/time";

export const dynamic = "force-static";

const abs = (path: string) => `${SITE_URL}${path}`;

function line(r: CvRole): string {
  const period = `${r.startISO} – ${r.endISO ?? "present"}`;
  return `- **${r.title}**, ${r.organization} (${period}) — ${r.description}`;
}

export function GET() {
  const now = nowDecimal();
  const cv = buildCv("en", now);

  const body = `# ${cv.fullName}

> ${cv.summary}

${cv.availability}

- Location: ${cv.locality}, ${cv.country}
- Email: ${cv.email}
- Website: ${SITE_URL}
- Updated: ${new Date().toISOString().slice(0, 10)}

## CV

- [CV in English](${abs(ROUTES.en.cv)}): full experience, education and projects.
- [CV på norsk](${abs(ROUTES.no.cv)}): the same content in Norwegian.
- [JSON Resume](${abs(MACHINE_ROUTES.cvJson)}): structured, machine-readable version.

## Work experience

${cv.work.map(line).join("\n")}

## Volunteer work and positions of trust

${cv.volunteer.map(line).join("\n")}

## Education

${cv.education.map(line).join("\n")}

Coursework (${cv.totalCredits} ECTS credits): ${cv.courses
    .flatMap((s) => s.courses.map((course) => `${course.code} ${course.title}`))
    .join("; ")}.

## Projects

${cv.projects
  .map((p) => `- **${p.name}** (${p.webUrl}) — ${p.description} Stack: ${p.stack.join(", ")}.`)
  .join("\n")}

## Skills

- Technology: ${cv.tech.join(", ")}
- Areas: ${cv.domains.join(", ")}
- Languages: Norwegian (native), English (professional working proficiency)

## Profiles

${SAME_AS.map((url) => `- ${url}`).join("\n")}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
