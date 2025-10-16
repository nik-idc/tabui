import { GuitarEffectScope } from "./guitar-effect-scope";
import { GuitarEffectType } from "./guitar-effect-type";
/**
 * List of effects incompatible with each other
 */
export const EFFECTS_INCOMPATIBILITIES = {
    /**
     * Effects incompatible with all kinds of bends
     */
    BEND: [
        GuitarEffectType.Bend,
        GuitarEffectType.BendAndRelease,
        GuitarEffectType.Prebend,
        GuitarEffectType.PrebendAndRelease,
        GuitarEffectType.HammerOnOrPullOff,
        GuitarEffectType.NaturalHarmonic,
        GuitarEffectType.Slide,
        GuitarEffectType.Vibrato,
    ],
    /**
     * Effects incompatible with vibrato
     */
    VIBRATO: [
        GuitarEffectType.Vibrato,
        GuitarEffectType.Bend,
        GuitarEffectType.BendAndRelease,
        GuitarEffectType.Prebend,
        GuitarEffectType.PrebendAndRelease,
        GuitarEffectType.HammerOnOrPullOff,
        GuitarEffectType.NaturalHarmonic,
        GuitarEffectType.Slide,
    ],
    /**
     * Effects incompatible with start of a slide
     */
    SLIDE: [
        GuitarEffectType.Slide,
        GuitarEffectType.Bend,
        GuitarEffectType.BendAndRelease,
        GuitarEffectType.Prebend,
        GuitarEffectType.PrebendAndRelease,
        GuitarEffectType.Vibrato,
        GuitarEffectType.HammerOnOrPullOff,
        GuitarEffectType.NaturalHarmonic,
    ],
    /**
     * Effects incompatible with start of a hammer-on
     */
    HAMMER_ON_PULL_OFF: [
        GuitarEffectType.HammerOnOrPullOff,
        GuitarEffectType.Slide,
        GuitarEffectType.NaturalHarmonic,
    ],
    /**
     * Effects incompatible with pinch harmonic
     */
    PINCH_HARMONIC: [
        GuitarEffectType.NaturalHarmonic,
        GuitarEffectType.PinchHarmonic,
    ],
    /**
     * Effects incompatible with natural harmonic
     */
    NATURAL_HARMONIC: [
        GuitarEffectType.NaturalHarmonic,
        GuitarEffectType.PinchHarmonic,
        GuitarEffectType.Bend,
        GuitarEffectType.BendAndRelease,
        GuitarEffectType.Prebend,
        GuitarEffectType.PrebendAndRelease,
        GuitarEffectType.Vibrato,
        GuitarEffectType.Slide,
        GuitarEffectType.HammerOnOrPullOff,
    ],
    /**
     * Effects incompatible with palm mute
     */
    PALM_MUTE: [GuitarEffectType.PalmMute],
};
/**
 * Effects incompatibility mapping
 */
export const EFFECTS_INCOMPATIBILITY = {
    [GuitarEffectType.Bend]: EFFECTS_INCOMPATIBILITIES.BEND,
    [GuitarEffectType.BendAndRelease]: EFFECTS_INCOMPATIBILITIES.BEND,
    [GuitarEffectType.Prebend]: EFFECTS_INCOMPATIBILITIES.BEND,
    [GuitarEffectType.PrebendAndRelease]: EFFECTS_INCOMPATIBILITIES.BEND,
    [GuitarEffectType.Vibrato]: EFFECTS_INCOMPATIBILITIES.VIBRATO,
    [GuitarEffectType.Slide]: EFFECTS_INCOMPATIBILITIES.SLIDE,
    [GuitarEffectType.HammerOnOrPullOff]: EFFECTS_INCOMPATIBILITIES.HAMMER_ON_PULL_OFF,
    [GuitarEffectType.PinchHarmonic]: EFFECTS_INCOMPATIBILITIES.PINCH_HARMONIC,
    [GuitarEffectType.NaturalHarmonic]: EFFECTS_INCOMPATIBILITIES.NATURAL_HARMONIC,
    [GuitarEffectType.PalmMute]: EFFECTS_INCOMPATIBILITIES.PALM_MUTE,
};
/**
 * Effects that require options
 */
export const OPTIONS_DEMANDING_EFFECTS = [
    GuitarEffectType.Bend,
    GuitarEffectType.BendAndRelease,
    GuitarEffectType.Prebend,
    GuitarEffectType.PrebendAndRelease,
    GuitarEffectType.Slide,
];
/**
 * Options per guitar effect (order matters due to how
 * 'GuitarEffectOptions' c-tor works)
 */
export const OPTIONS_PER_EFFECT_TYPE = {
    [GuitarEffectType.Bend]: ["bendPitch"],
    [GuitarEffectType.BendAndRelease]: ["bendPitch", "bendReleasePitch"],
    [GuitarEffectType.Prebend]: ["prebendPitch"],
    [GuitarEffectType.PrebendAndRelease]: ["bendReleasePitch", "prebendPitch"],
    [GuitarEffectType.Vibrato]: new Array(),
    [GuitarEffectType.Slide]: ["nextHigher"],
    [GuitarEffectType.HammerOnOrPullOff]: new Array(),
    [GuitarEffectType.PinchHarmonic]: new Array(),
    [GuitarEffectType.NaturalHarmonic]: new Array(),
    [GuitarEffectType.PalmMute]: new Array(),
};
/**
 * Maps the effect type to its scope
 */
export const EFFECT_TYPE_TO_SCOPE = {
    [GuitarEffectType.Bend]: GuitarEffectScope.NoteLevelEffect,
    [GuitarEffectType.BendAndRelease]: GuitarEffectScope.NoteLevelEffect,
    [GuitarEffectType.Prebend]: GuitarEffectScope.NoteLevelEffect,
    [GuitarEffectType.PrebendAndRelease]: GuitarEffectScope.NoteLevelEffect,
    [GuitarEffectType.Vibrato]: GuitarEffectScope.PhraseLevelEffect,
    [GuitarEffectType.Slide]: GuitarEffectScope.NoteLevelEffect,
    [GuitarEffectType.HammerOnOrPullOff]: GuitarEffectScope.NoteLevelEffect,
    [GuitarEffectType.PinchHarmonic]: GuitarEffectScope.NoteLevelEffect,
    [GuitarEffectType.NaturalHarmonic]: GuitarEffectScope.NoteLevelEffect,
    [GuitarEffectType.PalmMute]: GuitarEffectScope.PhraseLevelEffect,
};
//# sourceMappingURL=guitar-effect-lists.js.map