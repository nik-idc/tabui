import {
  Bar,
  Beat,
  BeatArrayOperationOutput,
  ScoreEditor,
} from "@/notation/model";
import { Command } from "./command";

/**
 * Remove beats command
 */
export class RemoveBeatsCommand implements Command {
  /** Beats to be removeed */
  private _beatsToRemove: Beat[];
  /** True if executed, false otherwise */
  private _removeBeatsOutputs: BeatArrayOperationOutput[][] | null = null;

  /**
   * Remove beats command
   * @param beatsToRemove Beats to be removeed
   */
  constructor(beatsToRemove: Beat[]) {
    this._beatsToRemove = beatsToRemove;
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

    for (const outputs of this._removeBeatsOutputs) {
      for (const output of outputs) {
        const bar = output.beats[0].bar;
        bar.insertBeats(output.index, output.beats);
      }
    }
  }

  /**
   * Redo, i.e. restore bar state to before execute
   */
  redo(): void {
    if (this._removeBeatsOutputs === null) {
      return;
    }

    ScoreEditor.removeBeats(this._beatsToRemove);
  }
}
