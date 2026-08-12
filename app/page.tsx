import JsonLd from "@/components/JsonLd";
import LangRoot from "@/components/LangRoot";
import Site from "@/components/Site";
import data from "@/data/experiences.json";
import { HOME_DESCRIPTION, HOME_TITLE, pageMeta, pageUrl } from "@/lib/meta";
import { nowDecimal } from "@/lib/time";
import type { Experience } from "@/lib/types";

export const metadata = pageMeta("home", "no", {
  title: HOME_TITLE.no,
  description: HOME_DESCRIPTION.no,
});

export default function Page() {
  // «Nå» beregnes på serveren og sendes som prop, så SSR-HTML og hydrering
  // alltid er enige om tidsaksen (fryses per build/deploy).
  const now = nowDecimal();
  return (
    <LangRoot lang="no">
      <Site experiences={data.experiences as Experience[]} now={now} lang="no" />
      <JsonLd
        lang="no"
        now={now}
        page={{
          url: pageUrl("home", "no"),
          name: HOME_TITLE.no,
          description: HOME_DESCRIPTION.no,
        }}
      />
    </LangRoot>
  );
}
