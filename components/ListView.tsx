"use client";

import { useRef } from "react";
import type { Copy } from "@/lib/copy";
import type { ExperienceVM } from "@/lib/derive";
import { prefersReducedMotion, useScrollFrame } from "@/lib/fx";
import styles from "./ListView.module.css";

interface Props {
  t: Copy;
  vms: ExperienceVM[];
}

export default function ListView({ t, vms }: Props) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const eraRef = useRef<HTMLDivElement | null>(null);
  const eraToRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  useScrollFrame(({ vhLive: vh }) => {
    const items = itemRefs.current.filter(Boolean) as HTMLElement[];
    if (!items.length) return;
    const still = prefersReducedMotion();
    const line = vh * 0.55;

    // Lesefase: alle rects hentes før noe skrives, så ingen av skrivingene
    // under tvinger fram en ny layout midt i løkka.
    const rail = railRef.current;
    const host = rail && rail.parentElement ? rail.parentElement.getBoundingClientRect() : null;
    const centers: number[] = [];
    for (let i = 0; i < items.length; i++) centers.push(items[i].getBoundingClientRect().top + 33);

    const startY = centers[0];
    const end = centers[centers.length - 1];
    // Er hele tidslinja utenfor bildet, er det ingenting å oppdatere.
    if (end < -200 || startY > vh + 200) return;
    const span = end - startY;
    const p = span > 0 ? Math.max(0, Math.min(1, (line - startY) / span)) : line > startY ? 1 : 0;

    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < centers.length; i++) {
      const dd = Math.abs(centers[i] - line);
      if (dd < bestD) {
        bestD = dd;
        best = i;
      }
    }

    // Skrivefase. Verdiene sammenlignes mot inline-stilen først: å lese
    // el.style koster ingenting, mens en identisk tilordning ville trigget en
    // ny style recalc for hvert kort, hver frame.
    const set = (el: HTMLElement, prop: "background" | "borderColor" | "boxShadow" | "transform" | "opacity" | "top" | "height", v: string) => {
      if (el.style[prop] !== v) el.style[prop] = v;
    };

    if (rail && host && span > 0) {
      set(rail, "top", `${Math.round(startY - host.top)}px`);
      set(rail, "height", `${Math.round(span)}px`);
    }
    if (fillRef.current) set(fillRef.current, "height", `${p * 100}%`);

    let eraFrom: string | null = null;
    let eraTo: string | null = null;
    for (let i = 0; i < items.length; i++) {
      const el = items[i];
      const c = centers[i];
      const on = c < line;
      const focus = i === best;
      const node = el.firstElementChild as HTMLElement | null;
      if (node) {
        set(node, "background", on ? "#d9ff63" : "#0c0e11");
        set(node, "borderColor", on ? "#d9ff63" : "rgba(244,241,232,.28)");
        set(
          node,
          "boxShadow",
          focus
            ? "0 0 0 7px rgba(217,255,99,.18)"
            : on
              ? "0 0 0 4px rgba(217,255,99,.1)"
              : "none"
        );
        set(node, "transform", focus ? "scale(1.35)" : "scale(1)");
      }
      const card = el.lastElementChild as HTMLElement | null;
      if (card && still) {
        set(card, "opacity", "1");
        set(card, "transform", "none");
        set(card, "borderColor", focus ? "rgba(217,255,99,.42)" : "rgba(244,241,232,.12)");
      } else if (card) {
        const dRel = (c - line) / vh;
        if (on) {
          set(card, "opacity", focus ? "1" : "0.8");
          set(card, "transform", "none");
        } else {
          set(card, "opacity", String(Math.max(0.14, 1 - dRel * 1.9)));
          set(
            card,
            "transform",
            `translate3d(${Math.min(dRel * 90, 110)}px,0,0) scale(${
              1 - Math.min(dRel * 0.07, 0.09)
            })`
          );
        }
        set(card, "borderColor", focus ? "rgba(217,255,99,.42)" : "rgba(244,241,232,.12)");
      }
      if (on) {
        eraFrom = el.dataset.eraFrom || null;
        eraTo = el.dataset.eraTo || null;
      }
    }
    if (eraFrom && eraRef.current && eraRef.current.textContent !== eraFrom)
      eraRef.current.textContent = eraFrom;
    if (eraTo && eraToRef.current && eraToRef.current.textContent !== eraTo)
      eraToRef.current.textContent = eraTo;
  }, [vms]);

  const first = vms[0];

  return (
    <div className={styles.wrap}>
      <div className={styles.railCol}>
        <div className={styles.railSticky}>
          <div className={styles.era}>
            <div ref={eraRef} className={styles.eraFrom}>
              {first ? first.startYear : ""}
            </div>
            <div ref={eraToRef} className={styles.eraTo}>
              {first ? `–${first.live ? t.nowWord : Math.floor(first.eNum)}` : ""}
            </div>
          </div>
          <p className={styles.railHint}>{t.timelineHint}</p>
        </div>
      </div>
      <div className={styles.items}>
        <div ref={railRef} className={styles.rail}>
          <div ref={fillRef} className={styles.fill}>
            <span className={styles.fillTip} />
          </div>
        </div>
        {vms.map((e, i) => (
          <article
            key={e.id}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            data-era-from={String(e.startYear)}
            data-era-to={`–${e.live ? t.nowWord : Math.floor(e.eNum)}`}
            className={styles.item}
          >
            <span className={styles.node} />
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.logo}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.imagePath} alt={e.organization} loading="lazy" />
                </div>
                <div className={styles.titleCol}>
                  <h3 className={styles.cardTitle}>{e.title}</h3>
                  <p className={styles.cardOrg}>{e.organization}</p>
                </div>
                <div className={styles.periodCol}>
                  <div
                    className={styles.period}
                    style={{ color: e.live ? "var(--lime)" : "rgba(244,241,232,.6)" }}
                  >
                    {e.period}
                  </div>
                  <div className={styles.type}>{e.typeLabel}</div>
                </div>
              </div>
              <p className={styles.cardDesc}>{e.description}</p>
              <div className={styles.tags}>
                {e.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
