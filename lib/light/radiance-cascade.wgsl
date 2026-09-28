import { rc_atlas_decode, rc_atlas_texel, rc_block_size } from "./rc-directions.wgsl";
import { rc_direction, rc_probe_origin, rc_probe_spacing, rc_ray_count } from "./rc-directions.wgsl";
import { sphere_trace } from "./sdf-sample.wgsl";
import { Light } from "./light.wgsl";

// Én cascade: trace dette nivåets intervall for hver probe og retning, og flett inn nivået
// over. Kjeden går ovenfra og ned (øverste cascade først, cascade 0 sist), så når cascade 0
// skrives bærer den allerede radiansen fra hele hierarkiet.
// Fra vgpu sitt radiance-cascades-eksempel (MIT); traceren ser bokstaver og lysskive i stedet
// for malte emittere.

fn rc_interval_start(cascade: f32) -> f32 {
  return 2.0 * (pow(4.0, cascade) - 1.0) / 3.0;
}

fn rc_interval_length(cascade: f32) -> f32 {
  return 2.0 * pow(4.0, cascade);
}

fn rc_interval_end(cascade: f32) -> f32 {
  return rc_interval_start(cascade) +
    rc_interval_length(cascade) * (1.0 + 0.02);
}

const RC_BRANCH_WEIGHT: f32 = 0.25;

/**
 * Fletter en nær stråle med fortsettelsen bak den. Gikk den nære strålen gjennom glass, blir
 * alt lys bak den glass-lys — også det som var direkte sett derfra. Se sdf-sample.wgsl.
 */
fn rc_merge(near: vec4f, far: vec4f) -> vec4f {
  let through = near.b;
  return vec4f(
    near.r + near.a * far.r * (1.0 - through),
    near.g + near.a * (far.g + far.r * through),
    max(through, far.b),
    near.a * far.a,
  );
}

fn rc_bilinear_weights(fraction: vec2f) -> vec4f {
  let f = clamp(fraction, vec2f(0.0), vec2f(1.0));
  return vec4f(
    (1.0 - f.x) * (1.0 - f.y),
    f.x * (1.0 - f.y),
    (1.0 - f.x) * f.y,
    f.x * f.y,
  );
}

fn rc_clamp_probe(probe: vec2f, grid: vec2f) -> vec2f {
  return clamp(probe, vec2f(0.0), grid - vec2f(1.0));
}

struct Cascade {
  /** x: nivå, y: om det finnes en cascade over, zw: scenestørrelse i piksler. */
  state: vec4f,
};

@group(0) @binding(0) var<uniform> rc: Cascade;
@group(0) @binding(1) var<uniform> light: Light;
@group(0) @binding(2) var sdf_tex: texture_2d<f32>;
@group(0) @binding(3) var sdf_samp: sampler;
@group(0) @binding(4) var upper_tex: texture_2d<f32>;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let atlas_size = vec2f(textureDimensions(upper_tex));
  let scene_size = rc.state.zw;
  let cascade = rc.state.x;
  let texel = floor(uv * atlas_size);
  let block = rc_block_size(cascade);
  let rays = rc_ray_count(cascade);
  let decoded = rc_atlas_decode(texel, block);
  let probe = decoded.xy;
  let direction_index = decoded.z;

  let spacing = rc_probe_spacing(cascade);
  let origin = rc_probe_origin(probe, spacing);
  let direction = rc_direction(direction_index, rays);

  var radiance = sphere_trace(
    sdf_tex,
    sdf_samp,
    scene_size,
    light,
    origin,
    direction,
    rc_interval_start(cascade),
    rc_interval_end(cascade),
  );

  if (rc.state.y > 0.5) {
    let upper_block = block * 2.0;
    let upper_spacing = spacing * 2.0;
    let upper_grid = atlas_size / upper_block;

    // Hvor proben sitter i nivået overs probe-rutenett. -0.5 gjør probesentre om til et
    // gitter de bilineære vektene kan interpolere mellom.
    let position = origin / upper_spacing - 0.5;
    let base = floor(position);
    let weights = rc_bilinear_weights(position - base);
    var weight_array = array<f32, 4>(
      weights.x,
      weights.y,
      weights.z,
      weights.w,
    );

    var far = vec4f(0.0);
    for (var branch = 0; branch < 4; branch = branch + 1) {
      // De fire retningene i nivået over som deler opp denne.
      let upper_direction = direction_index * 4.0 + f32(branch);
      var interpolated = vec4f(0.0);
      for (var corner = 0; corner < 4; corner = corner + 1) {
        let offset = vec2f(f32(corner % 2), f32(corner / 2));
        // Klamp i probe-rom: atlaset fletter retninger, så en klamp i texel-rom ville hentet
        // en annen retning fra motsatt kant og lekket lys.
        let neighbour = rc_clamp_probe(base + offset, upper_grid);
        let coord = rc_atlas_texel(neighbour, upper_direction, upper_block);
        interpolated +=
          weight_array[corner] * textureLoad(upper_tex, vec2i(coord), 0);
      }
      // Flett først, snitt etterpå: hver barneretning flettes som en hel stråle, så skygger
      // overlever i stedet for å bli forhåndsuskarpe.
      far += interpolated * RC_BRANCH_WEIGHT;
    }
    radiance = rc_merge(radiance, far);
  }

  return radiance;
}
