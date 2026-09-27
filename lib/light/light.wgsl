// Lyskilden alle passene deler: én skive som følger pekeren. Ligger i en delt uniform, så
// posisjonen skrives én gang per frame i stedet for én gang per cascade.

export struct Light {
  /** Sentrum i scene-piksler. */
  pos: vec2f,
  /** Radius i scene-piksler. */
  radius: f32,
  /** Global eksponering: intro-flimmer og fade når heroen scrolles ut. */
  exposure: f32,
  /** Lineær radians. */
  color: vec3f,
  /** Scene-piksler per CSS-piksel. */
  scale: f32,
  /**
   * Radius på hullet lyset brenner i bokstavene rundt seg, i scene-piksler. Står lyset inni
   * en bokstav, når hullet ut til nærmeste kant, så lyset alltid slipper ut et sted.
   */
  carve: f32,
};
