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
}
