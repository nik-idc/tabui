import { NoteGuitarTechniqueType } from "../../technique-type";
import { BendTypes } from "./bend-type";

/**
 * Guitar technique incompatibility list type
 */
type IncompatibilityList = {
  [key in NoteGuitarTechniqueType]: NoteGuitarTechniqueType[];
};

/**
 * List of techniques incompatible with each other
 */
export const NOTE_TECHNIQUES_INCOMPATIBILITIES = {
  /**
   * Techniques incompatible with all kinds of bends
   */
  BEND: [
    NoteGuitarTechniqueType.Bend,
    NoteGuitarTechniqueType.HammerOnOrPullOff,
    NoteGuitarTechniqueType.NaturalHarmonic,
    NoteGuitarTechniqueType.Slide,
  ],
  /**
   * Techniques incompatible with start of a slide
   */
  SLIDE: [
    NoteGuitarTechniqueType.Slide,
    NoteGuitarTechniqueType.Bend,
    NoteGuitarTechniqueType.HammerOnOrPullOff,
    NoteGuitarTechniqueType.NaturalHarmonic,
  ],
  /**
   * Techniques incompatible with start of a hammer-on
   */
  HAMMER_ON_PULL_OFF: [
    NoteGuitarTechniqueType.HammerOnOrPullOff,
    NoteGuitarTechniqueType.Slide,
    NoteGuitarTechniqueType.NaturalHarmonic,
  ],
  /**
   * Techniques incompatible with pinch harmonic
   */
  PINCH_HARMONIC: [
    NoteGuitarTechniqueType.NaturalHarmonic,
    NoteGuitarTechniqueType.PinchHarmonic,
  ],
  /**
   * Techniques incompatible with natural harmonic
   */
  NATURAL_HARMONIC: [
    NoteGuitarTechniqueType.NaturalHarmonic,
    NoteGuitarTechniqueType.PinchHarmonic,
    NoteGuitarTechniqueType.Bend,
    NoteGuitarTechniqueType.Slide,
    NoteGuitarTechniqueType.HammerOnOrPullOff,
  ],
};

/**
 * Techniques incompatibility mapping
 */
export const NOTE_TECHNIQUES_INCOMPATIBILITY: IncompatibilityList = {
  [NoteGuitarTechniqueType.Bend]: NOTE_TECHNIQUES_INCOMPATIBILITIES.BEND,
  [NoteGuitarTechniqueType.Slide]: NOTE_TECHNIQUES_INCOMPATIBILITIES.SLIDE,
  [NoteGuitarTechniqueType.HammerOnOrPullOff]:
    NOTE_TECHNIQUES_INCOMPATIBILITIES.HAMMER_ON_PULL_OFF,
  [NoteGuitarTechniqueType.PinchHarmonic]:
    NOTE_TECHNIQUES_INCOMPATIBILITIES.PINCH_HARMONIC,
  [NoteGuitarTechniqueType.NaturalHarmonic]:
    NOTE_TECHNIQUES_INCOMPATIBILITIES.NATURAL_HARMONIC,
};

/**
 * Options per guitar technique (order matters due to how
 * 'GuitarTechniqueOptions' c-tor works)
 */
export const OPTIONS_PER_BEND_TYPE = {
  [BendTypes.Bend]: ["bendPitch", "bendDuration"],
  [BendTypes.Release]: ["releasePitch", "bendDuration"],
  [BendTypes.BendAndRelease]: ["bendPitch", "releasePitch", "bendDuration"],
  [BendTypes.Hold]: ["holdPitch", "bendDuration"],
  [BendTypes.Prebend]: ["prebendPitch"],
  [BendTypes.PrebendBend]: ["prebendPitch", "bendPitch", "bendDuration"],
  [BendTypes.PrebendAndRelease]: [
    "releasePitch",
    "prebendPitch",
    "bendDuration",
  ],
};

/**
 * Maps technique type to possibility of applying it to multiple
 * notes at the same time
 */
export const TECHNIQUE_TYPE_MULTI_NOTE_MAP = {
  [NoteGuitarTechniqueType.Bend]: false,
  [NoteGuitarTechniqueType.Slide]: true,
  [NoteGuitarTechniqueType.HammerOnOrPullOff]: true,
  [NoteGuitarTechniqueType.PinchHarmonic]: false,
  [NoteGuitarTechniqueType.NaturalHarmonic]: false,
};
