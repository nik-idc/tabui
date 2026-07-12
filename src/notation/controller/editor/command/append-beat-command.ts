import {
  MasterBarArrayOperationOutput,
  Beat,
  BeatArrayOperationOutput,
  VoiceBar,
} from "../../../model";
import { Command, AffectedModel } from "./command";

/**
 * Append beat command
 */
export class AppendBeatCommand implements Command {
  /** Bar to append the beat to */
  private _voiceBar: VoiceBar;
  /** Created master bar & staff bars or null if not created yet */
  private _appendBeatResult: BeatArrayOperationOutput | null = null;

  /**
   * Add beat command
   * @param voiceBar Voice bar to append the beat to
   */
  constructor(voiceBar: VoiceBar) {
    this._voiceBar = voiceBar;
  }

  /**
   * Execute add beat command
   */
  execute(): void {
    this._appendBeatResult = this._voiceBar.appendBeats();
  }

  /**
   * Undo add beat command, i.e. delete added beat
   */
  undo(): void {
    if (this._appendBeatResult === null) {
      return;
    }

    const beatIndex = this._voiceBar.beats.indexOf(
      this._appendBeatResult.beats[0]
    );
    const targetIndex =
      beatIndex === -1 ? this._appendBeatResult.index : beatIndex;
    this._voiceBar.removeBeat(targetIndex);
  }

  /**
   * Redo, i.e. restore bar state to before execute
   */
  redo(): void {
    if (this._appendBeatResult === null) {
      throw Error("Redo called before execute");
    }

    this._voiceBar.insertBeat(
      this._appendBeatResult.index,
      this._appendBeatResult.beats[0]
    );
  }

  /** Created master bar & staff bars or null if not created yet */
  public get appendBeatResult(): BeatArrayOperationOutput | null {
    return this._appendBeatResult;
  }

  public get affectedModels(): AffectedModel[] {
    return [
      {
        masterBarIndex: this._voiceBar.bar.staff.track.score.masterBars.indexOf(
          this._voiceBar.bar.masterBar
        ),
        modelUUID: this._voiceBar.bar.masterBar.uuid,
      },
    ];
  }
}
