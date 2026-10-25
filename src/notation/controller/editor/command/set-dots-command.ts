import { Beat, ScoreEditor } from "../../../model";
import { Command, AffectedModel, getAffectedModelsFromBeats } from "./command";

/**
 * Set beats dots
 */
export class SetDotsCommand implements Command {
  /** Beats whose dot value to set */
  private _beats: Beat[];
  /** Fixed dot count applied by execute and redo. */
  private _after: number;
  /** Original dot counts saved before execution. */
  private _before: Map<number, number> = new Map();
  /** True if executed, false otherwise*/
  private _executed: boolean = false;
  private _affectedModels: AffectedModel[];

  /**
   * Set beats dots
   * @param beats Beats whose dot value to set
   * @param newDots New dots value
   */
  constructor(beats: Beat[], newDots: number) {
    this._beats = beats;
    this._after = newDots;
    this._affectedModels = getAffectedModelsFromBeats(beats);
  }

  /**
   * Execute set dots command
   */
  execute(): void {
    this._before = new Map(this._beats.map((b) => [b.uuid, b.dots]));
    ScoreEditor.setDots(this._beats, this._after);
    this._executed = true;
  }

  /**
   * Undo set dots - reset dots to old values
   */
  undo(): void {
    if (!this._executed) {
      return;
    }

    ScoreEditor.restoreDots(this._beats, this._before);
  }

  /**
   * Redo, i.e. restore beats dots state to before execute
   */
  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }

    ScoreEditor.setDots(this._beats, this._after);
  }

  public get affectedModels(): AffectedModel[] {
    return this._affectedModels;
  }
}
