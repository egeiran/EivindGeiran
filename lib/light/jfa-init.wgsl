// Starter jump flood-en. Kjøres to ganger: med invert = 0 er bokstav-texlene frø (avstand
// utenfra inn til glasset), med invert = 1 er tomrommet frø (avstand innenfra ut av glasset,
// som traceren trenger for å vite hvor tykt glasset er). Frøene er absolutte pikselsentre i
// et rgba32float-target — f16 klarer ikke en 2560 bred koordinat eksakt.
// Fra vgpu sitt radiance-cascades-eksempel (MIT); leser bokstavmasken i stedet for emittere.

struct JfaInit {
  /** x: 1 for å så frø i tomrommet i stedet for i bokstavene. */
  invert: vec4f,
};

@group(0) @binding(0) var<uniform> init: JfaInit;
@group(0) @binding(1) var mask: texture_2d<f32>;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let size = vec2f(textureDimensions(mask));
  let pixel = clamp(floor(uv * size), vec2f(0.0), size - 1.0);
  let glyph = textureLoad(mask, vec2i(pixel), 0).a > 0.5;
  if (glyph != (init.invert.x > 0.5)) {
    return vec4f(pixel + 0.5, 0.0, 1.0);
  }
  return vec4f(0.0);
}
