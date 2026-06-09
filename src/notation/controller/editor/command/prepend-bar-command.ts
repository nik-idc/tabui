import {
  Score,
  MasterBarData,
  MasterBarArrayOperationOutput,
  VoiceNumber,
  ScoreEditor,
} from "@/notation/model";
import { Command, CommandUpdateRequest } from "./command";

/**
 * Prepend bar command
 */
export class PrependBarCommand implements Command {
  /** Score */
  private _score: Score;
  /** Data of the master bar to add */
  private _masterBarData: MasterBarData;
  private _voiceNumber: VoiceNumber;
  /** Created master bar & staff bars or null if not created yet */
  private _prependMasterBarResult: MasterBarArrayOperationOutput | null = null;

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
    this._prependMasterBarResult = ScoreEditor.prependMasterBar(
      this._score,
      this._masterBarData,
      this._voiceNumber
    );
  }

  /**
   * Undo add bar command, i.e. delete added bar
   */
  undo(): void {
    if (this._prependMasterBarResult === null) {
      return;
    }

    const masterBarIndex = this._score.masterBars.indexOf(
      this._prependMasterBarResult.masterBar
    );
    this._score.removeMasterBar(masterBarIndex);
  }

  /**
   * Redo, i.e. restore score state to before execute
   */
  redo(): void {
    if (this._prependMasterBarResult === null) {
      throw Error("Redo called before execute");
    }

    this._score.insertReadyMasterBar(
      this._prependMasterBarResult.index,
      this._prependMasterBarResult.masterBar,
      this._prependMasterBarResult.bars
    );
  }

  /** Created master bar & staff bars or null if not created yet */
  public get prependResult(): MasterBarArrayOperationOutput | null {
    return this._prependMasterBarResult;
  }

  public get updateRequest(): CommandUpdateRequest {
    return {
      updateType: "Horizontal",
      affectedMasterBarIndices: [0],
      firstAffectedMasterBarIndex: 0,
      reason: "prepend-bar",
    };
  }
}
