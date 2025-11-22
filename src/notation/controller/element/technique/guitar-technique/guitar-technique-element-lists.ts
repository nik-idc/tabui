import { GuitarTechniqueType } from "@/notation/model";

/**
 * If the value is true, then the technique requires labels
 * If false, then no labels needed
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
