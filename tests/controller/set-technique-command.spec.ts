import { SetTechniqueCommand } from "../../src/notation/controller/editor/command";
import {
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
});
