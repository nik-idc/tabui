import { BarRepeatStatus, NoteDuration, Score } from "../../src/notation/model";
import { createBarWithBeats, createBeat, createScoreGraph } from "./helpers";
import { fillBar } from "../../demo/data/helpers";

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

    expect(() => voiceBar.removeBeat(voiceBar.beats.length)).toThrow(Error);
  });

  test("removeBeat replaces the last note beat with a default rest", () => {
    const { bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }

    const result = voiceBar.removeBeat(0);

    expect(result.removed.beats).toHaveLength(1);
    expect(result.inserted).toHaveLength(1);
    expect(voiceBar.beats).toHaveLength(1);
    expect(voiceBar.beats[0].isRest()).toBe(true);
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

    const result = voiceBar.appendBeats([inputBeat]);

    expect(result.index).toBe(1);
    expect(voiceBar.beats).toHaveLength(2);
    expect(result.beats[0]).toBe(voiceBar.beats[1]);
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

    const result = voiceBar.prependBeats([inputBeat]);

    expect(result.index).toBe(0);
    expect(voiceBar.beats).toHaveLength(2);
    expect(result.beats[0]).toBe(voiceBar.beats[0]);
    expect(voiceBar.beats[0].baseDuration).toBe(NoteDuration.Eighth);
  });

  test("rebuildTiming computes bar and beat ticks", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth, dots: 1 },
      { baseDuration: NoteDuration.Sixteenth },
    ]);

    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }
    voiceBar.rebuildTiming();

    expect(voiceBar.tickResolution).toBeGreaterThan(0);
    expect(voiceBar.barTicks).toBe(voiceBar.tickResolution);
    expect(voiceBar.actualTicks).toBe(
      beats[0].fullDurationTicks +
        beats[1].fullDurationTicks +
        beats[2].fullDurationTicks
    );
    expect(beats[0].startTick).toBe(0);
    expect(beats[1].startTick).toBe(beats[0].endTick);
    expect(beats[2].startTick).toBe(beats[1].endTick);
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
  });

  test("fillBar rebuilds timing for reused default-rest bars", () => {
    const { bar } = createScoreGraph({
      tempo: 120,
      beatsCount: 1,
      duration: NoteDuration.Whole,
      repeatStatus: BarRepeatStatus.None,
      repeatCount: null,
    });

    fillBar(bar, {
      beatsCount: 1,
      beatsDuration: NoteDuration.Whole,
    });

    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }

    expect(bar.checkDurationsFit()).toBe(true);
    expect(voiceBar.actualTicks).toBe(voiceBar.barTicks);
  });
});
