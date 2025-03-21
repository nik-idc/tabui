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
