import { CommandManager } from "../../../src/notation/controller/editor/command/command-manager";
import { SetFretCommand } from "../../../src/notation/controller/editor/command/set-fret-command";
import { SetTechniqueCommand } from "../../../src/notation/controller/editor/command/set-technique-command";
import {
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
} from "../../../src/notation/model";
import { createScoreGraph } from "../model/helpers";

function createHistory() {
  const { bar } = createScoreGraph();
  const beat = bar.getVoiceBar(1)?.beats[0];
  const note = beat?.notes?.[0];
  if (beat === undefined || !(note instanceof GuitarNote)) {
    throw Error("Expected a guitar note in the test beat");
  }

  return { manager: new CommandManager(), beat, note };
}

describe("CommandManager", () => {
  test("redo restores an undone edit and makes it undoable again", () => {
    const { manager, beat, note } = createHistory();
    const command = new SetFretCommand(beat, note.stringNum, 7);

    expect(manager.execute(command)).toBe(command);
    expect(note.fret).toBe(7);
    expect(manager.undo()).toBe(command);
    expect(note.fret).toBeNull();
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(true);

    expect(manager.redo()).toBe(command);
    expect(note.fret).toBe(7);
    expect(manager.canUndo).toBe(true);
    expect(manager.canRedo).toBe(false);

    manager.undo();
    expect(note.fret).toBeNull();
  });

  test("executing a new command after undo clears redo history", () => {
    const { manager, beat, note } = createHistory();
    note.fret = 5;
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.LetRing));
    const originalCommand = new SetFretCommand(beat, note.stringNum, 7);
    manager.execute(originalCommand);
    manager.undo();
    expect(manager.canRedo).toBe(true);

    const rejectedCommand = new SetTechniqueCommand(
      [note],
      GuitarTechniqueType.PalmMute
    );
    expect(manager.execute(rejectedCommand)).toBe(rejectedCommand);
    expect(rejectedCommand.executed).toBe(false);
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(true);
    expect(manager.redo()).toBe(originalCommand);
    expect(note.fret).toBe(7);

    manager.undo();
    expect(note.fret).toBe(5);
    expect(manager.canRedo).toBe(true);
    manager.execute(new SetFretCommand(beat, note.stringNum, 9));
    expect(note.fret).toBe(9);
    expect(manager.canUndo).toBe(true);
    expect(manager.canRedo).toBe(false);
    expect(manager.redo()).toBeUndefined();
    expect(note.fret).toBe(9);

    manager.undo();
    expect(note.fret).toBe(5);
    expect(manager.undo()).toBeUndefined();
  });

  test("multiple undo and redo operations preserve edit order", () => {
    const { manager, beat, note } = createHistory();
    const first = new SetFretCommand(beat, note.stringNum, 5);
    manager.execute(first);
    const second = new SetFretCommand(beat, note.stringNum, 9);
    manager.execute(second);
    expect(note.fret).toBe(9);

    expect(manager.undo()).toBe(second);
    expect(note.fret).toBe(5);
    expect(manager.undo()).toBe(first);
    expect(note.fret).toBeNull();
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(true);

    expect(manager.redo()).toBe(first);
    expect(note.fret).toBe(5);
    expect(manager.redo()).toBe(second);
    expect(note.fret).toBe(9);
    expect(manager.canUndo).toBe(true);
    expect(manager.canRedo).toBe(false);
  });

  test("clear discards both histories without reverting the current edit", () => {
    const { manager, beat, note } = createHistory();
    manager.execute(new SetFretCommand(beat, note.stringNum, 5));
    manager.execute(new SetFretCommand(beat, note.stringNum, 9));
    manager.undo();
    expect(manager.canUndo).toBe(true);
    expect(manager.canRedo).toBe(true);
    expect(note.fret).toBe(5);

    manager.clear();
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(false);
    expect(manager.undo()).toBeUndefined();
    expect(manager.redo()).toBeUndefined();
    expect(note.fret).toBe(5);

    manager.execute(new SetFretCommand(beat, note.stringNum, 12));
    manager.undo();
    expect(note.fret).toBe(5);
    expect(manager.undo()).toBeUndefined();
  });

  test("undo and redo are no-ops when corresponding history is empty", () => {
    const { manager, note } = createHistory();

    expect(manager.undo()).toBeUndefined();
    expect(manager.redo()).toBeUndefined();
    expect(note.fret).toBeNull();
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(false);
  });
});
