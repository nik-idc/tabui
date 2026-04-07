import { AppendBeatCommand } from "../../src/notation/controller/editor/command/append-beat-command";
import { createScoreGraph } from "../model/helpers";

describe("AppendBeatCommand", () => {
  test("execute appends one empty beat at the end and undo/redo restore exact state", () => {
    const { bar } = createScoreGraph();
    const originalBeatUUIDs = bar.beats.map((beat) => beat.uuid);
    const command = new AppendBeatCommand(bar);

    command.execute();
    expect(bar.beats).toHaveLength(2);
    expect(bar.beats[0].uuid).toBe(originalBeatUUIDs[0]);
    expect(command.appendBeatResult).not.toBeNull();
    expect(command.appendBeatResult?.index).toBe(1);
    expect(command.appendBeatResult?.beats).toHaveLength(1);
    expect(bar.beats[1].uuid).toBe(command.appendBeatResult?.beats[0].uuid);
    expect(bar.beats[1].isEmpty()).toBe(true);

    command.undo();
    expect(bar.beats).toHaveLength(1);
    expect(bar.beats.map((beat) => beat.uuid)).toEqual(originalBeatUUIDs);

    command.redo();
    expect(bar.beats).toHaveLength(2);
    expect(bar.beats[0].uuid).toBe(originalBeatUUIDs[0]);
    expect(bar.beats[1].baseDuration).toBe(bar.beats[0].baseDuration);
    expect(bar.beats[1].isEmpty()).toBe(true);
  });

  test("redo before execute throws", () => {
    const { bar } = createScoreGraph();
    const command = new AppendBeatCommand(bar);

    expect(() => command.redo()).toThrow("Redo called before execute");
  });
});
