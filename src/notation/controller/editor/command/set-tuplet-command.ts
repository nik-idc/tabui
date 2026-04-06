import { Beat, ScoreEditor, TupletSettings } from "@/notation/model";
import { Command } from "./command";

/**
 * Set beats tuplet settings
 */
export class SetTupletCommand implements Command {
  /** Beats whose dot value to set */
  private _beats: Beat[];
  /** New tuplet settings value */
  private _newTupletSettings: TupletSettings;
  /** Old tuplet settings map */
  private _oldTupletMap: Map<number, TupletSettings | null>;
  /** True if executed, false otherwise*/
  private _executed: boolean = false;

  /**
   * Set beats tuplet settings
   * @param beats Beats whose dot value to set
   * @param newTupletSettings New tuplet
   */
  constructor(beats: Beat[], newTupletSettings: TupletSettings) {
    this._beats = beats;
    this._newTupletSettings = newTupletSettings;

    this._oldTupletMap = new Map();
    for (const beat of this._beats) {
      this._oldTupletMap.set(beat.uuid, beat.tupletSettings);
    }
  }

  /**
   * Execute set tuplet settings command
   */
  execute(): void {
    ScoreEditor.setTuplet(this._beats, this._newTupletSettings);
    this._executed = true;
  }

  /**
   * Undo set tuplet settings - reset tuplet settings to old values
   */
  undo(): void {
    if (!this._executed) {
      return;
    }

    ScoreEditor.restoreTuplets(this._beats, this._oldTupletMap);
  }

  /**
   * Redo, i.e. restore beats tuplet settings state to before execute
   */
  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }

    ScoreEditor.setTuplet(this._beats, this._newTupletSettings);
  }
}
