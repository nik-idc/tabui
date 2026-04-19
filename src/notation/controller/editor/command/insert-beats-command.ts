import { Bar, Beat } from "@/notation/model";
import { Command, CommandUpdateRequest, getMasterBarIndex } from "./command";

/**
 * Insert beats command
 */
export class InsertBeatsCommand implements Command {
  /** Bar to insert the beats into */
  private _bar: Bar;
  /** Insertion index */
  private _index: number;
  /** Beats to be inserted */
  private _beatsToInsert: Beat[];
  /** Inserted beat copies tracked for undo/redo */
  private _insertedBeats: Beat[] = [];
  /** True if executed, false otherwise */
  private _executed: boolean = false;

  /**
   * Insert beats command
   * @param bar Bar to insert the beats into
   * @param beatsToInsert Beats to be inserted
   */
  constructor(bar: Bar, index: number, beatsToInsert: Beat[]) {
    this._bar = bar;
    this._index = index;
    this._beatsToInsert = beatsToInsert;
  }

  /**
   * Execute add beat command
   */
  execute(): void {
    this._insertedBeats = this._bar.insertBeats(
      this._index,
      this._beatsToInsert
    );
    this._executed = true;
  }

  /**
   * Undo add beat command, i.e. delete added beat
   */
  undo(): void {
    if (!this._executed) {
      return;
    }

    this._bar.removeBeats(this._insertedBeats);
  }

  /**
   * Redo, i.e. restore bar state to before execute
   */
  redo(): void {
    if (!this._executed) {
      return;
    }

    this._insertedBeats = this._bar.insertBeats(
      this._index,
      this._beatsToInsert
    );
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
      reason: "insert-beats",
    };
  }
}
