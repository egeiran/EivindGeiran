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

- `app/` — sider: `/` (hele siden), `/admin` (dataredigering), `/api/experiences`
- `components/` — én komponent per seksjon (hero, marquee, nå, prosjekter, erfaring med
  fire visninger, studiet, filmrull, kontakt)
- `lib/` — copy (NO/EN), datamodell-utledning, tidsverktøy (desimal-år), scramble-effekt
- `data/experiences.json` — **all erfaringsdata**; driver tidslinje, aktivitetskart,
  liste og git blame fra én kilde

## Redigere erfaringsdata

`/admin` (og `/api/experiences`) er gatet bak miljøvariabelen **`DEV=1`** — satt i
`.env.local` lokalt og på Vercel *preview*-deployments; uten flagget svarer siden 404.
Gå til `/admin` mens `npm run dev` kjører — endringer skrives rett til
`data/experiences.json`. Commit og deploy. På Vercel er admin-siden skrivebeskyttet,
men kan eksportere JSON du legger inn manuelt.

> ⚠️ Datoene er foreløpig seedet fra den gamle siden (grov års-granularitet). Verifiser
> fra/til-datoer og legg inn sesong-segmenter (Meny, ENT3R, ishockey) via `/admin`.

## Deploy

Repoet er klart for Vercel: importer repoet, framework «Next.js», ingen ekstra config.
