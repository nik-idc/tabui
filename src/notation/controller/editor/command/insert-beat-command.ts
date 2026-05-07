import { Bar, BeatArrayOperationOutput } from "@/notation/model";
import { Command, CommandUpdateRequest, getMasterBarIndex } from "./command";

/** Insert one default beat at a specific bar index. */
export class InsertBeatCommand implements Command {
  private _bar: Bar;
  private _index: number;
  private _insertBeatResult: BeatArrayOperationOutput | null = null;

  constructor(bar: Bar, index: number) {
    this._bar = bar;
    this._index = index;
  }

  execute(): void {
    this._insertBeatResult = this._bar.insertBeat(this._index);
  }

  undo(): void {
    if (this._insertBeatResult === null) {
      return;
    }

    const beatIndex = this._bar.beats.indexOf(this._insertBeatResult.beats[0]);
    const targetIndex =
      beatIndex === -1 ? this._insertBeatResult.index : beatIndex;
    this._bar.removeBeat(beatIndex);
  }

  redo(): void {
    if (this._insertBeatResult === null) {
      throw Error("Redo called before execute");
    }

    this._insertBeatResult = this._bar.insertBeat(
      this._insertBeatResult.index,
      this._insertBeatResult.beats[0]
    );
  }

  public get insertBeatResult(): BeatArrayOperationOutput | null {
    return this._insertBeatResult;
  }

  public get updateRequest(): CommandUpdateRequest {
    const affectedMasterBarIndex = getMasterBarIndex(
      this._bar.staff.track.score,
      this._bar.masterBar
    );

    return {
      updateType: "Horizontal",
      affectedMasterBarIndices: [affectedMasterBarIndex],
      firstAffectedMasterBarIndex: affectedMasterBarIndex,
      reason: "insert-beat",
    };
  }
}
