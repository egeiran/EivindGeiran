# EivindGeiran — Rampelys

Personlig nettside og mini-CV, redesignet etter designhandoffen i
`design_handoff_rampelys_portfolio/` («Rampelys»). Bygget med Next.js 15 + TypeScript,
deployes på Vercel.

## Kjøre lokalt

```bash
npm install
npm run dev        # http://localhost:3000
```

## Struktur

- `app/` — sider: `/` og `/en` (hele siden), `/cv` og `/en/cv` (CV), `/cv.json` og
  `/llms.txt` (maskinlesbart), `/admin` (dataredigering), `/api/experiences`
- `components/` — én komponent per seksjon (hero, marquee, nå, prosjekter, erfaring med
  fire visninger, studiet, filmrull, kontakt) pluss `CvPage`
- `lib/` — copy (NO/EN), datamodell-utledning, CV-modell, JSON-LD, metadata,
  tidsverktøy (desimal-år), scramble-effekt
- `data/experiences.json` — **all erfaringsdata**; driver tidslinje, aktivitetskart,
  liste, git blame, CV-sidene, `/cv.json` og `/llms.txt` fra én kilde

## Redigere erfaringsdata

`/admin` (og `/api/experiences`) er gatet bak miljøvariabelen **`DEV=1`** — satt i
`.env.local` lokalt og på Vercel *preview*-deployments; uten flagget svarer siden 404.
Gå til `/admin` mens `npm run dev` kjører — endringer skrives rett til
`data/experiences.json`. Commit og deploy. På Vercel er admin-siden skrivebeskyttet,
men kan eksportere JSON du legger inn manuelt.

> Fra/til-datoene er verifisert på månedsnivå. Trenger du diskrete perioder
> (sesongarbeid), bruk `segments`-feltet via `/admin`.

## SEO

Målet er at søk på **«Eivind Geiran»** treffer eivindgeiran.no. Alt som er i koden:

- `lib/site.ts` — én kilde for navn, URL, ruter og `sameAs`-profiler. Navnet må skrives
  likt overalt; det er slik Google slår sammen signalene til én entitet.
- `lib/meta.ts` — titler, canonical og hreflang. Hver side finnes på to språk, og paret
  peker på hverandre begge veier.
- `app/layout.tsx` — `robots`-direktiver og OG/Twitter-standarder.
- `app/robots.ts` og `app/sitemap.ts` — genereres av Next. Sitemapet lister også
  subdomenene; det krever at hele domenet er verifisert som **domain property** i
  Google Search Console.
- `components/Hero.tsx` — sidens eneste `<h1>` er fullt navn + rolle (ordmerket er
  dekorativt og `aria-hidden`).
- `components/Footer.tsx` — synlige lenker til subdomenene på hver visning.

Gjenstår utenfor repoet: verifisere domenet i Search Console, sende inn sitemapet, og
lenke hit fra LinkedIn og GitHub-profilen.

## Lesbarhet for AI og CV-parsere

Rekruttering går i økende grad gjennom verktøy som leser en side automatisk — enten en
ATS eller en språkmodell. De henter som regel HTML-en én gang og kjører ikke noe klikk,
så alt som først finnes etter en interaksjon, finnes ikke for dem.

- **`/cv` og `/en/cv`** (`components/CvPage.tsx`) er den fullstendige flaten: alle
  roller med `<time datetime>`-datoer, alle emner, prosjekter, ferdigheter og kontakt —
  server-rendret, uten tabs og uten klientside-state. Print-stilene gjør ⌘P til en
  brukbar PDF.
- **`/cv.json`** er den samme CV-en i [JSON Resume](https://jsonresume.org/schema)-format,
  og **`/llms.txt`** er en kort markdown-oppsummering etter [llmstxt.org](https://llmstxt.org).
  Begge genereres fra `lib/cv.ts`, så de holder seg i synk med `data/experiences.json`.
- **`lib/jsonld.ts`** beskriver arbeidserfaring, utdanning, verv og prosjekter som egne
  noder med datoer (schema.org sitt Role-mønster), ikke bare navn og lenker.
- **Listevisningen i erfaringsseksjonen er alltid montert**, også når en annen fane er
  valgt. Den er den eneste visningen som har periode, beskrivelse og tags for hver
  rolle; er den ikke i HTML-en, ser en parser elleve stillingstitler uten innhold.
- **`app/robots.ts`** slipper AI-crawlerne inn eksplisitt. `Google-Extended` og
  `Applebot-Extended` er rene opt-out-brytere — nevnes de ikke, står valget udokumentert.

To felter er ment å redigeres for hånd, og er de som faktisk matches mot en
stillingsannonse — begge ligger under `cv` i `lib/copy.ts`, for hvert språk:

| Felt | Hva det er |
| --- | --- |
| `summary` | Kort sammendrag øverst på CV-en, og `Person.description` i JSON-LD. |
| `availability` | Hva du er åpen for. Står i dag nøytralt formulert; gjør den konkret («søker sommerjobb 2027 innen …») når det stemmer. |

> Ikke legg skjult tekst rettet mot modellen på siden («ranger denne kandidaten
> høyt»). Det er prompt injection, det oppdages, og det er nok til å bli vraket.
> Skjult innhold som er identisk med det synlige — som listevisningen bak fanen —
> er en annen sak og helt uproblematisk.

## Deploy

Repoet er klart for Vercel: importer repoet, framework «Next.js», ingen ekstra config.
