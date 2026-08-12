import { graphScript, type PageNode } from "@/lib/jsonld";
import type { Lang } from "@/lib/types";

/** Legger den strukturerte dataen for én side inn i dokumentet. */
export default function JsonLd({
  lang,
  now,
  page,
}: {
  lang: Lang;
  now: number;
  page: PageNode;
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: graphScript(lang, now, page) }}
    />
  );
}
