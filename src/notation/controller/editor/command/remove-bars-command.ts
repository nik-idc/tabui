import {
  Score,
  MasterBarArrayOperationOutput,
  ScoreEditor,
} from "../../../model";
import { Command, AffectedModel } from "./command";

/**
 * Remove bars command
 */
export class RemoveBarsCommand implements Command {
  /** Score */
  private _score: Score;
  /** Indices of removed bars */
  private _indices: number[];
  /** Created master bar & staff bars or null if not created yet */
  private _removeMasterBarResults: MasterBarArrayOperationOutput[] | null =
    null;

  /**
   * Remove bars command
   * @param score Score
   */
  constructor(score: Score, indices: number | number[]) {
    this._score = score;
    this._indices = Array.isArray(indices)
      ? Array.from(new Set(indices)).sort((a, b) => a - b)
      : [indices];
  }

  /**
   * Execute remove bars command
   */
  execute(): void {
    this._removeMasterBarResults = ScoreEditor.removeBars(
      this._score,
      this._indices
    );
  }

  /**
   * Undo remove bars command, i.e. restore removed bars
   */
  undo(): void {
    if (this._removeMasterBarResults === null) {
      return;
    }

    for (const removeResult of this._removeMasterBarResults) {
      this._score.insertReadyMasterBar(
        removeResult.index,
        removeResult.masterBar,
        removeResult.bars
      );
    }
  }

  /**
   * Redo, i.e. restore score state to before execute
   */
  redo(): void {
    if (this._removeMasterBarResults === null) {
      throw Error("Redo called before execute");
    }

    for (let i = this._indices.length - 1; i >= 0; i--) {
      this._score.removeMasterBar(this._indices[i]);
    }
  }

  /** Created master bar & staff bars or null if not created yet */
  public get removeResults(): MasterBarArrayOperationOutput[] | null {
    return this._removeMasterBarResults;
  }

  /** First created master bar & staff bars or null if not created yet */
  public get removeResult(): MasterBarArrayOperationOutput | null {
    return this._removeMasterBarResults?.[0] ?? null;
  }

  public get affectedModels(): AffectedModel[] {
    return this._indices.map((masterBarIndex, i) => ({
      masterBarIndex,
      modelUUID:
        this._removeMasterBarResults?.[i]?.masterBar.uuid ??
        this._score.masterBars[masterBarIndex]?.uuid ??
        0,
    }));
  }
}
