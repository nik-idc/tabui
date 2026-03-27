import {
  Score,
  Note,
  Beat,
  ScoreEditor,
  BeatArrayOperationOutput,
  NoteValue,
} from "@/notation/model";
import { Command } from "./command";

/**
 * Set guitar note fret command
 */
export class SetNoteCommand implements Command {
  /** Note to append the beat to */
  private _note: Note;
  /** New note value */
  private _newValue: NoteValue;
  /** New octave */
  private _newOctave: number | null;
  /** Old note value */
  private _oldValue: NoteValue;
  /** Old octave */
  private _oldOctave: number | null;
  /** True if executed, false otherwise*/
  private _executed: boolean = false;

  /**
   * Set guitar note fret command
   * @param note Guitar note whose fret to set
   * @param newFret New fret value
   */
  constructor(note: Note, newValue: NoteValue, newOctave: number | null) {
    this._note = note;
    this._newValue = newValue;
    this._newOctave = newOctave;
    this._oldValue = note.noteValue;
    this._oldOctave = note.octave;
  }

  /**
   * Execute set fret command
   */
  execute(): void {
    this._note.noteValue = this._newValue;
    this._note.octave = this._newOctave;
    this._executed = true;
  }

  /**
   * Undo set fret command, i.e. set old fret value
   */
  undo(): void {
    if (!this._executed) {
      return;
    }

    this._note.noteValue = this._oldValue;
    this._note.octave = this._oldOctave;
  }

  /**
   * Redo, i.e. restore note state to before execute
   */
  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }

    this._note.noteValue = this._newValue;
    this._note.octave = this._newOctave;
  }
}
