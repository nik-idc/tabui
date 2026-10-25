import {
  Score,
  MasterBarArrayOperationOutput,
  ScoreEditor,
  BeatSnapshot,
} from "../../../model";
import {
  Command,
  AffectedModel,
  getAffectedModelsFromMasterBars,
} from "./command";

type RemoveBarsBefore = {
  bars: MasterBarArrayOperationOutput[];
  neighborSnapshots: BeatSnapshot[];
} | null;

/**
 * Remove bars command
 */
export class RemoveBarsCommand implements Command {
  /** Score */
  private _score: Score;
  /** Indices of removed bars */
  private _indices: number[];
  /** Removed bar graphs and separate surviving boundary content for undo. */
  private _before: RemoveBarsBefore = null;
  /** Fixed surviving content after removal. */
  private _after: BeatSnapshot[] = [];

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
    const affected = ScoreEditor.getBarEditBeats(this._score, this._indices);
    const neighbors = affected.filter((b) => {
      const index = this._score.masterBars.indexOf(b.voiceBar.bar.masterBar);
      return !this._indices.includes(index);
    });
    const neighborSnapshots = ScoreEditor.snapshotBeatNotes(neighbors);
    const bars = ScoreEditor.removeBars(this._score, this._indices);
    this._before = { bars, neighborSnapshots };
    this._after = ScoreEditor.snapshotBeatNotes(
      ScoreEditor.getLiveBeats(neighbors)
    );
  }

  /**
   * Undo remove bars command, i.e. restore removed bars
   */
  undo(): void {
    if (this._before === null) {
      return;
    }

    for (const removeResult of this._before.bars) {
      this._score.insertReadyMasterBar(
        removeResult.index,
        removeResult.masterBar,
        removeResult.bars
      );
    }
    ScoreEditor.restoreBeatSnapshots(this._before.neighborSnapshots);
  }

  /**
   * Redo, i.e. restore score state to before execute
   */
  redo(): void {
    if (this._before === null) {
      throw Error("Redo called before execute");
    }

    for (let i = this._indices.length - 1; i >= 0; i--) {
      this._score.removeMasterBar(this._indices[i]);
    }
    ScoreEditor.restoreBeatSnapshots(this._after);
  }

  /** Created master bar & staff bars or null if not created yet */
  public get removeResults(): MasterBarArrayOperationOutput[] | null {
    return this._before?.bars ?? null;
  }

  /** First created master bar & staff bars or null if not created yet */
  public get removeResult(): MasterBarArrayOperationOutput | null {
    return this._before?.bars[0] ?? null;
  }

  public get affectedModels(): AffectedModel[] {
    return [
      ...getAffectedModelsFromMasterBars(
        this._score,
        this._before?.neighborSnapshots.map((s) => s.voiceBar.bar.masterBar) ??
          []
      ),
      ...this._indices.map((masterBarIndex, i) => ({
        masterBarIndex,
        modelUUID:
          this._before?.bars[i]?.masterBar.uuid ??
          this._score.masterBars[masterBarIndex]?.uuid ??
          0,
      })),
    ];
  }
}
