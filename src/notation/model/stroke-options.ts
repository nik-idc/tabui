import { NoteDuration } from "./note-duration";
import { fractionToTicks, getBaseDurationFraction } from "./timing";

/**
 * Direction in which a stroke moves across the strings. It follows string
 * order, not pitch, so re-entrant tunings strum like the physical instrument.
 */
export enum StrokeDirection {
  /**
   * From the highest string number (nearest the player's face, usually the
   * lowest-pitched string) toward string 1.
   */
  Down,
  /** From string 1 toward the highest string number. */
  Up,
}

/**
 * Stroke duration ticks per quarter note. 960 is the MIDI and Guitar Pro
 * standard, so a 64th note (60 ticks) and triplet values are exact integers.
 */
export const STROKE_TICKS_PER_QUARTER = 960;

/** Stroke duration ticks per whole note, the resolution unit of the timing helpers. */
const STROKE_TICK_RESOLUTION = 4 * STROKE_TICKS_PER_QUARTER;

/** Converts a written note value to stroke duration ticks. */
function noteDurationToStrokeTicks(duration: NoteDuration): number {
  return fractionToTicks(
    getBaseDurationFraction(duration),
    STROKE_TICK_RESOLUTION
  );
}

/** Stroke duration of a 64th note, in stroke ticks. */
export const STROKE_DURATION_SIXTY_FOURTH = noteDurationToStrokeTicks(
  NoteDuration.SixtyFourth
);
/** Stroke duration of a 16th note, in stroke ticks. */
export const STROKE_DURATION_SIXTEENTH = noteDurationToStrokeTicks(
  NoteDuration.Sixteenth
);
/** Stroke duration of an 8th note, in stroke ticks. */
export const STROKE_DURATION_EIGHTH = noteDurationToStrokeTicks(
  NoteDuration.Eighth
);
/** Stroke duration of a quarter note, in stroke ticks. */
export const STROKE_DURATION_QUARTER = noteDurationToStrokeTicks(
  NoteDuration.Quarter
);
/** Stroke duration of a half note, in stroke ticks. */
export const STROKE_DURATION_HALF = noteDurationToStrokeTicks(
  NoteDuration.Half
);

/** Shortest allowed stroke duration (a 64th note), in stroke ticks. */
export const MIN_STROKE_DURATION = STROKE_DURATION_SIXTY_FOURTH;
/** Longest allowed stroke duration (a half note), in stroke ticks. */
export const MAX_STROKE_DURATION = STROKE_DURATION_HALF;

/**
 * Duration used when a stroke is added without settings, such as by a
 * toggle: a 16th note, a common strum speed.
 */
export const DEFAULT_STROKE_DURATION = STROKE_DURATION_SIXTEENTH;

/** Alignment where the first string sounds on the beat; the default. */
export const STROKE_ALIGNMENT_STARTS_ON_TIME = 0;
/** Alignment where the last string sounds on the beat. */
export const STROKE_ALIGNMENT_FALLS_ON_TIME = 100;

/** Raw stroke settings; validated by StrokeOptions. */
export type StrokeOptionsData = {
  /** Stroke direction. */
  direction: StrokeDirection;
  /**
   * Time used to spread the stroke's notes, as an integer count of stroke
   * ticks (STROKE_TICKS_PER_QUARTER per quarter note), from
   * MIN_STROKE_DURATION to MAX_STROKE_DURATION inclusive.
   */
  duration: number;
  /**
   * Integer percent of the stroke that sounds before the beat time, from
   * STROKE_ALIGNMENT_STARTS_ON_TIME (0, first string on the beat) to
   * STROKE_ALIGNMENT_FALLS_ON_TIME (100, last string on the beat).
   * Defaults to STROKE_ALIGNMENT_STARTS_ON_TIME.
   */
  alignment?: number;
};

/** Keys allowed in stroke option data. */
const STROKE_OPTION_KEYS = [
  "direction",
  "duration",
  "alignment",
] as const satisfies readonly (keyof StrokeOptionsData)[];

/** Returns true for a number that is a StrokeDirection member. */
function isStrokeDirection(value: unknown): value is StrokeDirection {
  return (
    // A numeric enum also maps member names, so allow only numeric keys.
    typeof value === "number" && value in StrokeDirection
  );
}

/** Returns true for an integer within the inclusive bounds. */
function isIntegerInRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

/** Validated, immutable stroke settings copied from input data. */
export class StrokeOptions {
  /** Stroke direction. */
  readonly direction: StrokeDirection;
  /** Time used to spread the stroke's notes, in stroke ticks. */
  readonly duration: number;
  /** Percent of the stroke that sounds before the beat time; 0 starts on time, 100 falls on time. */
  readonly alignment: number;

  /**
   * Validates and copies stroke settings.
   * @throws If the direction is unknown, the duration or alignment is not an integer in range, or extra keys are present.
   */
  constructor(options: StrokeOptionsData) {
    const hasUnexpectedKey = Object.keys(options).some(
      (k) => !STROKE_OPTION_KEYS.some((key) => key === k)
    );
    if (hasUnexpectedKey) {
      throw Error("Invalid stroke options: unexpected key");
    }
    const { direction, duration } = options;
    const alignment = options.alignment ?? STROKE_ALIGNMENT_STARTS_ON_TIME;
    if (!isStrokeDirection(direction)) {
      throw Error("Invalid stroke options: unknown direction");
    }
    if (!isIntegerInRange(duration, MIN_STROKE_DURATION, MAX_STROKE_DURATION)) {
      throw Error(
        `Invalid stroke options: duration must be an integer from ` +
          `${MIN_STROKE_DURATION} to ${MAX_STROKE_DURATION} ticks`
      );
    }
    const isAlignmentValid = isIntegerInRange(
      alignment,
      STROKE_ALIGNMENT_STARTS_ON_TIME,
      STROKE_ALIGNMENT_FALLS_ON_TIME
    );
    if (!isAlignmentValid) {
      throw Error(
        `Invalid stroke options: alignment must be an integer from ` +
          `${STROKE_ALIGNMENT_STARTS_ON_TIME} to ${STROKE_ALIGNMENT_FALLS_ON_TIME}`
      );
    }

    this.direction = direction;
    this.duration = duration;
    this.alignment = alignment;
  }

  /** Returns true when both options have the same direction, duration, and alignment. */
  public equals(other: StrokeOptions): boolean {
    return (
      this.direction === other.direction &&
      this.duration === other.duration &&
      this.alignment === other.alignment
    );
  }
}
