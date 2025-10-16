import { GuitarEffectType } from "../../../models/index";

/**
 * If the value is true, then the effect requires labels
 * If false, then no labels needed
 */
export const EFFECT_TYPE_TO_LABEL = {
  [GuitarEffectType.Bend]: true,
  [GuitarEffectType.BendAndRelease]: true,
  [GuitarEffectType.Prebend]: true,
  [GuitarEffectType.PrebendAndRelease]: true,
  [GuitarEffectType.Vibrato]: true,
  [GuitarEffectType.Slide]: false,
  [GuitarEffectType.HammerOnOrPullOff]: false,
  [GuitarEffectType.PinchHarmonic]: false,
  [GuitarEffectType.NaturalHarmonic]: false,
  [GuitarEffectType.PalmMute]: true,
};
