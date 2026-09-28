// Lyskilden alle passene deler: én skive som følger pekeren. Ligger i en delt uniform, så
// posisjonen skrives én gang per frame i stedet for én gang per cascade.

export struct Light {
  /** Sentrum i scene-piksler. */
  pos: vec2f,
  /** Radius i scene-piksler. */
  radius: f32,
  /** Global eksponering: intro-flimmer og fade når heroen scrolles ut. */
  exposure: f32,
  /** Lysets egen radians (lineær). */
  color: vec3f,
  /** Scene-piksler per CSS-piksel. */
  scale: f32,
  /** Radians for lys som har gått gjennom glassbokstavene (lineær): glassets farge. */
  tint: vec3f,
  /** Hvor mye glasset absorberer per scene-piksel det lyset går gjennom (Beer–Lambert). */
  absorb: f32,
};
