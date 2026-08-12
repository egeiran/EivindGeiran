// Strukturert data (JSON-LD) bygget fra den samme CV-modellen som HTML-en.
//
// Person-noden er den siden alltid har hatt; det nye er at arbeidserfaring,
// utdanning, verv og prosjekter nå ligger som egne noder med datoer. En parser
// som allerede forstår schema.org slipper dermed å lese prosaen for å finne ut
// hvor og når det har vært jobbet.

import { buildCv, type CvRole } from "./cv";
import { PERSON, SAME_AS, SITE_URL } from "./site";
import type { Lang } from "./types";

/**
 * Utdanningsstedene får sin spesifikke schema.org-type; det er forskjellen på
 * «en organisasjon» og «en grad tatt ved et universitet». URL-en er den eneste
 * vi har verifisert i repoet fra før.
 */
const ORG_META: Record<string, { type: string; url?: string }> = {
  NTNU: { type: "CollegeOrUniversity", url: "https://www.ntnu.no/" },
  "Sandvika VGS": { type: "HighSchool" },
};

const BCP47: Record<Lang, string> = { no: "nb-NO", en: "en" };

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

function organization(name: string) {
  const meta = ORG_META[name];
  return {
    "@type": meta?.type ?? "Organization",
    name,
    ...(meta?.url ? { url: meta.url } : {}),
  };
}

/**
 * schema.org sitt Role-mønster: rollen står der organisasjonen ellers ville
 * stått, og gjentar egenskapen på innsiden. Det er slik man får datoer på et
 * ansettelsesforhold uten å miste koblingen til organisasjonen.
 */
function role(property: "worksFor" | "alumniOf" | "memberOf", r: CvRole) {
  return {
    "@type": "OrganizationRole",
    roleName: r.title,
    startDate: r.startISO,
    ...(r.endISO ? { endDate: r.endISO } : {}),
    description: r.description,
    [property]: organization(r.organization),
  };
}

function projectNodes(lang: Lang, now: number) {
  return buildCv(lang, now).projects.map((p) => ({
    // Alle fire kjører i nettleseren, så SoftwareApplication er riktigere enn
    // det generiske CreativeWork og gir parseren applicationCategory gratis.
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#project-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: p.name,
    description: p.description,
    url: p.webUrl,
    codeRepository: p.repoUrl,
    applicationCategory: "WebApplication",
    operatingSystem: "Web",
    inLanguage: BCP47[lang],
    author: { "@id": PERSON_ID },
    keywords: p.stack.join(", "),
  }));
}

export interface PageNode {
  /** Absolutt URL til siden grafen beskriver. */
  url: string;
  name: string;
  description: string;
}

/**
 * Bygger hele grafen for én side. Person- og WebSite-nodene har faste @id-er,
 * så de to sidene beskriver samme entitet i stedet for to like personer.
 */
export function buildGraph(lang: Lang, now: number, page: PageNode) {
  const cv = buildCv(lang, now);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": PERSON_ID,
        name: PERSON.name,
        alternateName: PERSON.fullName,
        givenName: "Eivind",
        familyName: "Geiran",
        url: SITE_URL,
        email: `mailto:${PERSON.email}`,
        image: `${SITE_URL}/opengraph-image.png`,
        jobTitle: cv.jobTitle,
        description: cv.summary,
        disambiguatingDescription: cv.availability,
        nationality: { "@type": "Country", name: cv.country },
        address: {
          "@type": "PostalAddress",
          addressLocality: PERSON.locality,
          addressCountry: "NO",
        },
        homeLocation: { "@type": "Place", name: `${cv.locality}, ${cv.country}` },
        knowsLanguage: ["nb-NO", "en"],
        knowsAbout: [...cv.tech, ...cv.domains],
        hasOccupation: cv.work.map((r) => ({
          "@type": "Occupation",
          name: r.title,
          occupationLocation: { "@type": "Place", name: PERSON.locality },
        })),
        worksFor: cv.work.map((r) => role("worksFor", r)),
        alumniOf: cv.education.map((r) => role("alumniOf", r)),
        memberOf: cv.volunteer.map((r) => role("memberOf", r)),
        sameAs: [...SAME_AS],
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_URL,
        name: PERSON.name,
        inLanguage: BCP47[lang],
        description: page.description,
        publisher: { "@id": PERSON_ID },
        about: { "@id": PERSON_ID },
      },
      {
        "@type": "ProfilePage",
        "@id": `${page.url}#profilepage`,
        url: page.url,
        name: page.name,
        description: page.description,
        inLanguage: BCP47[lang],
        isPartOf: { "@id": WEBSITE_ID },
        mainEntity: { "@id": PERSON_ID },
      },
      ...projectNodes(lang, now),
    ],
  };
}

/**
 * Serialisert graf klar for dangerouslySetInnerHTML. Alt innholdet kommer fra
 * konstanter i repoet, men `<` escapes uansett: en beskrivelse som en dag
 * inneholder «</script>» skal ikke kunne lukke taggen den ligger i.
 */
export function graphScript(lang: Lang, now: number, page: PageNode): string {
  return JSON.stringify(buildGraph(lang, now, page)).replace(/</g, "\\u003c");
}
