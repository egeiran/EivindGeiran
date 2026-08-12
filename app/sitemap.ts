import type { MetadataRoute } from "next";

import { pageUrl } from "@/lib/meta";
import { MACHINE_ROUTES, SITE_URL, SUBSITES } from "@/lib/site";

// Sitemapet genereres på build, så lastModified er deploy-tidspunktet.
const lastModified = new Date();

/** Språkparet for en side, i formatet Google vil ha hreflang-alternativer. */
function languages(key: "home" | "cv") {
  return {
    "nb-NO": pageUrl(key, "no"),
    en: pageUrl(key, "en"),
    "x-default": pageUrl(key, "no"),
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: pageUrl("home", "no"),
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
      alternates: { languages: languages("home") },
    },
    {
      url: pageUrl("home", "en"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: { languages: languages("home") },
    },
    // CV-sidene er de fullstendige, maskinlesbare utgavene av innholdet.
    {
      url: pageUrl("cv", "no"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: { languages: languages("cv") },
    },
    {
      url: pageUrl("cv", "en"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: { languages: languages("cv") },
    },
    {
      url: `${SITE_URL}${MACHINE_ROUTES.cvJson}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // Undersidene ligger på egne subdomener. Google godtar dem i dette
    // sitemapet så lenge hele domenet er verifisert som én property i
    // Search Console (domain property, ikke URL-prefix).
    ...SUBSITES.map((url) => ({
      url,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
