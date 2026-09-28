// Scenens avstandsfelt og sphere-traceren hver cascade-stråle kjører. Tilpasset fra vgpu sitt
// radiance-cascades-eksempel (MIT). Bokstavene er farget glass: avstandsfeltet har både
// avstanden inn til glasset (R) og ut av det (G), så traceren kan marsjere gjennom en bokstav
// og måle hvor tykk den er. Lyset er en analytisk skive, så det kan flytte seg hver frame uten
// at avstandsfeltet må regnes ut på nytt.
//
// En stråle gir vec4f(direkte, gjennom glass, glass-flagg, synlighet):
//   R: andel av lyset som treffes direkte, uten glass imellom
//   G: andel som treffes gjennom glass (allerede dempet)
//   B: 1 hvis strålen gikk gjennom glass i sitt eget intervall
//   A: transmisjon videre til neste intervall (1 = fri bane, 0 = traff lyset)

import { Light } from "./light.wgsl";

/** En halv texel teller som treff. */
export const SDF_HIT_EPSILON: f32 = 0.5;
/** Holder strejfende stråler i bevegelse. */
export const SDF_MIN_STEP: f32 = 0.35;
/** Minste steg inne i glasset, så en stråle langs en kant ikke står og stamper. */
export const SDF_MIN_STEP_INSIDE: f32 = 1.25;
/** Avstandsfelt konvergerer fort over 4x-intervaller. */
export const SDF_MAX_STEPS: i32 = 16;

export fn sdf_pixel_uv(pixel: vec2f, size: vec2f) -> vec2f {
  let half_texel = 0.5 / size;
  return clamp(pixel / size, half_texel, vec2f(1.0) - half_texel);
}

/** R: avstand inn til glasset (0 inni), G: avstand ut av glasset (0 utenfor). */
export fn sdf_sample(
  tex: texture_2d<f32>,
  samp: sampler,
  pixel: vec2f,
  size: vec2f,
) -> vec2f {
  return textureSampleLevel(tex, samp, sdf_pixel_uv(pixel, size), 0.0).rg;
}

export fn light_distance(light: Light, p: vec2f) -> f32 {
  return length(p - light.pos) - light.radius;
}

/** Marsjerer `[t_start, t_end]` av én stråle gjennom scenen. Se toppen av fila for resultatet. */
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
  // Hvor langt strålen har gått inne i glass i dette intervallet, i scene-piksler.
  var glass = 0.0;
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
    let to_light = light_distance(light, p);
    if (to_light <= SDF_HIT_EPSILON) {
      if (glass > 0.0) {
        return vec4f(0.0, exp(-light.absorb * glass), 1.0, 0.0);
      }
      return vec4f(1.0, 0.0, 0.0, 0.0);
    }
    let field = sdf_sample(sdf_tex, sdf_samp, p, size);
    var advance = 0.0;
    if (field.x > SDF_HIT_EPSILON) {
      advance = max(min(field.x, to_light), SDF_MIN_STEP);
    } else {
      // Inni glasset: G er avstanden ut, så et steg så langt krysser aldri kanten.
      advance = max(min(field.y, to_light), SDF_MIN_STEP_INSIDE);
      glass = glass + advance;
    }
    t = t + advance;
    if (t > t_end) {
      break;
    }
  }
  return vec4f(0.0, 0.0, select(0.0, 1.0, glass > 0.0), exp(-light.absorb * glass));
}
