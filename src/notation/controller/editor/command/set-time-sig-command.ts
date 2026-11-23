import { Score, MasterBar, NoteDuration, ScoreEditor } from "../../../model";
import type { TimeSignatureChange } from "../../../model/editor/score-editor";
import {
  Command,
  AffectedModel,
  getAffectedModelsFromMasterBars,
} from "./command";

/** Changes meter without moving notes, restoring mixed original meters on undo. */
export class SetTimeSigCommand implements Command {
  /** Original meters saved before execution. */
  private _before: TimeSignatureChange[] = [];
  /** Complete meters applied by execute and redo. */
  private _after: TimeSignatureChange[] = [];
  private readonly _affectedModels: AffectedModel[];
  private _executed = false;

  constructor(
    private readonly _score: Score,
    /** Fixed target bars; meter inputs are resolved when execution starts. */
    private readonly _bars: MasterBar[],
    /** Requested numerator, or undefined to keep each bar's value. */
    private readonly _beatsCount?: number,
    /** Requested beat unit, or undefined to keep each bar's value. */
    private readonly _duration?: NoteDuration
  ) {
    this._affectedModels = getAffectedModelsFromMasterBars(_score, _bars);
  }

  execute(): void {
    this._before = this._bars.map((masterBar) => ({
      masterBar,
      beatsCount: masterBar.beatsCount,
      duration: masterBar.duration,
    }));
    this._after = this._before.map((v) => ({
      masterBar: v.masterBar,
      beatsCount: this._beatsCount ?? v.beatsCount,
      duration: this._duration ?? v.duration,
    }));
    ScoreEditor.setTimeSignatures(this._score, this._after);
    this._executed = true;
  }

  undo(): void {
    if (!this._executed) {
      return;
    }
    ScoreEditor.setTimeSignatures(this._score, this._before);
  }

  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }
    ScoreEditor.setTimeSignatures(this._score, this._after);
  }

  public get affectedModels(): AffectedModel[] {
    return this._affectedModels;
  }
}
