import {
  Score,
  GuitarNote,
  Beat,
  ScoreEditor,
  BeatArrayOperationOutput,
  NoteDuration,
} from "@/notation/model";
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
    for (const beat of this._beats) {
      ScoreEditor.setDuration(beat, this._newDuration);
    }
    this._executed = true;
  }

  /**
   * Undo set duration - reset duration to old values
   */
  undo(): void {
    if (!this._executed) {
      return;
    }

    for (const beat of this._beats) {
      const oldDuration = this._oldDurationMap.get(beat.uuid);
      ScoreEditor.setDuration(
        beat,
        oldDuration === undefined ? NoteDuration.Quarter : oldDuration
      );
    }
  }

  /**
   * Redo, i.e. restore beats duration state to before execute
   */
  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }

    for (const beat of this._beats) {
      ScoreEditor.setDuration(beat, this._newDuration);
    }
  }
}
