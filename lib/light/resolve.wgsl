import { rc_atlas_texel, rc_block_size, rc_ray_count } from "./rc-directions.wgsl";
import { Light } from "./light.wgsl";

// Løser cascade 0 opp til irradians: snittet av de fire strålene per probe, én probe per
// scene-piksel. Direkte lys får lysets farge, lys gjennom glasset får glassets. Eget pass så
// present kan sample resultatet bilineært i full skjermoppløsning i stedet for å gjøre fire
// oppslag per nabo-probe for hver skjermpiksel.

struct Resolve {
  /** xy: scenestørrelse i piksler. */
  size: vec4f,
};

@group(0) @binding(0) var<uniform> resolve: Resolve;
@group(0) @binding(1) var<uniform> light: Light;
@group(0) @binding(2) var cascade_tex: texture_2d<f32>;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let block = rc_block_size(0.0);
  let rays = rc_ray_count(0.0);
  let atlas_size = vec2f(textureDimensions(cascade_tex));
  let pixel = uv * resolve.size.xy;
  let probe = clamp(floor(pixel), vec2f(0.0), atlas_size / block - 1.0);
  var total = vec2f(0.0);
  for (var i = 0.0; i < rays; i = i + 1.0) {
    let coord = rc_atlas_texel(probe, i, block);
    total += textureLoad(cascade_tex, vec2i(coord), 0).rg;
  }
  let fraction = total / rays;
  return vec4f(light.color * fraction.x + light.tint * fraction.y, 1.0);
}
