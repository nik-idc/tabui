import {
  Bar,
  Beat,
  Guitar,
  GuitarNote,
  NoteDuration,
  NoteValue,
  Score,
} from "../../../src/notation/model";
import { createBarWithBeats, createBeat, createScoreGraph } from "./helpers";
import { fillBar } from "../../../fixtures/score-builder";
import { required } from "../required";

describe("Bar model", () => {
  test("rejecting an insertion beyond the post-removal end leaves every voice unchanged", () => {
    const { bar } = createScoreGraph();
    const first = required(bar.getVoiceBar(1));
    const detached = bar.insertVoiceBar(2);
    const second = bar.insertVoiceBar(2);
    const firstBeat = first.beats[0];
    const secondBeat = second.beats[0];
    const detachedBeat = detached.beats[0];

    expect(() =>
      bar.replaceSelectedBeats(
        [firstBeat, secondBeat],
        [
          {
            voiceBar: detached,
            index: 0,
            beats: [firstBeat.deepCopy(detached)],
          },
          { voiceBar: first, index: 1, beats: [secondBeat.deepCopy(first)] },
        ]
      )
    ).toThrow("invalid beat index");

    expect(bar.getVoiceBar(1)).toBe(first);
    expect(bar.getVoiceBar(2)).toBe(second);
    expect(first.beats).toEqual([firstBeat]);
    expect(second.beats).toEqual([secondBeat]);
    expect(detached.beats).toEqual([detachedBeat]);
    expect(first.getActualBarDuration()).toBe(1 / 4);
    expect(second.getActualBarDuration()).toBe(1 / 4);
    expect(bar.staff.nonEmptyVoiceNumbers).toEqual([1, 2]);
  });

  test("failed destination copying leaves a replacement plan unapplied", () => {
    const score = new Score();
    const sourceVoice = score.tracks[0].staves[0].bars[0].ensureVoiceBar(1);
    const source = new Beat(sourceVoice, sourceVoice.trackContext);
    (required(source.notes)[0] as GuitarNote).setFret(1);
    const instrument = new Guitar(
      undefined,
      undefined,
      "High",
      6,
      Array.from({ length: 6 }, () => ({ noteValue: NoteValue.B, octave: 9 }))
    );
    const staff = score.addTrack(instrument, "High").tracks[0].staves[0];
    const bar = staff.bars[0];
    const voice = bar.ensureVoiceBar(1);
    const original = voice.beats[0];
    const rest = new Beat(voice, voice.trackContext, null);

    expect(() =>
      bar.restoreBeats(
        [
          { voiceBar: voice, index: 0, beats: [rest] },
          { voiceBar: voice, index: 1, beats: [source] },
        ],
        [original]
      )
    ).toThrow("Octave out of range");
    expect(voice.beats).toEqual([original]);
    expect(original.notes).toBeNull();
    expect(bar.getVoiceBar(1)).toBe(voice);
    expect(staff.nonEmptyVoiceNumbers).toEqual([1]);
    expect(voice.getActualBarDuration()).toBe(0.25);
    expect([original.startTick, original.endTick]).toEqual([0, 1]);
  });

  test("planned insertion positions follow removals and earlier insertions per voice", () => {
    const { bar } = createScoreGraph();
    const first = required(bar.getVoiceBar(1));
    const second = bar.insertVoiceBar(2);
    const eighth = createBeat(first, NoteDuration.Eighth);
    const sixteenth = createBeat(second, NoteDuration.Sixteenth);

    const result = bar.replaceSelectedBeats(
      [...first.beats, ...second.beats],
      [
        { voiceBar: first, index: 0, beats: [eighth] },
        { voiceBar: second, index: 0, beats: [sixteenth] },
        { voiceBar: first, index: 1, beats: [eighth] },
        { voiceBar: second, index: 1, beats: [sixteenth] },
      ]
    );

    expect(first.beats).toEqual([
      result.insertedBeats[0],
      result.insertedBeats[2],
    ]);
    expect(second.beats).toEqual([
      result.insertedBeats[1],
      result.insertedBeats[3],
    ]);
    expect(first.getActualBarDuration()).toBe(1 / 4);
    expect(second.getActualBarDuration()).toBe(1 / 8);
    expect(bar.staff.nonEmptyVoiceNumbers).toEqual([1, 2]);
  });

  test("removing the only voice keeps one quarter rest in voice 1", () => {
    const { bar } = createScoreGraph();

    bar.removeVoiceBar(1);

    expect(bar.voiceBarsAsArray).toHaveLength(1);
    expect(bar.getVoiceBar(1)?.beats).toHaveLength(1);
    expect(bar.getVoiceBar(1)?.beats[0].isRest()).toBe(true);
    expect(bar.getVoiceBar(1)?.getActualBarDuration()).toBe(1 / 4);
    expect(bar.staff.nonEmptyVoiceNumbers).toEqual([1]);
  });

  test("atomic replacement installs content without fallback metadata", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const voiceBar = beats[0].voiceBar;
    const replacement = createBeat(voiceBar, NoteDuration.Eighth);

    const result = bar.replaceSelectedBeats(beats, [
      { voiceBar, index: 0, beats: [replacement] },
    ]);

    expect(result.removals[0].inserted).toEqual([]);
    expect(result.removals[0].removedVoiceNumbers).toBeNull();
    expect(bar.getVoiceBar(1)).toBe(voiceBar);
    expect(voiceBar.beats).toEqual(result.insertedBeats);
    expect(voiceBar.getActualBarDuration()).toBe(1 / 8);
    expect(bar.staff.nonEmptyVoiceNumbers).toEqual([1]);
  });

  test("atomic restore reinstalls original voices and timing after removing all voices", () => {
    const { bar } = createScoreGraph();
    const first = required(bar.getVoiceBar(1));
    first.beats[0].makeRest();
    const second = bar.insertVoiceBar(2);
    second.replaceBeats([createBeat(second, NoteDuration.Eighth)]);
    const originalRest = first.beats[0];
    const result = bar.replaceSelectedBeats([...first.beats, ...second.beats]);

    expect(result.removals.flatMap((r) => r.inserted)).toHaveLength(1);
    expect(bar.voiceBarsAsArray).toHaveLength(1);
    bar.restoreBeatRemovals(result.removals);

    expect(bar.getVoiceBar(1)).toBe(first);
    expect(bar.getVoiceBar(2)).toBe(second);
    expect(first.beats).toHaveLength(1);
    expect(first.beats[0].isRest()).toBe(true);
    expect(first.beats[0]).not.toBe(originalRest);
    expect(second.getActualBarDuration()).toBe(1 / 8);
    expect(bar.staff.nonEmptyVoiceNumbers).toEqual([1, 2]);
  });

  test("restoration recognizes a generated rest after a later remove and undo", () => {
    const { bar } = createScoreGraph();
    const second = bar.insertVoiceBar(2);
    bar.removeVoiceBar(1);
    const original = [...second.beats];
    const firstRemoval = bar.replaceSelectedBeats(original).removals;
    const fallback = required(bar.getVoiceBar(1)).beats[0];
    const laterRemoval = bar.replaceSelectedBeats([fallback]).removals;
    bar.restoreBeatRemovals(laterRemoval);
    bar.restoreBeatRemovals(firstRemoval);

    expect(bar.getVoiceBar(1)).toBeNull();
    expect(bar.getVoiceBar(2)).toBe(second);
    expect(second.beats).toHaveLength(1);
    expect(second.beats[0].isRest()).toBe(true);
    expect(bar.staff.nonEmptyVoiceNumbers).toEqual([2]);
  });

  test("restoration keeps an ordinary rest that replaced a generated rest", () => {
    const { bar } = createScoreGraph();
    const second = bar.insertVoiceBar(2);
    bar.removeVoiceBar(1);
    const removals = bar.replaceSelectedBeats([...second.beats]).removals;
    const first = required(bar.getVoiceBar(1));
    const ordinaryRest = createBeat(first, NoteDuration.Quarter);
    ordinaryRest.makeRest();
    first.replaceBeats([ordinaryRest]);

    bar.restoreBeatRemovals(removals);

    expect(bar.getVoiceBar(1)?.beats).toEqual([ordinaryRest]);
    expect(bar.getVoiceBar(2)).toBe(second);
    expect(bar.staff.nonEmptyVoiceNumbers).toEqual([1, 2]);
  });

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
