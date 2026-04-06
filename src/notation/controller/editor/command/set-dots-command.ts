import { Beat, ScoreEditor } from "@/notation/model";
import { Command } from "./command";

/**
 * Set beats dots
 */
export class SetDotsCommand implements Command {
  /** Beats whose dot value to set */
  private _beats: Beat[];
  /** New dots value */
  private _newDots: number;
  /** Old dots map */
  private _oldDotsMap: Map<number, number>;
  /** True if executed, false otherwise*/
  private _executed: boolean = false;

  /**
   * Set beats dots
   * @param beats Beats whose dot value to set
   * @param newDots New dots value
   */
  constructor(beats: Beat[], newDots: number) {
    this._beats = beats;
    this._newDots = newDots;

    this._oldDotsMap = new Map();
    for (const beat of this._beats) {
      this._oldDotsMap.set(beat.uuid, beat.dots);
    }
  }

  /**
   * Execute set dots command
   */
  execute(): void {
    ScoreEditor.setDots(this._beats, this._newDots);
    this._executed = true;
  }

  /**
   * Undo set dots - reset dots to old values
   */
  undo(): void {
    if (!this._executed) {
      return;
    }

    ScoreEditor.restoreDots(this._beats, this._oldDotsMap);
  }

  /**
   * Redo, i.e. restore beats dots state to before execute
   */
  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }

    ScoreEditor.setDots(this._beats, this._newDots);
  }
}
