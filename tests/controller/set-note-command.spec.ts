import { SetNoteCommand } from "../../src/notation/controller/editor/command";
import { NoteValue } from "../../src/notation/model";
import { createScoreGraph } from "../model/helpers";

describe("SetNoteCommand", () => {
  test("execute, undo, and redo update note value and octave together", () => {
    const { bar } = createScoreGraph();
    const note = bar.beats[0].notes[0];
    const command = new SetNoteCommand(note, NoteValue.GSharp, 5);

    command.execute();
    expect(note.noteValue).toBe(NoteValue.GSharp);
    expect(note.octave).toBe(5);

    command.undo();
    expect(note.noteValue).toBe(NoteValue.None);
    expect(note.octave).toBeNull();

    command.redo();
    expect(note.noteValue).toBe(NoteValue.GSharp);
    expect(note.octave).toBe(5);
  });

  test("redo before execute throws", () => {
    const { bar } = createScoreGraph();
    const command = new SetNoteCommand(bar.beats[0].notes[0], NoteValue.C, 4);

    expect(() => command.redo()).toThrow("Redo called before execute");
  });
});
