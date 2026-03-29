import { Command } from "./command";

/**
 * Command manager class
 */
export class CommandManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  /**
   * Execute provided command, push it the undo stack & clear redo stack
   * @param command
   */
  execute(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
  }

  /**
   * Undo command & put it into redo stack
   */
  undo(): void {
    const command = this.undoStack.pop();
    if (command !== undefined) {
      command.undo();
      this.redoStack.push(command);
    }
  }

  /**
   * Redo command
   */
  redo(): void {
    const command = this.redoStack.pop();
    if (command) {
      command.redo();
      this.undoStack.push(command);
    }
  }

  /**
   * Clears both undo & redo stacks
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /** True if can perform undo, false otherwise */
  public get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /** True if can perform redo, false otherwise */
  public get canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}
