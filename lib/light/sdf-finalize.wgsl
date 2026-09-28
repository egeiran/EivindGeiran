// Gjør et ferdig frøfelt om til avstand i scene-piksler. Kjøres etter begge jump floods:
// først skrives avstanden inn til glasset (R), så leses den tilbake via `previous` mens
// avstanden ut av glasset legges i G. rgba16float fordi traceren trenger bilineær filtrering.
// Tilpasset fra vgpu sitt radiance-cascades-eksempel (MIT).

struct Finalize {
  /** x: 1 i andre runde — behold R fra `previous` og skriv avstanden til G. */
  inside: vec4f,
};

@group(0) @binding(0) var<uniform> finalize: Finalize;
@group(0) @binding(1) var seeds: texture_2d<f32>;
@group(0) @binding(2) var previous: texture_2d<f32>;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let size = vec2f(textureDimensions(seeds));
  let pixel = clamp(floor(uv * size), vec2f(0.0), size - 1.0);
  let seed = textureLoad(seeds, vec2i(pixel), 0);
  let far = length(size) * 2.0;
  let distance_px = select(far, distance(seed.xy, pixel + 0.5), seed.w >= 0.5);
  if (finalize.inside.x > 0.5) {
    return vec4f(textureLoad(previous, vec2i(pixel), 0).r, distance_px, 0.0, 1.0);
  }
  return vec4f(distance_px, 0.0, 0.0, 1.0);
}
