import { Bar, Guitar, NoteDuration, Score } from "../../../src/notation/model";
import { createBarWithBeats, createBeat, createScoreGraph } from "./helpers";
import { fillBar } from "../../../fixtures/score-builder";

describe("Bar model", () => {
  test("new bar starts with one default rest beat", () => {
    const score = new Score();
    const bar = score.tracks[0].staves[0].bars[0];
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }

    expect(voiceBar.beats).toHaveLength(1);
    expect(voiceBar.beats[0].isRest()).toBe(true);
    expect(voiceBar.beats[0].baseDuration).toBe(NoteDuration.Quarter);
    expect(bar.hasContent()).toBe(true);
  });

  test("removeBeat rejects index equal to current length", () => {
    const { bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);

    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }

    const originalBeats = [...voiceBar.beats];

    expect(() => voiceBar.removeBeat(voiceBar.beats.length)).toThrow(Error);
    expect(voiceBar.beats).toEqual(originalBeats);
  });

  test("removeBeat replaces the last note beat with a default rest", () => {
    const { bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }

    const originalBeat = voiceBar.beats[0];
    const result = voiceBar.removeBeat(0);

    expect(result.removed).toEqual({ index: 0, beats: [originalBeat] });
    expect(result.inserted).toHaveLength(1);
    expect(voiceBar.beats).toHaveLength(1);
    expect(result.inserted[0]).toEqual({ index: 0, beats: voiceBar.beats });
    expect(voiceBar.beats[0]).not.toBe(originalBeat);
    expect(voiceBar.beats[0].isRest()).toBe(true);
    expect(voiceBar.beats[0].baseDuration).toBe(NoteDuration.Quarter);
    expect(voiceBar.isEmpty()).toBe(false);
  });

  test("appendBeats with no arguments inserts one rest beat", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }

    const result = voiceBar.appendBeats();

    expect(voiceBar.beats).toHaveLength(2);
    expect(result.index).toBe(1);
    expect(result.beats).toHaveLength(1);
    expect(result.beats[0]).toBe(voiceBar.beats[1]);
    expect(voiceBar.beats[1].isRest()).toBe(true);
  });

  test("appendBeats appends provided beats at the end", () => {
    const { bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }
    const inputBeat = createBeat(voiceBar, NoteDuration.Eighth);
    const originalBeat = voiceBar.beats[0];

    const result = voiceBar.appendBeats([inputBeat]);

    expect(result.index).toBe(1);
    expect(voiceBar.beats).toHaveLength(2);
    expect(result.beats[0]).toBe(voiceBar.beats[1]);
    expect(voiceBar.beats[0]).toBe(originalBeat);
    expect(voiceBar.beats[1]).not.toBe(inputBeat);
    expect(voiceBar.beats[1].baseDuration).toBe(NoteDuration.Eighth);
  });

  test("prependBeats prepends provided beats at the beginning", () => {
    const { bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }
    const inputBeat = createBeat(voiceBar, NoteDuration.Eighth);
    const originalBeat = voiceBar.beats[0];

    const result = voiceBar.prependBeats([inputBeat]);

    expect(result.index).toBe(0);
    expect(voiceBar.beats).toHaveLength(2);
    expect(result.beats[0]).toBe(voiceBar.beats[0]);
    expect(voiceBar.beats[1]).toBe(originalBeat);
    expect(voiceBar.beats[0]).not.toBe(inputBeat);
    expect(voiceBar.beats[0].baseDuration).toBe(NoteDuration.Eighth);
  });

  test("rebuildTiming computes bar and beat ticks", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Sixteenth },
    ]);

    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }
    beats[1].dots = 1;
    voiceBar.rebuildTiming();

    expect(voiceBar.tickResolution).toBeGreaterThan(0);
    expect(voiceBar.barTicks).toBe(voiceBar.tickResolution);
    // A quarter, dotted eighth, and sixteenth occupy half of a 4/4 bar.
    expect(voiceBar.actualTicks / voiceBar.tickResolution).toBe(1 / 2);
    expect(
      beats.map((beat) => beat.fullDurationTicks / voiceBar.tickResolution)
    ).toEqual([1 / 4, 3 / 16, 1 / 16]);
    expect(
      beats.map((beat) => beat.startTick / voiceBar.tickResolution)
    ).toEqual([0, 1 / 4, 7 / 16]);
    expect(beats.map((beat) => beat.endTick / voiceBar.tickResolution)).toEqual(
      [1 / 4, 7 / 16, 1 / 2]
    );
  });

  test("checkDurationsFit and beatPlayable use tick-based bar bounds", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Whole },
      { baseDuration: NoteDuration.Eighth },
    ]);

    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }

    expect(voiceBar.checkDurationsFit()).toBe(false);
    expect(voiceBar.beatPlayable(beats[0])).toBe(true);
    expect(voiceBar.beatPlayable(beats[1])).toBe(false);

    voiceBar.removeBeat(1);

    expect(voiceBar.checkDurationsFit()).toBe(true);
    expect(voiceBar.beatPlayable(beats[0])).toBe(true);
  });

  test("fillBar rebuilds timing for reused default-rest bars", () => {
    const score = new Score();
    const bar = score.tracks[0].staves[0].bars[0] as Bar<Guitar>;
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }
    const originalBeat = voiceBar.beats[0];
    expect(originalBeat.isRest()).toBe(true);
    expect(originalBeat.baseDuration).toBe(NoteDuration.Quarter);

    fillBar(bar, {
      beatsCount: 1,
      beatsDuration: NoteDuration.Whole,
    });

    expect(voiceBar.beats).toHaveLength(1);
    expect(voiceBar.beats[0]).not.toBe(originalBeat);
    expect(voiceBar.beats[0].isRest()).toBe(false);
    expect(voiceBar.beats[0].baseDuration).toBe(NoteDuration.Whole);
    expect(bar.checkDurationsFit()).toBe(true);
    expect(voiceBar.actualTicks).toBe(voiceBar.barTicks);
  });
});
