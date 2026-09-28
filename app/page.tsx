import Site from "@/components/Site";
import data from "@/data/experiences.json";
import { nowDecimal } from "@/lib/time";
import type { Experience } from "@/lib/types";

// Siden bygges statisk, men fornyes i bakgrunnen minst én gang i døgnet — ellers
// ville «nå» (datoen i Nå, slutten på tidslinja, hvilke roller som er pågående)
// stått fast på datoen for siste deploy.
export const revalidate = 86400;

export default function Page() {
  // «Nå» beregnes på serveren og sendes som prop, så SSR-HTML og hydrering
  // alltid er enige om tidsaksen.
  return <Site experiences={data.experiences as Experience[]} now={nowDecimal()} />;
}
