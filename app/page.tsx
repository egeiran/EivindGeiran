import Site from "@/components/Site";
import data from "@/data/experiences.json";
import type { Experience } from "@/lib/types";

export default function Page() {
  return <Site experiences={data.experiences as Experience[]} />;
}
