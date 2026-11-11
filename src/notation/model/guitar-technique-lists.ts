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
  [GuitarTechniqueType.Tap]: false,
  [GuitarTechniqueType.Accent]: false,
};

/**
 * Techniques a dead note can keep. Tie validity is checked by the tie rules,
 * so a dead note does not remove it here.
 */
export const TECHNIQUE_ALLOWED_ON_DEAD_NOTES: Record<
  GuitarTechniqueType,
  boolean
> = {
  [GuitarTechniqueType.Bend]: false,
  [GuitarTechniqueType.Legato]: false,
  [GuitarTechniqueType.LetRing]: false,
  [GuitarTechniqueType.NaturalHarmonic]: false,
  [GuitarTechniqueType.PalmMute]: true,
  [GuitarTechniqueType.PinchHarmonic]: false,
  [GuitarTechniqueType.Slide]: false,
  [GuitarTechniqueType.Vibrato]: false,
  [GuitarTechniqueType.Tie]: true,
  [GuitarTechniqueType.Tap]: false,
  [GuitarTechniqueType.Accent]: true,
};

/** Techniques that mark a new attack, so a tie continuation cannot have them. */
export const ATTACK_TECHNIQUES: Set<GuitarTechniqueType> = new Set([
  GuitarTechniqueType.Tap,
  GuitarTechniqueType.Accent,
]);

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
  [GuitarTechniqueType.Tap]: [GuitarTechniqueType.Tap],
  [GuitarTechniqueType.Accent]: [GuitarTechniqueType.Accent],
};

export const TRANSITIONAL_TECHNIQUES: Set<GuitarTechniqueType> = new Set([
  GuitarTechniqueType.Slide,
  GuitarTechniqueType.Legato,
]);
