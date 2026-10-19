import { BendType, OPTIONS_PER_BEND_TYPE } from "./bend-type";

/** Maximum bend value: 3 whole tones in the UI. Playback currently treats bend values as semitones. */
export const MAX_BEND_PITCH = 3;

/**
 * Bend-shape data; the selected shape requires specific pitch fields and, except Prebend, bendDuration.
 * Required pitches must be finite in 0–3 and duration in (0, 1]; extra defined fields are rejected.
 * Required fields, in addition to type:
 * - Bend: bendPitch, bendDuration.
 * - BendAndRelease: bendPitch, releasePitch, bendDuration.
 * - Hold: holdPitch, bendDuration.
 * - Prebend: prebendPitch.
 * - PrebendAndRelease: prebendPitch, releasePitch, bendDuration.
 * - PrebendBend: prebendPitch, bendPitch, bendDuration.
 * - Release: releasePitch, bendDuration.
 */
export type BendOptionsData = {
  /** Shape determining which other fields are required; unused fields must be omitted. */
  type: BendType;
  /** Bent displacement in UI whole tones, from 0 through MAX_BEND_PITCH. */
  bendPitch?: number;
  /** Release displacement in UI whole tones, from 0 through MAX_BEND_PITCH. */
  releasePitch?: number;
  /** Held displacement in UI whole tones, from 0 through MAX_BEND_PITCH. */
  holdPitch?: number;
  /** Initial displacement in UI whole tones, from 0 through MAX_BEND_PITCH. */
  prebendPitch?: number;
  /** Fraction of the note used by the bend motion, greater than 0 and at most 1. */
  bendDuration?: number;
};

/**
 * Validated bend-shape parameters copied from input data.
 */
export class BendTechniqueOptions {
  /** Bend shape controlling the required option fields. */
  readonly type: BendType;
  /** Bent displacement in UI whole tones, when required by the shape. */
  readonly bendPitch?: number;
  /** Release displacement in UI whole tones, when required by the shape. */
  readonly releasePitch?: number;
  /** Held displacement in UI whole tones, when required by the shape. */
  readonly holdPitch?: number;
  /** Initial displacement in UI whole tones, when required by the shape. */
  readonly prebendPitch?: number;
  /** Bend-motion fraction of the note in (0, 1], when required by the shape. */
  readonly bendDuration?: number;

  /**
   * Validates and copies bend-shape fields.
   * @param options Fields required by the selected shape; unused fields must be absent or undefined.
   * @throws If the type is unknown, required numbers are missing/non-finite, pitches are outside 0–3, duration is outside (0, 1], or extra fields are defined.
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

  /** Final displacement in UI whole tones for Bend, PrebendBend, Hold, or Prebend; undefined for other shapes. */
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
