import type { AffectedModel, Command } from "./command";
import type { SelectionHistorySnapshot } from "../../selection/selection-cursor";
import type { SelectionManager } from "../../selection/selection-manager";

/**
 * Adds selection history and complete-edit handling around one model command.
 * Snapshots are captured once and reused for every undo and redo.
 */
export class SelectionHistoryCommand implements Command {
  /** Selection state before execution, reused for every undo. */
  private _selectionBefore?: SelectionHistorySnapshot;
  /** Selection state after execution, reused for every redo. */
  private _selectionAfter?: SelectionHistorySnapshot;
  /** Whether the wrapped command is currently applied. */
  private _applied = false;

  constructor(
    private readonly _command: Command,
    private readonly _selectionManager: SelectionManager,
    private readonly _complete?: () => void,
    selectionBefore?: SelectionHistorySnapshot
  ) {
    this._selectionBefore = selectionBefore;
  }

  public get executed(): boolean {
    return this._applied;
  }

  public get affectedModels(): AffectedModel[] {
    return this._command.affectedModels;
  }

  public execute(): void {
    if (this._selectionBefore === undefined) {
      this._selectionBefore = this._selectionManager.captureHistorySnapshot();
    }

    this._command.execute();
    if (this._command.executed === false) {
      this._applied = false;
      return;
    }

    this._applied = true;
    this._complete?.();
    this._selectionAfter = this._selectionManager.captureHistorySnapshot();
  }

  public undo(): void {
    this._command.undo();
    this.restore(this._selectionBefore, this._selectionAfter);
  }

  public redo(): void {
    this._command.redo();
    this.restore(this._selectionAfter, this._selectionBefore);
  }

  private restore(
    selection: SelectionHistorySnapshot | undefined,
    opposite: SelectionHistorySnapshot | undefined
  ): void {
    if (selection === undefined || opposite === undefined) {
      throw Error("Selection history is incomplete");
    }
    this._selectionManager.restoreHistorySnapshot(selection, opposite);
  }
}
