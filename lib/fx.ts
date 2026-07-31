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
 * rAF-throttlet scroll/resize-handler: maks én frame i flight, leser rects og
 * skriver stiler direkte i callbacken i stedet for via state (jf. handoff).
 */
export function useScrollFrame(frame: () => void, deps: unknown[] = []) {
  const frameRef = useRef(frame);
  frameRef.current = frame;
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        frameRef.current();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
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
