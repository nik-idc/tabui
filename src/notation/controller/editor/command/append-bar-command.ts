import {
  Score,
  MasterBarData,
  MasterBarArrayOperationOutput,
  VoiceNumber,
  ScoreEditor,
} from "../../../model";
import { Command, AffectedModel } from "./command";

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
  private _after: MasterBarArrayOperationOutput | null = null;

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
    this._after = ScoreEditor.appendMasterBar(
      this._score,
      this._masterBarData,
      this._voiceNumber
    );
  }

  /**
   * Undo add bar command, i.e. delete added bar
   */
  undo(): void {
    if (this._after === null) {
      return;
    }

    const masterBarIndex = this._score.masterBars.indexOf(
      this._after.masterBar
    );
    this._score.removeMasterBar(masterBarIndex);
  }

  /**
   * Redo, i.e. restore score state to before execute
   */
  redo(): void {
    if (this._after === null) {
      throw Error("Redo called before execute");
    }

    this._score.insertReadyMasterBar(
      this._after.index,
      this._after.masterBar,
      this._after.bars
    );
  }

  /** Created master bar & staff bars or null if not created yet */
  public get appendResult(): MasterBarArrayOperationOutput | null {
    return this._after;
  }

  public get affectedModels(): AffectedModel[] {
    const masterBarIndex = this._after?.index ?? this._score.masterBars.length;
    const masterBar =
      this._after?.masterBar ?? this._score.masterBars[masterBarIndex];

    return [{ masterBarIndex, modelUUID: masterBar?.uuid ?? 0 }];
  }
}
