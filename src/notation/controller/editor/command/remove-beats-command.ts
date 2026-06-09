import { Beat, BeatArrayOperationOutput, ScoreEditor } from "@/notation/model";
import {
  Command,
  CommandUpdateRequest,
  getAffectedMasterBarIndicesFromBeats,
} from "./command";

/**
 * Remove beats command
 */
export class RemoveBeatsCommand implements Command {
  /** Beats to be removeed */
  private _beatsToRemove: Beat[];
  /** True if executed, false otherwise */
  private _removeBeatsOutputs: BeatArrayOperationOutput[][] | null = null;
  private _affectedMasterBarIndices: number[];

  /**
   * Remove beats command
   * @param beatsToRemove Beats to be removeed
   */
  constructor(beatsToRemove: Beat[]) {
    this._beatsToRemove = beatsToRemove;
    this._affectedMasterBarIndices =
      getAffectedMasterBarIndicesFromBeats(beatsToRemove);
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
        const voiceBar = output.beats[0].voiceBar;

        if (voiceBar.beats.length === 1 && voiceBar.beats[0].isEmpty()) {
          voiceBar.beats.splice(0, 1);
        }

        voiceBar.insertBeats(output.index, output.beats);
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

    for (const outputs of this._removeBeatsOutputs) {
      const output = outputs[0];
      const voiceBar = output.beats[0].voiceBar;
      voiceBar.removeBeat(output.index);
    }
  }

  public get updateRequest(): CommandUpdateRequest {
    return {
      updateType: "Horizontal",
      affectedMasterBarIndices: this._affectedMasterBarIndices,
      firstAffectedMasterBarIndex: this._affectedMasterBarIndices[0] ?? 0,
      reason: "remove-beats",
    };
  }
}
