import type { MetadataRoute } from "next";

import { SITE_URL, SUBSITES } from "@/lib/site";

// Sitemapet genereres på build, så lastModified er deploy-tidspunktet.
const lastModified = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "monthly", priority: 1 },
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
