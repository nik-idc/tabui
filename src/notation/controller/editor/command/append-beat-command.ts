import {
  Score,
  MasterBarData,
  MasterBarArrayOperationOutput,
  Bar,
  Beat,
  ScoreEditor,
  BeatArrayOperationOutput,
} from "@/notation/model";
import { Command } from "./command";

/**
 * Append beat command
 */
export class AppendBeatCommand implements Command {
  /** Bar to append the beat to */
  private _bar: Bar;
  /** Created master bar & staff bars or null if not created yet */
  private _appendBeatResult: BeatArrayOperationOutput | null = null;

  /**
   * Add beat command
   * @param bar Bar to append the beat to
   */
  constructor(bar: Bar) {
    this._bar = bar;
  }

  /**
   * Execute add beat command
   */
  execute(): void {
    this._appendBeatResult = this._bar.appendBeat();
  }

  /**
   * Undo add beat command, i.e. delete added beat
   */
  undo(): void {
    if (this._appendBeatResult === null) {
      return;
    }

    const beatIndex = this._bar.beats.indexOf(this._appendBeatResult.beats[0]);
    this._bar.removeBeat(beatIndex);
  }

  /**
   * Redo, i.e. restore bar state to before execute
   */
  redo(): void {
    if (this._appendBeatResult === null) {
      throw Error("Redo called before execute");
    }

    this._bar.insertBeat(
      this._appendBeatResult.index,
      this._appendBeatResult.beats[0]
    );
  }

  /** Created master bar & staff bars or null if not created yet */
  public get appendBeatResult(): BeatArrayOperationOutput | null {
    return this._appendBeatResult;
  }
}
