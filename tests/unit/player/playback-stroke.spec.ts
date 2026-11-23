import {
  STROKE_DURATION_EIGHTH,
  STROKE_DURATION_SIXTEENTH,
  StrokeDirection,
  StrokeOptions,
} from "../../../src/notation/model";
import { getStrokeAttackOffsets } from "../../../src/player/playback-stroke";

/** At 120 BPM a 16th-note stroke takes 0.125 s. */
const sixteenthAt120 = { tempo: 120, beatSeconds: 0.5 };

function stroke(
  direction: StrokeDirection,
  alignment = 0,
  duration = STROKE_DURATION_SIXTEENTH
): StrokeOptions {
  return new StrokeOptions({ direction, duration, alignment });
}

describe("getStrokeAttackOffsets", () => {
  test.each([
    {
      name: "down strokes start on the highest string number",
      direction: StrokeDirection.Down,
      expected: [
        [3, 0],
        [2, 0.0625],
        [1, 0.125],
      ],
    },
    {
      name: "up strokes start on string 1",
      direction: StrokeDirection.Up,
      expected: [
        [1, 0],
        [2, 0.0625],
        [3, 0.125],
      ],
    },
  ])("$name", ({ direction, expected }) => {
    const offsets = getStrokeAttackOffsets(
      stroke(direction),
      [1, 2, 3],
      sixteenthAt120
    );

    expect(offsets).toEqual(new Map(expected as [number, number][]));
  });

  test.each([
    { alignment: 0, expected: [0, 0.0625, 0.125] },
    { alignment: 50, expected: [-0.0625, 0, 0.0625] },
    { alignment: 100, expected: [-0.125, -0.0625, 0] },
  ])(
    "alignment $alignment moves that share of the stroke before the beat",
    ({ alignment, expected }) => {
      const offsets = getStrokeAttackOffsets(
        stroke(StrokeDirection.Up, alignment),
        [1, 2, 3],
        sixteenthAt120
      );

      expect([1, 2, 3].map((s) => offsets.get(s))).toEqual(expected);
    }
  );

  test("spreads only the supplied strings, keeping gaps out of the order", () => {
    const offsets = getStrokeAttackOffsets(
      stroke(StrokeDirection.Down),
      [6, 1],
      sixteenthAt120
    );

    expect(offsets).toEqual(
      new Map([
        [6, 0],
        [1, 0.125],
      ])
    );
  });

  test.each([0, 50, 100])(
    "a single string sounds on the beat with alignment %i",
    (alignment) => {
      const offsets = getStrokeAttackOffsets(
        stroke(StrokeDirection.Down, alignment),
        [4],
        sixteenthAt120
      );

      expect(offsets).toEqual(new Map([[4, 0]]));
    }
  );

  test("converts the stroke duration with the bar tempo", () => {
    const offsets = getStrokeAttackOffsets(stroke(StrokeDirection.Up), [1, 2], {
      tempo: 60,
      beatSeconds: 1,
    });

    expect(offsets.get(2)).toBe(0.25);
  });

  test("limits the stroke to half of the beat duration", () => {
    const offsets = getStrokeAttackOffsets(
      stroke(StrokeDirection.Up, 0, STROKE_DURATION_EIGHTH),
      [1, 2],
      { tempo: 120, beatSeconds: 0.25 }
    );

    expect(offsets.get(2)).toBe(0.125);
  });

  test("shifts the whole stroke later so no attack is before the earliest offset", () => {
    const offsets = getStrokeAttackOffsets(
      stroke(StrokeDirection.Up, 100),
      [1, 2, 3],
      { ...sixteenthAt120, earliestOffsetSeconds: -0.0625 }
    );

    expect([1, 2, 3].map((s) => offsets.get(s))).toEqual([-0.0625, 0, 0.0625]);
  });
});
