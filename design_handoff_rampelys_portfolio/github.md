repo: egeiran/EivindGeiran
branch: main

## Last sync
date: 2026-07-29T18:05:00Z

### Updated in this project
- Recreated the live GitHub Pages site pixel-for-pixel as `Current Site.dc.html` (cream/lime theme, Manrope + Syne, pill topbar, ticker, filters).
- Copied all 15 real images (`img/erfaringer/*`, `img/karusell/*`) into the project.
- Ported `experiences.json` and `js/courses.js` data verbatim into the recreation's logic.
- Three hero directions in `Hero Directions.dc.html`, all bilingual (NO/EN).
- Two full redesigns built out: `Rampelys.dc.html` (bold, scrolling) and `Konsoll.dc.html` (non-linear, single screen).

## Screen map
| Screen | Built from |
| --- | --- |
| Current Site.dc.html | index.html, style.css, js/app.js, js/courses.js, experiences.json, img/erfaringer/*, img/karusell/* |
| Hero Directions.dc.html | style.css (tokens), index.html (nav/copy), experiences.json, js/courses.js, user-supplied project list |
| Rampelys.dc.html | experiences.json, js/courses.js, img/erfaringer/*, img/karusell/*, user-supplied project list |
| Konsoll.dc.html | experiences.json, js/courses.js, img/erfaringer/*, img/karusell/*, user-supplied project list |

## Notes
- `js/background.js`, `js/carousel.js`, `js/peek.js`, `js/experience.js`, `js/render-courses.js` exist in the repo but are NOT loaded by `index.html` — treated as dead code, not recreated.
