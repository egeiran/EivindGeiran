import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

// /admin og /api er gatet bak DEV=1 og svarer 404 i produksjon, men holdes
// uansett utenfor crawl-budsjettet.
const DISALLOW = ["/admin", "/api/"];

/**
 * Crawlerne bak AI-søk, -svar og -trening. De fleste er tillatt som standard,
 * men Google-Extended og Applebot-Extended er rene opt-out-brytere: nevner man
 * dem ikke, står valget udokumentert. Målet her er at siden skal være lesbar
 * for verktøy som vurderer kandidater, så alle slippes inn eksplisitt.
 */
const AI_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "Bingbot",
  "Amazonbot",
  "meta-externalagent",
  "CCBot",
  "Bytespider",
  "Timpibot",
  "cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_AGENTS.map((userAgent) => ({ userAgent, allow: "/", disallow: DISALLOW })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
