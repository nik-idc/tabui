import { InsertBeatCommand } from "../../src/notation/controller/editor/command/insert-beat-command";
import { NoteDuration } from "../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";

describe("InsertBeatCommand", () => {
  test("execute inserts one default beat at the requested index", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
    ]);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }
    const originalBeatUUIDs = beats.map((beat) => beat.uuid);
    const command = new InsertBeatCommand(voiceBar, 1);

    command.execute();

    expect(voiceBar.beats).toHaveLength(3);
    expect(voiceBar.beats[0].uuid).toBe(originalBeatUUIDs[0]);
    expect(voiceBar.beats[2].uuid).toBe(originalBeatUUIDs[1]);
    expect(voiceBar.beats[1].baseDuration).toBe(NoteDuration.Quarter);
    expect(command.insertBeatResult?.beats[0]).toBe(voiceBar.beats[1]);
    for (const note of voiceBar.beats[1].notes ?? []) {
      expect(note.beat).toBe(voiceBar.beats[1]);
    }

    command.undo();
    expect(voiceBar.beats.map((beat) => beat.uuid)).toEqual(originalBeatUUIDs);

    command.redo();
    expect(voiceBar.beats).toHaveLength(3);
    expect(voiceBar.beats[1]).toBe(command.insertBeatResult?.beats[0]);
    for (const note of voiceBar.beats[1].notes ?? []) {
      expect(note.beat).toBe(voiceBar.beats[1]);
    }
  });
});
