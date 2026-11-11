import { InsertBeatsCommand } from "../../../src/notation/controller/editor/command/insert-beats-command";
import {
  BeatGuitarTechniqueType,
  NoteDuration,
  ScoreEditor,
  StrokeDirection,
  StrokeOptions,
  STROKE_DURATION_QUARTER,
} from "../../../src/notation/model";
import { createBarWithBeats, createBeat } from "../model/helpers";
import { required } from "../required";

describe("InsertBeatsCommand", () => {
  test("pasted beats keep their strokes", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const voiceBar = required(bar.getVoiceBar(1));
    const source = createBeat(voiceBar, NoteDuration.Eighth);
    ScoreEditor.setBeatTechnique([source], BeatGuitarTechniqueType.Stroke, {
      strokeOptions: new StrokeOptions({
        direction: StrokeDirection.Up,
        duration: STROKE_DURATION_QUARTER,
      }),
    });

    new InsertBeatsCommand(bar, beats[0], [source]).execute();

    const pasted = voiceBar.beats[1];
    expect(pasted).not.toBe(source);
    const stroke = pasted.getBeatTechnique(BeatGuitarTechniqueType.Stroke);
    expect(stroke?.beat).toBe(pasted);
    expect(stroke?.options.direction).toBe(StrokeDirection.Up);
  });

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
