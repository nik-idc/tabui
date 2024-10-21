/**
 * All the supported guitar effects
 */
export enum GuitarEffectType {
  Bend,
  BendAndRelease,
  Prebend,
  PrebendAndRelease,
  Vibrato,
  SlideStart,
  SlideEnd,
  HammerOnStart,
  HammerOnEnd,
  PullOffStart,
  PullOffEnd,
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
    GuitarEffectType.HammerOnStart,
    GuitarEffectType.PullOffEnd,
    GuitarEffectType.NaturalHarmonic,
    GuitarEffectType.SlideStart,
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
    GuitarEffectType.HammerOnStart,
    GuitarEffectType.PullOffEnd,
    GuitarEffectType.NaturalHarmonic,
    GuitarEffectType.SlideStart,
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
    GuitarEffectType.HammerOnStart,
    GuitarEffectType.PullOffEnd,
    GuitarEffectType.NaturalHarmonic,
    GuitarEffectType.SlideStart,
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
    GuitarEffectType.HammerOnStart,
    GuitarEffectType.PullOffEnd,
    GuitarEffectType.NaturalHarmonic,
    GuitarEffectType.SlideStart,
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
    GuitarEffectType.HammerOnStart,
    GuitarEffectType.PullOffEnd,
    GuitarEffectType.NaturalHarmonic,
    GuitarEffectType.SlideStart,
  ],
  /**
   * Effects incompatible with start of a slide
   */
  [GuitarEffectType.SlideStart]: [
    GuitarEffectType.SlideStart,
    GuitarEffectType.Bend,
    GuitarEffectType.BendAndRelease,
    GuitarEffectType.Prebend,
    GuitarEffectType.PrebendAndRelease,
    GuitarEffectType.Vibrato,
    GuitarEffectType.HammerOnStart,
    GuitarEffectType.HammerOnEnd,
    GuitarEffectType.PullOffStart,
    GuitarEffectType.PullOffEnd,
    GuitarEffectType.NaturalHarmonic,
  ],
  /**
   * Effects incompatible with end of a slide
   */
  [GuitarEffectType.SlideEnd]: [
    GuitarEffectType.SlideEnd,
    GuitarEffectType.Bend,
    GuitarEffectType.BendAndRelease,
    GuitarEffectType.Prebend,
    GuitarEffectType.PrebendAndRelease,
    GuitarEffectType.Vibrato,
    GuitarEffectType.HammerOnEnd,
    GuitarEffectType.PullOffEnd,
    GuitarEffectType.NaturalHarmonic,
  ],
  /**
   * Effects incompatible with start of a hammer-on
   */
  [GuitarEffectType.HammerOnStart]: [
    GuitarEffectType.HammerOnStart,
    GuitarEffectType.SlideStart,
    GuitarEffectType.PullOffStart,
    GuitarEffectType.NaturalHarmonic,
  ],
  /**
   * Effects incompatible with end of a hammer-on
   */
  [GuitarEffectType.HammerOnEnd]: [
    GuitarEffectType.HammerOnEnd,
    GuitarEffectType.SlideEnd,
    GuitarEffectType.PullOffEnd,
    GuitarEffectType.NaturalHarmonic,
  ],
  /**
   * Effects incompatible with start of a pull-off
   */
  [GuitarEffectType.PullOffStart]: [
    GuitarEffectType.PullOffStart,
    GuitarEffectType.SlideStart,
    GuitarEffectType.HammerOnStart,
    GuitarEffectType.NaturalHarmonic,
  ],
  /**
   * Effects incompatible with end of a pull-off
   */
  [GuitarEffectType.PullOffEnd]: [
    GuitarEffectType.PullOffEnd,
    GuitarEffectType.SlideEnd,
    GuitarEffectType.HammerOnEnd,
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
    GuitarEffectType.SlideStart,
    GuitarEffectType.SlideEnd,
    GuitarEffectType.HammerOnStart,
    GuitarEffectType.HammerOnEnd,
    GuitarEffectType.PullOffStart,
    GuitarEffectType.PullOffEnd,
  ],
  /**
   * Effects incompatible with palm mute
   */
  [GuitarEffectType.PalmMute]: [GuitarEffectType.PalmMute],
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
   */
  constructor(
    readonly bendPitch?: number,
    readonly bendReleasePitch?: number,
    readonly prebendPitch?: number
  ) {}
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
  ) {}
}
