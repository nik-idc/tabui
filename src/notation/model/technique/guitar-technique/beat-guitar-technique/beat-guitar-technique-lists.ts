import { BendTypes } from "../note-guitar-technique";
import { BeatGuitarTechniqueType } from "./beat-guitar-technique-type";

/**
 * Guitar technique incompatibility list type
 */
type IncompatibilityList = {
  [key in BeatGuitarTechniqueType]: BeatGuitarTechniqueType[];
};

/**
 * List of techniques incompatible with each other
 */
export const BEAT_TECHNIQUES_INCOMPATIBILITIES = {
  /**
   * Techniques incompatible with let ring
   */
  LET_RING: [BeatGuitarTechniqueType.LetRing, BeatGuitarTechniqueType.PalmMute],
  /**
   * Techniques incompatible with palm mute
   */
  PALM_MUTE: [
    BeatGuitarTechniqueType.PalmMute,
    BeatGuitarTechniqueType.LetRing,
  ],
  /**
   * Techniques incompatible with vibrato
   */
  VIBRATO: [],
};

/**
 * Techniques incompatibility mapping
 */
export const BEAT_TECHNIQUES_INCOMPATIBILITY: IncompatibilityList = {
  [BeatGuitarTechniqueType.LetRing]: BEAT_TECHNIQUES_INCOMPATIBILITIES.LET_RING,
  [BeatGuitarTechniqueType.PalmMute]:
    BEAT_TECHNIQUES_INCOMPATIBILITIES.PALM_MUTE,
  [BeatGuitarTechniqueType.Vibrato]: BEAT_TECHNIQUES_INCOMPATIBILITIES.VIBRATO,
};
