import {
  ReplaceBeatsCommand,
  SetDotsCommand,
  SetDurationCommand,
  SetTimeSigCommand,
  SetTupletCommand,
} from "../../../src/notation/controller/editor/command";
import { NoteDuration } from "../../../src/notation/model";
import {
  createBarWithBeats,
  createBeat,
  createScoreGraph,
} from "../model/helpers";
import { Beat, Guitar } from "../../../src/notation/model";

describe("Timing rebuild commands", () => {
  function noteBeats(beats: Beat<Guitar>[]): Beat<Guitar>[] {
    return beats.filter((beat) => beat.hasNotes());
  }

  test("SetDurationCommand updates beat timing and restores it on undo/redo", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const command = new SetDurationCommand(
      beats.slice(0, 2),
      NoteDuration.Eighth
    );
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    const timing = () => ({
      durations: beats.map((beat) => beat.baseDuration),
      starts: beats.map((beat) => beat.startTick / voiceBar.tickResolution),
      lengths: beats.map(
        (beat) => beat.fullDurationTicks / voiceBar.tickResolution
      ),
      total: voiceBar.actualTicks / voiceBar.tickResolution,
    });

    command.execute();
    expect(timing()).toEqual({
      durations: [
        NoteDuration.Eighth,
        NoteDuration.Eighth,
        NoteDuration.Quarter,
      ],
      starts: [0, 1 / 8, 1 / 4],
      lengths: [1 / 8, 1 / 8, 1 / 4],
      total: 1 / 2,
    });

    command.undo();
    expect(timing()).toEqual({
      durations: [
        NoteDuration.Quarter,
        NoteDuration.Eighth,
        NoteDuration.Quarter,
      ],
      starts: [0, 1 / 4, 3 / 8],
      lengths: [1 / 4, 1 / 8, 1 / 4],
      total: 5 / 8,
    });

    command.redo();
    expect(timing()).toEqual({
      durations: [
        NoteDuration.Eighth,
        NoteDuration.Eighth,
        NoteDuration.Quarter,
      ],
      starts: [0, 1 / 8, 1 / 4],
      lengths: [1 / 8, 1 / 8, 1 / 4],
      total: 1 / 2,
    });
  });

  test("SetDotsCommand updates dot timing and restores tick state", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter, dots: 2 },
      { baseDuration: NoteDuration.Eighth },
    ]);
    const command = new SetDotsCommand(beats.slice(0, 2), 1);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    const timing = () => ({
      dots: beats.map((beat) => beat.dots),
      starts: beats.map((beat) => beat.startTick / voiceBar.tickResolution),
      lengths: beats.map(
        (beat) => beat.fullDurationTicks / voiceBar.tickResolution
      ),
      total: voiceBar.actualTicks / voiceBar.tickResolution,
    });

    command.execute();
    expect(timing()).toEqual({
      dots: [1, 1, 0],
      starts: [0, 3 / 8, 3 / 4],
      lengths: [3 / 8, 3 / 8, 1 / 8],
      total: 7 / 8,
    });

    command.undo();
    expect(timing()).toEqual({
      dots: [0, 2, 0],
      starts: [0, 1 / 4, 11 / 16],
      lengths: [1 / 4, 7 / 16, 1 / 8],
      total: 13 / 16,
    });

    command.redo();
    expect(timing()).toEqual({
      dots: [1, 1, 0],
      starts: [0, 3 / 8, 3 / 4],
      lengths: [3 / 8, 3 / 8, 1 / 8],
      total: 7 / 8,
    });
  });

  test("SetTupletCommand updates tuplet timing and beaming for the full group", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Eighth },
    ]);
    const command = new SetTupletCommand(beats, {
      normalCount: 3,
      tupletCount: 2,
    });
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    command.execute();
    expect(voiceBar.tupletGroups).toHaveLength(1);
    expect(voiceBar.tupletGroups[0].complete).toBe(true);
    expect(beats.map((beat) => beat.fullDurationTicks)).toEqual([
      voiceBar.tickResolution / 12,
      voiceBar.tickResolution / 12,
      voiceBar.tickResolution / 12,
    ]);
    expect(beats.map((beat) => beat.beamGroupId)).toEqual([0, 0, 0]);
    expect(beats.map((b) => b.startTick / voiceBar.tickResolution)).toEqual([
      0,
      1 / 12,
      1 / 6,
    ]);
    expect(voiceBar.actualTicks / voiceBar.tickResolution).toBe(1 / 4);

    command.undo();
    expect(voiceBar.tupletGroups).toHaveLength(0);
    expect(beats.map((b) => b.tupletSettings)).toEqual([null, null, null]);
    expect(beats.map((b) => b.startTick / voiceBar.tickResolution)).toEqual([
      0,
      1 / 8,
      1 / 4,
    ]);
    expect(voiceBar.actualTicks / voiceBar.tickResolution).toBe(3 / 8);
    expect(beats.map((beat) => beat.fullDurationTicks)).toEqual([
      voiceBar.tickResolution / 8,
      voiceBar.tickResolution / 8,
      voiceBar.tickResolution / 8,
    ]);

    command.redo();
    expect(voiceBar.tupletGroups).toHaveLength(1);
    expect(voiceBar.tupletGroups[0].complete).toBe(true);
    expect(beats.map((b) => b.startTick / voiceBar.tickResolution)).toEqual([
      0,
      1 / 12,
      1 / 6,
    ]);
    expect(voiceBar.actualTicks / voiceBar.tickResolution).toBe(1 / 4);
    expect(beats.map((beat) => beat.fullDurationTicks)).toEqual([
      voiceBar.tickResolution / 12,
      voiceBar.tickResolution / 12,
      voiceBar.tickResolution / 12,
    ]);
  });

  test("SetTimeSigCommand updates every bar tied to master bar", () => {
    const { score, track, masterBar, bar } = createScoreGraph();
    const extraStaff = track.insertStaff(1).staves[0];
    const siblingBar = extraStaff.bars[0];

    const voiceBar = bar.getVoiceBar(1);
    const siblingVoiceBar = siblingBar.getVoiceBar(1);
    if (voiceBar === null || siblingVoiceBar === null) {
      throw Error("Expected voice 1 in test bars");
    }
    const command = new SetTimeSigCommand(
      score,
      masterBar,
      3,
      NoteDuration.Eighth
    );

    command.execute();
    expect(masterBar.beatsCount).toBe(3);
    expect(masterBar.duration).toBe(NoteDuration.Eighth);
    for (const voice of [voiceBar, siblingVoiceBar]) {
      expect(voice.tickResolution).toBe(8);
      expect(voice.barTicks).toBe(3);
      expect(voice.beats[0].fullDurationTicks).toBe(2);
    }

    command.undo();
    expect(masterBar.beatsCount).toBe(4);
    expect(masterBar.duration).toBe(NoteDuration.Quarter);
    for (const voice of [voiceBar, siblingVoiceBar]) {
      expect(voice.tickResolution).toBe(4);
      expect(voice.barTicks).toBe(4);
      expect(voice.beats[0].fullDurationTicks).toBe(1);
    }

    command.redo();
    expect(masterBar.beatsCount).toBe(3);
    expect(masterBar.duration).toBe(NoteDuration.Eighth);
    for (const voice of [voiceBar, siblingVoiceBar]) {
      expect(voice.tickResolution).toBe(8);
      expect(voice.barTicks).toBe(3);
      expect(voice.beats[0].fullDurationTicks).toBe(2);
    }
  });

  test("ReplaceBeatsCommand copies full rhythmic data and restores equal-length replacements on undo/redo", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const replacementBeats = [
      createBeat(bar, NoteDuration.Eighth, 1, {
        normalCount: 3,
        tupletCount: 2,
      }),
      createBeat(bar, NoteDuration.Sixteenth),
    ];
    const command = new ReplaceBeatsCommand(beats, replacementBeats);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    command.execute();
    expect(voiceBar.beats).toHaveLength(2);
    expect(noteBeats(voiceBar.beats)).toHaveLength(2);
    expect(noteBeats(voiceBar.beats)[0].baseDuration).toBe(NoteDuration.Eighth);
    expect(noteBeats(voiceBar.beats)[0].dots).toBe(1);
    expect(noteBeats(voiceBar.beats)[0].tupletSettings).toEqual({
      normalCount: 3,
      tupletCount: 2,
    });
    expect(noteBeats(voiceBar.beats)[1].baseDuration).toBe(
      NoteDuration.Sixteenth
    );

    command.undo();
    expect(voiceBar.beats).toHaveLength(2);
    expect(noteBeats(voiceBar.beats).map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    expect(voiceBar.beats.map((b) => b.dots)).toEqual([0, 0]);
    expect(voiceBar.beats.map((b) => b.tupletSettings)).toEqual([null, null]);

    command.redo();
    expect(voiceBar.beats).toHaveLength(2);
    expect(noteBeats(voiceBar.beats)).toHaveLength(2);
    expect(noteBeats(voiceBar.beats)[0].baseDuration).toBe(NoteDuration.Eighth);
    expect(noteBeats(voiceBar.beats)[0].dots).toBe(1);
    expect(noteBeats(voiceBar.beats)[0].tupletSettings).toEqual({
      normalCount: 3,
      tupletCount: 2,
    });
    expect(noteBeats(voiceBar.beats)[1].baseDuration).toBe(
      NoteDuration.Sixteenth
    );
  });

  test("ReplaceBeatsCommand replaces all primary-voice beats without leaving a default rest on undo/redo", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Half },
      { baseDuration: NoteDuration.Half },
    ]);
    const replacementBeats = [createBeat(bar, NoteDuration.Whole)];
    const command = new ReplaceBeatsCommand(beats, replacementBeats);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    command.execute();
    expect(voiceBar.beats.map((b) => b.baseDuration)).toEqual([
      NoteDuration.Whole,
    ]);

    command.undo();
    expect(voiceBar.beats.map((b) => b.baseDuration)).toEqual([
      NoteDuration.Half,
      NoteDuration.Half,
    ]);

    command.redo();
    expect(voiceBar.beats.map((b) => b.baseDuration)).toEqual([
      NoteDuration.Whole,
    ]);
    expect(voiceBar.bar.staff.nonEmptyVoiceNumbers).toEqual([1]);
  });

  test("ReplaceBeatsCommand keeps a replaced secondary voice attached", () => {
    const { bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const voiceBar = bar.insertVoiceBar(2);
    voiceBar.replaceBeats([
      createBeat(voiceBar, NoteDuration.Half),
      createBeat(voiceBar, NoteDuration.Half),
    ]);
    const command = new ReplaceBeatsCommand(
      [...voiceBar.beats],
      [createBeat(voiceBar, NoteDuration.Whole)]
    );

    command.execute();
    expect(bar.getVoiceBar(2)).toBe(voiceBar);
    expect(voiceBar.beats.map((b) => b.baseDuration)).toEqual([
      NoteDuration.Whole,
    ]);
    expect(bar.staff.nonEmptyVoiceNumbers).toEqual([1, 2]);

    command.undo();
    expect(bar.getVoiceBar(2)).toBe(voiceBar);
    expect(voiceBar.beats.map((b) => b.baseDuration)).toEqual([
      NoteDuration.Half,
      NoteDuration.Half,
    ]);
    expect(bar.staff.nonEmptyVoiceNumbers).toEqual([1, 2]);

    command.redo();
    expect(bar.getVoiceBar(2)).toBe(voiceBar);
    expect(voiceBar.beats.map((b) => b.baseDuration)).toEqual([
      NoteDuration.Whole,
    ]);
    expect(bar.staff.nonEmptyVoiceNumbers).toEqual([1, 2]);
  });

  test("ReplaceBeatsCommand inserts additional beats in order and restores original sequence on undo", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const replacementBeats = [
      createBeat(bar, NoteDuration.Eighth),
      createBeat(bar, NoteDuration.Sixteenth),
    ];
    const command = new ReplaceBeatsCommand(beats, replacementBeats);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    command.execute();
    expect(voiceBar.beats.map((b) => b.baseDuration)).toEqual([
      NoteDuration.Eighth,
      NoteDuration.Sixteenth,
    ]);

    command.undo();
    expect(voiceBar.beats.map((b) => b.baseDuration)).toEqual([
      NoteDuration.Quarter,
    ]);

    command.redo();
    expect(voiceBar.beats.map((b) => b.baseDuration)).toEqual([
      NoteDuration.Eighth,
      NoteDuration.Sixteenth,
    ]);
  });

  test("ReplaceBeatsCommand removes surplus beats and restores original order on undo", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Sixteenth },
    ]);
    const replacementBeats = [createBeat(bar, NoteDuration.Half)];
    const command = new ReplaceBeatsCommand(beats, replacementBeats);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    command.execute();
    expect(voiceBar.beats.map((b) => b.baseDuration)).toEqual([
      NoteDuration.Half,
    ]);

    command.undo();
    expect(voiceBar.beats.map((b) => b.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Eighth,
      NoteDuration.Sixteenth,
    ]);

    command.redo();
    expect(voiceBar.beats.map((b) => b.baseDuration)).toEqual([
      NoteDuration.Half,
    ]);
  });

  test("ReplaceBeatsCommand undo restores multi-bar selections to original bars", () => {
    const { score, track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    score.appendMasterBar();
    const secondBar = track.staves[0].bars[1];
    const secondVoiceBar = secondBar.getVoiceBar(1);
    if (secondVoiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    secondVoiceBar.replaceBeats([
      createBeat(secondVoiceBar, NoteDuration.Half),
      createBeat(secondVoiceBar, NoteDuration.Half),
    ]);
    const replacementBeats = [
      createBeat(bar, NoteDuration.Eighth),
      createBeat(bar, NoteDuration.Eighth),
    ];
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const command = new ReplaceBeatsCommand(
      [voiceBar.beats[1], secondVoiceBar.beats[0]],
      replacementBeats
    );

    command.execute();
    expect(voiceBar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Eighth,
      NoteDuration.Eighth,
    ]);
    expect(secondVoiceBar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Half,
    ]);

    command.undo();
    expect(voiceBar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    expect(secondVoiceBar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Half,
      NoteDuration.Half,
    ]);

    command.redo();
    expect(voiceBar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Eighth,
      NoteDuration.Eighth,
    ]);
    expect(secondVoiceBar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Half,
    ]);
  });
});
