/**
 * Supported guitar techniques. Legato renders a hammer-on or pull-off according to the next beat's same-string pitch.
 */
export enum GuitarTechniqueType {
  Bend,
  Legato,
  LetRing,
  NaturalHarmonic,
  PalmMute,
  PinchHarmonic,
  Slide,
  Vibrato,
}

/**
 * All supported types of musical techniques
 */
export type TechniqueType = GuitarTechniqueType;
