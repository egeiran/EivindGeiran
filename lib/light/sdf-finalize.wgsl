// Gjør det ferdige frøfeltet om til avstandsfeltet sphere-traceren sampler. R er avstanden i
// scene-piksler; rgba16float fordi traceren trenger bilineær filtrering.
// Fra vgpu sitt radiance-cascades-eksempel (MIT), uendret.

@group(0) @binding(0) var seeds: texture_2d<f32>;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let size = vec2f(textureDimensions(seeds));
  let pixel = clamp(floor(uv * size), vec2f(0.0), size - 1.0);
  let seed = textureLoad(seeds, vec2i(pixel), 0);
  let far = length(size) * 2.0;
  let distance_px = select(far, distance(seed.xy, pixel + 0.5), seed.w >= 0.5);
  return vec4f(distance_px, 0.0, 0.0, 1.0);
}
