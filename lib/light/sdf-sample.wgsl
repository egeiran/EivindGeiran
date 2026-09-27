// Scenens avstandsfelt og sphere-traceren hver cascade-stråle kjører. Tilpasset fra vgpu sitt
// radiance-cascades-eksempel (MIT): bokstavene ligger i et jump-flood-felt som bare bygges når
// de flytter seg, mens lyset er en analytisk skive, så det kan flytte seg hver frame uten at
// hele avstandsfeltet må regnes ut på nytt.

import { Light } from "./light.wgsl";

/** En halv texel teller som treff. */
export const SDF_HIT_EPSILON: f32 = 0.5;
/** Holder strejfende stråler i bevegelse. */
export const SDF_MIN_STEP: f32 = 0.35;
/** Avstandsfelt konvergerer fort over 4x-intervaller. */
export const SDF_MAX_STEPS: i32 = 16;

export fn sdf_pixel_uv(pixel: vec2f, size: vec2f) -> vec2f {
  let half_texel = 0.5 / size;
  return clamp(pixel / size, half_texel, vec2f(1.0) - half_texel);
}

export fn sdf_sample(
  tex: texture_2d<f32>,
  samp: sampler,
  pixel: vec2f,
  size: vec2f,
) -> f32 {
  return textureSampleLevel(tex, samp, sdf_pixel_uv(pixel, size), 0.0).r;
}

export fn light_distance(light: Light, p: vec2f) -> f32 {
  return length(p - light.pos) - light.radius;
}

/**
 * Marsjerer `[t_start, t_end]` av én stråle gjennom scenen.
 *
 * Returnerer `vec4f(radians, synlighet)`: treffer strålen lyset, lysets radians med synlighet 0;
 * treffer den en bokstav, svart med synlighet 0 — bokstavene er rene skyggekastere; slipper den
 * unna, svart med synlighet 1, så neste cascades lengre intervall fortsetter samme stråle.
 */
export fn sphere_trace(
  sdf_tex: texture_2d<f32>,
  sdf_samp: sampler,
  size: vec2f,
  light: Light,
  origin: vec2f,
  direction: vec2f,
  t_start: f32,
  t_end: f32,
) -> vec4f {
  var t = t_start;
  for (var step = 0; step < SDF_MAX_STEPS; step = step + 1) {
    let p = origin + direction * t;
    // Utenfor lerretet er tomt rom: ingenting å treffe, og feltet der ute er bare ekstrapolert.
    if (
      p.x < -1.0 ||
      p.y < -1.0 ||
      p.x > size.x + 1.0 ||
      p.y > size.y + 1.0
    ) {
      break;
    }
    // Lyset sjekkes først: står skiva delvis inne i en bokstav, vinner den delen som stikker ut.
    let to_light = light_distance(light, p);
    if (to_light <= SDF_HIT_EPSILON) {
      return vec4f(light.color, 0.0);
    }
    // Bokstavene minus hullet rundt lyset: max av to nedre skranker er fortsatt en trygg
    // avstand å sphere-trace med.
    let to_glyph = max(
      sdf_sample(sdf_tex, sdf_samp, p, size),
      light.carve - length(p - light.pos),
    );
    if (to_glyph <= SDF_HIT_EPSILON) {
      return vec4f(0.0, 0.0, 0.0, 0.0);
    }
    t = t + max(min(to_glyph, to_light), SDF_MIN_STEP);
    if (t > t_end) {
      break;
    }
  }
  return vec4f(0.0, 0.0, 0.0, 1.0);
}
