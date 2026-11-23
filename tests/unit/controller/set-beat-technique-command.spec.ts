import {
  SetBeatTechniqueCommand,
  SetRestCommand,
} from "../../../src/notation/controller/editor/command";
import {
  Beat,
  BeatGuitarTechniqueType,
  NoteDuration,
  ScoreEditor,
  SetBeatTechniqueOptions,
  StrokeOptions,
  StrokeDirection,
  STROKE_DURATION_SIXTEENTH,
} from "../../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";

const down: SetBeatTechniqueOptions = {
  strokeOptions: new StrokeOptions({
    direction: StrokeDirection.Down,
    duration: STROKE_DURATION_SIXTEENTH,
  }),
};

function strokeDirection(beat: Beat): StrokeDirection | undefined {
  return beat.getBeatTechnique(BeatGuitarTechniqueType.Stroke)?.options
    .direction;
}

function positions(beats: Beat[]) {
  return beats.map((b) => ScoreEditor.getBeatPosition(b));
}

describe("SetBeatTechniqueCommand", () => {
  test("execute adds a stroke; undo and redo restore saved states", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const command = new SetBeatTechniqueCommand(
      positions(beats),
      BeatGuitarTechniqueType.Stroke,
      down
    );

    command.execute();
    expect(command.executed).toBe(true);
    expect(strokeDirection(beats[0])).toBe(StrokeDirection.Down);
    expect(command.affectedModels.map((m) => m.modelUUID)).toEqual([
      beats[0].uuid,
    ]);

    command.undo();
    expect(strokeDirection(beats[0])).toBeUndefined();

    command.redo();
    expect(strokeDirection(beats[0])).toBe(StrokeDirection.Down);
  });

  test("an edit that changes nothing is not executed", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    ScoreEditor.setBeatTechnique(beats, BeatGuitarTechniqueType.Stroke, down);
    const command = new SetBeatTechniqueCommand(
      positions(beats),
      BeatGuitarTechniqueType.Stroke,
      down
    );

    command.execute();

    expect(command.executed).toBe(false);
  });

  test("undoing a rest restores the stroke it removed", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    ScoreEditor.setBeatTechnique(beats, BeatGuitarTechniqueType.Stroke, down);
    const command = new SetRestCommand(beats, true);

    command.execute();
    expect(strokeDirection(beats[0])).toBeUndefined();

    command.undo();
    expect(strokeDirection(beats[0])).toBe(StrokeDirection.Down);
  });
});
