import { NoteDuration } from "./note-duration";
import { TupletSettings } from "./tuplet-settings";

export type TimingFraction = {
  numerator: number;
  denominator: number;
};

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

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) {
    return 0;
  }

  return Math.abs((a / gcd(a, b)) * b);
}

export function lcmAll(values: number[]): number {
  if (values.length === 0) {
    throw Error("lcmAll called with an empty array");
  }

  return values.reduce((acc, value) => lcm(acc, value));
}

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

export function multiplyFractions(
  a: TimingFraction,
  b: TimingFraction
): TimingFraction {
  return reduceFraction(
    a.numerator * b.numerator,
    a.denominator * b.denominator
  );
}

export function getBaseDurationFraction(
  duration: NoteDuration
): TimingFraction {
  return {
    numerator: 1,
    denominator: 1 / duration,
  };
}

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
