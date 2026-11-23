import { Note } from "./note";
import { TechniqueType } from "./technique-type";

/**
 * Note level technique
 */
export interface Technique {
  /** Unique model identifier. */
  readonly uuid: number;
  /** Kind of note-level technique. */
  readonly type: TechniqueType;
  /** Owning note. */
  readonly note: Note;

  /**
   * Copies technique data for the supplied note, or the current note by default.
   * @throws If copied technique options fail validation.
   */
  deepCopy(note?: Note): Technique;
}
