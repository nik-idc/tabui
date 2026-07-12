import { Beat, Note, NoteValue } from "../../../model";
import { Command, AffectedModel, getAffectedModelsFromBeats } from "./command";

/** Set note value at a beat/string cursor position. */
export class SetNoteCommand implements Command {
  private _beat: Beat;
  private _stringNumber: number;
  private _newValue: NoteValue;
  private _newOctave: number | null;
  private _oldValue: NoteValue;
  private _oldOctave: number | null;
  private _oldWasRest: boolean;
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
    this._oldWasRest = beat.isRest();
    const note = this._oldWasRest ? null : this.getTargetNote();
    this._oldValue = note?.noteValue ?? NoteValue.None;
    this._oldOctave = note?.octave ?? null;
  }

  private getTargetNote(): Note {
    return this._beat.notes![this._stringNumber - 1];
  }

  execute(): void {
    this._beat.makeBeatWithNotes();
    this.applyNoteState(this._newValue, this._newOctave);
    this._executed = true;
  }

  undo(): void {
    if (!this._executed) {
      return;
    }

    this.applyNoteState(this._oldValue, this._oldOctave);
    if (this._oldWasRest) {
      this._beat.makeRest();
    }
  }

  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }

    this._beat.makeBeatWithNotes();
    this.applyNoteState(this._newValue, this._newOctave);
  }

  private applyNoteState(value: NoteValue, octave: number | null): void {
    const note = this.getTargetNote();
    if (value === NoteValue.None || value === NoteValue.Dead) {
      note.noteValue = value;
      note.octave = octave;
      return;
    }

    note.octave = octave;
    note.noteValue = value;
  }

  public get affectedModels(): AffectedModel[] {
    return getAffectedModelsFromBeats([this._beat]);
  }
}
