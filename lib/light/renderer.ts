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
 * Hero-lyset: 2D global belysning med radiance cascades på WebGPU (vgpu). Bokstavene i
 * ordmerket er skyggekastere, pekeren er en lime lyskilde, og gulvet under er skrå fliser
 * som bare synes der lyset treffer. Kjeden er tilpasset fra vgpu sitt radiance-cascades-
 * eksempel (MIT): bokstavmasken → jump flood → avstandsfelt (bare når bokstavene flytter
 * seg) → cascadene ovenfra og ned → irradians → present til lerretet.
 */

type Vec2 = readonly [number, number];

const HDR: GPUTextureFormat = "rgba16float";
// Frøene lagrer absolutte pikselkoordinater, som trenger f32-presisjon over 2048.
const SEED: GPUTextureFormat = "rgba32float";
const RC_INTERVAL0 = 2;

/** Lime (#d9ff63) i lineært rom, dratt mot hvitt så gulvet ikke blir neongrønt. */
const LIGHT_TINT = [0.816, 1, 0.475] as const;
const LIGHT_POWER = 11;
/** Hvor langt forbi skiva hullet i bokstavene når, som andel av lysets radius. */
const CARVE_REACH = 1.2;
/** Søkeradius for nærmeste bokstavkant, som andel av lysets radius. */
const CARVE_SEARCH = 4;
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

    // Avstandsfeltet: all ping-pong er kjent på forhånd, så bindingene settes én gang.
    const sdfPasses: Pass[] = [];
    const jfaInit = effect(gpu, jfaInitWgsl, { set: { mask } });
    sdfPasses.push({ target: jfa[0], effect: jfaInit });
    let seedRead = 0;
    for (const jump of jumps) {
      // set() skriver umiddelbart, så hvert pass med egne uniforms trenger egen effect.
      const step = effect(gpu, jfaPassWgsl, {
        set: { jfa: { jump: [jump, 0, 0, 0] }, seeds: jfa[seedRead] },
      });
      sdfPasses.push({ target: jfa[1 - seedRead], effect: step });
      seedRead = 1 - seedRead;
    }
    const sdfFinalize = effect(gpu, sdfFinalizeWgsl, { set: { seeds: jfa[seedRead] } });
    sdfPasses.push({ target: sdf, effect: sdfFinalize });

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
      set: { resolve: { size: [width, height, 0, 0] }, cascade_tex: cascades[1 - atlasWrite] },
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

  // Gjenbrukes av carveRadius, så flood fill-en ikke allokerer hver frame.
  let open = new Uint8Array(0);
  let queue = new Int32Array(0);

  const maskCanvas = document.createElement("canvas");
  // Leses tilbake rundt lyset hver frame (se carveRadius), så den skal ligge i CPU-minne.
  const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });

  const light = uniforms(gpu, {
    pos: [0, 0],
    radius: 1,
    exposure: 0,
    color: LIGHT_TINT.map((c) => c * LIGHT_POWER),
    scale: 1,
    carve: 0,
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

  /**
   * Radius på hullet lyset brenner i bokstavene, i scene-piksler. Står lyset inni en bokstav,
   * når hullet til nærmeste kant pluss litt, så lyset alltid slipper ut; står det utenfor men
   * tett inntil, krymper hullet til null med avstanden. Kontinuerlig i begge retninger, så
   * lyset glir inn og ut av bokstavene uten å hoppe.
   *
   * «Utenfor» betyr tomrom som henger sammen med kanten av søkevinduet. Hullene i D, R og A
   * er tomme, men lukket inne — står lyset der, regnes det som inni bokstaven, ellers ville
   * ringen rundt stengt alt lys inne og hele gulvet blitt svart.
   */
  const carveRadius = (cx: number, cy: number, r: number): number => {
    if (!maskCtx) return 0;
    const reach = r * CARVE_REACH;
    const search = Math.ceil(r * CARVE_SEARCH);
    const x0 = Math.max(0, Math.floor(cx) - search);
    const y0 = Math.max(0, Math.floor(cy) - search);
    const x1 = Math.min(maskCanvas.width, Math.floor(cx) + search + 1);
    const y1 = Math.min(maskCanvas.height, Math.floor(cy) + search + 1);
    if (x1 <= x0 || y1 <= y0) return 0;
    const w = x1 - x0;
    const h = y1 - y0;
    const n = w * h;
    const alpha = maskCtx.getImageData(x0, y0, w, h).data;
    if (open.length < n) {
      open = new Uint8Array(n);
      queue = new Int32Array(n);
    }
    open.fill(0, 0, n);
    // Flood fill av tomrom fra vinduskanten (4-nabo).
    let head = 0;
    let tail = 0;
    const seed = (i: number) => {
      if (open[i] || alpha[i * 4 + 3] > 127) return;
      open[i] = 1;
      queue[tail++] = i;
    };
    for (let x = 0; x < w; x++) {
      seed(x);
      seed((h - 1) * w + x);
    }
    for (let y = 0; y < h; y++) {
      seed(y * w);
      seed(y * w + w - 1);
    }
    while (head < tail) {
      const i = queue[head++];
      const x = i % w;
      if (x > 0) seed(i - 1);
      if (x < w - 1) seed(i + 1);
      if (i >= w) seed(i - w);
      if (i < n - w) seed(i + w);
    }
    const px = Math.min(w - 1, Math.max(0, Math.floor(cx) - x0));
    const py = Math.min(h - 1, Math.max(0, Math.floor(cy) - y0));
    const outside = open[py * w + px];
    let nearest = search;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (open[y * w + x] === outside) continue;
        const d = Math.hypot(x0 + x + 0.5 - cx, y0 + y + 0.5 - cy);
        if (d < nearest) nearest = d;
      }
    }
    return outside ? Math.max(0, reach - nearest) : nearest + reach;
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
    render({ x, y, radius, exposure }) {
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
        const lx = x * scale;
        const ly = y * scaleY;
        const r = radius * scale;
        light.set({ pos: [lx, ly], radius: r, exposure, scale, carve: carveRadius(lx, ly, r) });
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
