import { Staff, Track } from "../../../model";
import { AffectedModel, Command } from "./command";

/**
 * Removes one staff from a track. Undo puts the same staff back, so older
 * history entries that point into it stay valid. A track's last staff is
 * never removed.
 */
export class RemoveStaffCommand implements Command {
  private readonly _track: Track;
  private readonly _staff: Staff;
  private readonly _masterBarIndex: number;
  /** Position of the staff when it was removed. */
  private _index = -1;
  private _executed = false;

  /**
   * @param track Track that owns the staff.
   * @param staff Staff to remove.
   * @param masterBarIndex Master bar to redraw first, usually the selected one.
   */
  constructor(track: Track, staff: Staff, masterBarIndex: number) {
    this._track = track;
    this._staff = staff;
    this._masterBarIndex = masterBarIndex;
  }

  public get executed(): boolean {
    return this._executed;
  }

  execute(): void {
    this._index = this._track.staves.indexOf(this._staff);
    if (this._index < 0 || this._track.staves.length <= 1) {
      this._executed = false;
      return;
    }
    this._track.removeStaff(this._index);
    this._executed = true;
  }

  undo(): void {
    if (!this._executed) {
      return;
    }
    this._track.insertStaff(this._index, this._staff);
  }

  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }
    this._track.removeStaff(this._index);
  }

  /** Position of the staff when it was removed, or -1 before execution. */
  public get index(): number {
    return this._index;
  }

  public get affectedModels(): AffectedModel[] {
    return [
      { masterBarIndex: this._masterBarIndex, modelUUID: this._staff.uuid },
    ];
  }
}
