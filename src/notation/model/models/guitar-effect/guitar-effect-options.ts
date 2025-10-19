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
  static fromJSON(obj: any): GuitarEffectOptions {
    if (
      obj.bendPitch === undefined &&
      obj.bendReleasePitch === undefined &&
      obj.prebendPitch === undefined &&
      obj.nextHigher === undefined
    ) {
      throw Error("Invalid js object to parse to guitar effect options");
    }

    return new GuitarEffectOptions(
      obj.bendPitch,
      obj.bendReleasePitch,
      obj.prebendPitch,
      obj.nextHigher
    );
  }
}
