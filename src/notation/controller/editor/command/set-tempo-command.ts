import { MasterBar, Score } from "../../../model";
import {
  Command,
  AffectedModel,
  getAffectedModelsFromMasterBars,
} from "./command";

/** Updates a fixed set of bars, restoring each original tempo on undo. */
export class SetTempoCommand implements Command {
  private readonly _oldTempos: number[];
  private readonly _affectedModels: AffectedModel[];
  private _executed = false;

  constructor(
    score: Score,
    private readonly _bars: MasterBar[],
    private readonly _newTempo: number
  ) {
    this._oldTempos = _bars.map((v) => v.tempo);
    this._affectedModels = getAffectedModelsFromMasterBars(score, _bars);
  }

  execute(): void {
    for (const bar of this._bars) {
      bar.tempo = this._newTempo;
    }

    this._executed = true;
  }

  undo(): void {
    if (!this._executed) {
      return;
    }

    for (const [index, bar] of this._bars.entries()) {
      bar.tempo = this._oldTempos[index];
    }
  }

  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }

    this.execute();
  }

  public get executed(): boolean {
    return this._executed;
  }
  public get affectsTempoVisibility(): boolean {
    return this._affectedModels.length > 0;
  }
  public get affectedModels(): AffectedModel[] {
    return this._affectedModels;
  }
}
