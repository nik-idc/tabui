import { BarRepeatStatus, MasterBar, Track } from "../../../model";
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
  private _newRepeatCount: number;
  /** Old repeat boundary values */
  private _oldRepeatStart: boolean;
  private _oldRepeatEnd: boolean;
  private _oldRepeatCount: number | null;
  /** True if executed, false otherwise*/
  private _executed: boolean = false;

  /**
   * Set guitar bar repeat status command
   * @param bar Bar whose repeat status to set
   * @param newRepeatStatus New repeat status value
   */
  constructor(
    bar: MasterBar,
    newRepeatStatus: BarRepeatStatus,
    track: Track,
    newRepeatCount: number = 2
  ) {
    this._bar = bar;
    this._track = track;
    this._newRepeatStatus = newRepeatStatus;
    this._newRepeatCount = newRepeatCount;
    this._oldRepeatStart = bar.isRepeatStart;
    this._oldRepeatEnd = bar.isRepeatEnd;
    this._oldRepeatCount = bar.repeatCount;
  }

  /**
   * Execute set repeat status command
   */
  execute(): void {
    this._bar.toggleRepeatBoundary(this._newRepeatStatus, this._newRepeatCount);
    this._executed = true;
  }

  /**
   * Undo set repeat status command, i.e. set old repeat status value
   */
  undo(): void {
    if (!this._executed) {
      return;
    }

    this._bar.isRepeatStart = this._oldRepeatStart;
    this._bar.isRepeatEnd = this._oldRepeatEnd;
    if (this._oldRepeatEnd && this._oldRepeatCount !== null) {
      this._bar.repeatCount = this._oldRepeatCount;
    }
  }

  /**
   * Redo, i.e. restore bar state to before execute
   */
  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }

    this._bar.toggleRepeatBoundary(this._newRepeatStatus, this._newRepeatCount);
  }

  public get affectedModels(): AffectedModel[] {
    const masterBarIndex = this._track.score.masterBars.indexOf(this._bar);

    return this._track.staves.map((staff) => ({
      masterBarIndex,
      modelUUID: staff.bars[masterBarIndex].uuid,
    }));
  }
}
