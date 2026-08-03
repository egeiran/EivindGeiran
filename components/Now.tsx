"use client";

import { useEffect, useRef } from "react";
import type { Copy } from "@/lib/copy";
import { prefersReducedMotion, useScrollFrame } from "@/lib/fx";
import { fmtMonthYearFull } from "@/lib/time";
import type { Lang } from "@/lib/types";
import styles from "./Now.module.css";

// Tweaks fra handoffen: musefølging 0–100 % og fri spinn på kuben.
const CUBE_FOLLOW = 40;
const CUBE_SPIN = true;

/* ---------- Kapittel 01: nevralt nett — statisk geometri ---------- */

const NET_LAYERS = [3, 5, 4, 2];
const NET_X = [64, 152, 248, 336];
const NET_CY = 178;
const NET_GAP = 54;

const NET_NODES: { x: number; y: number; layer: number }[] = [];
const NET_EDGES: { x: number; y: number; w: number; deg: number; layer: number }[] = [];
{
  const pts = NET_LAYERS.map((n, layer) =>
    Array.from({ length: n }, (_, i) => ({
      x: NET_X[layer],
      y: NET_CY + (i - (n - 1) / 2) * NET_GAP,
      layer,
    }))
  );
  for (const layer of pts) for (const p of layer) NET_NODES.push(p);
  for (let l = 0; l < pts.length - 1; l++) {
    for (const a of pts[l]) {
      for (const b of pts[l + 1]) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        NET_EDGES.push({
          layer: l,
          x: a.x,
          y: a.y,
          w: Math.round(Math.hypot(dx, dy)),
          deg: +((Math.atan2(dy, dx) * 180) / Math.PI).toFixed(2),
        });
      }
    }
  }
}

/* ---------- Kapittel 02: skjermen — abstrakte kodelinjer ---------- */

const CODE_COLOR: Record<string, string> = {
  k: "#d9ff63",
  t: "rgba(244,241,232,.78)",
  m: "rgba(244,241,232,.26)",
  a: "#4fc3c3",
  w: "#ff7a4d",
};
const CODE_LINES = (
  [
    { indent: 0, segs: [[34, "k"], [56, "t"], [9, "m"]] },
    { indent: 0, segs: [[28, "k"], [64, "a"]] },
    { indent: 0, segs: [] },
    { indent: 0, segs: [[24, "w"], [72, "t"], [13, "m"]] },
    { indent: 14, segs: [[46, "t"], [28, "m"], [38, "a"]] },
    { indent: 14, segs: [[60, "t"], [20, "k"]] },
    { indent: 28, segs: [[32, "k"], [50, "t"]] },
    { indent: 28, segs: [[42, "t"], [26, "w"], [17, "m"]] },
    { indent: 14, segs: [[30, "m"]] },
    { indent: 0, segs: [[20, "m"]] },
    { indent: 0, segs: [] },
    { indent: 0, segs: [[44, "k"], [36, "t"], [22, "a"]] },
  ] as { indent: number; segs: [number, string][] }[]
).map((l) => ({ indent: l.indent, segs: l.segs.map((s) => ({ w: s[0], c: CODE_COLOR[s[1]] })) }));

const CREW = ["#d9ff63", "#4fc3c3", "#ff7a4d"];

/* ---------- Kapittel 03: Rubiks kube ---------- */

const CUBE_S = 52;
// Klassiske Rubiks-farger; I er innsiden av kuben.
const CUBE_FACE = {
  F: "#009e60",
  B: "#0051ba",
  R: "#c41e3a",
  L: "#ff5800",
  U: "#ffffff",
  D: "#ffd500",
  I: "#0f1216",
};
const FACE_TF = [
  "translateZ(25px)",
  "rotateY(180deg) translateZ(25px)",
  "rotateY(90deg) translateZ(25px)",
  "rotateY(-90deg) translateZ(25px)",
  "rotateX(90deg) translateZ(25px)",
  "rotateX(-90deg) translateZ(25px)",
];

interface Cubie {
  p: number[];
  m: number[];
}

// Stickerne er bundet til cubien: farger settes én gang ved render og endres aldri.
const CUBIE_FACES: string[][] = [];
const CUBE_SOLVED: Cubie[] = [];
{
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (!x && !y && !z) continue;
        CUBIE_FACES.push([
          z === 1 ? CUBE_FACE.F : CUBE_FACE.I,
          z === -1 ? CUBE_FACE.B : CUBE_FACE.I,
          x === 1 ? CUBE_FACE.R : CUBE_FACE.I,
          x === -1 ? CUBE_FACE.L : CUBE_FACE.I,
          y === -1 ? CUBE_FACE.U : CUBE_FACE.I,
          y === 1 ? CUBE_FACE.D : CUBE_FACE.I,
        ]);
        CUBE_SOLVED.push({ p: [x, y, z], m: [1, 0, 0, 0, 1, 0, 0, 0, 1] });
      }
    }
  }
}

// Matrisekonvensjonene følger CSS-spesifikasjonen (X høyre, Y ned, Z ut),
// så JS og CSS er enige uten korreksjoner.
function mRot(ax: number, a: number): number[] {
  const c = Math.round(Math.cos(a));
  const s = Math.round(Math.sin(a));
  if (ax === 0) return [1, 0, 0, 0, c, -s, 0, s, c];
  if (ax === 1) return [c, 0, s, 0, 1, 0, -s, 0, c];
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}
function mMul(a: number[], b: number[]): number[] {
  const r = new Array<number>(9);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  return r;
}
function vRot(m: number[], v: number[]): number[] {
  return [
    Math.round(m[0] * v[0] + m[1] * v[1] + m[2] * v[2]),
    Math.round(m[3] * v[0] + m[4] * v[1] + m[5] * v[2]),
    Math.round(m[6] * v[0] + m[7] * v[1] + m[8] * v[2]),
  ];
}

interface Move {
  ax: number;
  layer: number;
  dir: number;
}

function cubeTurn(state: Cubie[], mv: Move): Cubie[] {
  const r = mRot(mv.ax, (mv.dir * Math.PI) / 2);
  return state.map((c) =>
    c.p[mv.ax] === mv.layer ? { p: vRot(r, c.p), m: mMul(r, c.m) } : c
  );
}

const CUBE_SCRAMBLE: Move[] = [
  { ax: 1, layer: -1, dir: 1 },
  { ax: 0, layer: 1, dir: -1 },
  { ax: 2, layer: 1, dir: 1 },
  { ax: 1, layer: 1, dir: -1 },
  { ax: 0, layer: -1, dir: 1 },
  { ax: 2, layer: -1, dir: -1 },
  { ax: 1, layer: -1, dir: -1 },
  { ax: 0, layer: 1, dir: 1 },
  { ax: 2, layer: 1, dir: -1 },
];
const CUBE_SOL: Move[] = CUBE_SCRAMBLE.slice()
  .reverse()
  .map((m) => ({ ax: m.ax, layer: m.layer, dir: -m.dir }));
// De ti mellomtilstandene, forhåndsregnet én gang ved innlasting.
const CUBE_STATES: Cubie[][] = (() => {
  let stt = CUBE_SOLVED;
  for (const mv of CUBE_SCRAMBLE) stt = cubeTurn(stt, mv);
  const out = [stt];
  for (const mv of CUBE_SOL) {
    stt = cubeTurn(stt, mv);
    out.push(stt);
  }
  return out;
})();

const SCENES = ["net", "corp", "cube"] as const;

export default function Now({ t, lang, now }: { t: Copy; lang: Lang; now: number }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const chapRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fillRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tickRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const capRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const stageInnerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const edgeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const caretRef = useRef<HTMLSpanElement | null>(null);
  const crewRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const cubeRef = useRef<HTMLDivElement | null>(null);
  const cubieRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Interaksjonstilstand som lever utenfor React — skrives per frame.
  const st = useRef({
    chapIdx: 0,
    spinX: 0,
    spinY: 0,
    vx: 0,
    vy: 0,
    ctx: 0,
    cty: 0,
    baseY: -34,
    drag: false,
    lx: 0,
    ly: 0,
    rx: undefined as number | undefined,
    ry: 0,
    lastW: 0,
    lastSH: 0,
  }).current;

  const mark = (els: (HTMLElement | null)[], idx: number) => {
    els.forEach((el, i) => {
      if (!el) return;
      if (i === idx) el.setAttribute("data-on", "");
      else el.removeAttribute("data-on");
    });
  };

  // Kalles bare når kapittelindeksen faktisk endrer seg — ikke hver frame.
  const setChapter = (idx: number) => {
    st.chapIdx = idx;
    mark(chapRefs.current, idx);
    mark(sceneRefs.current, idx);
    mark(capRefs.current, idx);
  };

  const fitStage = () => {
    const stage = stageRef.current;
    const inner = stageInnerRef.current;
    if (!stage || !inner) return;
    const s = Math.min(1, stage.clientWidth / 400, stage.clientHeight / 410);
    inner.style.transform = `scale(${s.toFixed(3)})`;
  };

  const netFrame = (q: number) => {
    NET_NODES.forEach((n, i) => {
      const el = nodeRefs.current[i];
      if (!el) return;
      if (q > n.layer * 0.22) el.setAttribute("data-on", "");
      else el.removeAttribute("data-on");
    });
    NET_EDGES.forEach((e, i) => {
      const el = edgeRefs.current[i];
      if (!el) return;
      if (q > e.layer * 0.22 + 0.11) el.setAttribute("data-on", "");
      else el.removeAttribute("data-on");
    });
  };

  const corpFrame = (q: number) => {
    const rows = rowRefs.current;
    const n = rows.length;
    if (!n) return;
    const tt = Math.max(0, Math.min(1, q / 0.9)) * n;
    for (let i = 0; i < n; i++) {
      const row = rows[i];
      if (!row) continue;
      const v = Math.max(0, Math.min(1, tt - i));
      const c = `inset(0 ${((1 - v) * 100).toFixed(1)}% 0 0)`;
      if (row.style.clipPath !== c) row.style.clipPath = c;
    }
    const caret = caretRef.current;
    const ci = Math.max(0, Math.min(n - 1, Math.floor(tt)));
    const row = rows[ci];
    if (caret && row) {
      const cv = Math.max(0, Math.min(1, tt - ci));
      caret.style.top = `${row.offsetTop + 2}px`;
      caret.style.left = `${row.offsetLeft + row.offsetWidth * cv}px`;
      // Blinkingen styrer opacity, så ferdig-tilstanden må bruke visibility.
      caret.style.visibility = tt >= n ? "hidden" : "visible";
    }
    crewRefs.current.forEach((el, i) => {
      if (!el) return;
      if (q > 0.2 + i * 0.14) el.setAttribute("data-on", "");
      else el.removeAttribute("data-on");
    });
  };

  const cubeFrame = (q: number, still: boolean) => {
    const els = cubieRefs.current;
    if (!els.length) return;
    const n = CUBE_SOL.length;
    const raw = Math.max(0, Math.min(0.99999, q)) * n;
    const k = still ? n : Math.floor(raw);
    let tt = still ? 0 : raw - k;
    tt = tt < 0.5 ? 2 * tt * tt : 1 - (-2 * tt + 2) ** 2 / 2;
    const state = CUBE_STATES[Math.min(k, n)];
    const mv = k < n && !still ? CUBE_SOL[k] : null;
    const ang = mv ? mv.dir * 90 * tt : 0;
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      const c = state[i];
      if (!el || !c) continue;
      let pre = "";
      if (mv && c.p[mv.ax] === mv.layer) {
        // Roterer laget om origo, i verdensrommet, før cubiens egen matrise.
        pre = `rotate3d(${mv.ax === 0 ? 1 : 0},${mv.ax === 1 ? 1 : 0},${mv.ax === 2 ? 1 : 0},${ang.toFixed(2)}deg) `;
      }
      const m = c.m;
      el.style.transform =
        `${pre}matrix3d(${m[0]},${m[3]},${m[6]},0,${m[1]},${m[4]},${m[7]},0,` +
        `${m[2]},${m[5]},${m[8]},0,${c.p[0] * CUBE_S},${c.p[1] * CUBE_S},${c.p[2] * CUBE_S},1)`;
    }
    st.baseY = -34 + q * 48;
    if (cubeRef.current && (still || st.rx === undefined)) {
      st.rx = -22;
      st.ry = st.baseY;
      cubeRef.current.style.transform = `rotateX(-22deg) rotateY(${st.baseY.toFixed(2)}deg)`;
    }
  };

  useScrollFrame(() => {
    const sec = sectionRef.current;
    if (!sec) return;
    const vh = window.innerHeight;
    const sh = stageRef.current ? stageRef.current.clientHeight : 0;
    if (st.lastW !== window.innerWidth || st.lastSH !== sh) {
      st.lastW = window.innerWidth;
      st.lastSH = sh;
      fitStage();
    }
    const r = sec.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const still = prefersReducedMotion();
    const p = Math.max(0, Math.min(0.99999, -r.top / Math.max(1, r.height - vh)));
    const idx = Math.min(2, Math.floor(p * 3));
    // 0.84: kapitlet er ferdig animert etter 84 % av sin tredjedel og holder
    // ferdigtilstanden resten — det er dét som gjør at overgangene lander.
    const q = Math.max(0, Math.min(1, (p * 3 - idx) / 0.84));
    const qe = still ? 1 : q;
    if (idx !== st.chapIdx) setChapter(idx);
    for (let i = 0; i < 3; i++) {
      const w = `${(i < idx ? 100 : i > idx ? 0 : qe * 100).toFixed(1)}%`;
      const cf = fillRefs.current[i];
      const tf = tickRefs.current[i];
      if (cf && cf.style.width !== w) cf.style.width = w;
      if (tf && tf.style.width !== w) tf.style.width = w;
    }
    if (idx === 0) netFrame(qe);
    else if (idx === 1) corpFrame(qe);
    else cubeFrame(qe, still);
  });

  // Re-marker aktivt kapittel etter re-render (f.eks. språkbytte), i tilfelle
  // React har byttet ut noder siden forrige imperative markering.
  useEffect(() => {
    setChapter(st.chapIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  useEffect(() => {
    fitStage();
    cubeFrame(0, prefersReducedMotion());
    const spinTick = () => {
      const el = cubeRef.current;
      if (!el || !CUBE_SPIN || st.chapIdx !== 2) return;
      if (prefersReducedMotion()) return;
      let rx = st.rx;
      if (rx === undefined) return;
      let ry = st.ry;
      if (!st.drag) {
        st.spinY += st.vy;
        st.spinX += st.vx;
        st.vy *= 0.93;
        st.vx *= 0.93;
        if (Math.abs(st.vy) < 0.015) st.vy = 0;
        if (Math.abs(st.vx) < 0.015) st.vx = 0;
      }
      st.spinX = Math.max(-70, Math.min(70, st.spinX));
      const f = (CUBE_FOLLOW / 100) * 24;
      const tx = -22 + st.cty * f + st.spinX;
      const ty = st.baseY + st.ctx * f + st.spinY;
      if (!st.drag && !st.vx && !st.vy && Math.abs(tx - rx) < 0.02 && Math.abs(ty - ry) < 0.02)
        return;
      rx += (tx - rx) * 0.1;
      ry += (ty - ry) * 0.1;
      st.rx = rx;
      st.ry = ry;
      el.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    };
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      spinTick();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerMove = (e: React.PointerEvent) => {
    const stage = stageRef.current;
    if (!stage) return;
    if (st.drag) {
      const dx = e.clientX - st.lx;
      const dy = e.clientY - st.ly;
      st.lx = e.clientX;
      st.ly = e.clientY;
      // På touch nulles vertikal spinn — touch-action: pan-y lar siden scrolle.
      const tilt = e.pointerType === "touch" ? 0 : dy * 0.35;
      st.spinY += dx * 0.45;
      st.spinX -= tilt;
      st.vy = dx * 0.45;
      st.vx = -tilt;
      return;
    }
    const r = stage.getBoundingClientRect();
    st.ctx = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 2;
    st.cty = -((e.clientY - r.top) / Math.max(1, r.height) - 0.5) * 2;
    stage.style.cursor = CUBE_SPIN && st.chapIdx === 2 ? "grab" : "default";
  };

  const onPointerLeave = () => {
    st.ctx = 0;
    st.cty = 0;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!CUBE_SPIN || st.chapIdx !== 2) return;
    st.drag = true;
    st.lx = e.clientX;
    st.ly = e.clientY;
    st.vx = 0;
    st.vy = 0;
    const stage = stageRef.current;
    if (stage) {
      stage.style.cursor = "grabbing";
      try {
        stage.setPointerCapture(e.pointerId);
      } catch {
        // Eldre nettlesere uten pointer capture — dra fungerer likevel.
      }
    }
  };

  const onPointerUp = () => {
    if (!st.drag) return;
    st.drag = false;
    if (stageRef.current) stageRef.current.style.cursor = "grab";
  };

  return (
    <section id="na" ref={sectionRef} className={styles.section}>
      <div className={styles.pin}>
        <div className={styles.head}>
          <h2 className={styles.title}>{t.nowTitle}</h2>
          <div className={styles.headMeta}>
            <div className={styles.ticks}>
              {t.now.map((n, i) => (
                <div key={i} className={styles.tick}>
                  <div
                    ref={(el) => {
                      tickRefs.current[i] = el;
                    }}
                    className={styles.tickFill}
                  />
                </div>
              ))}
            </div>
            <span className={styles.date}>{fmtMonthYearFull(now, lang)}</span>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.chapters}>
            {t.now.map((n, i) => (
              <div
                // Indeks som key: listen er fast, og en stabil key hindrer at
                // språkbytte remonterer kapitlene og mister aktiv-markeringen.
                key={i}
                ref={(el) => {
                  chapRefs.current[i] = el;
                }}
                className={styles.chap}
                data-on={i === 0 ? "" : undefined}
              >
                <div className={styles.chapRow}>
                  <span className={styles.num}>0{i + 1}</span>
                  <div>
                    <div className={styles.tagRow}>
                      <span className={styles.dot} />
                      <span className={styles.tag}>{n.tag}</span>
                    </div>
                    <h3 className={styles.chapTitle}>{n.title}</h3>
                    <div className={styles.body}>
                      <div className={styles.bodyInner}>
                        <p className={styles.detail}>{n.detail}</p>
                        <span className={styles.since}>{n.since}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.rail}>
                  <div
                    ref={(el) => {
                      fillRefs.current[i] = el;
                    }}
                    className={styles.fill}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.stageCol}>
            <div
              ref={stageRef}
              className={styles.stage}
              onPointerMove={onPointerMove}
              onPointerLeave={onPointerLeave}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <div ref={stageInnerRef} className={styles.stageInner}>
                <div
                  ref={(el) => {
                    sceneRefs.current[0] = el;
                  }}
                  className={styles.scene}
                  data-on=""
                >
                  {NET_EDGES.map((e, i) => (
                    <div
                      key={`${e.x}-${e.y}-${e.deg}`}
                      ref={(el) => {
                        edgeRefs.current[i] = el;
                      }}
                      className={styles.netEdge}
                      style={{ left: e.x, top: e.y, width: e.w, transform: `rotate(${e.deg}deg)` }}
                    />
                  ))}
                  {NET_NODES.map((nd, i) => (
                    <div
                      key={`${nd.x}-${nd.y}`}
                      ref={(el) => {
                        nodeRefs.current[i] = el;
                      }}
                      className={styles.netNode}
                      style={{ left: nd.x, top: nd.y }}
                    />
                  ))}
                  <div className={styles.netLabels}>
                    {t.nowNet.map((l, i) => (
                      <span key={`${l}-${i}`}>{l}</span>
                    ))}
                  </div>
                </div>

                <div
                  ref={(el) => {
                    sceneRefs.current[1] = el;
                  }}
                  className={`${styles.scene} ${styles.sceneCorp}`}
                >
                  <div className={styles.monitor}>
                    <div className={styles.screen}>
                      <div className={styles.screenBar}>
                        <div className={styles.trafficDots}>
                          <span />
                          <span />
                          <span />
                        </div>
                        <div className={styles.crewRow}>
                          {CREW.map((c, i) => (
                            <span
                              key={c}
                              ref={(el) => {
                                crewRefs.current[i] = el;
                              }}
                              className={styles.crew}
                              style={{ background: c }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className={styles.code}>
                        {CODE_LINES.map((l, i) => (
                          <div
                            // Statisk liste — indeksen er stabil.
                            key={i}
                            ref={(el) => {
                              rowRefs.current[i] = el;
                            }}
                            className={styles.codeRow}
                            style={{ marginLeft: l.indent }}
                          >
                            {l.segs.map((s, j) => (
                              <span key={j} style={{ width: s.w, background: s.c }} />
                            ))}
                          </div>
                        ))}
                        <span ref={caretRef} className={styles.caret} />
                      </div>
                    </div>
                  </div>
                  <div className={styles.monitorNeck} />
                  <div className={styles.monitorFoot} />
                </div>

                <div
                  ref={(el) => {
                    sceneRefs.current[2] = el;
                  }}
                  className={`${styles.scene} ${styles.sceneCube}`}
                >
                  <div ref={cubeRef} className={styles.cube}>
                    {CUBIE_FACES.map((faces, i) => (
                      <div
                        // Statisk liste — indeksen er stabil.
                        key={i}
                        ref={(el) => {
                          cubieRefs.current[i] = el;
                        }}
                        className={styles.cubie}
                      >
                        {faces.map((bg, j) => (
                          <div key={j} className={styles.face} style={{ transform: FACE_TF[j], background: bg }} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.caption}>
              <span className={styles.capDot} />
              {SCENES.map((k, i) => (
                <span
                  key={k}
                  ref={(el) => {
                    capRefs.current[i] = el;
                  }}
                  className={styles.cap}
                  data-on={i === 0 ? "" : undefined}
                >
                  {t.nowCaps[k]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
