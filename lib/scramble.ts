"use client";

import { prefersReducedMotion } from "./fx";

const CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&/<>_-01";
const CYCLE_MS = 3200;
const TICK_MS = 46;
const WATCHDOG_MS = 1500;

export interface ScrambleCtrl {
  stop(): void;
  /** Tving en umiddelbar overgang til første rolle (brukes ved språkbytte). */
  bump(): void;
}

/**
 * To-fase tegn-scramble på rollelinja i heroen: visk ut 4 tegn per tick, skriv
 * inn med en flimrende ~3-tegns bølgefront. Frames beregnes fra medgått tid via
 * selv-reschedulerende rAF keyet til elementet, med vaktbikkje som alltid lander
 * på eksakt målstreng (jf. handoff-notatene om hvordan dette knakk i prototypen).
 */
export function startScramble(el: HTMLElement, getRoles: () => string[]): ScrambleCtrl {
  const still = prefersReducedMotion();
  const roles = () => {
    const list = getRoles();
    return list.length ? list : [el.textContent || ""];
  };
  let idx = 0;
  let target = el.textContent || roles()[0] || "";
  let prev = target;
  let t0 = 0;
  let busy = false;
  let last = 0;
  let stopped = false;
  let force = false;

  const settle = () => {
    busy = false;
    if (el.textContent !== target) el.textContent = target;
  };

  const step = (now: number) => {
    if (stopped || !el.isConnected) return;
    requestAnimationFrame(step);
    const list = roles();
    if (!busy && (force || now - last > CYCLE_MS)) {
      idx = force ? 0 : (idx + 1) % list.length;
      force = false;
      const nx = list[idx];
      if (typeof nx === "string" && nx) {
        target = nx;
        prev = el.textContent || target;
        if (still) {
          settle();
        } else {
          busy = true;
          t0 = now;
        }
      }
      last = now;
    }
    if (!busy) {
      if (el.textContent !== target) el.textContent = target;
      return;
    }
    if (now - t0 > WATCHDOG_MS) {
      settle();
      return;
    }
    const f = Math.floor((now - t0) / TICK_MS) + 1;
    const erase = Math.ceil(prev.length / 4);
    let out = "";
    if (f <= erase) {
      const keep = Math.max(0, prev.length - f * 4);
      out = prev.slice(0, keep);
      if (out) out = out.slice(0, -1) + CH[Math.floor(Math.random() * CH.length)];
    } else {
      const g = f - erase;
      const locked = (g - 2) * 1.6;
      if (locked >= target.length) {
        settle();
        return;
      }
      for (let i = 0; i < target.length; i++) {
        if (i < locked) out += target[i];
        else if (i < g * 1.6 + 3) out += CH[Math.floor(Math.random() * CH.length)];
      }
    }
    el.textContent = out;
  };

  requestAnimationFrame((now) => {
    last = now;
    step(now);
  });

  return {
    stop: () => {
      stopped = true;
    },
    bump: () => {
      force = true;
    },
  };
}
