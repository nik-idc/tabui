import { Command } from "./command";

/**
 * Command manager class
 */
export class CommandManager {
  private _undoStack: Command[] = [];
  private _redoStack: Command[] = [];

  /**
   * Execute a command and record it unless it explicitly reports no edit.
   * Recording a command clears redo history.
   * @param command
   */
  execute(command: Command): Command {
    command.execute();
    if (command.executed === false) {
      return command;
    }
    this._undoStack.push(command);
    this._redoStack = [];
    return command;
  }

  /**
   * Undo command & put it into redo stack
   */
  undo(): Command | undefined {
    const command = this._undoStack.pop();
    if (command !== undefined) {
      command.undo();
      this._redoStack.push(command);
    }
    return command;
  }

  /**
   * Redo command
   */
  redo(): Command | undefined {
    const command = this._redoStack.pop();
    if (command) {
      command.redo();
      this._undoStack.push(command);
    }
    return command;
  }

  /**
   * Clears both undo & redo stacks
   */
  clear(): void {
    this._undoStack = [];
    this._redoStack = [];
  }

  /** True if can perform undo, false otherwise */
  public get canUndo(): boolean {
    return this._undoStack.length > 0;
  }

  /** True if can perform redo, false otherwise */
  public get canRedo(): boolean {
    return this._redoStack.length > 0;
  }
}
