import { Beat, GuitarNote } from "../../../model";
import { Command, AffectedModel, getAffectedModelsFromBeats } from "./command";

/**
 * Set guitar note fret command
 */
export class SetFretCommand implements Command {
  private _beat: Beat;
  private _stringNumber: number;
  /** New fret value */
  private _newFret: number | null;
  /** Old fret value */
  private _oldFret: number | null;
  private _oldWasRest: boolean;
  /** True if executed, false otherwise*/
  private _executed: boolean = false;

  /**
   * Set guitar note fret command
   * @param target Guitar note or beat whose lane should receive the fret
   * @param newFret New fret value
   */
  constructor(beat: Beat, stringNumber: number, newFret: number | null) {
    this._beat = beat;
    this._stringNumber = stringNumber;
    this._newFret = newFret;
    this._oldWasRest = beat.isRest();
    this._oldFret = this._oldWasRest ? null : this.getTargetNote().fret;
  }

  private getTargetNote(): GuitarNote {
    const note = this._beat.notes?.[this._stringNumber - 1];
    if (!(note instanceof GuitarNote)) {
      throw Error("Can't set fret of a non-guitar note");
    }

    return note;
  }

  /**
   * Execute set fret command
   */
  execute(): void {
    this._beat.makeBeatWithNotes();

    const note = this.getTargetNote();
    note.fret = this._newFret;
    this._executed = true;
  }

  /**
   * Undo set fret command, i.e. set old fret value
   */
  undo(): void {
    if (!this._executed) {
      return;
    }

    const note = this.getTargetNote();
    note.fret = this._oldFret;
    if (this._oldWasRest) {
      this._beat.makeRest();
      return;
    }
  }

  /**
   * Redo, i.e. restore note state to before execute
   */
  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }

    this._beat.makeBeatWithNotes();

    const note = this.getTargetNote();
    note.fret = this._newFret;
  }

  public get affectedModels(): AffectedModel[] {
    return getAffectedModelsFromBeats([this._beat]);
  }
}
