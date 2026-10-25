import { BendType } from "./bend-type";
import { GuitarTechniqueType } from "./technique-type";

/** Local storage eligibility for empty guitar-note slots; passage support is checked separately. */
export const TECHNIQUE_ALLOWED_ON_EMPTY_NOTES: Record<
  GuitarTechniqueType,
  boolean
> = {
  [GuitarTechniqueType.Bend]: false,
  [GuitarTechniqueType.Legato]: false,
  [GuitarTechniqueType.LetRing]: true,
  [GuitarTechniqueType.NaturalHarmonic]: false,
  [GuitarTechniqueType.PalmMute]: false,
  [GuitarTechniqueType.PinchHarmonic]: false,
  [GuitarTechniqueType.Slide]: false,
  [GuitarTechniqueType.Vibrato]: false,
  [GuitarTechniqueType.Tie]: false,
};

export const BEND_TYPE_INCOMPATIBILITY: Record<
  BendType,
  GuitarTechniqueType[]
> = {
  [BendType.Bend]: [],
  [BendType.BendAndRelease]: [],
  [BendType.Hold]: [],
  [BendType.Prebend]: [GuitarTechniqueType.Tie],
  [BendType.PrebendAndRelease]: [GuitarTechniqueType.Tie],
  [BendType.PrebendBend]: [GuitarTechniqueType.Tie],
  [BendType.Release]: [],
};

/**
 * Techniques incompatibility mapping
 */
export const TECHNIQUES_INCOMPATIBILITY: Record<
  GuitarTechniqueType,
  GuitarTechniqueType[]
> = {
  [GuitarTechniqueType.Tie]: [GuitarTechniqueType.Tie],
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
