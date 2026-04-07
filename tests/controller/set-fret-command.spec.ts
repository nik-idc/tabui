import { SetFretCommand } from "../../src/notation/controller/editor/command";
import { GuitarNote } from "../../src/notation/model";
import { createScoreGraph } from "../model/helpers";

describe("SetFretCommand", () => {
  test("execute, undo, and redo update fret", () => {
    const { bar } = createScoreGraph();
    const note = bar.beats[0].notes[0] as GuitarNote;
    const command = new SetFretCommand(note, 7);

    command.execute();
    expect(note.fret).toBe(7);

    command.undo();
    expect(note.fret).toBeNull();

    command.redo();
    expect(note.fret).toBe(7);
  });

  test("supports clearing fret with null", () => {
    const { bar } = createScoreGraph();
    const note = bar.beats[0].notes[0] as GuitarNote;
    note.fret = 9;
    const command = new SetFretCommand(note, null);

    command.execute();
    expect(note.fret).toBeNull();

    command.undo();
    expect(note.fret).toBe(9);

    command.redo();
    expect(note.fret).toBeNull();
  });

  test("redo before execute throws", () => {
    const { bar } = createScoreGraph();
    const note = bar.beats[0].notes[0] as GuitarNote;
    const command = new SetFretCommand(note, 5);

    expect(() => command.redo()).toThrow("Redo called before execute");
  });
});
