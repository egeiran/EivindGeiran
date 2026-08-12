import CvPage from "@/components/CvPage";
import { COPY } from "@/lib/copy";
import { pageMeta } from "@/lib/meta";
import { nowDecimal } from "@/lib/time";

const c = COPY.en.cv;

export const metadata = pageMeta("cv", "en", {
  title: c.metaTitle,
  description: c.metaDescription,
});

export default function Page() {
  return <CvPage lang="en" now={nowDecimal()} />;
}
