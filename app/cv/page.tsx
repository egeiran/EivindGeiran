import CvPage from "@/components/CvPage";
import { COPY } from "@/lib/copy";
import { pageMeta } from "@/lib/meta";
import { nowDecimal } from "@/lib/time";

const c = COPY.no.cv;

export const metadata = pageMeta("cv", "no", {
  title: c.metaTitle,
  description: c.metaDescription,
});

export default function Page() {
  return <CvPage lang="no" now={nowDecimal()} />;
}
