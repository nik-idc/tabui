import { SetTechniqueCommand } from "../../src/notation/controller/editor/command";
import {
  BendTechniqueOptions,
  BendType,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
} from "../../src/notation/model";
import { createScoreGraph } from "../model/helpers";

describe("SetTechniqueCommand", () => {
  test("execute applies technique and undo restores previous techniques", () => {
    const { bar } = createScoreGraph();
    const note = bar.beats[0].notes[0] as GuitarNote;
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.LetRing));
    const command = new SetTechniqueCommand(
      [note],
      GuitarTechniqueType.Vibrato
    );

    command.execute();
    expect(command.executed).toBe(true);
    expect(note.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);
    expect(note.hasTechnique(GuitarTechniqueType.Vibrato)).toBe(true);

    command.undo();
    expect(note.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);
    expect(note.hasTechnique(GuitarTechniqueType.Vibrato)).toBe(false);

    command.redo();
    expect(note.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);
    expect(note.hasTechnique(GuitarTechniqueType.Vibrato)).toBe(true);
  });

  test("incompatible execute leaves executed false and undo is a no-op", () => {
    const { bar } = createScoreGraph();
    const note = bar.beats[0].notes[0] as GuitarNote;
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.LetRing));
    const command = new SetTechniqueCommand(
      [note],
      GuitarTechniqueType.PalmMute
    );

    command.execute();
    expect(command.executed).toBe(false);
    expect(note.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);
    expect(note.hasTechnique(GuitarTechniqueType.PalmMute)).toBe(false);

    command.undo();
    expect(note.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);
    expect(note.hasTechnique(GuitarTechniqueType.PalmMute)).toBe(false);

    expect(() => command.redo()).toThrow("Redo called before execute");
  });

  test("label-producing techniques are marked for vertical update", () => {
    const { bar } = createScoreGraph();
    const note = bar.beats[0].notes[0] as GuitarNote;

    const vibratoCommand = new SetTechniqueCommand(
      [note],
      GuitarTechniqueType.Vibrato
    );
    const bendCommand = new SetTechniqueCommand(
      [note],
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({ type: BendType.Bend })
    );
    const letRingCommand = new SetTechniqueCommand(
      [note],
      GuitarTechniqueType.LetRing
    );

    expect(vibratoCommand.isTechniqueLabelVerticalUpdate).toBe(true);
    expect(bendCommand.isTechniqueLabelVerticalUpdate).toBe(true);
    expect(letRingCommand.isTechniqueLabelVerticalUpdate).toBe(true);
  });

  test("inline non-label techniques are marked for targeted update", () => {
    const { bar } = createScoreGraph();
    const note = bar.beats[0].notes[0] as GuitarNote;

    const harmonicCommand = new SetTechniqueCommand(
      [note],
      GuitarTechniqueType.NaturalHarmonic
    );
    const slideCommand = new SetTechniqueCommand(
      [note],
      GuitarTechniqueType.Slide
    );

    expect(harmonicCommand.updateRequest).toEqual({
      updateType: "Targeted",
      affectedModelUUID: note.uuid,
    });
    expect(slideCommand.updateRequest).toEqual({
      updateType: "Targeted",
      affectedModelUUID: note.uuid,
    });
  });

  test("bend remains a vertical update because it produces a label", () => {
    const { bar } = createScoreGraph();
    const note = bar.beats[0].notes[0] as GuitarNote;
    const command = new SetTechniqueCommand(
      [note],
      GuitarTechniqueType.Bend,
      new BendTechniqueOptions({ type: BendType.Bend })
    );

    expect(command.updateRequest).toEqual({
      updateType: "Vertical",
      affectedModelUUIDs: [note.uuid],
    });
  });
});
