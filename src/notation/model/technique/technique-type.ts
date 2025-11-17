/**
 * All the supported note level guitar techniques
 */
export enum NoteGuitarTechniqueType {
  Bend,
  Slide,
  HammerOnOrPullOff,
  PinchHarmonic,
  NaturalHarmonic,
}

/**
 * All the supported beat level guitar techniques
 */
export enum BeatGuitarTechniqueType {
  LetRing,
  PalmMute,
  Vibrato,
}

/**
 * All supported types of musical techniques
 */
export type TechniqueType = NoteGuitarTechniqueType | BeatGuitarTechniqueType;

/**
 * All supported types of note level techniques
 */
export type NoteTechniqueType = NoteGuitarTechniqueType;

/**
 * All supported types of beat level techniques
 */
export type BeatTechniqueType = BeatGuitarTechniqueType;