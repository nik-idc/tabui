import { RemoveBeatsCommand } from "../../../src/notation/controller/editor/command";
import { NoteDuration } from "../../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";

describe("RemoveBeatsCommand", () => {
  test("execute removes selected beats and undo restores them in place", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Sixteenth },
    ]);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }

    const command = new RemoveBeatsCommand([beats[1]]);

    command.execute();
    expect(voiceBar.beats).toHaveLength(2);
    expect(voiceBar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Sixteenth,
    ]);

    command.undo();
    expect(voiceBar.beats).toHaveLength(3);
    expect(voiceBar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Eighth,
      NoteDuration.Sixteenth,
    ]);

    command.redo();
    expect(voiceBar.beats).toHaveLength(2);
    expect(voiceBar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Sixteenth,
    ]);
  });

  test("removing all beats inserts a real default rest", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }

    const command = new RemoveBeatsCommand(beats);

    command.execute();
    expect(voiceBar.beats).toHaveLength(1);
    expect(voiceBar.beats[0].baseDuration).toBe(NoteDuration.Quarter);
    expect(voiceBar.beats[0].isRest()).toBe(true);
    expect(voiceBar.isEmpty()).toBe(false);

    command.undo();
    expect(voiceBar.beats).toHaveLength(1);
    expect(voiceBar.beats[0].baseDuration).toBe(NoteDuration.Quarter);
    expect(voiceBar.beats[0].isRest()).toBe(false);

    command.redo();
    expect(voiceBar.beats).toHaveLength(1);
    expect(voiceBar.beats[0].isRest()).toBe(true);
  });

  test("removing the only beat in an extra voice removes that voice", () => {
    const { bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const voiceBar = bar.insertVoiceBar(2);
    const command = new RemoveBeatsCommand(voiceBar.beats);

    command.execute();
    const voiceOneBarAfterExecute = bar.getVoiceBar(1);
    if (voiceOneBarAfterExecute === null) {
      throw Error("Expected voice 1 to exist");
    }

    expect(bar.getVoiceBar(2)).toBeNull();
    expect(voiceOneBarAfterExecute.beats).toHaveLength(1);

    command.undo();
    expect(bar.getVoiceBar(2)).toBe(voiceBar);
    expect(voiceBar.beats).toHaveLength(1);
    expect(voiceBar.beats[0].isRest()).toBe(true);

    command.redo();
    const voiceOneBarAfterRedo = bar.getVoiceBar(1);
    if (voiceOneBarAfterRedo === null) {
      throw Error("Expected voice 1 to exist");
    }

    expect(bar.getVoiceBar(2)).toBeNull();
    expect(voiceOneBarAfterRedo.beats).toHaveLength(1);
  });
});
