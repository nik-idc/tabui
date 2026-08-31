import {
  BarRepeatStatus,
  BarRepeatStatusChange,
  MasterBar,
  Track,
} from "../../../model";
import { Command, AffectedModel } from "./command";

/**
 * Set bar repeat status command
 */
export class SetRepeatStatusCommand implements Command {
  /** Master bar whose repeat status is changed. */
  private _bar: MasterBar;
  /** Track whose rendered staff bars should be refreshed. */
  private _track: Track;
  /** Desired repeat status state. */
  private _change: BarRepeatStatusChange;
  /** Old repeat start value */
  private _oldRepeatStart: boolean;
  /** Old repeat end value */
  private _oldRepeatEnd: boolean;
  /** Old repeat count value */
  private _oldRepeatCount: number | null;
  /** True if executed, false otherwise */
  private _executed: boolean = false;

  /**
   * Set guitar bar repeat status command
   * @param bar Bar whose repeat status to set
   * @param change Desired repeat status state
   * @param track Track whose rendered bars must refresh
   */
  constructor(bar: MasterBar, change: BarRepeatStatusChange, track: Track) {
    this._bar = bar;
    this._track = track;
    this._change = change;
    this._oldRepeatStart = bar.isRepeatStart;
    this._oldRepeatEnd = bar.isRepeatEnd;
    this._oldRepeatCount = bar.repeatCount;
  }

  /**
   * Execute set repeat status command
   */
  execute(): void {
    this._bar.setRepeatStatus(this._change);
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

    this._bar.setRepeatStatus(this._change);
  }

  public get affectedModels(): AffectedModel[] {
    return this._track.staves.flatMap((s) =>
      s.bars.map((b, bi) => ({
        masterBarIndex: bi,
        modelUUID: b.uuid,
      }))
    );
  }
}
