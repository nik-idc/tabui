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

describe("Timing rebuild commands", () => {
  test("SetDurationCommand updates beat timing and restores it on undo/redo", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const command = new SetDurationCommand(beats, NoteDuration.Eighth);
    const originalTicks = beats[0].fullDurationTicks;

    command.execute();
    expect(beats[0].fullDurationTicks).toBe(bar.tickResolution / 8);

    command.undo();
    expect(beats[0].fullDurationTicks).toBe(originalTicks);

    command.redo();
    expect(beats[0].fullDurationTicks).toBe(bar.tickResolution / 8);
  });

  test("SetDotsCommand updates dot timing and restores tick state", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const originalTicks = beats.map((beat) => beat.fullDurationTicks);
    const command = new SetDotsCommand(beats, 1);

    command.execute();
    expect(beats.map((beat) => beat.fullDurationTicks)).toEqual([
      (bar.tickResolution * 3) / 8,
      (bar.tickResolution * 3) / 8,
    ]);
    expect(bar.actualTicks).toBe((bar.tickResolution * 3) / 4);

    command.undo();
    expect(beats.map((beat) => beat.fullDurationTicks)).toEqual(originalTicks);
    expect(bar.actualTicks).toBe(bar.tickResolution / 2);

    command.redo();
    expect(beats.map((beat) => beat.fullDurationTicks)).toEqual([
      (bar.tickResolution * 3) / 8,
      (bar.tickResolution * 3) / 8,
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

    command.execute();
    expect(bar.tupletGroups).toHaveLength(1);
    expect(bar.tupletGroups[0].complete).toBe(true);
    expect(beats.map((beat) => beat.fullDurationTicks)).toEqual([
      bar.tickResolution / 12,
      bar.tickResolution / 12,
      bar.tickResolution / 12,
    ]);
    expect(beats.map((beat) => beat.beamGroupId)).toEqual([0, 0, 0]);

    command.undo();
    expect(bar.tupletGroups).toHaveLength(0);
    expect(beats.map((beat) => beat.fullDurationTicks)).toEqual([
      bar.tickResolution / 8,
      bar.tickResolution / 8,
      bar.tickResolution / 8,
    ]);

    command.redo();
    expect(bar.tupletGroups).toHaveLength(1);
    expect(beats.map((beat) => beat.fullDurationTicks)).toEqual([
      bar.tickResolution / 12,
      bar.tickResolution / 12,
      bar.tickResolution / 12,
    ]);
  });

  test("SetTimeSigCommand updates every bar tied to master bar", () => {
    const { score, track, masterBar, bar } = createScoreGraph();
    const extraStaff = track.insertStaff(1).staves[0];
    const siblingBar = extraStaff.bars[0];

    const originalBarTicks = bar.barTicks;
    const originalSiblingTicks = siblingBar.barTicks;
    const command = new SetTimeSigCommand(
      score,
      masterBar,
      3,
      NoteDuration.Quarter
    );

    command.execute();
    expect(bar.barTicks).toBe((bar.tickResolution * 3) / 4);
    expect(siblingBar.barTicks).toBe((siblingBar.tickResolution * 3) / 4);
    expect(bar.barTicks).not.toBe(originalBarTicks);
    expect(siblingBar.barTicks).not.toBe(originalSiblingTicks);

    command.undo();
    expect(bar.barTicks).toBe(originalBarTicks);
    expect(siblingBar.barTicks).toBe(originalSiblingTicks);

    command.redo();
    expect(bar.barTicks).toBe((bar.tickResolution * 3) / 4);
    expect(siblingBar.barTicks).toBe((siblingBar.tickResolution * 3) / 4);
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
    const originalBeatUUIDs = bar.beats.map((beat) => beat.uuid);

    command.execute();
    expect(bar.beats).toHaveLength(2);
    expect(bar.beats[0].baseDuration).toBe(NoteDuration.Eighth);
    expect(bar.beats[0].dots).toBe(1);
    expect(bar.beats[0].tupletSettings).toEqual({
      normalCount: 3,
      tupletCount: 2,
    });
    expect(bar.beats[1].baseDuration).toBe(NoteDuration.Sixteenth);
    expect(bar.beats.map((beat) => beat.uuid)).toEqual(originalBeatUUIDs);

    command.undo();
    expect(bar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    expect(bar.beats.map((beat) => beat.uuid)).toEqual(originalBeatUUIDs);
    expect(bar.beats.every((beat) => beat.dots === 0)).toBe(true);
    expect(bar.beats.every((beat) => beat.tupletSettings === null)).toBe(true);

    command.redo();
    expect(bar.beats).toHaveLength(2);
    expect(bar.beats[0].baseDuration).toBe(NoteDuration.Eighth);
    expect(bar.beats[0].dots).toBe(1);
    expect(bar.beats[0].tupletSettings).toEqual({
      normalCount: 3,
      tupletCount: 2,
    });
    expect(bar.beats[1].baseDuration).toBe(NoteDuration.Sixteenth);
    expect(bar.beats.map((beat) => beat.uuid)).toEqual(originalBeatUUIDs);
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

    command.execute();
    expect(bar.beats).toHaveLength(2);
    expect(bar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Eighth,
      NoteDuration.Sixteenth,
    ]);

    command.undo();
    expect(bar.beats).toHaveLength(1);
    expect(bar.beats[0].baseDuration).toBe(NoteDuration.Quarter);
    expect(bar.beats[0].dots).toBe(0);
    expect(bar.beats[0].tupletSettings).toBeNull();

    command.redo();
    expect(bar.beats).toHaveLength(2);
    expect(bar.beats.map((beat) => beat.baseDuration)).toEqual([
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

    command.execute();
    expect(bar.beats).toHaveLength(1);
    expect(bar.beats[0].baseDuration).toBe(NoteDuration.Half);

    command.undo();
    expect(bar.beats).toHaveLength(3);
    expect(bar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Eighth,
      NoteDuration.Sixteenth,
    ]);
    expect(bar.beats.every((beat) => beat.dots === 0)).toBe(true);
    expect(bar.beats.every((beat) => beat.tupletSettings === null)).toBe(true);

    command.redo();
    expect(bar.beats).toHaveLength(1);
    expect(bar.beats[0].baseDuration).toBe(NoteDuration.Half);
  });
});
