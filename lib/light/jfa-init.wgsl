// Starter jump flood-en: hver bokstav-texel peker på seg selv, alt annet er tomt. Frøene er
// absolutte pikselsentre i et rgba32float-target — f16 klarer ikke en 2560 bred koordinat
// eksakt, og et frø som bommer med én texel blir lys som lekker gjennom en vegg.
// Fra vgpu sitt radiance-cascades-eksempel (MIT); leser bokstavmasken i stedet for emittere.

@group(0) @binding(0) var mask: texture_2d<f32>;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let size = vec2f(textureDimensions(mask));
  let pixel = clamp(floor(uv * size), vec2f(0.0), size - 1.0);
  let coverage = textureLoad(mask, vec2i(pixel), 0).a;
  if (coverage > 0.5) {
    return vec4f(pixel + 0.5, 0.0, 1.0);
  }
  return vec4f(0.0);
}
