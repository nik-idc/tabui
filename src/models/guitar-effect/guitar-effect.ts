import { GuitarEffectOptions } from "./guitar-effect-options";
import { GuitarEffectType } from "./guitar-effect-type";
import {
  EFFECT_TYPE_TO_SCOPE,
  OPTIONS_DEMANDING_EFFECTS,
  OPTIONS_PER_EFFECT_TYPE,
} from "./guitar-effect-lists";
import { GuitarEffectScope } from "./guitar-effect-scope";
import { randomInt } from "../../misc/random-int";

/**
 * Class that represents a guitar effect
 */
export class GuitarEffect {
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
  constructor(
    readonly effectType: GuitarEffectType,
    readonly options?: GuitarEffectOptions
  ) {
    // Set effect scope
    this.scope = EFFECT_TYPE_TO_SCOPE[effectType];
    this.uuid = randomInt();

    this.validateOptions();
  }

  /**
   * Validates options
   */
  private validateOptions(): void {
    if (!OPTIONS_DEMANDING_EFFECTS.includes(this.effectType)) {
      if (this.options === undefined) {
        return;
      } else {
        throw Error(
          `Options provided for effect not demanding options. Effect type: ${this.effectType}, options: ${this.options}`
        );
      }
    }

    if (this.options === undefined) {
      throw Error(
        `Option demanding effect without options. Effect type: ${this.effectType}`
      );
    }

    this.stripUndefinedOptions();
    this.ensureCorrectOptions();
  }

  /**
   * Strips undefined keys from options
   */
  private stripUndefinedOptions(): void {
    Object.keys(this.options!).forEach(
      (key) =>
        this.options![key as keyof GuitarEffectOptions] === undefined &&
        delete this.options![key as keyof GuitarEffectOptions]
    );
  }

  /**
   * Ensures the options are correct
   */
  private ensureCorrectOptions(): void {
    const actualKeys = Object.keys(this.options!);
    const expectedKeys = OPTIONS_PER_EFFECT_TYPE[this.effectType];
    const areEqual =
      actualKeys.length === expectedKeys.length &&
      actualKeys.every((key) => expectedKeys.includes(key));

    if (!areEqual) {
      throw Error(
        `Option demanding effect was provided the wrong options: Required options: ${expectedKeys}; provided: ${actualKeys}`
      );
    }
  }

  /**
   * Creates a deep copy of the effect
   * @returns Copy of the effect
   */
  public deepCopy(): GuitarEffect {
    const optionsCopy =
      this.options === undefined
        ? undefined
        : new GuitarEffectOptions(
            this.options.bendPitch,
            this.options.bendReleasePitch,
            this.options.prebendPitch,
            this.options.nextHigher
          );
    return new GuitarEffect(this.effectType, optionsCopy);
  }

  /**
   * Parses guitar effect into simple object
   * @returns Simple parsed object
   */
  public toJSONObj(): Object {
    return {
      effectType: this.effectType,
      options: this.options,
    };
  }

  /**
   * Parses guitar effect into JSON string
   * @returns Parsed JSON string
   */
  public toJSON(): string {
    return JSON.stringify(this.toJSONObj());
  }

  /**
   * Parse from object
   * @param obj Object
   * @returns Parsed guitar effect
   */
  static fromJSON(obj: any): GuitarEffect {
    if (obj.effectType === undefined) {
      throw Error(
        "Invalid js object to parse to guitar effect: no effect type"
      );
    } else if (
      OPTIONS_DEMANDING_EFFECTS.includes(obj.effectType) &&
      obj.options === undefined
    ) {
      throw Error(
        "Invalid js object to parse to guitar effect: effect type demands options, but no option provided"
      );
    } else if (
      !OPTIONS_DEMANDING_EFFECTS.includes(obj.effectType) &&
      obj.options !== undefined
    ) {
      throw Error(
        "Invalid js object to parse to guitar effect: effect type does not demands options, but has them"
      );
    }

    const options =
      obj.options === undefined
        ? undefined
        : GuitarEffectOptions.fromJSON(obj.options);

    return new GuitarEffect(obj.effectType, options);
  }
}
