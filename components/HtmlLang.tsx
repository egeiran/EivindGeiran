"use client";

import { useEffect } from "react";

/**
 * Setter `<html lang>` til rutens språk. Rot-layouten må velge én verdi for
 * hele appen, og velger nb; her rettes den opp for klienter som kjører JS.
 * Innholdet er uansett merket med riktig `lang` av LangRoot, så en crawler
 * uten JS får korrekt språk på selve teksten.
 */
export default function HtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
