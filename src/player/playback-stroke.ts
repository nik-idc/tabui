import { ticksToSeconds } from "../notation/model/timing";
import {
  STROKE_TICKS_PER_QUARTER,
  StrokeDirection,
  StrokeOptions,
} from "../notation/model/stroke-options";

/** Stroke ticks per whole note, the tick resolution used by ticksToSeconds. */
const strokeTickResolution = 4 * STROKE_TICKS_PER_QUARTER;
/**
 * Longest stroke spread as a share of the beat. A long stroke on a short beat
 * then still lets every string sound for at least half of the beat, and a
 * "falls on time" stroke never starts more than half a beat early.
 */
const maxStrokeBeatRatio = 0.5;

/** Beat timing that a stroke is spread over. */
export type StrokeTiming = {
  /** Quarter-note beats per minute of the beat's bar. */
  tempo: number;
  /** Seconds from the beat time to the beat's end; limits the stroke spread. */
  beatSeconds: number;
  /** Earliest allowed attack offset from the beat time, such as the playback pass start. */
  earliestOffsetSeconds?: number;
};

/**
 * Spreads the attacks of one stroke over its duration.
 * Down strokes start on the highest string number (the lowest string in
 * standard tunings) and up strokes start on string 1. Alignment moves that
 * percent of the stroke before the beat time. When an attack would be earlier
 * than `earliestOffsetSeconds`, the whole stroke moves later to keep its shape.
 * @param stringNums Strings that attack on this beat, in any order
 * @returns Attack offset in seconds from the beat time, keyed by string number
 */
export function getStrokeAttackOffsets(
  stroke: StrokeOptions,
  stringNums: readonly number[],
  timing: StrokeTiming
): Map<number, number> {
  const order = [...stringNums].sort((a, b) =>
    stroke.direction === StrokeDirection.Down ? b - a : a - b
  );
  const offsets = new Map<number, number>();
  if (order.length === 1) {
    offsets.set(order[0], 0);
    return offsets;
  }

  const strokeSeconds = Math.min(
    ticksToSeconds(stroke.duration, strokeTickResolution, timing.tempo),
    timing.beatSeconds * maxStrokeBeatRatio
  );
  const alignmentShare = stroke.alignment / 100;
  const firstOffset = -alignmentShare * strokeSeconds;
  const earliestOffset = timing.earliestOffsetSeconds ?? -Infinity;
  const shift = Math.max(0, earliestOffset - firstOffset);
  for (const [i, stringNum] of order.entries()) {
    const strokeShare = i / (order.length - 1);
    offsets.set(
      stringNum,
      (strokeShare - alignmentShare) * strokeSeconds + shift
    );
  }
  return offsets;
}
