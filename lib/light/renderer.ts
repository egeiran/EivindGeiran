"use client";

import {
  effect,
  frame,
  init,
  sampler,
  surface,
  target,
  texture,
  uniforms,
  type Effect,
  type Gpu,
  type SharedUniforms,
  type Surface,
  type Target,
  type Texture,
} from "vgpu";
import jfaInitWgsl from "./jfa-init.wgsl";
import jfaPassWgsl from "./jfa-pass.wgsl";
import presentWgsl from "./present.wgsl";
import radianceCascadeWgsl from "./radiance-cascade.wgsl";
import resolveWgsl from "./resolve.wgsl";
import sdfFinalizeWgsl from "./sdf-finalize.wgsl";

/*
 * Hero-lyset: 2D global belysning med radiance cascades på WebGPU (vgpu). Pekeren er en lime
 * lyskilde, bokstavene i ordmerket er farget glass som demper og farger lyset som går
 * gjennom dem, og gulvet under er skrå fliser som bare synes der lyset treffer. Kjeden er
 * tilpasset fra vgpu sitt radiance-cascades-eksempel (MIT): bokstavmasken → to jump floods →
 * avstandsfelt inn til og ut av glasset (bare når bokstavene flytter seg) → cascadene ovenfra
 * og ned → irradians → present til lerretet.
 */

type Vec2 = readonly [number, number];

const HDR: GPUTextureFormat = "rgba16float";
// Frøene lagrer absolutte pikselkoordinater, som trenger f32-presisjon over 2048.
const SEED: GPUTextureFormat = "rgba32float";
const RC_INTERVAL0 = 2;

/** Lime (#d9ff63) i lineært rom, dratt mot hvitt så gulvet ikke blir neongrønt. */
const LIGHT_TINT = [0.816, 1, 0.475] as const;
const LIGHT_POWER = 11;
/**
 * Bokstavene er blått glass (sidens --blue, lineært): lime lys foran, blått bak. Lyset som
 * går gjennom kommer ut i denne fargen, dempet etter hvor tykt glasset er. Styrken følger
 * lyset, så forholdet holder seg likt.
 */
const GLASS_TINT = [0.1, 0.42, 1] as const;
const GLASS_POWER = LIGHT_POWER * 1.15;
/** Scenen bygges på nytt først når størrelsen har stått i ro så lenge (ms). */
const REBUILD_DEBOUNCE_MS = 160;
/** Hvor mye sceneoppløsningen krymper per nedgradering når GPU-en ikke henger med. */
const DEGRADE_STEP = 0.72;
const MAX_DEGRADES = 2;

export interface LightFrame {
  /** Lysets sentrum i CSS-piksler, relativt til lerretet. */
  readonly x: number;
  readonly y: number;
  /** Lysets radius i CSS-piksler. */
  readonly radius: number;
  /** 0–1: intro-flimmer ganger fade når heroen scrolles ut. */
  readonly exposure: number;
  /** Hvor mye glasset i bokstavene absorberer per CSS-piksel (følger skriftstørrelsen). */
  readonly absorb: number;
}

export interface HeroLightOptions {
  /** Tegner bokstavene opakt i CSS-piksler relativt til lerretet; transformen er satt. */
  readonly drawMask: (ctx: CanvasRenderingContext2D) => void;
  /** Maks antall scene-piksler; sceneoppløsningen skaleres ned til dette. */
  readonly budget: number;
  /** GPU-en forsvant eller rapporterte feil. Heroen faller da tilbake til CSS-spotlighten. */
  readonly onFailure: (error: unknown) => void;
  /** Rendereren trenger en ny frame (resize, ny scene) selv om lyset står stille. */
  readonly requestRender: () => void;
}

export interface HeroLight {
  /** Bokstavene har flyttet seg: tegn masken og avstandsfeltet på nytt ved neste render. */
  invalidateMask(): void;
  /** Tegner én frame. false hvis ingenting ble tegnet (ikke klar, eller GPU-en feilet). */
  render(frame: LightFrame): boolean;
  /** Senk sceneoppløsningen ett hakk. false når det ikke går lavere. */
  degrade(): boolean;
  dispose(): void;
}

interface Pass {
  readonly target: Target;
  readonly effect: Effect;
}

function createScene(gpu: Gpu, size: Vec2, light: SharedUniforms) {
  const [width, height] = size;
  const cascadeCount = Math.min(
    6,
    Math.max(
      5,
      Math.ceil(Math.log(1 + (3 * Math.hypot(width, height)) / RC_INTERVAL0) / Math.log(4))
    )
  );
  const spacing = 2 ** (cascadeCount - 1);
  const atlas: Vec2 = [
    Math.ceil(width / spacing) * spacing * 2,
    Math.ceil(height / spacing) * spacing * 2,
  ];
  const jumpCount = Math.ceil(Math.log2(Math.max(width, height, 2)));
  const jumps = [
    ...Array.from({ length: jumpCount }, (_, i) => Math.max(1, 2 ** (jumpCount - i - 1))),
    1,
    1,
  ];

  const owned: (Target | Texture)[] = [];
  const own = <T extends Target | Texture>(resource: T) => {
    owned.push(resource);
    return resource;
  };
  // `target()` er typet som Target, men er en OffscreenTarget med destroy() — samme
  // grep som vgpu sitt eget eksempel bruker for å frigjøre den ved resize.
  const destroy = () => {
    for (const resource of owned.reverse()) {
      try {
        (resource as { destroy?: () => void }).destroy?.();
      } catch {
        // Best effort: resten skal fortsatt ryddes.
      }
    }
  };

  try {
    const mask = own(
      texture(gpu, {
        kind: "2d",
        size,
        format: "rgba8unorm",
        // copyExternalImageToTexture krever render_attachment på målet.
        usage: ["texture_binding", "copy_dst", "render_attachment"],
        label: "hero-mask",
      })
    );
    const jfa = [
      own(target(gpu, { size, format: SEED })),
      own(target(gpu, { size, format: SEED })),
    ] as const;
    const sdfOutside = own(target(gpu, { size, format: HDR }));
    const sdf = own(target(gpu, { size, format: HDR }));
    const cascades = [
      own(target(gpu, { size: atlas, format: HDR })),
      own(target(gpu, { size: atlas, format: HDR })),
    ] as const;
    const irradiance = own(target(gpu, { size, format: HDR }));
    const linear = sampler(gpu, {
      minFilter: "linear",
      magFilter: "linear",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
    });

    // Avstandsfeltet: to jump floods — inn til glasset og ut av det — gjennom samme par med
    // frø-targets. All ping-pong er kjent på forhånd, så bindingene settes én gang, og
    // steg-effektene gjenbrukes av begge (samme hopp, samme targets).
    const steps: Pass[] = [];
    let seedRead = 0;
    for (const jump of jumps) {
      // set() skriver umiddelbart, så hvert pass med egne uniforms trenger egen effect.
      const step = effect(gpu, jfaPassWgsl, {
        set: { jfa: { jump: [jump, 0, 0, 0] }, seeds: jfa[seedRead] },
      });
      steps.push({ target: jfa[1 - seedRead], effect: step });
      seedRead = 1 - seedRead;
    }
    const flood = (invert: number, finalize: Pass): Pass[] => [
      {
        target: jfa[0],
        effect: effect(gpu, jfaInitWgsl, { set: { init: { invert: [invert, 0, 0, 0] }, mask } }),
      },
      ...steps,
      finalize,
    ];
    const sdfPasses: Pass[] = [
      ...flood(0, {
        target: sdfOutside,
        effect: effect(gpu, sdfFinalizeWgsl, {
          set: { finalize: { inside: [0, 0, 0, 0] }, seeds: jfa[seedRead], previous: sdf },
        }),
      }),
      ...flood(1, {
        target: sdf,
        effect: effect(gpu, sdfFinalizeWgsl, {
          set: { finalize: { inside: [1, 0, 0, 0] }, seeds: jfa[seedRead], previous: sdfOutside },
        }),
      }),
    ];

    // Cascadene ovenfra og ned, to atlas som resirkuleres.
    const lightPasses: Pass[] = [];
    let atlasWrite = 0;
    for (let cascade = cascadeCount - 1; cascade >= 0; cascade--) {
      const shader = effect(gpu, radianceCascadeWgsl, {
        set: {
          rc: { state: [cascade, cascade < cascadeCount - 1 ? 1 : 0, width, height] },
          light,
          sdf_tex: sdf,
          sdf_samp: linear,
          upper_tex: cascades[1 - atlasWrite],
        },
      });
      lightPasses.push({ target: cascades[atlasWrite], effect: shader });
      atlasWrite = 1 - atlasWrite;
    }
    const resolve = effect(gpu, resolveWgsl, {
      set: {
        resolve: { size: [width, height, 0, 0] },
        light,
        cascade_tex: cascades[1 - atlasWrite],
      },
    });
    lightPasses.push({ target: irradiance, effect: resolve });

    const present = effect(gpu, presentWgsl, {
      set: {
        present: { view: [1, 1, 0, 1] },
        light,
        irradiance_tex: irradiance,
        irradiance_samp: linear,
      },
    });

    return { size, mask, sdfPasses, lightPasses, present, destroy };
  } catch (error) {
    destroy();
    throw error;
  }
}

type Scene = ReturnType<typeof createScene>;

export async function createHeroLight(
  canvas: HTMLCanvasElement,
  options: HeroLightOptions
): Promise<HeroLight> {
  const gpu = await init({ label: "hero-light" });
  let disposed = false;
  let failed = false;
  let scene: Scene | undefined;
  let canvasSurface: Surface | undefined;
  let observer: ResizeObserver | undefined;
  let dprQuery: MediaQueryList | undefined;
  let resizePending = false;
  let rebuildTimer = 0;
  let maskDirty = true;
  let degrades = 0;
  let css: Vec2 = [0, 0];
  let dpr = 1;
  /** Scene-piksler per CSS-piksel, per akse (avrundingen gjør dem marginalt ulike). */
  let scale = 1;
  let scaleY = 1;
  const started = performance.now();

  const maskCanvas = document.createElement("canvas");
  const maskCtx = maskCanvas.getContext("2d");

  const light = uniforms(gpu, {
    pos: [0, 0],
    radius: 1,
    exposure: 0,
    color: LIGHT_TINT.map((c) => c * LIGHT_POWER),
    scale: 1,
    tint: GLASS_TINT.map((c) => c * GLASS_POWER),
    absorb: 0,
  });

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    window.clearTimeout(rebuildTimer);
    observer?.disconnect();
    dprQuery?.removeEventListener("change", onDprChange);
    scene?.destroy();
    scene = undefined;
    gpu.dispose();
  };

  const fail = (error: unknown) => {
    if (disposed || failed) return;
    failed = true;
    dispose();
    options.onFailure(error);
  };

  gpu.onError(fail);
  void gpu.gpu.lost.then((info) => {
    if (!disposed) fail(info);
  });

  const rebuild = () => {
    const [w, h] = css;
    if (!canvasSurface || w <= 0 || h <= 0) return;
    const fit = Math.min(1, Math.sqrt(options.budget / (w * h))) * DEGRADE_STEP ** degrades;
    const size: Vec2 = [Math.max(1, Math.round(w * fit)), Math.max(1, Math.round(h * fit))];
    scale = size[0] / w;
    scaleY = size[1] / h;
    if (!scene || scene.size[0] !== size[0] || scene.size[1] !== size[1]) {
      const previous = scene;
      scene = createScene(gpu, size, light);
      previous?.destroy();
      maskCanvas.width = size[0];
      maskCanvas.height = size[1];
    }
    scene.present.set({ present: { view: [w, h, 0, dpr] } });
    maskDirty = true;
  };

  /**
   * Tilpasser lerretet til ny størrelse. Kalles først i render(), rett før det tegnes:
   * å sette canvas.width tømmer tegnebufferet, og skjer det etter at framen er tegnet,
   * vises en blank frame. Scenen (cascade-targets, ~20 effects) bygges ikke på nytt for
   * hvert steg i en vindus-drag — den gamle strekkes til størrelsen har roet seg.
   */
  const applyResize = () => {
    resizePending = false;
    if (!canvasSurface) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    css = [rect.width, rect.height];
    canvasSurface.resize([
      Math.max(1, Math.round(rect.width * dpr)),
      Math.max(1, Math.round(rect.height * dpr)),
    ]);
    if (!scene) {
      rebuild();
      return;
    }
    scale = scene.size[0] / css[0];
    scaleY = scene.size[1] / css[1];
    scene.present.set({ present: { view: [css[0], css[1], 0, dpr] } });
    maskDirty = true;
    window.clearTimeout(rebuildTimer);
    rebuildTimer = window.setTimeout(() => {
      if (disposed) return;
      try {
        rebuild();
        options.requestRender();
      } catch (error) {
        fail(error);
      }
    }, REBUILD_DEBOUNCE_MS);
  };

  const onResize = () => {
    if (disposed) return;
    resizePending = true;
    options.requestRender();
  };

  // Flytter vinduet til en skjerm med annen pikseltetthet, endres ikke CSS-størrelsen, så
  // ResizeObserver merker ingenting. En media query på gjeldende dppx gjør det.
  function onDprChange() {
    watchDpr();
    onResize();
  }
  const watchDpr = () => {
    dprQuery?.removeEventListener("change", onDprChange);
    dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    dprQuery.addEventListener("change", onDprChange);
  };

  const uploadMask = (current: Scene) => {
    if (!maskCtx) throw new Error("2D-kontekst mangler for bokstavmasken");
    maskCtx.setTransform(1, 0, 0, 1, 0, 0);
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskCtx.setTransform(scale, 0, 0, scaleY, 0, 0);
    maskCtx.fillStyle = "#fff";
    options.drawMask(maskCtx);
    gpu.gpu.queue.copyExternalImageToTexture(
      { source: maskCanvas },
      { texture: current.mask.gpu },
      [current.size[0], current.size[1]]
    );
  };

  try {
    canvasSurface = surface(gpu, canvas, { autoResize: false, dpr: [1, 2] });
    applyResize();
    if (!scene) throw new Error("Lerretet har ingen størrelse ennå");
    const current = scene;
    // Forvarm alle pipelines før første frame, så introen ikke hakker. allSettled: feiler én,
    // skal resten være ferdige før GPU-en rives ned, ellers avviser de etter dispose.
    const compiled = await Promise.allSettled([
      ...[...current.sdfPasses, ...current.lightPasses].map((p) => p.effect.compile(p.target)),
      current.present.compile({ colors: [canvasSurface.format] }),
    ]);
    const failure = compiled.find((r): r is PromiseRejectedResult => r.status === "rejected");
    if (failure) throw failure.reason;
    // onError/device lost kan ha slått til mens pipelines kompilerte.
    if (failed || disposed) throw new Error("GPU-en falt bort under oppstart");
  } catch (error) {
    dispose();
    throw error;
  }

  observer = new ResizeObserver(onResize);
  observer.observe(canvas);
  watchDpr();

  return {
    invalidateMask() {
      maskDirty = true;
    },
    render({ x, y, radius, exposure, absorb }) {
      if (disposed || !canvasSurface) return false;
      const output = canvasSurface;
      try {
        if (resizePending) applyResize();
        const current = scene;
        if (!current) return false;
        const redrawSdf = maskDirty;
        if (redrawSdf) {
          uploadMask(current);
          maskDirty = false;
        }
        light.set({
          pos: [x * scale, y * scaleY],
          radius: radius * scale,
          exposure,
          scale,
          absorb: absorb / scale,
        });
        current.present.set({
          present: { view: [css[0], css[1], (performance.now() - started) / 1000, dpr] },
        });
        frame(gpu, (f) => {
          const passes = redrawSdf
            ? [...current.sdfPasses, ...current.lightPasses]
            : current.lightPasses;
          for (const pass of passes) {
            f.pass({ target: pass.target, clear: [0, 0, 0, 0] }, (encoder) =>
              encoder.draw(pass.effect)
            );
          }
          f.pass({ target: output, clear: [0, 0, 0, 1] }, (encoder) =>
            encoder.draw(current.present)
          );
        });
        return true;
      } catch (error) {
        fail(error);
        return false;
      }
    },
    degrade() {
      if (disposed || degrades >= MAX_DEGRADES) return false;
      degrades += 1;
      try {
        rebuild();
      } catch (error) {
        fail(error);
        return false;
      }
      return true;
    },
    dispose,
  };
}
