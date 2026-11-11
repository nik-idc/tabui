/** Supported guitar techniques that belong to a whole beat instead of one note. */
export enum BeatGuitarTechniqueType {
  /** Strums all notes of the beat in one direction. */
  Stroke,
}

/** All supported beat-level technique types; kept separate from note technique types. */
export type BeatTechniqueType = BeatGuitarTechniqueType;
