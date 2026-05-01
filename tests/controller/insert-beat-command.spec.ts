import { InsertBeatCommand } from "../../src/notation/controller/editor/command/insert-beat-command";
import { NoteDuration } from "../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";

describe("InsertBeatCommand", () => {
  test("execute inserts one default beat at the requested index", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
    ]);
    const originalBeatUUIDs = beats.map((beat) => beat.uuid);
    const command = new InsertBeatCommand(bar, 1);

    command.execute();

    expect(bar.beats).toHaveLength(3);
    expect(bar.beats[0].uuid).toBe(originalBeatUUIDs[0]);
    expect(bar.beats[2].uuid).toBe(originalBeatUUIDs[1]);
    expect(bar.beats[1].baseDuration).toBe(NoteDuration.Quarter);
    expect(command.insertBeatResult?.beats[0]).toBe(bar.beats[1]);

    command.undo();
    expect(bar.beats.map((beat) => beat.uuid)).toEqual(originalBeatUUIDs);

    command.redo();
    expect(bar.beats).toHaveLength(3);
    expect(bar.beats[1]).toBe(command.insertBeatResult?.beats[0]);
  });
});
