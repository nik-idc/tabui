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
  /** Continues the preceding beat's same-string note without a new attack. */
  Tie,
  /** Picking-hand tap, shown as a "T" above the beat. */
  Tap,
  /** Louder attack; its options choose a normal (">") or heavy ("^") accent. */
  Accent,
}

/**
 * All supported types of musical techniques
 */
export type TechniqueType = GuitarTechniqueType;
