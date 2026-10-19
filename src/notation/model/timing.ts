import { NoteDuration } from "./note-duration";
import { TupletSettings } from "./tuplet-settings";

/** Exact duration in whole-note units; fraction operations require a nonzero denominator, and ordering comparisons require positive denominators. */
export type TimingFraction = {
  /** Fraction numerator */
  numerator: number;
  /** Fraction denominator */
  denominator: number;
};

/** Greatest common divisor */
export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }

  return x;
}

/** Least common multiple */
export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) {
    return 0;
  }

  return Math.abs((a / gcd(a, b)) * b);
}

/** Least common multiple for an array of values */
export function lcmAll(values: number[]): number {
  if (values.length === 0) {
    throw Error("lcmAll called with an empty array");
  }

  return values.reduce((acc, value) => lcm(acc, value));
}

/** Reduces a fraction to its lowest terms */
export function reduceFraction(
  numerator: number,
  denominator: number
): TimingFraction {
  if (denominator === 0) {
    throw Error("Fraction denominator cannot be zero");
  }

  const divisor = gcd(numerator, denominator);
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
}

/** Multiplies two fractions */
export function multiplyFractions(
  a: TimingFraction,
  b: TimingFraction
): TimingFraction {
  return reduceFraction(
    a.numerator * b.numerator,
    a.denominator * b.denominator
  );
}

/** Gets exact whole-note fraction for a written base duration */
export function getBaseDurationFraction(
  duration: NoteDuration
): TimingFraction {
  return {
    numerator: 1,
    denominator: 1 / duration,
  };
}

/**
 * Applies 0, 1, or 2 augmentation dots and reduces the result.
 * @throws If the dot count is unsupported or the denominator is zero.
 */
export function applyDotsToFraction(
  baseFraction: TimingFraction,
  dots: number
): TimingFraction {
  switch (dots) {
    case 0:
      return reduceFraction(baseFraction.numerator, baseFraction.denominator);
    case 1:
      return reduceFraction(
        baseFraction.numerator * 3,
        baseFraction.denominator * 2
      );
    case 2:
      return reduceFraction(
        baseFraction.numerator * 7,
        baseFraction.denominator * 4
      );
    default:
      throw Error(`${dots} is an invalid dots value`);
  }
}

/**
 * Multiplies duration by tupletCount / normalCount and reduces it; null only reduces the input.
 * @throws If the input denominator or normalCount is zero.
 */
export function applyTupletToFraction(
  fraction: TimingFraction,
  tupletSettings: TupletSettings | null
): TimingFraction {
  if (tupletSettings === null) {
    return reduceFraction(fraction.numerator, fraction.denominator);
  }

  return multiplyFractions(fraction, {
    numerator: tupletSettings.tupletCount,
    denominator: tupletSettings.normalCount,
  });
}

/**
 * Converts a whole-note fraction to an exact integer tick count.
 * @param tickResolution Ticks per whole note.
 * @throws If conversion is not integral at this resolution, including a zero fraction denominator.
 */
export function fractionToTicks(
  fraction: TimingFraction,
  tickResolution: number
): number {
  const ticksNumerator = tickResolution * fraction.numerator;
  if (ticksNumerator % fraction.denominator !== 0) {
    throw Error(
      `Fraction ${fraction.numerator}/${fraction.denominator} cannot be represented at resolution ${tickResolution}`
    );
  }

  return ticksNumerator / fraction.denominator;
}

/**
 * Converts ticks to a reduced whole-note fraction.
 * @param tickResolution Ticks per whole note.
 * @throws If tickResolution is zero.
 */
export function ticksToFraction(
  ticks: number,
  tickResolution: number
): TimingFraction {
  return reduceFraction(ticks, tickResolution);
}

/** Indicates whether two fractions are equal */
export function fractionEq(a: TimingFraction, b: TimingFraction): boolean {
  return a.numerator * b.denominator === b.numerator * a.denominator;
}

/** Indicates whether the first fraction is less than the second; assumes positive denominators without validating them. */
export function fractionLt(a: TimingFraction, b: TimingFraction): boolean {
  return a.numerator * b.denominator < b.numerator * a.denominator;
}

/** Indicates whether the first fraction is less than or equal to the second; assumes positive denominators without validating them. */
export function fractionLte(a: TimingFraction, b: TimingFraction): boolean {
  return a.numerator * b.denominator <= b.numerator * a.denominator;
}

/**
 * Converts a whole-note fraction to seconds without numeric validation.
 * @param tempo Quarter-note beats per minute; invalid values can produce NaN or Infinity.
 */
export function fractionToSeconds(
  fraction: TimingFraction,
  tempo: number
): number {
  const wholeNoteSeconds = 240 / tempo;
  return (fraction.numerator / fraction.denominator) * wholeNoteSeconds;
}

/**
 * Converts bar-local ticks to seconds.
 * @param tickResolution Ticks per whole note.
 * @param tempo Quarter-note beats per minute; invalid values can produce NaN or Infinity.
 * @throws If tickResolution is zero.
 */
export function ticksToSeconds(
  ticks: number,
  tickResolution: number,
  tempo: number
): number {
  return fractionToSeconds(ticksToFraction(ticks, tickResolution), tempo);
}
