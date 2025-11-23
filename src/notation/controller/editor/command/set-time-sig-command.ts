import {
  Score,
  Beat,
  ScoreEditor,
  BeatArrayOperationOutput,
  Bar,
  MasterBar,
  NoteDuration,
} from "@/notation/model";
import { Command } from "./command";

/**
 * Set bar time signature command
 */
export class SetTimeSigCommand implements Command {
  /** Bar to append the beat to */
  private _bar: MasterBar;
  /** New beats count value */
  private _newBeatsCount?: number;
  /** New duration value */
  private _newDuration?: NoteDuration;
  /** New beats count value */
  private _oldBeatsCount: number;
  /** New duration value */
  private _oldDuration: NoteDuration;
  /** True if executed, false otherwise*/
  private _executed: boolean = false;

  /**
   * Set guitar bar timeSig command
   * @param bar Bar whose timeSig to set
   */

  /**
   * Set guitar bar time signature command
   * @param bar Bar whose time signature to set
   * @param beatsCount Time signature beats count
   * @param duration Time signature duration
   */
  constructor(bar: MasterBar, beatsCount?: number, duration?: NoteDuration) {
    this._bar = bar;
    this._newBeatsCount = beatsCount;
    this._newDuration = duration;
    this._oldBeatsCount = bar.beatsCount;
    this._oldDuration = bar.duration;
  }

  /**
   * Execute set timeSig command
   */
  execute(): void {
    if (this._newBeatsCount !== undefined) {
      this._bar.beatsCount = this._newBeatsCount;
    }
    if (this._newDuration !== undefined) {
      this._bar.duration = this._newDuration;
    }
    this._executed = true;
  }

  /**
   * Undo set timeSig command, i.e. set old timeSig value
   */
  undo(): void {
    if (!this._executed) {
      return;
    }

    this._bar.beatsCount = this._oldBeatsCount;
    this._bar.duration = this._oldDuration;
  }

  /**
   * Redo, i.e. restore bar state to before execute
   */
  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }

    if (this._newBeatsCount !== undefined) {
      this._bar.beatsCount = this._newBeatsCount;
    }
    if (this._newDuration !== undefined) {
      this._bar.duration = this._newDuration;
    }
  }
}
