import { BendType, OPTIONS_PER_BEND_TYPE } from "./bend-type";

export const MAX_BEND_PITCH = 3;

/**
 * Bend options data
 */
export type BendOptionsData = {
  type: BendType;
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
  readonly type: BendType;
  readonly bendPitch?: number;
  readonly releasePitch?: number;
  readonly holdPitch?: number;
  readonly prebendPitch?: number;
  readonly bendDuration?: number;

  /**
   * Class that represents bend options
   * @param options Options
   */
  constructor(options: BendOptionsData) {
    BendTechniqueOptions.ensureValid(options);
    this.type = options.type;
    this.bendPitch = options.bendPitch;
    this.releasePitch = options.releasePitch;
    this.holdPitch = options.holdPitch;
    this.prebendPitch = options.prebendPitch;
    this.bendDuration = options.bendDuration;
  }

  public get terminalPitch(): number | undefined {
    switch (this.type) {
      case BendType.Bend:
      case BendType.PrebendBend:
        return this.bendPitch;
      case BendType.Hold:
        return this.holdPitch;
      case BendType.Prebend:
        return this.prebendPitch;
      default:
        return undefined;
    }
  }

  private static ensureValid(options: BendOptionsData): void {
    const expectedKeys = OPTIONS_PER_BEND_TYPE[options.type];
    if (expectedKeys === undefined) {
      throw Error("Invalid bend options: unknown bend type");
    }

    for (const key of expectedKeys) {
      if (key === "type") {
        continue;
      }
      const value = options[key];
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw Error(`Invalid bend options: '${key}' must be finite`);
      }
      if (key === "bendDuration") {
        if (value <= 0 || value > 1) {
          throw Error("Invalid bend options: bendDuration must be in (0, 1]");
        }
      } else if (value < 0 || value > MAX_BEND_PITCH) {
        throw Error(
          `Invalid bend options: '${key}' must be between 0 and ${MAX_BEND_PITCH}`
        );
      }
    }

    const suppliedKeys = Object.entries(options)
      .filter(([, value]) => value !== undefined)
      .map(([key]) => key);
    if (
      suppliedKeys.length !== expectedKeys.length ||
      suppliedKeys.some(
        (key) => !expectedKeys.some((expectedKey) => expectedKey === key)
      )
    ) {
      throw Error("Invalid bend options: unexpected value for bend type");
    }
  }

  /**
   * Serializes bend options to JSON
   * @returns Bend options in JSON format
   */
  public toJSON(): BendOptionsJSON {
    return {
      type: this.type,
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
      obj.type === undefined &&
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
      type: obj.type as BendType,
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
