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

/**
 * If the value is true, then the technique supports having
 * multiple labels for one technique on the same Y-coordinate
 */
export const TECHNIQUE_ALLOWS_STACKING: Record<GuitarTechniqueType, boolean> = {
  [GuitarTechniqueType.Bend]: true,
  [GuitarTechniqueType.Vibrato]: false,
  [GuitarTechniqueType.Slide]: false,
  [GuitarTechniqueType.HammerOnOrPullOff]: false,
  [GuitarTechniqueType.PinchHarmonic]: false,
  [GuitarTechniqueType.NaturalHarmonic]: false,
  [GuitarTechniqueType.PalmMute]: false,
  [GuitarTechniqueType.LetRing]: false,
};

/**
 * Numbers for technique lines:
 * 0: No line
 * 1: Vibrato
 * 2: Palm Mute OR Let Ring (as they are mutually exclusive)
 * 3: Bends (since bends stack)
 */
export type TechLineNumber = 1 | 2 | 3;

/**
 * Maps technique to the number of the tech gap line which the
 * technique should occupy
 */
export const TECHNIQUE_TO_LINE_NUMBER: Record<
  GuitarTechniqueType,
  TechLineNumber | null
> = {
  [GuitarTechniqueType.Slide]: null,
  [GuitarTechniqueType.HammerOnOrPullOff]: null,
  [GuitarTechniqueType.PinchHarmonic]: null,
  [GuitarTechniqueType.NaturalHarmonic]: null,
  [GuitarTechniqueType.Vibrato]: 1,
  [GuitarTechniqueType.PalmMute]: 2,
  [GuitarTechniqueType.LetRing]: 2,
  [GuitarTechniqueType.Bend]: 3,
};

/**
 * True if technique is inline (like a slide line, a nh/ph diamond etc)
 */
export const TECHNIQUE_IS_INLINE: Record<GuitarTechniqueType, boolean> = {
  [GuitarTechniqueType.Bend]: true,
  [GuitarTechniqueType.Vibrato]: false,
  [GuitarTechniqueType.Slide]: true,
  [GuitarTechniqueType.HammerOnOrPullOff]: true,
  [GuitarTechniqueType.PinchHarmonic]: true,
  [GuitarTechniqueType.NaturalHarmonic]: true,
  [GuitarTechniqueType.PalmMute]: false,
  [GuitarTechniqueType.LetRing]: false,
};
