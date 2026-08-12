import type { Lang } from "@/lib/types";
import HtmlLang from "./HtmlLang";

const HTML_LANG: Record<Lang, string> = { no: "nb", en: "en" };

/**
 * Merker et undertre med språket sitt.
 *
 * `<html lang>` ligger i rot-layouten og kan ikke varieres per rute uten flere
 * rot-layouter, så de engelske rutene annoterer innholdet sitt her i stedet —
 * `lang` arves nedover, så en crawler eller skjermleser leser riktig språk
 * uansett. `display: contents` gjør at wrapperen ikke finnes i boksetreet, så
 * `position: sticky` i headeren oppfører seg nøyaktig som før.
 */
export default function LangRoot({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  return (
    <div lang={HTML_LANG[lang]} style={{ display: "contents" }}>
      <HtmlLang lang={HTML_LANG[lang]} />
      {children}
    </div>
  );
}
