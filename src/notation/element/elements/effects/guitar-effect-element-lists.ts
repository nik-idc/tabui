import { GuitarTechniqueType } from "@/notation/model";

/**
 * If the value is true, then the technique requires labels
 * If false, then no labels needed
 */
export const TECHNIQUE_TYPE_TO_LABEL = {
  [GuitarTechniqueType.Bend]: true,
  [GuitarTechniqueType.BendAndRelease]: true,
  [GuitarTechniqueType.Prebend]: true,
  [GuitarTechniqueType.PrebendAndRelease]: true,
  [GuitarTechniqueType.Vibrato]: true,
  [GuitarTechniqueType.Slide]: false,
  [GuitarTechniqueType.HammerOnOrPullOff]: false,
  [GuitarTechniqueType.PinchHarmonic]: false,
  [GuitarTechniqueType.NaturalHarmonic]: false,
  [GuitarTechniqueType.PalmMute]: true,
};
