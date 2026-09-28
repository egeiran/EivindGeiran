"use client";

import { useEffect, useRef, useState } from "react";

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useReducedMotion(): boolean {
  const [still, setStill] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setStill(mq.matches);
    const onChange = () => setStill(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return still;
}

/**
 * Målene alle scroll-effektene deler. `vh` er *stabil*: den følger ikke med når
 * mobilnettleseren skjuler adresselinja, for da hopper alt som regner progresjon
 * mot den. `vhLive` er den faktiske innerHeight for det som må treffe eksakt.
 */
export interface FrameMetrics {
  scrollY: number;
  vh: number;
  vhLive: number;
  vw: number;
  maxScroll: number;
}

type FrameFn = (m: FrameMetrics) => void;

const subscribers = new Set<FrameFn>();
const metrics: FrameMetrics = { scrollY: 0, vh: 0, vhLive: 0, vw: 0, maxScroll: 0 };

let raf = 0;
let listening = false;
let docDirty = true;
let stableVh = 0;
let stableVw = 0;

/**
 * Adresselinja som gjemmer seg gir en resize på 60–120 px uten at bredden
 * endres. Da beholder vi den gamle høyden; ekte endringer (rotasjon, delt
 * skjerm, desktop-resize) slår gjennom.
 */
function updateStableViewport() {
  const h = window.innerHeight;
  const w = window.innerWidth;
  if (!stableVh || w !== stableVw || Math.abs(h - stableVh) > 120) {
    stableVh = h;
    stableVw = w;
  }
}

function measure() {
  updateStableViewport();
  metrics.scrollY = window.scrollY;
  metrics.vhLive = window.innerHeight;
  metrics.vw = window.innerWidth;
  metrics.vh = stableVh;
  if (docDirty) {
    // Dokumenthøyden er det eneste målet som tvinger reflow på egen hånd, så
    // den leses kun når noe faktisk kan ha endret den.
    metrics.maxScroll = Math.max(0, document.documentElement.scrollHeight - metrics.vhLive);
    docDirty = false;
  }
}

function run() {
  raf = 0;
  measure();
  // Abonnentene delte tidligere ikke frame, så en feil i én effekt kunne ikke
  // ta ned de andre. Den isolasjonen beholdes.
  for (const fn of subscribers) {
    try {
      fn(metrics);
    } catch (err) {
      console.error(err);
    }
  }
}

function schedule() {
  if (raf) return;
  raf = requestAnimationFrame(run);
}

function invalidateDocument() {
  docDirty = true;
  schedule();
}

function startListening() {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", invalidateDocument);
  if (typeof ResizeObserver !== "undefined") {
    // Seksjoner som vokser (språkbytte, åpnet meny) endrer dokumenthøyden uten
    // at det kommer en resize på vinduet.
    new ResizeObserver(invalidateDocument).observe(document.documentElement);
  }
}

/**
 * rAF-throttlet scroll/resize-handler. Alle abonnenter deler én lytter, én
 * frame og ett sett måltall, slik at dokumenthøyde og viewport leses én gang
 * per frame i stedet for én gang per komponent (jf. handoff: les rects og
 * skriv stiler i callbacken, ikke via state).
 */
export function useScrollFrame(frame: FrameFn, deps: unknown[] = []) {
  const frameRef = useRef(frame);
  frameRef.current = frame;
  useEffect(() => {
    const fn: FrameFn = (m) => frameRef.current(m);
    startListening();
    subscribers.add(fn);
    invalidateDocument();
    return () => {
      subscribers.delete(fn);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Er elementet i eller nær viewporten? Brukes til å parkere loops og
 * CSS-animasjoner som ellers ville brent hovedtråden på noe ingen ser.
 * Faller tilbake til `true` uten IntersectionObserver, så ingenting kan bli
 * stående stille som følge av hooken.
 */
export function useInView<T extends HTMLElement>(
  rootMargin = "300px"
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => setInView(entries.some((e) => e.isIntersecting)),
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, inView];
}

/**
 * Sant først når elementet nærmer seg viewporten *og* siden er ferdig lastet.
 * Brukes til å montere tredjeparts-iframes: de skal aldri konkurrere med
 * førstelasten om båndbredde og hovedtråd, men være på plass i god tid før de
 * kommer til syne. Uten IntersectionObserver monteres de med én gang.
 */
export function useDeferredMount<T extends HTMLElement>(
  rootMargin = "1200px"
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === "undefined") {
      setReady(true);
      return;
    }
    let io: IntersectionObserver | null = null;
    const observe = () => {
      const el = ref.current;
      if (!el) return;
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            setReady(true);
            io?.disconnect();
          }
        },
        { rootMargin }
      );
      io.observe(el);
    };
    if (document.readyState === "complete") observe();
    else window.addEventListener("load", observe, { once: true });
    return () => {
      io?.disconnect();
      window.removeEventListener("load", observe);
    };
  }, [rootMargin]);
  return [ref, ready];
}

/** Én-gangs scroll-reveal: opacity 0→1, translateY(28px)→0, staggered. */
export function useReveal<T extends HTMLElement>(delayMs = 0) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(28px)";
    el.style.transition =
      "opacity 700ms cubic-bezier(.2,.8,.2,1), transform 700ms cubic-bezier(.2,.8,.2,1)";
    el.style.transitionDelay = `${delayMs}ms`;
    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      el.style.opacity = "1";
      el.style.transform = "none";
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          show();
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delayMs]);
  return ref;
}
