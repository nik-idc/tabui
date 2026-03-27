import {
  Score,
  MasterBarData,
  MasterBarArrayOperationOutput,
} from "@/notation/model";
import { Command } from "./command";

/**
 * Remove bar command
 */
export class RemoveBarCommand implements Command {
  /** Score */
  private _score: Score;
  /** Index of removeion */
  private _index: number;
  /** Created master bar & staff bars or null if not created yet */
  private _removeMasterBarResult: MasterBarArrayOperationOutput | null = null;

  /**
   * Remove bar command
   * @param score Score
   */
  constructor(score: Score, index: number) {
    this._score = score;
    this._index = index;
  }

  /**
   * Execute remove bar command
   */
  execute(): void {
    this._removeMasterBarResult = this._score.removeMasterBar(this._index);
  }

  /**
   * Undo remove bar command, i.e. delete removed bar
   */
  undo(): void {
    if (this._removeMasterBarResult === null) {
      return;
    }

    const masterBarIndex = this._score.masterBars.indexOf(
      this._removeMasterBarResult.masterBar
    );
    this._score.insertMasterBar(
      masterBarIndex,
      this._removeMasterBarResult.masterBar.barData
    );
  }

  /**
   * Redo, i.e. restore score state to before execute
   */
  redo(): void {
    if (this._removeMasterBarResult === null) {
      throw Error("Redo called before execute");
    }

    this._score.removeMasterBar(this._index);
  }

  /** Created master bar & staff bars or null if not created yet */
  public get removeResult(): MasterBarArrayOperationOutput | null {
    return this._removeMasterBarResult;
  }
}
