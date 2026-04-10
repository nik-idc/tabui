import { InsertBeatsCommand } from "../../src/notation/controller/editor/command/insert-beats-command";
import { NoteDuration } from "../../src/notation/model";
import { createBarWithBeats, createBeat } from "../model/helpers";

describe("InsertBeatsCommand", () => {
  test("execute inserts beats at the requested index preserving surrounding order", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Half },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const insertedBeats = [
      createBeat(bar, NoteDuration.Eighth),
      createBeat(bar, NoteDuration.Sixteenth),
    ];
    const originalBeatUUIDs = beats.map((beat) => beat.uuid);
    const command = new InsertBeatsCommand(bar, 1, insertedBeats);

    command.execute();
    expect(bar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Eighth,
      NoteDuration.Sixteenth,
      NoteDuration.Half,
      NoteDuration.Quarter,
    ]);
    expect(bar.beats[0].uuid).toBe(originalBeatUUIDs[0]);
    expect(bar.beats[3].uuid).toBe(originalBeatUUIDs[1]);
    expect(bar.beats[4].uuid).toBe(originalBeatUUIDs[2]);
    expect(bar.beats[1].baseDuration).toBe(NoteDuration.Eighth);
    expect(bar.beats[2].baseDuration).toBe(NoteDuration.Sixteenth);

    command.undo();
    expect(bar.beats.map((beat) => beat.uuid)).toEqual(originalBeatUUIDs);

    command.redo();
    expect(bar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Eighth,
      NoteDuration.Sixteenth,
      NoteDuration.Half,
      NoteDuration.Quarter,
    ]);
    expect(bar.beats[1].baseDuration).toBe(NoteDuration.Eighth);
    expect(bar.beats[2].baseDuration).toBe(NoteDuration.Sixteenth);
  });

  test("inserting into a single-beat bar preserves the existing beat and undo restores the original bar", () => {
    const { bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const seedBeatUUID = bar.beats[0].uuid;
    const insertedBeat = createBeat(bar, NoteDuration.Eighth);
    const command = new InsertBeatsCommand(bar, 1, [insertedBeat]);

    command.execute();
    expect(bar.beats).toHaveLength(2);
    expect(bar.beats[0].uuid).toBe(seedBeatUUID);
    expect(bar.beats[1].baseDuration).toBe(NoteDuration.Eighth);

    command.undo();
    expect(bar.beats).toHaveLength(1);
    expect(bar.beats[0].uuid).toBe(seedBeatUUID);
    expect(bar.beats[0].isEmpty()).toBe(true);

    command.redo();
    expect(bar.beats).toHaveLength(2);
    expect(bar.beats[1].baseDuration).toBe(NoteDuration.Eighth);
  });
});
