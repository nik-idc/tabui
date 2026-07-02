import { Beat, BeatRemovalOutput, ScoreEditor } from "@/notation/model";
import { Command, AffectedModel, getAffectedModelsFromBeats } from "./command";

/**
 * Remove beats command
 */
export class RemoveBeatsCommand implements Command {
  /** Beats to be removeed */
  private _beatsToRemove: Beat[];
  /** True if executed, false otherwise */
  private _removeBeatsOutputs: BeatRemovalOutput[] | null = null;
  private _affectedModels: AffectedModel[];

  /**
   * Remove beats command
   * @param beatsToRemove Beats to be removeed
   */
  constructor(beatsToRemove: Beat[]) {
    this._beatsToRemove = beatsToRemove;
    this._affectedModels = getAffectedModelsFromBeats(beatsToRemove);
  }

  /**
   * Execute add beat command
   */
  execute(): void {
    this._removeBeatsOutputs = ScoreEditor.removeBeats(this._beatsToRemove);
  }

  /**
   * Undo add beat command, i.e. delete added beat
   */
  undo(): void {
    if (this._removeBeatsOutputs === null) {
      return;
    }

    ScoreEditor.undoBeatRemovals(this._removeBeatsOutputs);
  }

  /**
   * Redo, i.e. restore bar state to before execute
   */
  redo(): void {
    if (this._removeBeatsOutputs === null) {
      return;
    }

    this._removeBeatsOutputs = ScoreEditor.redoBeatRemovals(
      this._removeBeatsOutputs
    );
  }

  public get affectedModels(): AffectedModel[] {
    return this._affectedModels;
  }
}
