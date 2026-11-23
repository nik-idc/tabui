import {
  STROKE_ALIGNMENT_FALLS_ON_TIME,
  STROKE_ALIGNMENT_STARTS_ON_TIME,
  STROKE_DURATION_EIGHTH,
  STROKE_DURATION_HALF,
  STROKE_DURATION_QUARTER,
  STROKE_DURATION_SIXTEENTH,
  STROKE_DURATION_SIXTY_FOURTH,
  StrokeDirection,
  StrokeOptions,
} from "../model";

/** Written note values that name stroke durations, shortest first. */
const STROKE_DURATION_NAMES: ReadonlyArray<[number, string]> = [
  [STROKE_DURATION_SIXTY_FOURTH, "64th note"],
  [STROKE_DURATION_SIXTY_FOURTH * 2, "32nd note"],
  [STROKE_DURATION_SIXTEENTH, "16th note"],
  [STROKE_DURATION_EIGHTH, "8th note"],
  [STROKE_DURATION_QUARTER, "quarter note"],
  [STROKE_DURATION_HALF, "half note"],
];

/** Names a stroke direction in lowercase, for example "down stroke". */
export function describeStrokeDirection(direction: StrokeDirection): string {
  return direction === StrokeDirection.Down ? "down stroke" : "up stroke";
}

/**
 * Names a stroke duration by its written note value, for example
 * "16th note", or "between 16th note and 8th note" for other values.
 */
export function describeStrokeDuration(duration: number): string {
  const exact = STROKE_DURATION_NAMES.find(([ticks]) => ticks === duration);
  if (exact !== undefined) {
    return exact[1];
  }

  const longerIndex = STROKE_DURATION_NAMES.findIndex(
    ([ticks]) => ticks > duration
  );
  const shorter = STROKE_DURATION_NAMES[longerIndex - 1];
  const longer = STROKE_DURATION_NAMES[longerIndex];
  if (shorter === undefined || longer === undefined) {
    return `${duration} ticks`;
  }
  return `between ${shorter[1]} and ${longer[1]}`;
}

/** Describes when a stroke sounds relative to its beat time. */
export function describeStrokeAlignment(alignment: number): string {
  if (alignment === STROKE_ALIGNMENT_STARTS_ON_TIME) {
    return "starts on time";
  }
  if (alignment === STROKE_ALIGNMENT_FALLS_ON_TIME) {
    return "falls on time";
  }
  return `${alignment}% before the beat`;
}

/**
 * Describes a stroke for screen readers, for example
 * "down stroke, duration 16th note". Alignment is added only when the
 * stroke does not start on time, which is the default.
 */
export function describeStroke(options: StrokeOptions): string {
  const alignment =
    options.alignment === STROKE_ALIGNMENT_STARTS_ON_TIME
      ? ""
      : `, ${describeStrokeAlignment(options.alignment)}`;
  return (
    `${describeStrokeDirection(options.direction)}, ` +
    `duration ${describeStrokeDuration(options.duration)}${alignment}`
  );
}
