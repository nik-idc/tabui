/**
 * All the supported guitar effects
 */
export enum GuitarEffectType {
  Bend,
  BendAndRelease,
  Prebend,
  PrebendAndRelease,
  Vibrato,
  Slide,
  HammerOnOrPullOff,
  PinchHarmonic,
  NaturalHarmonic,
  PalmMute,
}

/**
 * Guitar effect incompatibility list type
 */
type IncompatibilityList = {
  [key in GuitarEffectType]: GuitarEffectType[];
};

/**
 * Effects incompatibility object
 */
export const effectsIncompatibility: IncompatibilityList = {
  /**
   * Effects incompatible with bend
   */
  [GuitarEffectType.Bend]: [
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
   * Effects incompatible with bend & release
   */
  [GuitarEffectType.BendAndRelease]: [
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
   * Effects incompatible with prebend
   */
  [GuitarEffectType.Prebend]: [
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
   * Effects incompatible with prebend & release
   */
  [GuitarEffectType.PrebendAndRelease]: [
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
  [GuitarEffectType.Vibrato]: [
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
  [GuitarEffectType.Slide]: [
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
  [GuitarEffectType.HammerOnOrPullOff]: [
    GuitarEffectType.HammerOnOrPullOff,
    GuitarEffectType.Slide,
    GuitarEffectType.NaturalHarmonic,
  ],
  /**
   * Effects incompatible with pinch harmonic
   */
  [GuitarEffectType.PinchHarmonic]: [
    GuitarEffectType.NaturalHarmonic,
    GuitarEffectType.PinchHarmonic,
  ],
  /**
   * Effects incompatible with natural harmonic
   */
  [GuitarEffectType.NaturalHarmonic]: [
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
  [GuitarEffectType.PalmMute]: [GuitarEffectType.PalmMute],
};

/**
 * Effects that are applicable to multiple notes/chords at once
 */
export const applyToMultipleEffects = [
  GuitarEffectType.Vibrato,
  // GuitarEffectType.Slide,
  // GuitarEffectType.SlideEnd,
  // GuitarEffectType.HammerOn,
  // GuitarEffectType.HammerOnEnd,
  // GuitarEffectType.PullOffStart,
  // GuitarEffectType.PullOff,
  GuitarEffectType.PalmMute,
];

/**
 * Effects that require options
 */
export const optionsDemandingEffects = [
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
export const optionsPerEffectType = {
  [GuitarEffectType.Bend]: ["bendPitch"],
  [GuitarEffectType.BendAndRelease]: ["bendPitch", "bendReleasePitch"],
  [GuitarEffectType.Prebend]: ["prebendPitch"],
  [GuitarEffectType.PrebendAndRelease]: ["bendReleasePitch", "prebendPitch"],
  [GuitarEffectType.Vibrato]: [],
  [GuitarEffectType.Slide]: ["nextHigher"],
  [GuitarEffectType.HammerOnOrPullOff]: [],
  [GuitarEffectType.PinchHarmonic]: [],
  [GuitarEffectType.NaturalHarmonic]: [],
  [GuitarEffectType.PalmMute]: [],
};

/**
 * Class that represents guitar effect options
 */
export class GuitarEffectOptions {
  /**
   * Class that represents guitar effect options
   * @param bendPitch Bend pitch
   * @param bendReleasePitch Bend release pitch
   * @param prebendPitch Prebend pitch
   * @param nextHigher True if slide/HO-PO into a higher note, false otherwise
   */
  constructor(
    readonly bendPitch?: number,
    readonly bendReleasePitch?: number,
    readonly prebendPitch?: number,
    readonly nextHigher?: boolean
  ) {}

  /**
   * Parse from object
   * @param obj Object
   * @returns Parsed guitar effect options
   */
  static fromObject(obj: any): GuitarEffectOptions {
    return new GuitarEffectOptions(
      obj.bendPitch,
      obj.bendReleasePitch,
      obj.prebendPitch
    );
  }
}

/**
 * Class that represents a guitar effect
 */
export class GuitarEffect {
  /**
   * Class that represents a guitar effect
   * @param effectType Type of effect
   * @param options Options (for bend)
   */
  constructor(
    readonly effectType: GuitarEffectType,
    readonly options?: GuitarEffectOptions
  ) {
    // Nothing else to do if the provided effect does not demand effects
    if (!optionsDemandingEffects.includes(effectType)) {
      if (options === undefined) {
        return;
      } else {
        throw Error(
          "Options provided for effect not demanding options. " +
            `Effect type: ${effectType}, options: ${options}`
        );
      }
    }

    // Check if effect has options
    if (options === undefined) {
      throw Error(
        "Option demanding effect without options. " +
          `Effect type: ${effectType}`
      );
    }

    // Strip undefined properties from the options
    Object.keys(options).forEach(
      (key) =>
        options[key as keyof GuitarEffectOptions] === undefined &&
        delete options[key as keyof GuitarEffectOptions]
    );
    const actualKeys = Object.keys(options);
    const expectedKeys = optionsPerEffectType[effectType];
    const areEqual =
      actualKeys.length === expectedKeys.length &&
      actualKeys.every((key) => {
        return expectedKeys.includes(key);
      });

    // Check if provided options are correct for specified effect type
    if (optionsDemandingEffects.includes(effectType)) {
      if (!areEqual) {
        throw Error(
          "Option demanding effect was provided the wrong options: " +
            `Required options: ${expectedKeys}; provided: ${actualKeys}`
        );
      }
    }
  }

  /**
   * Parse from object
   * @param obj Object
   * @returns Parsed guitar effect
   */
  static fromObject(obj: any): GuitarEffect {
    if (obj.effectType === undefined) {
      throw Error(
        "Invalid js object to parse to guitar effect: no effect type"
      );
    } else if (
      optionsDemandingEffects.includes(obj.effectType) &&
      obj.options === undefined
    ) {
      throw Error(
        "Invalid js object to parse to guitar effect: effect type demands options, but no option provided"
      );
    }

    return new GuitarEffect(
      obj.effectType,
      obj.options !== undefined
        ? GuitarEffectOptions.fromObject(obj.options)
        : undefined
    );
  }
}
