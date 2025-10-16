import { GuitarEffectScope } from "./guitar-effect-scope";
import { GuitarEffectType } from "./guitar-effect-type";
/**
 * Guitar effect incompatibility list type
 */
type IncompatibilityList = {
    [key in GuitarEffectType]: GuitarEffectType[];
};
/**
 * List of effects incompatible with each other
 */
export declare const EFFECTS_INCOMPATIBILITIES: {
    /**
     * Effects incompatible with all kinds of bends
     */
    BEND: GuitarEffectType[];
    /**
     * Effects incompatible with vibrato
     */
    VIBRATO: GuitarEffectType[];
    /**
     * Effects incompatible with start of a slide
     */
    SLIDE: GuitarEffectType[];
    /**
     * Effects incompatible with start of a hammer-on
     */
    HAMMER_ON_PULL_OFF: GuitarEffectType[];
    /**
     * Effects incompatible with pinch harmonic
     */
    PINCH_HARMONIC: GuitarEffectType[];
    /**
     * Effects incompatible with natural harmonic
     */
    NATURAL_HARMONIC: GuitarEffectType[];
    /**
     * Effects incompatible with palm mute
     */
    PALM_MUTE: GuitarEffectType[];
};
/**
 * Effects incompatibility mapping
 */
export declare const EFFECTS_INCOMPATIBILITY: IncompatibilityList;
/**
 * Effects that require options
 */
export declare const OPTIONS_DEMANDING_EFFECTS: GuitarEffectType[];
/**
 * Options per guitar effect (order matters due to how
 * 'GuitarEffectOptions' c-tor works)
 */
export declare const OPTIONS_PER_EFFECT_TYPE: {
    0: string[];
    1: string[];
    2: string[];
    3: string[];
    4: string[];
    5: string[];
    6: string[];
    7: string[];
    8: string[];
    9: string[];
};
/**
 * Maps the effect type to its scope
 */
export declare const EFFECT_TYPE_TO_SCOPE: {
    0: GuitarEffectScope;
    1: GuitarEffectScope;
    2: GuitarEffectScope;
    3: GuitarEffectScope;
    4: GuitarEffectScope;
    5: GuitarEffectScope;
    6: GuitarEffectScope;
    7: GuitarEffectScope;
    8: GuitarEffectScope;
    9: GuitarEffectScope;
};
export {};
