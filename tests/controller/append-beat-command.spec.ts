import { AppendBeatCommand } from "../../src/notation/controller/editor/command/append-beat-command";
import { createScoreGraph } from "../model/helpers";

describe("AppendBeatCommand", () => {
  test("execute appends one rest beat at the end and undo/redo restore exact state", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }
    const originalBeatUUIDs = voiceBar.beats.map((beat) => beat.uuid);
    const command = new AppendBeatCommand(voiceBar);

    command.execute();
    expect(voiceBar.beats).toHaveLength(2);
    expect(voiceBar.beats[0].uuid).toBe(originalBeatUUIDs[0]);
    expect(command.appendBeatResult).not.toBeNull();
    expect(command.appendBeatResult?.index).toBe(1);
    expect(command.appendBeatResult?.beats).toHaveLength(1);
    expect(voiceBar.beats[1].uuid).toBe(
      command.appendBeatResult?.beats[0].uuid
    );
    expect(voiceBar.beats[1].isRest()).toBe(true);

    command.undo();
    expect(voiceBar.beats).toHaveLength(1);
    expect(voiceBar.beats.map((beat) => beat.uuid)).toEqual(originalBeatUUIDs);

    command.redo();
    expect(voiceBar.beats).toHaveLength(2);
    expect(voiceBar.beats[0].uuid).toBe(originalBeatUUIDs[0]);
    expect(voiceBar.beats[1].baseDuration).toBe(voiceBar.beats[0].baseDuration);
    expect(voiceBar.beats[1].isRest()).toBe(true);
  });
});
