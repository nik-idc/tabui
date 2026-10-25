import {
  Score,
  MasterBarData,
  MasterBarArrayOperationOutput,
  VoiceNumber,
  ScoreEditor,
  BeatSnapshot,
} from "../../../model";
import {
  Command,
  AffectedModel,
  getAffectedModelsFromMasterBars,
} from "./command";

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
  /** Existing boundary content before bar insertion. */
  private _before: BeatSnapshot[] = [];
  /** Created bar graph and separate fixed boundary content for redo. */
  private _after: {
    bar: MasterBarArrayOperationOutput;
    neighborSnapshots: BeatSnapshot[];
  } | null = null;

  /**
   * Insert bar command
   * @param score Score
   * @param index Integer insertion position from zero through the number of master bars.
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
    const affected = ScoreEditor.getBarEditBeats(this._score, [this._index]);
    this._before = ScoreEditor.snapshotBeatNotes(affected);
    const bar = ScoreEditor.insertMasterBar(
      this._score,
      this._index,
      this._masterBarData,
      this._voiceNumber
    );
    this._after = {
      bar,
      neighborSnapshots: ScoreEditor.snapshotBeatNotes(affected),
    };
  }

  /**
   * Undo add bar command, i.e. delete added bar
   */
  undo(): void {
    if (this._after === null) {
      return;
    }

    const masterBarIndex = this._score.masterBars.indexOf(
      this._after.bar.masterBar
    );
    this._score.removeMasterBar(masterBarIndex);
    ScoreEditor.restoreBeatSnapshots(this._before);
  }

  /**
   * Redo, i.e. restore score state to before execute
   */
  redo(): void {
    if (this._after === null) {
      throw Error("Redo called before execute");
    }

    this._score.insertReadyMasterBar(
      this._after.bar.index,
      this._after.bar.masterBar,
      this._after.bar.bars
    );
    ScoreEditor.restoreBeatSnapshots(this._after.neighborSnapshots);
  }

  /** Created master bar & staff bars or null if not created yet */
  public get insertResult(): MasterBarArrayOperationOutput | null {
    return this._after?.bar ?? null;
  }

  public get affectedModels(): AffectedModel[] {
    const masterBar =
      this._after?.bar.masterBar ?? this._score.masterBars[this._index];
    return [
      { masterBarIndex: this._index, modelUUID: masterBar?.uuid ?? 0 },
      ...getAffectedModelsFromMasterBars(
        this._score,
        this._before.map((s) => s.voiceBar.bar.masterBar)
      ),
    ];
  }
}
