import { BeatArrayOperationOutput, VoiceBar } from "@/notation/model";
import { Command, AffectedModel } from "./command";

/** Insert one default beat at a specific bar index. */
export class InsertBeatCommand implements Command {
  private _voiceBar: VoiceBar;
  private _index: number;
  private _insertBeatResult: BeatArrayOperationOutput | null = null;

  constructor(voiceBar: VoiceBar, index: number) {
    this._voiceBar = voiceBar;
    this._index = index;
  }

  execute(): void {
    this._insertBeatResult = this._voiceBar.insertBeat(this._index);
  }

  undo(): void {
    if (this._insertBeatResult === null) {
      return;
    }

    const beatIndex = this._voiceBar.beats.indexOf(
      this._insertBeatResult.beats[0]
    );
    const targetIndex =
      beatIndex === -1 ? this._insertBeatResult.index : beatIndex;
    this._voiceBar.removeBeat(targetIndex);
  }

  redo(): void {
    if (this._insertBeatResult === null) {
      throw Error("Redo called before execute");
    }

    this._insertBeatResult = this._voiceBar.insertBeat(
      this._insertBeatResult.index,
      this._insertBeatResult.beats[0]
    );
  }

  public get insertBeatResult(): BeatArrayOperationOutput | null {
    return this._insertBeatResult;
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
