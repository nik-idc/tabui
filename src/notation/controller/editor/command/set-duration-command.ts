import { Beat, ScoreEditor, NoteDuration } from "@/notation/model";
import { Command } from "./command";

/**
 * Set beats duration
 */
export class SetDurationCommand implements Command {
  /** Beats whose dot value to set */
  private _beats: Beat[];
  /** New duration value */
  private _newDuration: NoteDuration;
  /** Old duration map */
  private _oldDurationMap: Map<number, NoteDuration>;
  /** True if executed, false otherwise*/
  private _executed: boolean = false;

  /**
   * Set beats duration
   * @param beats Beats whose dot value to set
   * @param newDuration New tuplet
   */
  constructor(beats: Beat[], newDuration: NoteDuration) {
    this._beats = beats;
    this._newDuration = newDuration;

    this._oldDurationMap = new Map();
    for (const beat of this._beats) {
      this._oldDurationMap.set(beat.uuid, beat.baseDuration);
    }
  }

  /**
   * Execute set duration command
   */
  execute(): void {
    ScoreEditor.setDurations(this._beats, this._newDuration);
    this._executed = true;
  }

  /**
   * Undo set duration - reset duration to old values
   */
  undo(): void {
    if (!this._executed) {
      return;
    }

    ScoreEditor.restoreDurations(this._beats, this._oldDurationMap);
  }

  /**
   * Redo, i.e. restore beats duration state to before execute
   */
  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }

    ScoreEditor.setDurations(this._beats, this._newDuration);
  }
}
