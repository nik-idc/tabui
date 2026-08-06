import {
  ReplaceBeatsCommand,
  SetDotsCommand,
  SetDurationCommand,
  SetTimeSigCommand,
  SetTupletCommand,
} from "../../src/notation/controller/editor/command";
import { NoteDuration } from "../../src/notation/model";
import {
  createBarWithBeats,
  createBeat,
  createScoreGraph,
} from "../model/helpers";
import { Beat, Guitar } from "../../src/notation/model";

describe("Timing rebuild commands", () => {
  function noteBeats(beats: Beat<Guitar>[]): Beat<Guitar>[] {
    return beats.filter((beat) => beat.hasNotes());
  }

  test("SetDurationCommand updates beat timing and restores it on undo/redo", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const command = new SetDurationCommand(beats, NoteDuration.Eighth);
    const originalTicks = beats[0].fullDurationTicks;
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    command.execute();
    expect(beats[0].fullDurationTicks).toBe(voiceBar.tickResolution / 8);

    command.undo();
    expect(beats[0].fullDurationTicks).toBe(originalTicks);

    command.redo();
    expect(beats[0].fullDurationTicks).toBe(voiceBar.tickResolution / 8);
  });

  test("SetDotsCommand updates dot timing and restores tick state", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const originalTicks = beats.map((beat) => beat.fullDurationTicks);
    const command = new SetDotsCommand(beats, 1);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    command.execute();
    expect(beats.map((beat) => beat.fullDurationTicks)).toEqual([
      (voiceBar.tickResolution * 3) / 8,
      (voiceBar.tickResolution * 3) / 8,
    ]);
    expect(voiceBar.actualTicks).toBe((voiceBar.tickResolution * 3) / 4);

    command.undo();
    expect(beats.map((beat) => beat.fullDurationTicks)).toEqual(originalTicks);
    expect(voiceBar.actualTicks).toBe(voiceBar.tickResolution / 2);

    command.redo();
    expect(beats.map((beat) => beat.fullDurationTicks)).toEqual([
      (voiceBar.tickResolution * 3) / 8,
      (voiceBar.tickResolution * 3) / 8,
    ]);
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

    command.undo();
    expect(voiceBar.tupletGroups).toHaveLength(0);
    expect(beats.map((beat) => beat.fullDurationTicks)).toEqual([
      voiceBar.tickResolution / 8,
      voiceBar.tickResolution / 8,
      voiceBar.tickResolution / 8,
    ]);

    command.redo();
    expect(voiceBar.tupletGroups).toHaveLength(1);
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
    const originalBarTicks = voiceBar.barTicks;
    const originalSiblingTicks = siblingVoiceBar.barTicks;
    const command = new SetTimeSigCommand(
      score,
      masterBar,
      3,
      NoteDuration.Quarter
    );

    command.execute();
    expect(voiceBar.barTicks).toBe((voiceBar.tickResolution * 3) / 4);
    expect(siblingVoiceBar.barTicks).toBe(
      (siblingVoiceBar.tickResolution * 3) / 4
    );
    expect(voiceBar.barTicks).not.toBe(originalBarTicks);
    expect(siblingVoiceBar.barTicks).not.toBe(originalSiblingTicks);

    command.undo();
    expect(voiceBar.barTicks).toBe(originalBarTicks);
    expect(siblingVoiceBar.barTicks).toBe(originalSiblingTicks);

    command.redo();
    expect(voiceBar.barTicks).toBe((voiceBar.tickResolution * 3) / 4);
    expect(siblingVoiceBar.barTicks).toBe(
      (siblingVoiceBar.tickResolution * 3) / 4
    );
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
    const originalBeatUUIDs = noteBeats(voiceBar.beats).map(
      (beat) => beat.uuid
    );

    command.execute();
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
    expect(noteBeats(voiceBar.beats).map((beat) => beat.uuid)).not.toEqual(
      originalBeatUUIDs
    );

    command.undo();
    expect(noteBeats(voiceBar.beats).map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    expect(noteBeats(voiceBar.beats).map((beat) => beat.uuid)).not.toEqual(
      originalBeatUUIDs
    );
    expect(noteBeats(voiceBar.beats).every((beat) => beat.dots === 0)).toBe(
      true
    );
    expect(
      noteBeats(voiceBar.beats).every((beat) => beat.tupletSettings === null)
    ).toBe(true);

    command.redo();
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
    expect(noteBeats(voiceBar.beats).map((beat) => beat.uuid)).not.toEqual(
      originalBeatUUIDs
    );
  });

  test("ReplaceBeatsCommand owns default rests created during replacement", () => {
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
    expect(noteBeats(voiceBar.beats)).toHaveLength(2);
    expect(noteBeats(voiceBar.beats).map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Eighth,
      NoteDuration.Sixteenth,
    ]);

    command.undo();
    expect(noteBeats(voiceBar.beats)).toHaveLength(1);
    expect(noteBeats(voiceBar.beats)[0].baseDuration).toBe(
      NoteDuration.Quarter
    );
    expect(noteBeats(voiceBar.beats)[0].dots).toBe(0);
    expect(noteBeats(voiceBar.beats)[0].tupletSettings).toBeNull();

    command.redo();
    expect(noteBeats(voiceBar.beats)).toHaveLength(2);
    expect(noteBeats(voiceBar.beats).map((beat) => beat.baseDuration)).toEqual([
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
    expect(noteBeats(voiceBar.beats)).toHaveLength(1);
    expect(noteBeats(voiceBar.beats)[0].baseDuration).toBe(NoteDuration.Half);

    command.undo();
    expect(noteBeats(voiceBar.beats)).toHaveLength(3);
    expect(noteBeats(voiceBar.beats).map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Eighth,
      NoteDuration.Sixteenth,
    ]);
    expect(noteBeats(voiceBar.beats).every((beat) => beat.dots === 0)).toBe(
      true
    );
    expect(
      noteBeats(voiceBar.beats).every((beat) => beat.tupletSettings === null)
    ).toBe(true);

    command.redo();
    expect(noteBeats(voiceBar.beats)).toHaveLength(1);
    expect(noteBeats(voiceBar.beats)[0].baseDuration).toBe(NoteDuration.Half);
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
    secondVoiceBar.beats.splice(
      0,
      secondVoiceBar.beats.length,
      createBeat(secondVoiceBar, NoteDuration.Half),
      createBeat(secondVoiceBar, NoteDuration.Half)
    );
    secondVoiceBar.rebuildTiming();
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
