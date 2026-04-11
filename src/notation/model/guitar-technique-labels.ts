import { GuitarTechniqueType } from "./technique-type";

/**
 * Whether a guitar technique requires a dedicated label row above the staff.
 */
export const TECHNIQUE_TYPE_TO_LABEL: Record<GuitarTechniqueType, boolean> = {
  [GuitarTechniqueType.Bend]: true,
  [GuitarTechniqueType.Vibrato]: true,
  [GuitarTechniqueType.Slide]: false,
  [GuitarTechniqueType.HammerOnOrPullOff]: false,
  [GuitarTechniqueType.PinchHarmonic]: false,
  [GuitarTechniqueType.NaturalHarmonic]: false,
  [GuitarTechniqueType.PalmMute]: true,
  [GuitarTechniqueType.LetRing]: true,
};
