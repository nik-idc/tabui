import { MasterBar, BarRepeatStatus } from "@/notation/model";
import { Command, CommandUpdateRequest } from "./command";

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
  /** Index of the affected master bar */
  private _affectedMasterBarIndex: number;

  /**
   * Set guitar bar repeat status command
   * @param bar Bar whose repeat status to set
   * @param newRepeatStatus New repeat status value
   */
  constructor(
    bar: MasterBar,
    newRepeatStatus: BarRepeatStatus,
    affectedMasterBarIndex: number
  ) {
    this._bar = bar;
    this._newRepeatStatus = newRepeatStatus;
    this._oldRepeatStatus = bar.repeatStatus;
    this._affectedMasterBarIndex = affectedMasterBarIndex;
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

  public get updateRequest(): CommandUpdateRequest {
    return {
      updateType: "Horizontal",
      affectedMasterBarIndices: [this._affectedMasterBarIndex],
      firstAffectedMasterBarIndex: this._affectedMasterBarIndex,
      reason: "repeat-status",
    };
  }
}
