import {
  Score,
  MasterBarData,
  MasterBarArrayOperationOutput,
  VoiceNumber,
  ScoreEditor,
} from "@/notation/model";
import { Command, CommandUpdateRequest } from "./command";

/**
 * Append bar command
 */
export class AppendBarCommand implements Command {
  /** Score */
  private _score: Score;
  /** Data of the master bar to add */
  private _masterBarData: MasterBarData;
  private _voiceNumber: VoiceNumber;
  /** Created master bar & staff bars or null if not created yet */
  private _appendMasterBarResult: MasterBarArrayOperationOutput | null = null;

  /**
   * Add bar command
   * @param score Score
   * @param masterBarData Data of the master bar to add
   */
  constructor(
    score: Score,
    masterBarData: MasterBarData,
    voiceNumber: VoiceNumber = 1
  ) {
    this._score = score;
    this._masterBarData = masterBarData;
    this._voiceNumber = voiceNumber;
  }

  /**
   * Execute add bar command
   */
  execute(): void {
    this._appendMasterBarResult = ScoreEditor.appendMasterBar(
      this._score,
      this._masterBarData,
      this._voiceNumber
    );
  }

  /**
   * Undo add bar command, i.e. delete added bar
   */
  undo(): void {
    if (this._appendMasterBarResult === null) {
      return;
    }

    const masterBarIndex = this._score.masterBars.indexOf(
      this._appendMasterBarResult.masterBar
    );
    this._score.removeMasterBar(masterBarIndex);
  }

  /**
   * Redo, i.e. restore score state to before execute
   */
  redo(): void {
    if (this._appendMasterBarResult === null) {
      throw Error("Redo called before execute");
    }

    this._score.insertReadyMasterBar(
      this._appendMasterBarResult.index,
      this._appendMasterBarResult.masterBar,
      this._appendMasterBarResult.bars
    );
  }

  /** Created master bar & staff bars or null if not created yet */
  public get appendResult(): MasterBarArrayOperationOutput | null {
    return this._appendMasterBarResult;
  }

  public get updateRequest(): CommandUpdateRequest {
    const affectedMasterBarIndex =
      this._appendMasterBarResult?.index ?? this._score.masterBars.length;

    return {
      updateType: "Horizontal",
      affectedMasterBarIndices: [affectedMasterBarIndex],
      firstAffectedMasterBarIndex: affectedMasterBarIndex,
      reason: "append-bar",
    };
  }
}
