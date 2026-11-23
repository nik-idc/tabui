import { Beat, BeatSnapshot, ScoreEditor } from "../../../model";
import { Command, AffectedModel, getAffectedModelsFromBeats } from "./command";

/** Sets a beat to an explicit rest while preserving its rhythm properties. */
export class SetRestCommand implements Command {
  /** Original content, including neighboring technique changes, for undo. */
  private _before: BeatSnapshot[] = [];
  /** Completed content for redo without repeating dependency discovery. */
  private _after: BeatSnapshot[] = [];
  /** Whether the command has saved and applied its edit. */
  private _executed = false;

  constructor(
    /** Selected beats whose rest state will change. */
    private _beats: Beat[],
    /** True to discard notes; false to create empty slots on rests. */
    private _newRestState: boolean
  ) {
    if (_beats.length === 0) {
      throw Error("Cannot set rest state for an empty beat selection");
    }
  }

  execute(): void {
    this._before = ScoreEditor.snapshotBeatNotes(
      ScoreEditor.getNoteEditBeats(this._beats)
    );
    ScoreEditor.setRest(this._beats, this._newRestState);
    this._after = ScoreEditor.snapshotBeatNotes(
      ScoreEditor.resolveBeatPositions(this._before)
    );
    this._executed = true;
  }

  undo(): void {
    if (this._executed) {
      ScoreEditor.restoreBeatSnapshots(this._before);
    }
  }

  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }
    ScoreEditor.restoreBeatSnapshots(this._after);
  }

  public get affectedModels(): AffectedModel[] {
    return getAffectedModelsFromBeats(
      this._before.length > 0
        ? ScoreEditor.resolveBeatPositions(this._before)
        : this._beats
    );
  }
}
