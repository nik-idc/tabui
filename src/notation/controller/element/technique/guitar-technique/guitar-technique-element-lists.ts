import { GuitarTechniqueType } from "../../../../model";

/**
 * If the value is true, then the technique supports having
 * multiple labels for one technique on the same Y-coordinate
 */
export const TECHNIQUE_ALLOWS_STACKING: Record<GuitarTechniqueType, boolean> = {
  [GuitarTechniqueType.Tie]: false,
  [GuitarTechniqueType.Bend]: true,
  [GuitarTechniqueType.Vibrato]: false,
  [GuitarTechniqueType.Slide]: false,
  [GuitarTechniqueType.Legato]: false,
  [GuitarTechniqueType.PinchHarmonic]: false,
  [GuitarTechniqueType.NaturalHarmonic]: false,
  [GuitarTechniqueType.PalmMute]: false,
  [GuitarTechniqueType.LetRing]: false,
};

/**
 * Numbers for technique lines:
 * 1: Vibrato
 * 2: Palm Mute
 * 3: Let Ring
 * 4: Bends (since bends stack)
 */
export const TECH_LINE_NUMBERS = [1, 2, 3, 4] as const;

export type TechLineNumber = (typeof TECH_LINE_NUMBERS)[number];

/**
 * Maps technique to the number of the tech gap line which the
 * technique should occupy
 */
export const TECHNIQUE_TO_LINE_NUMBER: Record<
  GuitarTechniqueType,
  TechLineNumber | null
> = {
  [GuitarTechniqueType.Tie]: null,
  [GuitarTechniqueType.Slide]: null,
  [GuitarTechniqueType.Legato]: null,
  [GuitarTechniqueType.PinchHarmonic]: null,
  [GuitarTechniqueType.NaturalHarmonic]: null,
  [GuitarTechniqueType.Vibrato]: 1,
  [GuitarTechniqueType.PalmMute]: 2,
  [GuitarTechniqueType.LetRing]: 3,
  [GuitarTechniqueType.Bend]: 4,
};

/**
 * True if technique is inline (like a slide line, a nh/ph diamond etc)
 */
export const TECHNIQUE_IS_INLINE: Record<GuitarTechniqueType, boolean> = {
  [GuitarTechniqueType.Tie]: true,
  [GuitarTechniqueType.Bend]: true,
  [GuitarTechniqueType.Vibrato]: false,
  [GuitarTechniqueType.Slide]: true,
  [GuitarTechniqueType.Legato]: true,
  [GuitarTechniqueType.PinchHarmonic]: true,
  [GuitarTechniqueType.NaturalHarmonic]: true,
  [GuitarTechniqueType.PalmMute]: false,
  [GuitarTechniqueType.LetRing]: false,
};
