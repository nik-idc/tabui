import { GuitarEffectOptions } from "./guitar-effect-options";
import { EFFECT_TYPE_TO_SCOPE, OPTIONS_DEMANDING_EFFECTS, OPTIONS_PER_EFFECT_TYPE, } from "./guitar-effect-lists";
import { randomInt } from "../../misc/random-int";
/**
 * Class that represents a guitar effect
 */
export class GuitarEffect {
    effectType;
    options;
    /**
     * Effect's scope
     */
    scope;
    /**
     * Global unique identifier
     */
    uuid;
    /**
     * Class that represents a guitar effect
     * @param effectType Type of effect
     * @param options Options (for bend)
     */
    constructor(effectType, options) {
        this.effectType = effectType;
        this.options = options;
        // Set effect scope
        this.scope = EFFECT_TYPE_TO_SCOPE[effectType];
        this.uuid = randomInt();
        this.validateOptions();
    }
    /**
     * Validates options
     */
    validateOptions() {
        if (!OPTIONS_DEMANDING_EFFECTS.includes(this.effectType)) {
            if (this.options === undefined) {
                return;
            }
            else {
                throw Error(`Options provided for effect not demanding options. Effect type: ${this.effectType}, options: ${this.options}`);
            }
        }
        if (this.options === undefined) {
            throw Error(`Option demanding effect without options. Effect type: ${this.effectType}`);
        }
        this.stripUndefinedOptions();
        this.ensureCorrectOptions();
    }
    /**
     * Strips undefined keys from options
     */
    stripUndefinedOptions() {
        Object.keys(this.options).forEach((key) => this.options[key] === undefined &&
            delete this.options[key]);
    }
    /**
     * Ensures the options are correct
     */
    ensureCorrectOptions() {
        const actualKeys = Object.keys(this.options);
        const expectedKeys = OPTIONS_PER_EFFECT_TYPE[this.effectType];
        const areEqual = actualKeys.length === expectedKeys.length &&
            actualKeys.every((key) => expectedKeys.includes(key));
        if (!areEqual) {
            throw Error(`Option demanding effect was provided the wrong options: Required options: ${expectedKeys}; provided: ${actualKeys}`);
        }
    }
    /**
     * Creates a deep copy of the effect
     * @returns Copy of the effect
     */
    deepCopy() {
        const optionsCopy = this.options === undefined
            ? undefined
            : new GuitarEffectOptions(this.options.bendPitch, this.options.bendReleasePitch, this.options.prebendPitch, this.options.nextHigher);
        return new GuitarEffect(this.effectType, optionsCopy);
    }
    /**
     * Parse from object
     * @param obj Object
     * @returns Parsed guitar effect
     */
    static fromObject(obj) {
        if (obj.effectType === undefined) {
            throw Error("Invalid js object to parse to guitar effect: no effect type");
        }
        else if (OPTIONS_DEMANDING_EFFECTS.includes(obj.effectType) &&
            obj.options === undefined) {
            throw Error("Invalid js object to parse to guitar effect: effect type demands options, but no option provided");
        }
        return new GuitarEffect(obj.effectType, obj.options !== undefined
            ? GuitarEffectOptions.fromObject(obj.options)
            : undefined);
    }
}
//# sourceMappingURL=guitar-effect.js.map