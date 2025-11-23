import { Bar, Beat, ScoreEditor } from "@/notation/model";
import { Command } from "./command";

/**
 * Replace beats command
 */
export class ReplaceBeatsCommand implements Command {
  /** Beats to be replaced */
  private _beatsToReplace: Beat[];
  /** New beats */
  private _newBeats: Beat[];
  /** True if executed, false otherwise */
  private _executed: boolean = false;

  /**
   * Replace beats command
   * @param beatsToReplace Beats to be replaced
   * @param newBeats New beats
   */
  constructor(beatsToReplace: Beat[], newBeats: Beat[]) {
    this._beatsToReplace = beatsToReplace;
    this._newBeats = newBeats;
  }

  /**
   * Execute replace beats command
   */
  execute(): void {
    ScoreEditor.replaceBeats(this._beatsToReplace, this._newBeats);

    this._executed = true;
  }

  /**
   * Undo replace beats command, i.e. replace new beats with old ones
   */
  undo(): void {
    if (!this._executed) {
      return;
    }

    ScoreEditor.replaceBeats(this._newBeats, this._beatsToReplace);
  }

  /**
   * Redo, i.e. restore staff state to before execute
   */
  redo(): void {
    if (!this._executed) {
      return;
    }

    ScoreEditor.replaceBeats(this._beatsToReplace, this._newBeats);
  }
}
