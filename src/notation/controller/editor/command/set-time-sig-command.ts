import { Score, MasterBar, NoteDuration, ScoreEditor } from "../../../model";
import type { TimeSignatureChange } from "../../../model/editor/score-editor";
import {
  Command,
  AffectedModel,
  getAffectedModelsFromMasterBars,
} from "./command";

/** Changes meter without moving notes, restoring mixed original meters on undo. */
export class SetTimeSigCommand implements Command {
  private readonly _oldValues: TimeSignatureChange[];
  private readonly _newValues: TimeSignatureChange[];
  private readonly _affectedModels: AffectedModel[];
  private _executed = false;

  constructor(
    private readonly _score: Score,
    bars: MasterBar[],
    beatsCount?: number,
    duration?: NoteDuration
  ) {
    this._oldValues = bars.map((masterBar) => ({
      masterBar,
      beatsCount: masterBar.beatsCount,
      duration: masterBar.duration,
    }));
    this._newValues = this._oldValues.map((v) => ({
      masterBar: v.masterBar,
      beatsCount: beatsCount ?? v.beatsCount,
      duration: duration ?? v.duration,
    }));
    this._affectedModels = getAffectedModelsFromMasterBars(_score, bars);
  }

  execute(): void {
    ScoreEditor.setTimeSignatures(this._score, this._newValues);
    this._executed = true;
  }

  undo(): void {
    if (!this._executed) return;
    ScoreEditor.setTimeSignatures(this._score, this._oldValues);
  }

  redo(): void {
    if (!this._executed) throw Error("Redo called before execute");
    this.execute();
  }

  public get affectedModels(): AffectedModel[] {
    return this._affectedModels;
  }
}
