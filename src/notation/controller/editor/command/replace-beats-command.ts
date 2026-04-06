import { Beat, ScoreEditor } from "@/notation/model";
import { Command } from "./command";

/**
 * Replace beats command
 */
export class ReplaceBeatsCommand implements Command {
  /** Beats to be replaced */
  private _beatsToReplace: Beat[];
  /** New beats */
  private _newBeats: Beat[];
  /** Snapshot of original beats for undo */
  private _oldBeatSnapshots: Beat[];
  /** Beats currently present in the bar after execute/redo */
  private _currentBeats: Beat[];
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
    this._oldBeatSnapshots = beatsToReplace.map((beat) => beat.deepCopy());
    this._currentBeats = beatsToReplace;
  }

  /**
   * Execute replace beats command
   */
  execute(): void {
    this._currentBeats = ScoreEditor.replaceBeats(
      this._beatsToReplace,
      this._newBeats
    );

    this._executed = true;
  }

  /**
   * Undo replace beats command, i.e. replace new beats with old ones
   */
  undo(): void {
    if (!this._executed) {
      return;
    }

    this._currentBeats = ScoreEditor.replaceBeats(
      this._currentBeats,
      this._oldBeatSnapshots
    );
  }

  /**
   * Redo, i.e. restore staff state to before execute
   */
  redo(): void {
    if (!this._executed) {
      return;
    }

    this._currentBeats = ScoreEditor.replaceBeats(
      this._currentBeats,
      this._newBeats
    );
  }
}
