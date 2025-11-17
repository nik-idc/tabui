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

// /**
//  * Maps technique type to possibility of applying it to multiple
//  * notes at the same time
//  */
// export const TECHNIQUE_TYPE_MULTI_NOTE_MAP: Record<TechniqueType, boolean> = {
//   [GuitarTechniqueType.Bend]: true,
//   [GuitarTechniqueType.HammerOnOrPullOff]: true,
//   [GuitarTechniqueType.LetRing]: true,
//   [GuitarTechniqueType.NaturalHarmonic]: true,
//   [GuitarTechniqueType.PalmMute]: true,
//   [GuitarTechniqueType.PinchHarmonic]: false,
//   [GuitarTechniqueType.Slide]: true,
//   [GuitarTechniqueType.Vibrato]: true,
// };
