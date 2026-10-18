import {
  Beat,
  MasterBar,
  MAX_MASTER_BAR_BEATS_COUNT,
  MAX_MASTER_BAR_REPEAT_COUNT,
  MAX_MASTER_BAR_TEMPO,
  MIN_MASTER_BAR_BEATS_COUNT,
  MIN_MASTER_BAR_TEMPO,
  MAX_TUPLET_NORMAL_COUNT,
  MAX_TUPLET_TUPLET_COUNT,
  MIN_TUPLET_NORMAL_COUNT,
  MIN_TUPLET_TUPLET_COUNT,
  NoteDuration,
  TupletSettings,
  tupletSettingsInRange,
} from "../../../src/notation/model";
import { createBarWithBeats } from "./helpers";

function masterBar(
  overrides: Partial<{
    tempo: number;
    beatsCount: number;
    duration: NoteDuration;
    isRepeatStart: boolean;
    isRepeatEnd: boolean;
    repeatCount: number | null;
  }> = {}
) {
  return new MasterBar({
    tempo: overrides.tempo ?? 120,
    beatsCount: overrides.beatsCount ?? 4,
    duration: overrides.duration ?? NoteDuration.Quarter,
    isRepeatStart: overrides.isRepeatStart ?? false,
    isRepeatEnd: overrides.isRepeatEnd ?? false,
    repeatCount: overrides.repeatCount ?? null,
  });
}

describe("MasterBar domain bounds", () => {
  test.each([
    [MIN_MASTER_BAR_TEMPO],
    [MAX_MASTER_BAR_TEMPO],
    [(MIN_MASTER_BAR_TEMPO + MAX_MASTER_BAR_TEMPO) / 2],
  ])("accepts tempo %i in range", (tempo) => {
    expect(masterBar({ tempo }).tempo).toBe(tempo);
    const bar = masterBar();
    bar.tempo = tempo;
    expect(bar.tempo).toBe(tempo);
  });

  test.each([
    [MIN_MASTER_BAR_TEMPO - 1, "too low"],
    [MAX_MASTER_BAR_TEMPO + 1, "too high"],
    [Number.NaN, "NaN"],
  ])("rejects tempo %p (%s) at construction and via setter", (tempo) => {
    expect(() => masterBar({ tempo })).toThrow();
    const bar = masterBar();
    expect(() => {
      bar.tempo = tempo;
    }).toThrow();
    expect(bar.tempo).toBe(120);
  });

  test.each([[MIN_MASTER_BAR_BEATS_COUNT], [MAX_MASTER_BAR_BEATS_COUNT]])(
    "accepts beatsCount %i in range",
    (beatsCount) => {
      expect(masterBar({ beatsCount }).beatsCount).toBe(beatsCount);
      const bar = masterBar();
      bar.beatsCount = beatsCount;
      expect(bar.beatsCount).toBe(beatsCount);
    }
  );

  test.each([
    [MIN_MASTER_BAR_BEATS_COUNT - 1, "too low"],
    [MAX_MASTER_BAR_BEATS_COUNT + 1, "too high"],
    [3.5, "non-integer"],
  ])("rejects beatsCount %p (%s)", (beatsCount) => {
    expect(() => masterBar({ beatsCount })).toThrow();
    const bar = masterBar();
    expect(() => {
      bar.beatsCount = beatsCount;
    }).toThrow();
    expect(bar.beatsCount).toBe(4);
  });

  test.each([
    [1],
    [MAX_MASTER_BAR_REPEAT_COUNT + 1],
    [2.5],
    [Number.POSITIVE_INFINITY],
  ])("rejects repeat count %p", (repeatCount) => {
    expect(() => masterBar({ isRepeatEnd: true, repeatCount })).toThrow();
    const bar = masterBar({ isRepeatEnd: true });
    expect(() => {
      bar.repeatCount = repeatCount;
    }).toThrow();
    expect(bar.repeatCount).toBe(2);
  });

  test.each([[2], [MAX_MASTER_BAR_REPEAT_COUNT]])(
    "accepts repeat count %i",
    (repeatCount) => {
      expect(masterBar({ isRepeatEnd: true, repeatCount }).repeatCount).toBe(
        repeatCount
      );
      const bar = masterBar({ isRepeatEnd: true, repeatCount: 3 });
      bar.repeatCount = repeatCount;
      expect(bar.repeatCount).toBe(repeatCount);
    }
  );
});

describe("Beat tuplet domain bounds", () => {
  function beatWith(settings: TupletSettings | null): Beat {
    const { beats } = createBarWithBeats([
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: settings,
      },
    ]);
    return beats[0];
  }

  test.each([
    [{ normalCount: MIN_TUPLET_NORMAL_COUNT, tupletCount: 1 }, "storage min"],
    [
      {
        normalCount: MAX_TUPLET_NORMAL_COUNT,
        tupletCount: MAX_TUPLET_TUPLET_COUNT,
      },
      "storage max",
    ],
    [null, "null"],
  ] as Array<[TupletSettings | null, string]>)(
    "accepts tuplet settings %p (%s)",
    (settings) => {
      expect(beatWith(settings).tupletSettings).toEqual(settings);
      const beat = beatWith({ normalCount: 2, tupletCount: 3 });
      beat.tupletSettings = settings;
      expect(beat.tupletSettings).toEqual(settings);
    }
  );

  test.each([
    [
      {
        normalCount: MIN_TUPLET_NORMAL_COUNT - 1,
        tupletCount: MIN_TUPLET_TUPLET_COUNT,
      },
      "normalCount too low",
    ],
    [
      {
        normalCount: MIN_TUPLET_NORMAL_COUNT,
        tupletCount: MIN_TUPLET_TUPLET_COUNT - 1,
      },
      "tupletCount too low",
    ],
    [
      {
        normalCount: MAX_TUPLET_NORMAL_COUNT + 1,
        tupletCount: MIN_TUPLET_TUPLET_COUNT,
      },
      "normalCount too high",
    ],
    [
      {
        normalCount: MIN_TUPLET_NORMAL_COUNT,
        tupletCount: MAX_TUPLET_TUPLET_COUNT + 1,
      },
      "tupletCount too high",
    ],
  ] as Array<[TupletSettings, string]>)(
    "rejects tuplet settings %p (%s)",
    (settings) => {
      expect(() => beatWith(settings)).toThrow();
      const beat = beatWith(null);
      expect(() => {
        beat.tupletSettings = settings;
      }).toThrow();
      expect(beat.tupletSettings).toBeNull();
    }
  );
});

describe("tupletSettingsInRange", () => {
  test.each([
    [null, false],
    [{ normalCount: 1, tupletCount: 1 }, true, "storage min"],
    [{ normalCount: 256, tupletCount: 256 }, true, "storage max"],
    [{ normalCount: 0, tupletCount: 1 }, false],
    [{ normalCount: 1, tupletCount: 0 }, false],
    [{ normalCount: 257, tupletCount: 1 }, false],
    [{ normalCount: 1, tupletCount: 257 }, false],
    [{ normalCount: 1.5, tupletCount: 1 }, false],
  ] as Array<[TupletSettings | null, boolean, string?]>)(
    "%p in range = %p",
    (settings, expected) => {
      expect(tupletSettingsInRange(settings)).toBe(expected);
    }
  );
});
