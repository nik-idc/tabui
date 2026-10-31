import { Beat, BeatPasteOutput, Score, ScoreEditor } from "../../../model";
import {
  AffectedModel,
  Command,
  getAffectedModelsFromMasterBars,
} from "./command";

/** Replaces selected beats with a packed clipboard stream. */
export class ReplaceBeatsCommand implements Command {
  /** Selection input, released after execution. */
  private _beats: Beat[];
  /** Clipboard input, released after execution. */
  private _source: Beat[];
  /** Score containing the selected beats. */
  private readonly _score: Score;
  /** Fixed model state shared by undo and redo. */
  private _output: BeatPasteOutput | undefined;

  constructor(beats: Beat[], source: Beat[]) {
    this._beats = beats;
    this._source = source;
    this._score = beats[0].voiceBar.bar.staff.track.score;
  }

  execute(): void {
    if (this._output !== undefined) {
      throw Error("ReplaceBeatsCommand attempted to execute twice");
    }
    this._output = ScoreEditor.replaceBeats(this._beats, this._source);
    this._beats = [];
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
    if (this._output === undefined) {
      return [];
    }

    const bars = [
      ...this._output.before.map((s) => s.bar.masterBar),
      ...this._output.after.map((s) => s.bar.masterBar),
      ...this._output.neighborsBefore.map((s) => s.voiceBar.bar.masterBar),
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
    return getAffectedModelsFromMasterBars(this._score, [...new Set(bars)]);
  }
}
