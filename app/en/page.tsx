import JsonLd from "@/components/JsonLd";
import LangRoot from "@/components/LangRoot";
import Site from "@/components/Site";
import data from "@/data/experiences.json";
import { HOME_DESCRIPTION, HOME_TITLE, pageMeta, pageUrl } from "@/lib/meta";
import { nowDecimal } from "@/lib/time";
import type { Experience } from "@/lib/types";

export const metadata = pageMeta("home", "en", {
  title: HOME_TITLE.en,
  description: HOME_DESCRIPTION.en,
});

export default function EnglishPage() {
  const now = nowDecimal();
  return (
    <LangRoot lang="en">
      <Site experiences={data.experiences as Experience[]} now={now} lang="en" />
      <JsonLd
        lang="en"
        now={now}
        page={{
          url: pageUrl("home", "en"),
          name: HOME_TITLE.en,
          description: HOME_DESCRIPTION.en,
        }}
      />
    </LangRoot>
  );
}
