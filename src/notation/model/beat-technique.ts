import type { Beat } from "./beat";
import { BeatTechniqueType } from "./beat-technique-type";

/** Technique that belongs to a whole beat, such as a stroke across all strings. */
export interface BeatTechnique {
  /** Unique model identifier. */
  readonly uuid: number;
  /** Kind of beat-level technique. */
  readonly type: BeatTechniqueType;
  /** Owning beat. */
  readonly beat: Beat;

  /**
   * Copies technique data for the supplied owner beat.
   * @throws If copied options fail validation.
   */
  deepCopy(beat: Beat): BeatTechnique;
}
