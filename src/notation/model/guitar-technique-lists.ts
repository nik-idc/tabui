import { GuitarTechniqueType } from "./technique-type";

/**
 * Techniques incompatibility mapping
 */
export const TECHNIQUES_INCOMPATIBILITY: Record<
  GuitarTechniqueType,
  GuitarTechniqueType[]
> = {
  [GuitarTechniqueType.Bend]: [
    GuitarTechniqueType.Bend,
    GuitarTechniqueType.HammerOnOrPullOff,
    GuitarTechniqueType.NaturalHarmonic,
    GuitarTechniqueType.Slide,
  ],
  [GuitarTechniqueType.HammerOnOrPullOff]: [
    GuitarTechniqueType.HammerOnOrPullOff,
    GuitarTechniqueType.NaturalHarmonic,
    GuitarTechniqueType.Slide,
  ],
  [GuitarTechniqueType.LetRing]: [
    GuitarTechniqueType.LetRing,
    GuitarTechniqueType.PalmMute,
  ],
  [GuitarTechniqueType.NaturalHarmonic]: [
    GuitarTechniqueType.Bend,
    GuitarTechniqueType.HammerOnOrPullOff,
    GuitarTechniqueType.NaturalHarmonic,
    GuitarTechniqueType.PinchHarmonic,
    GuitarTechniqueType.Slide,
  ],
  [GuitarTechniqueType.PalmMute]: [
    GuitarTechniqueType.LetRing,
    GuitarTechniqueType.PalmMute,
  ],
  [GuitarTechniqueType.PinchHarmonic]: [
    GuitarTechniqueType.NaturalHarmonic,
    GuitarTechniqueType.PinchHarmonic,
  ],
  [GuitarTechniqueType.Slide]: [
    GuitarTechniqueType.Bend,
    GuitarTechniqueType.HammerOnOrPullOff,
    GuitarTechniqueType.NaturalHarmonic,
    GuitarTechniqueType.Slide,
  ],
  [GuitarTechniqueType.Vibrato]: [
    GuitarTechniqueType.NaturalHarmonic,
    GuitarTechniqueType.Vibrato,
  ],
};
