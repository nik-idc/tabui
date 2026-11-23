import { Beat, ScoreEditor, NoteDuration } from "../../../model";
import { Command, AffectedModel, getAffectedModelsFromBeats } from "./command";

/**
 * Set beats duration
 */
export class SetDurationCommand implements Command {
  /** Beats whose dot value to set */
  private _beats: Beat[];
  /** Fixed duration applied by execute and redo. */
  private _after: NoteDuration;
  /** Original durations saved before execution. */
  private _before: Map<number, NoteDuration> = new Map();
  /** True if executed, false otherwise*/
  private _executed: boolean = false;
  private _affectedModels: AffectedModel[];

  /**
   * Set beats duration
   * @param beats Beats whose dot value to set
   * @param newDuration New tuplet
   */
  constructor(beats: Beat[], newDuration: NoteDuration) {
    this._beats = beats;
    this._after = newDuration;
    this._affectedModels = getAffectedModelsFromBeats(beats);
  }

  /**
   * Execute set duration command
   */
  execute(): void {
    this._before = new Map(this._beats.map((b) => [b.uuid, b.baseDuration]));
    ScoreEditor.setDurations(this._beats, this._after);
    this._executed = true;
  }

  /**
   * Undo set duration - reset duration to old values
   */
  undo(): void {
    if (!this._executed) {
      return;
    }

    ScoreEditor.restoreDurations(this._beats, this._before);
  }

  /**
   * Redo, i.e. restore beats duration state to before execute
   */
  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }

    ScoreEditor.setDurations(this._beats, this._after);
  }

  public get affectedModels(): AffectedModel[] {
    return this._affectedModels;
  }
}
