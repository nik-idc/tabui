import { MasterBar, Score } from "../../../model";
import {
  Command,
  AffectedModel,
  getAffectedModelsFromMasterBars,
} from "./command";

/** Updates a fixed set of bars, restoring each original tempo on undo. */
export class SetTempoCommand implements Command {
  /** Original tempos saved before execution. */
  private _before: number[] = [];
  private readonly _affectedModels: AffectedModel[];
  private _executed = false;

  constructor(
    score: Score,
    private readonly _bars: MasterBar[],
    /** Fixed tempo applied by execute and redo. */
    private readonly _after: number
  ) {
    this._affectedModels = getAffectedModelsFromMasterBars(score, _bars);
  }

  execute(): void {
    this._before = this._bars.map((b) => b.tempo);
    for (const bar of this._bars) {
      bar.tempo = this._after;
    }

    this._executed = true;
  }

  undo(): void {
    if (!this._executed) {
      return;
    }

    for (const [index, bar] of this._bars.entries()) {
      bar.tempo = this._before[index];
    }
  }

  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }

    for (const bar of this._bars) {
      bar.tempo = this._after;
    }
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
