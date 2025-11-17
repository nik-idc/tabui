/**
 * Bend options data
 */
export type BendOptionsData = {
  bendPitch?: number;
  releasePitch?: number;
  holdPitch?: number;
  prebendPitch?: number;
  bendDuration?: number;
};

/** Bend options JSON format */
export type BendOptionsJSON = BendOptionsData;

/**
 * Class that represents guitar technique bendOptions
 */
export class BendTechniqueOptions {
  readonly bendPitch?: number;
  readonly releasePitch?: number;
  readonly holdPitch?: number;
  readonly prebendPitch?: number;
  readonly bendDuration?: number;

  /**
   * Class that represents bend options
   * @param options Options
   */
  constructor(options: BendOptionsData = {}) {
    this.bendPitch = options.bendPitch;
    this.releasePitch = options.releasePitch;
    this.holdPitch = options.holdPitch;
    this.prebendPitch = options.prebendPitch;
    this.bendDuration = options.bendDuration;
  }

  /**
   * Serializes bend options to JSON
   * @returns Bend options in JSON format
   */
  public toJSON(): BendOptionsJSON {
    return {
      bendPitch: this.bendPitch,
      releasePitch: this.releasePitch,
      holdPitch: this.holdPitch,
      prebendPitch: this.prebendPitch,
      bendDuration: this.bendDuration,
    };
  }

  /**
   * Validate bend options object
   * @param obj Bend options object
   * @returns Bend options JSON format
   */
  static validateBendOptions(obj: Record<string, unknown>): BendOptionsJSON {
    if (
      obj.bendPitch === undefined &&
      obj.releasePitch === undefined &&
      obj.holdPitch === undefined &&
      obj.prebendPitch === undefined &&
      obj.bendDuration === undefined
    ) {
      throw Error("Invalid js object to parse to guitar technique options");
    }

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value !== "number" && value !== null) {
        throw new Error(`Invalid '${key}': expected number or null`);
      }
    }

    return {
      bendPitch: obj.bendPitch as number | undefined,
      releasePitch: obj.releasePitch as number | undefined,
      holdPitch: obj.holdPitch as number | undefined,
      prebendPitch: obj.prebendPitch as number | undefined,
      bendDuration: obj.bendDuration as number | undefined,
    };
  }

  /**
   * Parse from object
   * @param obj Object
   * @returns Parsed guitar technique bendOptions
   */
  static fromJSON(obj: Record<string, unknown>): BendTechniqueOptions {
    const options: BendOptionsData =
      BendTechniqueOptions.validateBendOptions(obj);

    return new BendTechniqueOptions(options);
  }
}
