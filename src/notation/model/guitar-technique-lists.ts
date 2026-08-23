import { BendType } from "./bend-type";
import { GuitarTechniqueType } from "./technique-type";

export const BEND_TYPE_INCOMPATIBILITY: Record<
  BendType,
  GuitarTechniqueType[]
> = {
  [BendType.Bend]: [],
  [BendType.BendAndRelease]: [],
  [BendType.Hold]: [],
  [BendType.Prebend]: [GuitarTechniqueType.LetRing],
  [BendType.PrebendAndRelease]: [GuitarTechniqueType.LetRing],
  [BendType.PrebendBend]: [GuitarTechniqueType.LetRing],
  [BendType.Release]: [],
};

/**
 * Techniques incompatibility mapping
 */
export const TECHNIQUES_INCOMPATIBILITY: Record<
  GuitarTechniqueType,
  GuitarTechniqueType[]
> = {
  [GuitarTechniqueType.Bend]: [
    GuitarTechniqueType.Bend,
    GuitarTechniqueType.Legato,
    GuitarTechniqueType.NaturalHarmonic,
    GuitarTechniqueType.Slide,
  ],
  [GuitarTechniqueType.Legato]: [
    GuitarTechniqueType.Legato,
    GuitarTechniqueType.NaturalHarmonic,
    GuitarTechniqueType.Slide,
  ],
  [GuitarTechniqueType.LetRing]: [
    GuitarTechniqueType.LetRing,
    GuitarTechniqueType.PalmMute,
  ],
  [GuitarTechniqueType.NaturalHarmonic]: [
    GuitarTechniqueType.Bend,
    GuitarTechniqueType.Legato,
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
    GuitarTechniqueType.Legato,
    GuitarTechniqueType.NaturalHarmonic,
    GuitarTechniqueType.Slide,
  ],
  [GuitarTechniqueType.Vibrato]: [
    GuitarTechniqueType.NaturalHarmonic,
    GuitarTechniqueType.Vibrato,
  ],
};

export const TRANSITIONAL_TECHNIQUES: Set<GuitarTechniqueType> = new Set([
  GuitarTechniqueType.Slide,
  GuitarTechniqueType.Legato,
]);
