import { Beat, ScoreEditor, TupletSettings } from "../../../model";
import { Command, AffectedModel, getAffectedModelsFromBeats } from "./command";

/**
 * Set beats tuplet settings
 */
export class SetTupletCommand implements Command {
  /** Beats whose dot value to set */
  private _beats: Beat[];
  /** Fixed tuplet settings applied by execute and redo. */
  private _after: TupletSettings | null;
  /** Original tuplet settings saved before execution. */
  private _before: Map<number, TupletSettings | null> = new Map();
  /** True if executed, false otherwise*/
  private _executed: boolean = false;
  private _affectedModels: AffectedModel[];

  /**
   * Set beats tuplet settings
   * @param beats Beats whose dot value to set
   * @param newTupletSettings New tuplet
   */
  constructor(beats: Beat[], newTupletSettings: TupletSettings | null) {
    this._beats = beats;
    this._after = newTupletSettings;
    this._affectedModels = getAffectedModelsFromBeats(beats);
  }

  /**
   * Execute set tuplet settings command
   */
  execute(): void {
    this._before = new Map(this._beats.map((b) => [b.uuid, b.tupletSettings]));
    ScoreEditor.setTuplet(this._beats, this._after);
    this._executed = true;
  }

  /**
   * Undo set tuplet settings - reset tuplet settings to old values
   */
  undo(): void {
    if (!this._executed) {
      return;
    }

    ScoreEditor.restoreTuplets(this._beats, this._before);
  }

  /**
   * Redo, i.e. restore beats tuplet settings state to before execute
   */
  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }

    ScoreEditor.setTuplet(this._beats, this._after);
  }

  public get affectedModels(): AffectedModel[] {
    return this._affectedModels;
  }
}
