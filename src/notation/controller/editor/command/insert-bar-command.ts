import {
  Score,
  MasterBarData,
  MasterBarArrayOperationOutput,
  VoiceNumber,
  ScoreEditor,
} from "@/notation/model";
import { Command, CommandUpdateRequest } from "./command";

/**
 * Insert bar command
 */
export class InsertBarCommand implements Command {
  /** Score */
  private _score: Score;
  /** Index of insertion */
  private _index: number;
  /** Data of the master bar to add */
  private _masterBarData: MasterBarData;
  private _voiceNumber: VoiceNumber;
  /** Created master bar & staff bars or null if not created yet */
  private _insertMasterBarResult: MasterBarArrayOperationOutput | null = null;

  /**
   * Insert bar command
   * @param score Score
   * @param masterBarData Data of the master bar to insert
   */
  constructor(
    score: Score,
    index: number,
    masterBarData: MasterBarData,
    voiceNumber: VoiceNumber = 1
  ) {
    this._score = score;
    this._index = index;
    this._masterBarData = masterBarData;
    this._voiceNumber = voiceNumber;
  }

  /**
   * Execute add bar command
   */
  execute(): void {
    this._insertMasterBarResult = ScoreEditor.insertMasterBar(
      this._score,
      this._index,
      this._masterBarData,
      this._voiceNumber
    );
  }

  /**
   * Undo add bar command, i.e. delete added bar
   */
  undo(): void {
    if (this._insertMasterBarResult === null) {
      return;
    }

    const masterBarIndex = this._score.masterBars.indexOf(
      this._insertMasterBarResult.masterBar
    );
    this._score.removeMasterBar(masterBarIndex);
  }

  /**
   * Redo, i.e. restore score state to before execute
   */
  redo(): void {
    if (this._insertMasterBarResult === null) {
      throw Error("Redo called before execute");
    }

    this._score.insertReadyMasterBar(
      this._insertMasterBarResult.index,
      this._insertMasterBarResult.masterBar,
      this._insertMasterBarResult.bars
    );
  }

  /** Created master bar & staff bars or null if not created yet */
  public get insertResult(): MasterBarArrayOperationOutput | null {
    return this._insertMasterBarResult;
  }

  public get updateRequest(): CommandUpdateRequest {
    return {
      updateType: "Horizontal",
      affectedMasterBarIndices: [this._index],
      firstAffectedMasterBarIndex: this._index,
      reason: "insert-bar",
    };
  }
}
