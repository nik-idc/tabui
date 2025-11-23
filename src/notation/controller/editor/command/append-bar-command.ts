import {
  Score,
  MasterBarData,
  MasterBarArrayOperationOutput,
} from "@/notation/model";
import { Command } from "./command";

/**
 * Append bar command
 */
export class AppendBarCommand implements Command {
  /** Score */
  private _score: Score;
  /** Data of the master bar to add */
  private _masterBarData: MasterBarData;
  /** Created master bar & staff bars or null if not created yet */
  private _appendMasterBarResult: MasterBarArrayOperationOutput | null = null;

  /**
   * Add bar command
   * @param score Score
   * @param masterBarData Data of the master bar to add
   */
  constructor(score: Score, masterBarData: MasterBarData) {
    this._score = score;
    this._masterBarData = masterBarData;
  }

  /**
   * Execute add bar command
   */
  execute(): void {
    this._appendMasterBarResult = this._score.appendMasterBar(
      this._masterBarData
    );
  }

  /**
   * Undo add bar command, i.e. delete added bar
   */
  undo(): void {
    if (this._appendMasterBarResult === null) {
      return;
    }

    const masterBarIndex = this._score.masterBars.indexOf(
      this._appendMasterBarResult.masterBar
    );
    this._score.removeMasterBar(masterBarIndex);
  }

  /**
   * Redo, i.e. restore score state to before execute
   */
  redo(): void {
    if (this._appendMasterBarResult === null) {
      throw Error("Redo called before execute");
    }

    this._score.insertReadyMasterBar(
      this._appendMasterBarResult.index,
      this._appendMasterBarResult.masterBar,
      this._appendMasterBarResult.bars
    );
  }

  /** Created master bar & staff bars or null if not created yet */
  public get appendResult(): MasterBarArrayOperationOutput | null {
    return this._appendMasterBarResult;
  }
}
