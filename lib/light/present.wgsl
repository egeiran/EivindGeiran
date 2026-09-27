import { Light } from "./light.wgsl";
import { light_distance } from "./sdf-sample.wgsl";

// Eneste pass som forlater lineær radians. Lyser opp flisegulvet med irradiansen fra
// cascadene, tegner selve lyskilden, og tonemapper + sRGB-koder én gang. Uten lys er
// resultatet nøyaktig sidens blekksvarte bakgrunn, så heroen går sømløst over i resten.

struct Present {
  /** xy: lerretets størrelse i CSS-piksler, z: tid i sekunder, w: device pixel ratio. */
  view: vec4f,
};

@group(0) @binding(0) var<uniform> present: Present;
@group(0) @binding(1) var<uniform> light: Light;
@group(0) @binding(2) var irradiance_tex: texture_2d<f32>;
@group(0) @binding(3) var irradiance_samp: sampler;

/** --ink (#0c0e11) i lineært rom. */
const INK: vec3f = vec3f(0.00367, 0.00439, 0.00561);

// Skrå fliser, i CSS-piksler så de har samme størrelse uansett sceneoppløsning.
const TILE_CELL: vec2f = vec2f(104.0, 172.0);
const TILE_GAP: f32 = 8.0;
const TILE_RADIUS: f32 = 14.0;
/** tan(12°): flisene lener seg mot høyre, som en skråstrek. */
const TILE_SKEW: f32 = 0.2126;
/** Bredden på fasen langs flisekanten. */
const TILE_BEVEL: f32 = 7.0;
/** Hvor høyt over gulvet lyset henger når fasene skygges, i CSS-piksler. */
const LIGHT_HEIGHT: f32 = 110.0;

/** Fortegnet avstand til nærmeste flis (negativ inni), pluss flisens id. */
fn tile_sd(p: vec2f) -> vec3f {
  let q = vec2f(p.x + p.y * TILE_SKEW, p.y);
  let id = floor(q / TILE_CELL);
  let local = q - (id + 0.5) * TILE_CELL;
  let half_size = TILE_CELL * 0.5 - vec2f(TILE_GAP * 0.5);
  let d = abs(local) - half_size + TILE_RADIUS;
  let sd = length(max(d, vec2f(0.0))) + min(max(d.x, d.y), 0.0) - TILE_RADIUS;
  return vec3f(sd, id);
}

fn hash21(p: vec2f) -> f32 {
  var q = fract(p * vec2f(123.34, 456.21));
  q += dot(q, q + 45.32);
  return fract(q.x * q.y);
}

/** Albedo × hvor mye fasen vender mot lyset. Flate flater gir nøyaktig albedo. */
fn tile_shade(p: vec2f, light_css: vec2f) -> f32 {
  let tile = tile_sd(p);
  let sd = tile.x;
  let aa = max(fwidth(sd), 1e-3);
  let face = 1.0 - smoothstep(-aa, aa, sd);
  // Noen få fliser er litt lysere, så gulvet ikke blir et helt jevnt rutenett.
  let face_albedo = select(0.11, 0.16, hash21(tile.yz) > 0.82);
  let albedo = mix(0.025, face_albedo, face);

  let e = 0.5;
  let grad = vec2f(
    tile_sd(p + vec2f(e, 0.0)).x - tile_sd(p - vec2f(e, 0.0)).x,
    tile_sd(p + vec2f(0.0, e)).x - tile_sd(p - vec2f(0.0, e)).x,
  ) / (2.0 * e);
  let rim = smoothstep(-TILE_BEVEL, 0.0, sd) * face;
  let normal = normalize(vec3f(grad * rim * 0.55, 1.0));
  let to_light = normalize(vec3f(light_css - p, LIGHT_HEIGHT));
  let facing = clamp(dot(normal, to_light) / max(to_light.z, 0.15), 0.0, 1.8);
  return albedo * facing;
}

fn tonemap_aces(color: vec3f) -> vec3f {
  let a = 2.51;
  let b = 0.03;
  let c = 2.43;
  let d = 0.59;
  let e = 0.14;
  return clamp(
    (color * (a * color + b)) / (color * (c * color + d) + e),
    vec3f(0.0),
    vec3f(1.0),
  );
}

fn linear_to_srgb(color: vec3f) -> vec3f {
  let low = color * 12.92;
  let high = 1.055 * pow(max(color, vec3f(0.0)), vec3f(1.0 / 2.4)) - 0.055;
  return select(high, low, color <= vec3f(0.0031308));
}

/** Interleaved gradient noise: bryter opp banding i de mørke gradientene. */
fn dither(pixel: vec2f) -> f32 {
  return fract(52.9829189 * fract(dot(pixel, vec2f(0.06711056, 0.00583715)))) - 0.5;
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let css = uv * present.view.xy;
  let scale = max(light.scale, 1e-3);
  let light_css = light.pos / scale;

  let irradiance = textureSampleLevel(irradiance_tex, irradiance_samp, uv, 0.0).rgb;
  let floor_shade = tile_shade(css, light_css);
  var lit = irradiance * floor_shade * light.exposure;

  // Selve lyskilden: en skarp kjerne med en svak glød rundt, i CSS-piksler.
  let scene_px = uv * vec2f(textureDimensions(irradiance_tex));
  let to_edge = light_distance(light, scene_px) / scale;
  let aa = 1.0 / max(present.view.w, 1.0);
  let core = 1.0 - smoothstep(-aa, aa, to_edge);
  let radius_css = light.radius / scale;
  let halo = exp(-max(to_edge, 0.0) / (radius_css * 0.8)) * 0.3;
  lit = mix(lit, light.color * light.exposure, core) + light.color * halo * light.exposure;

  let mapped = INK + tonemap_aces(lit * 0.85);
  let encoded = linear_to_srgb(mapped) + dither(css * present.view.w) / 255.0;
  return vec4f(encoded, 1.0);
}
