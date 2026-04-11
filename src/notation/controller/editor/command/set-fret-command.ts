import { GuitarNote, Beat, BeatArrayOperationOutput } from "@/notation/model";
import { Command } from "./command";

/**
 * Set guitar note fret command
 */
export class SetFretCommand implements Command {
  /** GuitarNote to append the beat to */
  private _note: GuitarNote;
  /** New fret value */
  private _newFret: number | null;
  /** Old fret value */
  private _oldFret: number | null;
  /** True if executed, false otherwise*/
  private _executed: boolean = false;

  /**
   * Set guitar note fret command
   * @param note Guitar note whose fret to set
   * @param newFret New fret value
   */
  constructor(note: GuitarNote, newFret: number | null) {
    this._note = note;
    this._newFret = newFret;
    this._oldFret = note.fret;
  }

  /**
   * Execute set fret command
   */
  execute(): void {
    this._note.fret = this._newFret;
    this._executed = true;
  }

  /**
   * Undo set fret command, i.e. set old fret value
   */
  undo(): void {
    if (!this._executed) {
      return;
    }

    this._note.fret = this._oldFret;
  }

  /**
   * Redo, i.e. restore note state to before execute
   */
  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }

    this._note.fret = this._newFret;
  }
}
