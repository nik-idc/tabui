import { InsertBeatsCommand } from "../../src/notation/controller/editor/command/insert-beats-command";
import { NoteDuration } from "../../src/notation/model";
import { createBarWithBeats, createBeat } from "../model/helpers";

describe("InsertBeatsCommand", () => {
  test("execute, undo, and redo work for inserted beats", () => {
    const { bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const beat = createBeat(bar, NoteDuration.Eighth);
    const command = new InsertBeatsCommand(bar, 1, [beat]);

    command.execute();
    expect(bar.beats).toHaveLength(2);
    expect(bar.beats[1].baseDuration).toBe(NoteDuration.Eighth);

    command.undo();
    expect(bar.beats).toHaveLength(1);

    command.redo();
    expect(bar.beats).toHaveLength(2);
    expect(bar.beats[1].baseDuration).toBe(NoteDuration.Eighth);
  });
});
