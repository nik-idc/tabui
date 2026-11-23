import {
  Beat,
  BeatGuitarTechnique,
  BeatGuitarTechniqueType,
  GuitarNote,
  NoteDuration,
  STROKE_ALIGNMENT_FALLS_ON_TIME,
  STROKE_ALIGNMENT_STARTS_ON_TIME,
  STROKE_DURATION_EIGHTH,
  STROKE_DURATION_HALF,
  STROKE_DURATION_QUARTER,
  STROKE_DURATION_SIXTEENTH,
  STROKE_DURATION_SIXTY_FOURTH,
  MAX_STROKE_DURATION,
  MIN_STROKE_DURATION,
  StrokeDirection,
  StrokeOptions,
  StrokeOptionsData,
} from "../../../src/notation/model";
import { createBarWithBeats } from "./helpers";
import { required } from "../required";

function stroke(
  beat: Beat,
  direction = StrokeDirection.Down,
  duration = STROKE_DURATION_EIGHTH
) {
  return new BeatGuitarTechnique(
    beat,
    BeatGuitarTechniqueType.Stroke,
    new StrokeOptions({ direction, duration })
  );
}

describe("Stroke options", () => {
  test("stroke durations use 960 ticks per quarter note, from a 64th to a half note", () => {
    expect([
      STROKE_DURATION_SIXTY_FOURTH,
      STROKE_DURATION_SIXTEENTH,
      STROKE_DURATION_EIGHTH,
      STROKE_DURATION_QUARTER,
      STROKE_DURATION_HALF,
    ]).toEqual([60, 240, 480, 960, 1920]);
    expect([MIN_STROKE_DURATION, MAX_STROKE_DURATION]).toEqual([60, 1920]);
    expect([
      STROKE_ALIGNMENT_STARTS_ON_TIME,
      STROKE_ALIGNMENT_FALLS_ON_TIME,
    ]).toEqual([0, 100]);
  });

  test("alignment defaults to starts on time and is part of equality", () => {
    const options = new StrokeOptions({
      direction: StrokeDirection.Up,
      duration: 75,
    });

    expect(options.direction).toBe(StrokeDirection.Up);
    expect(options.duration).toBe(75);
    expect(options.alignment).toBe(0);
    expect(
      options.equals(
        new StrokeOptions({
          direction: StrokeDirection.Up,
          duration: 75,
          alignment: 0,
        })
      )
    ).toBe(true);
    expect(
      options.equals(
        new StrokeOptions({
          direction: StrokeDirection.Up,
          duration: 75,
          alignment: 40,
        })
      )
    ).toBe(false);
    expect(
      options.equals(
        new StrokeOptions({ direction: StrokeDirection.Up, duration: 76 })
      )
    ).toBe(false);
  });

  test("accept the inclusive duration and alignment limits", () => {
    for (const [duration, alignment] of [
      [60, 0],
      [1920, 100],
    ]) {
      const options = new StrokeOptions({
        direction: StrokeDirection.Down,
        duration,
        alignment,
      });
      expect([options.duration, options.alignment]).toEqual([
        duration,
        alignment,
      ]);
    }
  });

  test.each([
    ["unknown direction", { direction: 7, duration: 480 }, "direction"],
    [
      "duration below a 64th note",
      { direction: StrokeDirection.Down, duration: 59 },
      "duration",
    ],
    [
      "duration above a half note",
      { direction: StrokeDirection.Down, duration: 1921 },
      "duration",
    ],
    [
      "fractional duration",
      { direction: StrokeDirection.Down, duration: 480.5 },
      "duration",
    ],
    [
      "negative alignment",
      { direction: StrokeDirection.Down, duration: 480, alignment: -1 },
      "alignment",
    ],
    [
      "alignment above 100",
      { direction: StrokeDirection.Down, duration: 480, alignment: 101 },
      "alignment",
    ],
    [
      "fractional alignment",
      { direction: StrokeDirection.Down, duration: 480, alignment: 12.5 },
      "alignment",
    ],
    [
      "extra key",
      { direction: StrokeDirection.Down, duration: 480, speed: 1 },
      "unexpected key",
    ],
  ])("reject %s", (_, data, message) => {
    expect(() => new StrokeOptions(data as StrokeOptionsData)).toThrow(message);
  });
});

describe("Beat techniques", () => {
  test("a note beat accepts one stroke, including when all slots are empty", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const beat = beats[0];

    expect(beat.addBeatTechnique(stroke(beat))).toBe(true);
    expect(beat.addBeatTechnique(stroke(beat, StrokeDirection.Up))).toBe(false);

    expect(beat.hasBeatTechnique(BeatGuitarTechniqueType.Stroke)).toBe(true);
    expect(beat.beatTechniques).toHaveLength(1);
    const saved = required(
      beat.getBeatTechnique(BeatGuitarTechniqueType.Stroke)
    );
    expect(saved.options.direction).toBe(StrokeDirection.Down);
  });

  test("rests and techniques owned by another beat are rejected", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    beats[0].makeRest();

    expect(beats[0].addBeatTechnique(stroke(beats[0]))).toBe(false);
    expect(beats[1].addBeatTechnique(stroke(beats[0]))).toBe(false);
    expect(beats[0].beatTechniques).toHaveLength(0);
    expect(beats[1].beatTechniques).toHaveLength(0);
  });

  test("remove and clear drop strokes", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const beat = beats[0];
    beat.addBeatTechnique(stroke(beat));

    expect(beat.removeBeatTechnique(BeatGuitarTechniqueType.Stroke)).toBe(true);
    expect(beat.removeBeatTechnique(BeatGuitarTechniqueType.Stroke)).toBe(
      false
    );
    beat.addBeatTechnique(stroke(beat));
    beat.clearBeatTechniques();
    expect(beat.hasBeatTechnique(BeatGuitarTechniqueType.Stroke)).toBe(false);
  });

  test("making a rest drops the stroke, but clearing frets keeps it", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const beat = beats[0];
    const note = required(beat.notes)[0] as GuitarNote;
    note.setFret(3);
    beat.addBeatTechnique(stroke(beat));

    note.setFret(null);
    expect(beat.hasBeatTechnique(BeatGuitarTechniqueType.Stroke)).toBe(true);

    beat.makeRest();
    beat.makeBeatWithNotes();
    expect(beat.hasBeatTechnique(BeatGuitarTechniqueType.Stroke)).toBe(false);
  });

  test("copies and restored content own independent strokes", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    beats[0].addBeatTechnique(
      stroke(beats[0], StrokeDirection.Up, STROKE_DURATION_QUARTER)
    );

    const copy = beats[0].deepCopy();
    beats[1].restoreContent(beats[0]);
    beats[0].clearBeatTechniques();

    for (const beat of [copy, beats[1]]) {
      const saved = required(
        beat.getBeatTechnique(BeatGuitarTechniqueType.Stroke)
      );
      expect(saved.beat).toBe(beat);
      expect(saved.options.direction).toBe(StrokeDirection.Up);
      expect(saved.options.duration).toBe(STROKE_DURATION_QUARTER);
    }
  });

  test("replacing stroke options reports whether a value changed", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const technique = stroke(beats[0]);

    expect(
      technique.replaceOptions(
        new StrokeOptions({
          direction: StrokeDirection.Down,
          duration: STROKE_DURATION_EIGHTH,
        })
      )
    ).toBe(false);
    expect(
      technique.replaceOptions(
        new StrokeOptions({
          direction: StrokeDirection.Up,
          duration: STROKE_DURATION_EIGHTH,
        })
      )
    ).toBe(true);
    expect(technique.options.direction).toBe(StrokeDirection.Up);
  });
});
