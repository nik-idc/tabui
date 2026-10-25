import {
  BarRepeatStatusChange,
  MasterBar,
  MasterBarData,
  Track,
} from "../../../model";
import { Command, AffectedModel } from "./command";

/** Complete repeat settings, independent of the operation that produced them. */
type RepeatState = Pick<
  MasterBarData,
  "isRepeatStart" | "isRepeatEnd" | "repeatCount"
>;

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
  /** Complete repeat settings saved before execution. */
  private _before: RepeatState | null = null;
  /** Fixed completed settings restored without repeating the edit rule. */
  private _after: RepeatState | null = null;

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
  }

  /**
   * Execute set repeat status command
   */
  execute(): void {
    this._before = this.snapshot();
    this._bar.setRepeatStatus(this._change);
    this._after = this.snapshot();
  }

  /**
   * Undo set repeat status command, i.e. set old repeat status value
   */
  undo(): void {
    if (this._before === null) {
      return;
    }

    this.restore(this._before);
  }

  /**
   * Redo, i.e. restore bar state to before execute
   */
  redo(): void {
    if (this._after === null) {
      throw Error("Redo called before execute");
    }

    this.restore(this._after);
  }

  private snapshot(): RepeatState {
    return {
      isRepeatStart: this._bar.isRepeatStart,
      isRepeatEnd: this._bar.isRepeatEnd,
      repeatCount: this._bar.repeatCount,
    };
  }

  private restore(state: RepeatState): void {
    this._bar.isRepeatStart = state.isRepeatStart;
    this._bar.isRepeatEnd = state.isRepeatEnd;
    if (state.repeatCount !== null) {
      this._bar.repeatCount = state.repeatCount;
    }
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
