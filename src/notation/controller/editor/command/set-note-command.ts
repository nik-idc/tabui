import { Beat, BeatSnapshot, NoteValue, ScoreEditor } from "../../../model";
import { Command, AffectedModel, getAffectedModelsFromBeats } from "./command";

/** Set note value at a beat/string cursor position. */
export class SetNoteCommand implements Command {
  private _beat: Beat;
  private _stringNumber: number;
  private _newValue: NoteValue;
  private _newOctave: number | null;
  /** Original beat content for undo. */
  private _before: BeatSnapshot[] = [];
  /** Completed beat content for redo. */
  private _after: BeatSnapshot[] = [];
  private _executed: boolean = false;

  constructor(
    beat: Beat,
    stringNumber: number,
    newValue: NoteValue,
    newOctave: number | null
  ) {
    this._beat = beat;
    this._stringNumber = stringNumber;
    this._newValue = newValue;
    this._newOctave = newOctave;
  }

  execute(): void {
    this._before = ScoreEditor.snapshotBeatNotes(
      ScoreEditor.getNoteEditBeats([this._beat], this._stringNumber)
    );
    ScoreEditor.setNote(
      this._beat,
      this._stringNumber,
      this._newValue,
      this._newOctave
    );
    this._after = ScoreEditor.snapshotBeatNotes(
      ScoreEditor.resolveBeatPositions(this._before)
    );
    this._executed = true;
  }

  undo(): void {
    if (!this._executed) {
      return;
    }

    ScoreEditor.restoreBeatSnapshots(this._before);
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
        : [this._beat]
    );
  }
}
