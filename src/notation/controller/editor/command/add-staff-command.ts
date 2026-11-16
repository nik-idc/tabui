import { Staff, Track } from "../../../model";
import { AffectedModel, Command } from "./command";

/** Inserts an empty staff into a track. Undo and redo reuse the same staff. */
export class AddStaffCommand implements Command {
  private readonly _track: Track;
  private readonly _index: number;
  private readonly _masterBarIndex: number;
  /** The inserted staff, or null before execution. */
  private _staff: Staff | null = null;

  /**
   * @param track Track that gets the staff.
   * @param index Zero-based insertion position, from zero through the staff count.
   * @param masterBarIndex Master bar to redraw first, usually the selected one.
   */
  constructor(track: Track, index: number, masterBarIndex: number) {
    this._track = track;
    this._index = index;
    this._masterBarIndex = masterBarIndex;
  }

  execute(): void {
    this._staff = this._track.insertStaff(this._index).staves[0];
  }

  undo(): void {
    if (this._staff === null) {
      return;
    }
    this._track.removeStaff(this._track.staves.indexOf(this._staff));
  }

  redo(): void {
    if (this._staff === null) {
      throw Error("Redo called before execute");
    }
    this._track.insertStaff(this._index, this._staff);
  }

  /** The inserted staff, or null before execution. */
  public get staff(): Staff | null {
    return this._staff;
  }

  public get affectedModels(): AffectedModel[] {
    return [
      {
        masterBarIndex: this._masterBarIndex,
        modelUUID: this._staff?.uuid ?? 0,
      },
    ];
  }
}
