import {
  Score,
  Beat,
  ScoreEditor,
  BeatArrayOperationOutput,
  Bar,
  MasterBar,
  BarRepeatStatus,
} from "@/notation/model";
import { Command } from "./command";

/**
 * Set bar repeat status command
 */
export class SetRepeatStatusCommand implements Command {
  /** Bar to append the beat to */
  private _bar: MasterBar;
  /** New repeat status value */
  private _newRepeatStatus: BarRepeatStatus;
  /** Old repeat status value */
  private _oldRepeatStatus: BarRepeatStatus;
  /** True if executed, false otherwise*/
  private _executed: boolean = false;

  /**
   * Set guitar bar repeat status command
   * @param bar Bar whose repeat status to set
   * @param newRepeatStatus New repeat status value
   */
  constructor(bar: MasterBar, newRepeatStatus: BarRepeatStatus) {
    this._bar = bar;
    this._newRepeatStatus = newRepeatStatus;
    this._oldRepeatStatus = bar.repeatStatus;
  }

  /**
   * Execute set repeat status command
   */
  execute(): void {
    this._bar.repeatStatus = this._newRepeatStatus;
    this._executed = true;
  }

  /**
   * Undo set repeat status command, i.e. set old repeat status value
   */
  undo(): void {
    if (!this._executed) {
      return;
    }

    this._bar.repeatStatus = this._oldRepeatStatus;
  }

  /**
   * Redo, i.e. restore bar state to before execute
   */
  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }

    this._bar.repeatStatus = this._newRepeatStatus;
  }
}
