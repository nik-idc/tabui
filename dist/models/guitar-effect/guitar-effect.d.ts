import { GuitarEffectOptions } from "./guitar-effect-options";
import { GuitarEffectType } from "./guitar-effect-type";
import { GuitarEffectScope } from "./guitar-effect-scope";
/**
 * Class that represents a guitar effect
 */
export declare class GuitarEffect {
    readonly effectType: GuitarEffectType;
    readonly options?: GuitarEffectOptions | undefined;
    /**
     * Effect's scope
     */
    readonly scope: GuitarEffectScope;
    /**
     * Global unique identifier
     */
    readonly uuid: number;
    /**
     * Class that represents a guitar effect
     * @param effectType Type of effect
     * @param options Options (for bend)
     */
    constructor(effectType: GuitarEffectType, options?: GuitarEffectOptions | undefined);
    /**
     * Validates options
     */
    private validateOptions;
    /**
     * Strips undefined keys from options
     */
    private stripUndefinedOptions;
    /**
     * Ensures the options are correct
     */
    private ensureCorrectOptions;
    /**
     * Creates a deep copy of the effect
     * @returns Copy of the effect
     */
    deepCopy(): GuitarEffect;
    /**
     * Parse from object
     * @param obj Object
     * @returns Parsed guitar effect
     */
    static fromObject(obj: any): GuitarEffect;
}
