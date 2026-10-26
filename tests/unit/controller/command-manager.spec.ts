import { CommandManager } from "../../../src/notation/controller/editor/command/command-manager";
import type { Command } from "../../../src/notation/controller/editor/command/command";
import { SetFretCommand } from "../../../src/notation/controller/editor/command/set-fret-command";
import { GuitarNote } from "../../../src/notation/model";
import { createScoreGraph } from "../model/helpers";
import { required } from "../required";

function createHistory() {
  const { bar } = createScoreGraph();
  const beat = bar.getVoiceBar(1)?.beats[0];
  const note = beat?.notes?.[0];
  if (beat === undefined || !(note instanceof GuitarNote)) {
    throw Error("Expected a guitar note in the test beat");
  }
  return { manager: new CommandManager(), beat, note };
}

function currentFret(note: GuitarNote): number | null {
  return (required(note.beat.notes)[note.stringNum - 1] as GuitarNote).fret;
}

describe("CommandManager", () => {
  test("redo restores an undone edit and makes it undoable again", () => {
    const { manager, beat, note } = createHistory();
    const command = new SetFretCommand(beat, note.stringNum, 7);

    expect(manager.execute(command)).toBe(command);
    expect(currentFret(note)).toBe(7);
    expect(manager.undo()).toBe(command);
    expect(currentFret(note)).toBeNull();
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(true);

    expect(manager.redo()).toBe(command);
    expect(currentFret(note)).toBe(7);
    expect(manager.canUndo).toBe(true);
    expect(manager.canRedo).toBe(false);

    manager.undo();
    expect(currentFret(note)).toBeNull();
  });

  test("rejected commands preserve redo, but a new edit clears it", () => {
    const { manager, beat, note } = createHistory();
    note.setFret(5);
    const originalCommand = new SetFretCommand(beat, note.stringNum, 7);
    manager.execute(originalCommand);
    manager.undo();
    expect(manager.canRedo).toBe(true);

    const rejectedCommand: Command = {
      executed: false,
      affectedModels: [],
      execute() {},
      undo() {},
      redo() {},
    };
    expect(manager.execute(rejectedCommand)).toBe(rejectedCommand);
    expect(rejectedCommand.executed).toBe(false);
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(true);
    expect(manager.redo()).toBe(originalCommand);
    expect(currentFret(note)).toBe(7);

    manager.undo();
    expect(currentFret(note)).toBe(5);
    expect(manager.canRedo).toBe(true);
    manager.execute(new SetFretCommand(beat, note.stringNum, 9));
    expect(currentFret(note)).toBe(9);
    expect(manager.canUndo).toBe(true);
    expect(manager.canRedo).toBe(false);
    expect(manager.redo()).toBeUndefined();
    expect(currentFret(note)).toBe(9);

    manager.undo();
    expect(currentFret(note)).toBe(5);
    expect(manager.undo()).toBeUndefined();
  });

  test("multiple undo and redo operations preserve edit order", () => {
    const { manager, beat, note } = createHistory();
    const first = new SetFretCommand(beat, note.stringNum, 5);
    manager.execute(first);
    const second = new SetFretCommand(beat, note.stringNum, 9);
    manager.execute(second);
    expect(currentFret(note)).toBe(9);

    expect(manager.undo()).toBe(second);
    expect(currentFret(note)).toBe(5);
    expect(manager.undo()).toBe(first);
    expect(currentFret(note)).toBeNull();
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(true);

    expect(manager.redo()).toBe(first);
    expect(currentFret(note)).toBe(5);
    expect(manager.redo()).toBe(second);
    expect(currentFret(note)).toBe(9);
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
    expect(currentFret(note)).toBe(5);

    manager.clear();
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(false);
    expect(manager.undo()).toBeUndefined();
    expect(manager.redo()).toBeUndefined();
    expect(currentFret(note)).toBe(5);

    manager.execute(new SetFretCommand(beat, note.stringNum, 12));
    manager.undo();
    expect(currentFret(note)).toBe(5);
    expect(manager.undo()).toBeUndefined();
  });

  test("undo and redo are no-ops when corresponding history is empty", () => {
    const { manager, note } = createHistory();
    expect(manager.undo()).toBeUndefined();
    expect(manager.redo()).toBeUndefined();
    expect(currentFret(note)).toBeNull();
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(false);
  });
});
