import { BarRepeatStatus, MasterBar, Track } from "@/notation/model";
import { Command, AffectedModel } from "./command";

/**
 * Set bar repeat status command
 */
export class SetRepeatStatusCommand implements Command {
  /** Master bar whose repeat status is changed. */
  private _bar: MasterBar;
  /** Track whose rendered staff bars should be refreshed. */
  private _track: Track;
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
  constructor(bar: MasterBar, newRepeatStatus: BarRepeatStatus, track: Track) {
    this._bar = bar;
    this._track = track;
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

  public get affectedModels(): AffectedModel[] {
    const masterBarIndex = this._track.score.masterBars.indexOf(this._bar);

    return this._track.staves.map((staff) => ({
      masterBarIndex,
      modelUUID: staff.bars[masterBarIndex].uuid,
    }));
  }
}
