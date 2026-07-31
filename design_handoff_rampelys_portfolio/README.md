# Handoff: Rampelys — personal portfolio redesign (Eivind Geiran)

## Overview

A full redesign of `egeiran/EivindGeiran` (currently a static Norwegian mini-CV on GitHub
Pages). The redesign, codenamed **Rampelys** ("limelight"), turns the site from a static
scroll into something with a point of view: a spotlight hero, a data-driven experience
timeline with three interchangeable views, a `git blame` easter egg, a film-roll photo
gallery, and a direct hire-me CTA.

Target audience, in order: summer-internship recruiters (consulting/tech), Norwegian tech
companies hiring developers, and anyone curious. The intended first impression is
**"this person gets things done"** — hence the emphasis on volume, concurrency, and
shipped things over decorative visuals.

## About the design files

The files in this bundle are **design references written as a single HTML prototype**.
They demonstrate the intended look, motion, and behaviour — they are **not production
code to copy**. The task is to recreate these designs in the target codebase's
environment using its established patterns.

The current repo is plain HTML/CSS/JS on GitHub Pages. Two reasonable paths:

1. **Keep it static** — plain HTML/CSS/JS, deployed on GitHub Pages as today. All the
   behaviour in the prototype is vanilla-JS-friendly; nothing needs a framework.
2. **Move to Next.js** — Eivind already runs Next.js + TypeScript + Vercel for
   Kort Forklart, so this is a low-friction upgrade and makes the "GitHub activity /
   live stats" ideas easier later.

Either is fine. Do not port the prototype's runtime (`support.js`) — that is a design-tool
artifact. Read the markup for structure and exact values, then write idiomatic code.

**Important:** the prototype uses inline styles exclusively because of a constraint in the
design tool. In production, use whatever the codebase prefers — CSS modules, Tailwind,
plain stylesheets. Do not treat inline styles as an intentional design decision.

## Fidelity

**High-fidelity.** Colours, typography, spacing, motion timings, and copy are final
enough to build from. Recreate pixel-for-pixel. The two known-soft areas:

- **Experience dates are estimates.** Eivind must confirm them before launch — see
  *Data model* below.
- **The Computas logo is a placeholder** text-SVG. Replace with the real mark.

## Design tokens

### Colour

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#0c0e11` | page background, text on lime |
| `--panel` | `#12151a` | cards, bars, image wells |
| `--panel-alt` | `#0f1216` | film-roll strip / contact-sheet background |
| `--paper` | `#f4f1e8` | body text, logo plates |
| `--lime` | `#d9ff63` | primary accent, "paid" category, playhead |
| `--lime-hover` | `#e6ff8f` | button hover |
| `--orange` | `#ff8f5a` | "volunteer" category, segment note |
| `--blue` | `#2a7fff` | "education" category |
| `--hero-dim` | `#1b1f26` | the un-lit hero wordmark |

Alpha ramps used throughout, all on `--paper` (`244,241,232`):
`.03 .035 .04 .045 .05 .06 .09 .1 .12 .14 .16 .2 .22 .24 .26 .28 .3 .32 .34 .35 .38 .4 .42 .5 .55 .58 .6 .62 .72`

The three category colours come from the original `style.css` type tokens — keep them.

### Typography

Three Google fonts:

- **Syne** 700/800 — display. Wordmark, section titles, big numbers. Always
  `letter-spacing: -.035em` to `-.05em`, `line-height: .82`–`1.06`.
- **Schibsted Grotesk** 400–800 — body/UI. `line-height: 1.5`.
- **JetBrains Mono** 400/500/700 — all metadata, labels, dates, blame view, tickers.
  Uppercase labels get `letter-spacing: .09em`–`.16em`.

Scale actually used (px): 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 16, 16.5,
19, 20, 23, 26, 29, 30, 32, 38, 40, 46, 58, 62, plus `clamp(64px, 12.6vw, 190px)` for the
hero and `clamp(30px, 3.6vw, 50px)` for the CTA headline.

### Other

- Radii: `3px` (mono chips), `4px` (heat cells, segments), `6–9px` (rows, bands),
  `10–12px` (logo plates, cards), `14px` (cards), `20px` (CTA panel), `999px` (pills).
- Page gutter: `44px`. Section padding: `96px 44px`. `scroll-margin-top: 70px` on
  every anchored section (sticky header clearance).
- Easing: `cubic-bezier(.2,.8,.2,1)` for reveals/transforms; `ease` for colour/opacity.
- Durations: 140–260ms for hover/state, 700ms for scroll reveals, 2.4s pulse,
  34s/48s/64s/78s for the marquees.

## Page structure

Single scrolling page, sections as distinct chapters:

`header` (sticky) → `#top` hero → lime marquee → `#na` (Now) → `#prosjekter` →
`#erfaring` → `#studiet` → `#glimt` (photos) → `#kontakt` → footer

A **2px lime scroll-progress bar** is fixed at `top: 0`, `z-index: 60`, width driven by
`scrollY / (scrollHeight - innerHeight)`.

### Header

Sticky, `z-index: 40`, `padding: 18px 44px`, `background: rgba(12,14,17,.82)` with
`backdrop-filter: blur(14px)`, 1px bottom hairline at `.1` alpha.

Left: a 30×30 lime rounded square (`radius 7px`) with "EG" in Syne 14px, then a mono
eyebrow. Right: nav links (13.5px, weight 600, `.62` alpha, hover lime), a NO/EN pill
toggle (1px border at `.22`, `radius 999px`, active segment = lime bg + ink text), and a
lime "Ta kontakt" pill.

### Hero — spotlight wordmark

`min-height: 640px`, centred column, `padding: 76px 44px 0`, `cursor: crosshair`.

**The effect:** "EIVIND" / "GEIRAN" is rendered **twice**, stacked. The bottom copy is
`#1b1f26` (nearly invisible). The top copy is `#d9ff63` and lives inside an absolutely
positioned overlay whose `mask-image` is
`radial-gradient(circle 260px at <x> <y>, #000 0%, rgba(0,0,0,.35) 55%, transparent 100%)`.
On `mousemove` over the section, `<x> <y>` follows the cursor — so the lime letters are
revealed only under a soft spotlight. `pointer-events: none` on the overlay.

Also parallaxing on mousemove: the two lines shift horizontally in opposite directions
(`data-hl="1"` / `data-hl="2"`, a few px), and a 74px background grid
(`linear-gradient` hairlines at `.045` alpha, `inset: -110px 0`) drifts.

On scroll the whole hero block translates up (`translate3d(0, min(scrollY*.22, 150px), 0)`)
and fades (`opacity: max(.12, 1 - scrollY/720)`).

Below the wordmark: a lime dot + **the animated role line** (see *Hero role scramble*),
a 20px lede at `.72` alpha, and a lime CTA pill "Se hva jeg har bygget →".

At the bottom of the hero, a 4-column stat strip between two hairlines. Numbers are Syne
32px and **count up** from 0 with cubic ease-out when scrolled into view
(`data-count` attribute holds the target; decimals preserved if the target has a `.`).

Stats: `5 pågående roller`, `11 erfaringer så langt`, `3 i produksjon`, `2016 første betalte jobb`.

### Lime marquee

Full-bleed lime band under the hero. Mono 12px ink text, items separated by `✦` at `.4`
opacity. The list is duplicated and animated `translateX(0 → -50%)` over **48s** linear
infinite (`marqueeSeconds` tweak).

⚠️ **Do not couple this to scroll velocity.** An earlier version sped the marquee up while
scrolling; it was rejected as disorienting. Constant speed only.

### `#na` — Now

A status ledger, not cards. Four rows, top hairline at `.16`, each row
`grid-template-columns: 64px 168px minmax(0,1fr) 168px`, `gap: 24px`,
`align-items: baseline`, `padding: 26px 10px 26px 4px`, bottom hairline at `.1`,
hover `background: rgba(244,241,232,.035)`.

Columns: big Syne 26px index (`01`–`04`) at `.2` alpha → pulsing lime dot + mono category
label → Syne 29px title with a 14.5px description under it → right-aligned mono "since"
date at `.34`.

The dot uses `@keyframes rl-pulse` (2.4s, opacity 1→.35, scale 1→.8), disabled under
`prefers-reduced-motion`.

Rows (NO):

| # | Tag | Title | Since |
|---|---|---|---|
| 01 | STUDIUM | Datateknologi, NTNU | siden aug 2024 |
| 02 | DELTID | Utvikler i Computas | siden feb 2026 |
| 03 | DELTID | Tech-konsulent i Junior Consulting | siden aug 2025 |
| 04 | EGNE PROSJEKTER | Kort Forklart, NHL-modellen, AI-assistent | løpende |

### `#prosjekter`

Cards in a grid: 1px border at `.12`, `radius 14px`, `background: #12151a`, hover
`border-color: rgba(217,255,99,.5)` + `translateY(-3px)`. Each has a title, description,
mono tech tags, and a link. Scroll-revealed (see *Motion*).

**Gap to fill:** the cards have no proof. Each needs one line of outcome — how many
students use Kort Forklart, the NHL model's hit rate, what the scraper saves. Ask Eivind.
Screenshots are also planned but not yet supplied; leave slots.

Projects: **Kort Forklart** (Next.js, React, TypeScript, Supabase, OpenAI, Vercel —
kort-forklart.vercel.app), **NHL ML Prediction Model** (Python, scikit-learn, Pandas,
Norsk Tipping Oddsen API — github.com/egeiran/NHL-ML-Prediction-Model), **grocery-offer
scraper**, **sorting visualizers**.

### `#erfaring` — three views

A view switcher (mono pills in a `radius 999px` container, active = lime bg + ink text):
**tidslinje** · **aktivitet** · **liste** · **git blame**.

Defaults are viewport-driven — see *Responsive*.

#### View 1: tidslinje (Gantt) — the primary view

A real time axis, `MINY = 2016.5` to `MAXY = 2026.8`, positions computed as
`(value - MINY) / (MAXY - MINY) * 100%`. Dates are decimal years (`2025.60` = Aug 2025).

Layout: `grid-template-columns: 216px minmax(0,1fr)` — role names left, bars right.
Roles are grouped into three **category bands** (Betalt / Frivillig / Utdanning), each with
a mono band header (colour-coded dot + label + count) and a tinted background
(`rgba(colour, .04)`, `radius 9px`). Within a band, rows are sorted newest-first, one row
per role at `27px` height.

Each row: left cell has a 3px left border in the category colour, the title (12.5px,
weight 600) and the organisation (mono 10px, `.3` alpha), both `text-overflow: ellipsis`.
Right cell holds the **segments**.

**Segments are the key fidelity detail.** Seasonal work is drawn as multiple discrete
blocks, not one long bar, because that is what actually happened:

- Ice hockey referee: 6 season blocks (Sep–Mar, 2016–2022)
- Meny: 6 blocks (summers + Christmas/Easter, 2022–2025)
- ENT3R: 3 semester blocks

Each segment is `15px` tall, `radius 4px`, `top: 6px`, background
`rgba(colour, .22)`, 1px border `rgba(colour, .6)`, `min-width: 1.1%`, and contains a
fill span that grows `width: 0 → 100%` as the playhead crosses it (`background: colour`,
`opacity: .75`).

**Scroll scrubbing.** The section is `height: 235vh` with a `position: sticky; top: 92px`
inner. As the user scrolls the sticky region, progress
`p = clamp((110 - rect.top) / (rect.height - vh*0.8), 0, 1)` maps to
`year = MINY + p * (MAXY - MINY)`. From that:

- A 2px lime **playhead** with `box-shadow: 0 0 18px 4px rgba(217,255,99,.32)` sits at
  `left: p * 100%` over the bar area, `z-index: 4`.
- Every segment's fill width = `clamp((year - segStart) / (segEnd - segStart), 0, 1)`.
- The big **year** (Syne 58px, lime) and **month** (mono 14px) update.
- A **concurrency counter** (Syne 30px) shows how many roles are active at that instant,
  labelled "roller samtidig".
- Row opacity: `1` when active, `.55` when finished, `.45` when still in the future.
  Segment opacity `1` / `.72`.

Behind the bars: vertical year gridlines (`.05` alpha, 2026 in `rgba(217,255,99,.14)`),
year ticks along a top axis at `translateX(-50%)`.

**Detail card** below the chart (top hairline, `min-height: 104px`): 52px logo plate
(`#f4f1e8`, `radius 10px`, `padding 8px`, logo `max-height 36px`), then title (20px, 700),
organisation (14px, `.55`), period + category (mono 11.5px, lime), description
(14.5px, `.6`, `max-width: 70ch`), an orange `↳ note` line for segmented roles
("6 sesonger", "somre + høytider", "3 semestre"), and mono tags joined by ` · `.

**The detail card is click-selected, not hover- or scroll-driven.** Clicking a row in the
left column selects it; the selected row gets `background: rgba(244,241,232,.07)` and its
left border grows 3px → 5px. Default selection is the **first paid role** (index 0 =
Computas). Scrubbing does *not* change the selection.

#### View 2: aktivitet (month heatmap)

11 year rows (2026 → 2016) × 12 month columns. `grid-template-columns: 52px minmax(0,1fr)`
with the right side `repeat(12, minmax(0,1fr))`, `gap: 4px`. Cells are `26px` tall,
`radius 4px`, showing the count of roles active that month.

Cell background = `rgba(dominantCategoryColour, .1 + min(count,4) * .17)`; empty months
are `rgba(244,241,232,.03)`. Text is ink when `count > 2`, else `.6` paper. Hovered cell
gets a `#f4f1e8` border. Below, a readout line shows `"mai 2025 · 4 roller aktive"` in
lime mono plus a pill per active role (colour dot + title + organisation).

This view exists specifically to make concurrency *precise* — the Gantt makes overlap
look bigger than it was.

#### View 3: liste (vertical timeline)

The list Eivind currently likes best. A 200px sticky left rail shows the **era** — the
start year in Syne 40px lime with the end year in 28px at `.42` under it — which swaps as
you scroll. Right side: a 2px vertical rail with a lime fill that grows with scroll
progress, 14px nodes that light up (`background: #d9ff63`, 5px lime glow ring) as they
cross `vh * 0.55`, and one card per role (1px border `.12`, `radius 14px`, `#12151a`,
`padding 22px 24px`, hover `border-color: rgba(217,255,99,.45)` + `translateX(5px)`).

Cards slide in from the incoming direction and settle as the node lights.

The rail is measured from first node centre to last node centre so the fill lands exactly
on each node.

#### View 4: git blame

An easter egg. A monospace `git blame` rendering of a "career file": `grid-template-columns:
96px 196px 48px max-content`, `width: max-content; min-width: 100%` so hover highlight
spans the full row even when scrolled horizontally. Columns: short SHA, author + date,
line number, the line itself. Hovering a row surfaces the "commit message". Header shows
line and commit counts.

### `#studiet`

Compact NTNU coursework presentation — deliberately *not* the big card grid the old site
had, since recruiters don't read course lists.

### `#glimt` — film roll

Section title "Filmrull." / "Film roll." (**never "Life"** — explicitly rejected).

Two horizontal strips inside `.rl-roll` containers on `#0f1216` with hairline top/bottom
borders. Above and below the first strip, a **sprocket-hole band**: 9px tall,
`background-image: radial-gradient(circle, rgba(244,241,232,.16) 0 2.6px, transparent 2.8px)`,
`background-size: 26px 9px`.

Strip 1: 280×186 frames, `gap: 10px`, `animation: rl-marquee 64s linear infinite`.
Strip 2: 212×142 frames, reversed order, `rl-marquee-rev 78s`.
Both duplicate their list so the loop is seamless. `.rl-roll:hover .rl-track` sets
`animation-play-state: paused`.

Frames are greyscale (`grayscale(1) contrast(1.05)`) and go full colour + `scale(1.06)` on
hover (420ms / 700ms). Each has a mono caption chip at bottom-left on
`rgba(12,14,17,.76)`: `"01 · Venture Cup"` on the top strip, the filename
(`IMG_2417.JPG`) on the bottom.

Above: a mono meta line — `"Rull 01 · Trondheim · 2024–2026"` in lime, frame count at `.3`.

**This scales with more photos** — Eivind can add many; the loop just gets longer.

**Open idea:** make the *lower* strip look more explicitly like film too — sprocket holes
on it as well, maybe a rebate/edge-code strip with frame numbers printed along the top
edge like real 35mm. Worth trying.

Two alternate treatments exist as tweaks and can be dropped if unused:
`kontaktark` (3×2 contact sheet with frame numbers and filenames) and `stripe`
(the original variable-width scroller).

### `#kontakt` — CTA

Full-width lime panel, `radius 20px`, `padding 56px 48px 44px`, ink text, two tiers
separated by a `rgba(12,14,17,.18)` hairline.

Top: pulsing ink dot + mono uppercase status label, then a Syne
`clamp(30px, 3.6vw, 50px)` headline, then a 16.5px sub at `.72`, `max-width: 46ch`.

Bottom: mono links (github.com/egeiran, linkedin, a note) on the left; on the right an ink
pill (`radius 999px`, `padding 16px 28px`, `#0c0e11` bg, paper text, 15px/800) reading
`eivind.geiran@gmail.com ↗`, hover `#20242b`.

**Three tones are written; ship `varm`.**

| Tone | Label | Headline | Sub | Note |
|---|---|---|---|---|
| **varm** ✅ | Si hei | Bygger dere noe du er stolt av? Fortell meg om det. | Jeg liker å høre hva folk holder på med. Terskelen er lav. | Svarer alltid |
| direkte | Ledig sommeren 2027 | Jeg leter etter en sommerjobb der jeg får bygge noe som faktisk blir brukt. | Send en e-post. Jeg svarer på alt, også på et kort «hei». | Trondheim eller Oslo |
| kort | Status | Ledig sommeren 2027. | Si fra tidlig. | Trondheim · Oslo |

`varm` is chosen for now, but **this copy is still open** — it's the highest-leverage text
on the page and worth another pass. The tension: `varm` is likeable but doesn't state
availability, which is the one fact a recruiter needs. A hybrid is probably the answer —
warm headline, availability in the sub or note. Build it so the tone is a single data
object that's trivial to swap; don't hardcode strings into markup.

Eivind also asked for a **contact form** eventually. Not designed yet; mailto for now.

## Hero role scramble — the effect to build

**Requested behaviour:** the role line under EIVIND GEIRAN should look like it's *being
typed and un-typed by a machine* — text erases, then the new text writes in, with
individual letters flickering through random characters before locking. "Ser ut som at det
blir kodet" — it should read as code being written.

Implemented in the prototype as a two-phase character scramble on a mono line, cycling
through four roles every **3200ms**, tick interval **46ms**:

**Phase 1 — erase.** Over `ceil(prev.length / 4)` ticks, chop 4 characters per tick off
the end of the previous string, and replace the new last character with a random glyph so
the trailing edge flickers as it retreats.

**Phase 2 — write.** For tick `g` after erase, build the string per character index `i`:
- `i < (g - 2) * 1.6` → the real character (locked in)
- `i < g * 1.6 + 3` → a random glyph (the flickering ~3-char wavefront)
- otherwise → nothing yet

Finish when `(g - 2) * 1.6 >= next.length`; snap to the exact string and clear the
interval.

Glyph pool: `ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&/<>_-01`

Notes for implementation:
- **Never write to the DOM from inside a ref/mount callback.** Doing so re-enters the
  framework's commit phase and, in the prototype, hung the main thread outright. Defer the
  loop's first frame (one `requestAnimationFrame` is enough) and seed the animation from
  the text already in the markup.
- **Drive frames from a self-rescheduling `requestAnimationFrame`, keyed to the element.**
  Compute the current frame from elapsed time (`(now - start) / 46`), not a tick counter,
  and bail when `el.isConnected` is false so a stale loop from a previous mount dies on
  its own. Chained `setInterval`/`clearInterval` per transition is how this broke twice —
  one stray clear left the hero showing five random glyphs permanently.
- **Always guarantee the resting state is the exact target string.** Guard against an
  empty or non-string target, snap to the full string on the completion branch, and add a
  ~1.5s watchdog that force-writes the target if completion never fires. A blank or
  garbled line in the hero is worse than no animation.
- The element needs `display: inline-block` and a `min-height` matching its line box
  (`17px` at 12px mono) so the layout doesn't jump when the string is empty mid-erase.
- Under `prefers-reduced-motion: reduce`, skip the animation entirely and set the text.
- Re-run the scramble when the language toggles, so the transition reads as intentional.
- The prototype animates a single line. **Worth exploring further:** currently the whole
  line resolves left-to-right in one wave. It could look better with letters resolving in
  a *random* order rather than sequentially, or with already-locked characters
  occasionally re-flickering so the line never feels fully settled. Both are small
  variations on the same loop — try them.

Roles cycled (NO): `Tech-konsulent, Junior Consulting` · `Utvikler, Computas` ·
`Mentor, ENT3R Trondheim` · `Bygger av Kort Forklart`

## Motion & interaction summary

| Element | Behaviour |
|---|---|
| Scroll progress bar | 2px lime, fixed top, width = scroll fraction |
| Hero spotlight | radial mask follows cursor, 260px circle |
| Hero wordmark | two lines counter-parallax on mousemove; grid drifts |
| Hero on scroll | translate up to 150px, fade to `.12` |
| Role line | character scramble, 3.2s cycle |
| Stat numbers | count up from 0, cubic ease-out, on enter viewport |
| Marquee | constant 48s loop — never scroll-coupled |
| Card reveals | `opacity 0→1`, `translateY(28px)→0`, 700ms `cubic-bezier(.2,.8,.2,1)`, staggered `(i % 3) * 80ms`, fires at `rect.top < vh * 0.9`, once |
| Gantt | scroll-scrubbed playhead, segment fills, live year/month/concurrency |
| Gantt rows | click to select detail; hover `rgba(244,241,232,.05)` |
| Heatmap | hover a month → readout + role pills |
| List timeline | rail fill + node ignition at `vh * 0.55`, era swap |
| Film roll | two counter-rotating strips, pause on hover, greyscale→colour |
| Pulsing dots | 2.4s `rl-pulse`, in Now rows and the CTA |

All scroll work runs in a **single `requestAnimationFrame`-throttled scroll handler** with
one rAF in flight at a time, reading `getBoundingClientRect()` and writing styles directly
rather than through state — important, since re-rendering ten times a second on scroll is
what makes this kind of page feel bad. Keep that split.

**`prefers-reduced-motion: reduce` must be honoured.** When set: no hero parallax, no
spotlight tracking, no scramble, no reveal animations (elements start visible), counters
jump to final values, marquees and film strips stop. State-driven visuals (node ignition,
year label, concurrency) still update — those are information, not decoration.

## Responsive

The prototype is desktop-first and **not yet designed for mobile** — that work remains.

Already handled: the experience view defaults are viewport-driven. Below **820px** the
default is `liste`; at or above it, `tidslinje`. The switcher stays available in both, so a
desktop visitor can move between all four views. Implemented via a `resize` listener
setting a `narrow` flag; a media query is equally fine.

Still to do for mobile: header nav collapse, hero type scale below 640px, the Now ledger's
4-column grid (should stack), the Gantt's 216px name column, and the heatmap's 12 columns.

## Data model

Experience entries drive all four views from one source. Shape:

```js
{
  title: { no, en },
  organization: "Junior Consulting",
  type: "Betalt" | "Frivillig" | "Utdanning",
  from: 2025.60,          // decimal year; .60 ≈ August
  to: 2026.55,            // NOW_T for ongoing
  segments: [[a, b], …],  // optional; omit for continuous
  note: { no, en },       // optional; shown as "↳ 6 sesonger"
  live: true,             // optional; force "nå" in the period label
  description: { no, en },
  imagePath: "img/erfaringer/jrc.jpeg"
}
```

`NOW_T = 2026.55`. Month formatting: `MONTHS[lang][floor((value % 1) * 12)]`.

Eleven entries: Computas · Junior Consulting · ENT3R · NTNU (MSc) · Abakus Arrkom ·
Start NTNU Gründerjakten · Abakus Faddersjef · MentorNorge · Meny Bærums Verk ·
Sandvika VGS · Norges Ishockeyforbund.

⚠️ **All `from`/`to` values and every `segments` array are estimates** made while
designing, plausible but unverified. Get them confirmed before launch — the whole
concurrency story depends on them being right, and the point of the design is precision.

Tags (three per role, both languages) live in a parallel array in the prototype; in
production put them on the entry itself.

## Bilingual

Every string exists in `no` and `en`, selected by a header toggle. Norwegian is the
default; both must be complete. The prototype holds them in one `COPY` object keyed by
language — replicate that shape or use whatever i18n the codebase has. Note that switching
language re-triggers the hero scramble.

## Configuration (settled)

These were exposed as tweaks during design. Ship them as the values below; keep them as
constants if useful, but they don't need to be user-facing.

| Setting | Value | Note |
|---|---|---|
| `language` | `no` | Norwegian default, **both languages complete** |
| `desktopView` | `gantt` (tidslinje) | primary experience view ≥820px |
| `mobileView` | `liste` | <820px |
| `ganttScrub` | `true` | scroll scrubbing on |
| `ctaTone` | `varm` | **still open — see the CTA section** |
| `gallery` | `filmrull` | + make the lower strip more film-like |
| `heroSpotlight` | `true` | cursor spotlight on |
| `marqueeSeconds` | `48` | good as-is; do not scroll-couple |

## Assets

In `img/`, copied from the existing repo (`egeiran/EivindGeiran@main`):

- `img/erfaringer/` — `abakus.webp`, `ent3r.webp`, `jrc.jpeg`, `mentornorge.webp`,
  `meny.webp`, `nihf.webp`, `ntnu.webp`, `sandvika.webp`, `start.webp`
- `img/erfaringer/computas.svg` — **placeholder** text-SVG, created for this design.
  Replace with the real Computas mark.
- `img/karusell/` — `VentureCup.jpg`, `Newbies.jpg`, `Sigrid.jpg`, `Oscmas.jpg`,
  `Lookout.jpg`, `Kragaluf.jpg`

Fonts: Google Fonts — Syne (700, 800), Schibsted Grotesk (400–800), JetBrains Mono
(400, 500, 700). Self-host if the codebase prefers.

Missing: project screenshots. Eivind can supply them; leave slots in the project cards.

## Files in this bundle

- `Rampelys.dc.html` — the primary design. Read the markup for exact values.
  Ignore `support.js` references; that's tool runtime.
- `img/` — the assets above.
- `github.md` — source-repo association and screen map.

Two earlier explorations were left in the project but are **not** part of this handoff:
`Konsoll.dc.html` (a terminal/IDE-shell direction, rejected) and
`Hero Directions.dc.html` (the three hero options this direction was chosen from).

## Suggested next steps beyond a straight build

Raised during design, not yet designed:

1. **Confirm the dates.** Highest priority; everything hangs off them.
2. **Outcome lines on project cards** — one number or consequence each.
3. **Project screenshots.**
4. **Rework the CTA copy** — warm tone plus a clear availability statement.
5. **Mobile layout** for the sections listed above.
6. **Marquee as a live ticker** — last commit, user count, current reading, pulled from
   the GitHub API rather than static role names.
7. **Contact form** instead of mailto.
8. **GitHub activity / live stats**, which Eivind asked for and which fits the
   "gets things done" thesis better than any copy would.
