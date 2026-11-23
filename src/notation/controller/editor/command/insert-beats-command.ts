import {
  Bar,
  Beat,
  BeatPosition,
  BeatPasteOutput,
  Score,
  ScoreEditor,
  VoiceBar,
  VoiceNumber,
} from "../../../model";
import {
  AffectedModel,
  Command,
  getAffectedModelsFromMasterBars,
} from "./command";

/** Inserts a packed clipboard stream after the cursor in its actual destination bar. */
export class InsertBeatsCommand implements Command {
  /** Destination bar, also used when the active voice has no cursor beat. */
  private readonly _bar: Bar;
  /** Stable cursor address before execution. */
  private readonly _anchor: BeatPosition | undefined;
  /** Clipboard input, released after execution. */
  private _source: Beat[];
  /** Active destination voice. */
  private readonly _voiceNumber: VoiceNumber;
  /** Score containing the destination bar. */
  private readonly _score: Score;
  /** Fixed model state shared by undo and redo. */
  private _output: BeatPasteOutput | undefined;

  constructor(
    bar: Bar,
    anchor: Beat | undefined,
    source: Beat[],
    voiceNumber: VoiceNumber = 1
  ) {
    this._bar = bar;
    this._anchor =
      anchor === undefined ? undefined : ScoreEditor.getBeatPosition(anchor);
    this._source = source;
    this._voiceNumber = voiceNumber;
    this._score = bar.staff.track.score;
  }

  execute(): void {
    if (this._output !== undefined) {
      throw Error("InsertBeatsCommand attempted to execute twice");
    }

    const voiceBar =
      this._bar.getVoiceBar(this._voiceNumber) ??
      new VoiceBar(this._bar, this._bar.trackContext, this._voiceNumber);
    const output = ScoreEditor.insertBeats(
      voiceBar,
      this._anchor === undefined ? 0 : this._anchor.index + 1,
      this._source
    );
    this._output = output;
    this._source = [];
  }

  undo(): void {
    if (this._output === undefined) {
      return;
    }

    ScoreEditor.restoreBeforePaste(this._score, this._output);
  }

  redo(): void {
    if (this._output === undefined) {
      return;
    }

    ScoreEditor.restoreAfterPaste(this._score, this._output);
  }

  public get affectedModels(): AffectedModel[] {
    return this._output === undefined
      ? [
          {
            masterBarIndex: this._bar.staff.bars.indexOf(this._bar),
            modelUUID: this._bar.masterBar.uuid,
          },
        ]
      : (() => {
          const bars = [
            ...this._output.before.map((s) => s.bar.masterBar),
            ...this._output.after.map((s) => s.bar.masterBar),
            ...this._output.neighborsBefore.map(
              (s) => s.voiceBar.bar.masterBar
            ),
          ].filter((b) => this._score.masterBars.includes(b));
          const indices = bars.map((b) => this._score.masterBars.indexOf(b));
          for (const index of indices) {
            for (const neighbor of [index - 1, index + 1]) {
              const bar = this._score.masterBars[neighbor];
              if (bar !== undefined) {
                bars.push(bar);
              }
            }
          }
          return getAffectedModelsFromMasterBars(this._score, [
            ...new Set(bars),
          ]);
        })();
  }
}
