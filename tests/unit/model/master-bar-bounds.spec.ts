import {
  BarRepeatStatus,
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
    expect(() => masterBar({ tempo })).not.toThrow();
  });

  test.each([
    [MIN_MASTER_BAR_TEMPO - 1, "too low"],
    [MAX_MASTER_BAR_TEMPO + 1, "too high"],
    [Number.NaN, "NaN"],
  ])("rejects tempo %p (%s) at construction and via setter", (tempo) => {
    expect(() => masterBar({ tempo })).toThrow(/outside/);
    const bar = masterBar();
    expect(() => {
      bar.tempo = tempo;
    }).toThrow(/outside/);
  });

  test.each([[MIN_MASTER_BAR_BEATS_COUNT], [MAX_MASTER_BAR_BEATS_COUNT]])(
    "accepts beatsCount %i in range",
    (beatsCount) => {
      expect(() => masterBar({ beatsCount })).not.toThrow();
    }
  );

  test.each([
    [MIN_MASTER_BAR_BEATS_COUNT - 1, "too low"],
    [MAX_MASTER_BAR_BEATS_COUNT + 1, "too high"],
    [3.5, "non-integer"],
  ])("rejects beatsCount %p (%s)", (beatsCount) => {
    expect(() => masterBar({ beatsCount })).toThrow(/outside/);
    const bar = masterBar();
    expect(() => {
      bar.beatsCount = beatsCount;
    }).toThrow(/outside/);
  });

  test.each([
    [1],
    [MAX_MASTER_BAR_REPEAT_COUNT + 1],
    [2.5],
    [Number.POSITIVE_INFINITY],
  ])("rejects repeat count %p", (repeatCount) => {
    expect(() => masterBar({ isRepeatEnd: true, repeatCount })).toThrow(
      /outside/
    );
    const bar = masterBar({ isRepeatEnd: true });
    expect(() => {
      bar.repeatCount = repeatCount;
    }).toThrow(/outside/);
  });

  test.each([[2], [MAX_MASTER_BAR_REPEAT_COUNT]])(
    "accepts repeat count %i",
    (repeatCount) => {
      expect(() => masterBar({ isRepeatEnd: true, repeatCount })).not.toThrow();
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
      expect(() => beatWith(settings)).not.toThrow();
      const beat = beatWith(null);
      expect(() => {
        beat.tupletSettings = settings;
      }).not.toThrow();
      if (settings !== null) {
        expect(beat.tupletSettings).toEqual(settings);
      }
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
      expect(() => beatWith(settings)).toThrow(/outside/);
      const beat = beatWith(null);
      expect(() => {
        beat.tupletSettings = settings;
      }).toThrow(/outside/);
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
