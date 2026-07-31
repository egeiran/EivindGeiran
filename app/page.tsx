import Site from "@/components/Site";
import data from "@/data/experiences.json";
import { nowDecimal } from "@/lib/time";
import type { Experience } from "@/lib/types";

export default function Page() {
  // «Nå» beregnes på serveren og sendes som prop, så SSR-HTML og hydrering
  // alltid er enige om tidsaksen (fryses per build/deploy).
  return <Site experiences={data.experiences as Experience[]} now={nowDecimal()} />;
}
