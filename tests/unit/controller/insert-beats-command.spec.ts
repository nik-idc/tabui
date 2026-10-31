import { InsertBeatsCommand } from "../../../src/notation/controller/editor/command/insert-beats-command";
import { NoteDuration } from "../../../src/notation/model";
import { createBarWithBeats, createBeat } from "../model/helpers";
import { required } from "../required";

describe("InsertBeatsCommand", () => {
  test("packs clipboard before the original tail and restores fixed contents", () => {
    const { score, bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Half },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const voiceBar = required(bar.getVoiceBar(1));
    const command = new InsertBeatsCommand(bar, beats[0], [
      createBeat(voiceBar, NoteDuration.Eighth),
      createBeat(voiceBar, NoteDuration.Sixteenth),
    ]);
    expect(command.affectedModels).toEqual([
      { masterBarIndex: 0, modelUUID: bar.masterBar.uuid },
    ]);
    command.execute();
    expect(voiceBar.beats.map((b) => b.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Eighth,
      NoteDuration.Sixteenth,
      NoteDuration.Half,
    ]);
    expect(score.masterBars).toHaveLength(2);
    expect(
      bar.staff.bars[1].getVoiceBar(1)?.beats.map((b) => b.baseDuration)
    ).toEqual([NoteDuration.Quarter]);
    const created = score.masterBars[1];
    command.undo();
    expect(score.masterBars).toHaveLength(1);
    expect(voiceBar.beats.map((b) => b.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Half,
      NoteDuration.Quarter,
    ]);
    command.redo();
    expect(score.masterBars[1]).toBe(created);
    expect(voiceBar.beats.map((b) => b.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Eighth,
      NoteDuration.Sixteenth,
      NoteDuration.Half,
    ]);
  });

  test("replaces the sole empty beat and keeps the requested voice", () => {
    const { bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const first = required(bar.getVoiceBar(1));
    const firstBeat = first.beats[0];
    const voiceBar = bar.insertVoiceBar(2);
    const command = new InsertBeatsCommand(
      bar,
      voiceBar.beats[0],
      [createBeat(voiceBar, NoteDuration.Eighth)],
      2
    );
    command.execute();
    expect(voiceBar.beats.map((b) => b.baseDuration)).toEqual([
      NoteDuration.Eighth,
    ]);
    command.undo();
    expect(voiceBar.beats.map((b) => b.baseDuration)).toEqual([
      NoteDuration.Quarter,
    ]);
    expect(voiceBar.beats[0].isRest()).toBe(true);
    command.redo();
    expect(voiceBar.beats.map((b) => b.baseDuration)).toEqual([
      NoteDuration.Eighth,
    ]);
    expect(first.beats).toEqual([firstBeat]);
  });
});
