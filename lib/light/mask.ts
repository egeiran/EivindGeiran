"use client";

/*
 * Bokstavmasken hero-lyset kaster skygger fra. Hvert tegn tegnes for seg på den posisjonen
 * DOM-en faktisk har gitt det (via Range-rektangler), så letter-spacing og kerning blir
 * nøyaktig lik ordmerket — skyggene starter der de synlige bokstavene slutter.
 */

interface Glyph {
  readonly ch: string;
  /** Posisjon relativt til linjeelementets egen boks, i CSS-piksler. */
  readonly dx: number;
  readonly dy: number;
}

export interface GlyphRun {
  readonly el: HTMLElement;
  readonly font: string;
  /** Avstand fra toppen av tegnboksen ned til grunnlinja. */
  readonly ascent: number;
  readonly glyphs: readonly Glyph[];
}

/** Måler tegnene i hver linje. Kjøres på nytt når layouten endrer seg (resize, fonter). */
export function measureRuns(
  lines: readonly HTMLElement[],
  ctx: CanvasRenderingContext2D
): GlyphRun[] {
  const range = document.createRange();
  return lines.map((el) => {
    const style = getComputedStyle(el);
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ctx.font = font;
    const metrics = ctx.measureText(el.textContent || "E");
    const ascent = metrics.fontBoundingBoxAscent ?? parseFloat(style.fontSize) * 0.9;
    const base = el.getBoundingClientRect();
    const glyphs: Glyph[] = [];
    // Alle tekstnoder, ikke bare første barn: en oversettelsesutvidelse kan pakke teksten inn.
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent || "";
      for (let i = 0; i < text.length; i++) {
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const r = range.getBoundingClientRect();
        if (r.width > 0) glyphs.push({ ch: text[i], dx: r.left - base.left, dy: r.top - base.top });
      }
    }
    return { el, font, ascent, glyphs };
  });
}

/** Tegner linjene der de står nå (inkludert scroll-transformer), relativt til `origin`. */
export function drawRuns(
  ctx: CanvasRenderingContext2D,
  runs: readonly GlyphRun[],
  origin: DOMRect
) {
  ctx.textBaseline = "alphabetic";
  for (const run of runs) {
    const r = run.el.getBoundingClientRect();
    const x = r.left - origin.left;
    const y = r.top - origin.top + run.ascent;
    ctx.font = run.font;
    for (const g of run.glyphs) ctx.fillText(g.ch, x + g.dx, y + g.dy);
  }
}
