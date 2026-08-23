import { randomInt } from "../../shared";
import { Beat } from "./beat";
import { TrackContext } from "./track-context";
import { GuitarTechnique } from "./guitar-technique";
import { Guitar } from "./instrument/guitar";
import {
  NoteValue,
  Note,
  LOWEST_OCTAVE,
  HIGHEST_OCTAVE,
  getNoteFromSemitones,
  getSemitonesFromNote,
} from "./note";
import { GuitarTechniqueType } from "./technique-type";
import {
  BEND_TYPE_INCOMPATIBILITY,
  TRANSITIONAL_TECHNIQUES,
} from "./guitar-technique-lists";
import {
  guitarTechniquesIncompatible,
  guitarTechniqueTypesIncompatible,
  isBendValidForContinuation,
} from "./guitar-technique-validation";
import { BendTechniqueOptions } from "./bend-options";

/**
 * Class that represents a guitar note
 */
export class GuitarNote implements Note<Guitar> {
  /** Guitar note's unique identifier */
  readonly uuid: number;
  /** Beat in which the note lives */
  readonly beat: Beat<Guitar>;
  /** Track context */
  readonly trackContext: TrackContext<Guitar>;

  /** Note value */
  private _noteValue: NoteValue = NoteValue.None;
  /** Octave */
  private _octave: number | null = null;
  /** String number */
  private _stringNum: number = 1;
  /**  Fret number */
  private _fret: number | null = null;
  /** Techniques applied to the note */
  private _techniques: GuitarTechnique[];

  /**
   * Class that represents a guitar note
   * @param beat Beat in which the note lives
   * @param trackContext Track context
   * @param stringNum String number
   * @param fret Fret number
   * @param techniques Techniques applied to the note
   */
  constructor(
    beat: Beat<Guitar>,
    trackContext: TrackContext<Guitar>,
    stringNum: number,
    fret: number | null = null,
    techniques: GuitarTechnique[] = []
  ) {
    if (fret === null && techniques.length > 0) {
      throw new Error("Cannot apply techniques to an empty guitar note");
    }

    this.uuid = randomInt();
    this.beat = beat;
    this.trackContext = trackContext;

    this._stringNum = stringNum;
    this._techniques = techniques;
    this.fret = fret;

    this.calcNoteFromFret();
  }

  /**
   * Calculate musical note value based on the fret & string number
   */
  public calcNoteFromFret(): void {
    if (this._fret === null) {
      this._noteValue = NoteValue.None;
      this._octave = null;
      return;
    }

    if (this._fret === -1) {
      this._noteValue = NoteValue.Dead;
      this._octave = null;
      return;
    }

    const openStringNote =
      this.trackContext.instrument.tuning[this._stringNum - 1];

    if (openStringNote.octave === null) {
      throw Error("Open string octave is null");
    }

    const totalSemitones =
      getSemitonesFromNote(openStringNote.noteValue, openStringNote.octave) +
      this._fret;
    const { noteValue, octave } = getNoteFromSemitones(totalSemitones);

    if (octave < LOWEST_OCTAVE || octave > HIGHEST_OCTAVE) {
      throw new Error("Octave out of range");
    }

    this._noteValue = noteValue;
    this._octave = octave;
  }

  /**
   * Calculate musical note value based on note & octave value
   */
  public calculateFretFromNote(): void {
    if (this._noteValue === NoteValue.None) {
      this._fret = null;
      this.clearTechniques();
      return;
    }

    if (this._noteValue === NoteValue.Dead) {
      this._fret = -1;
      return;
    }

    if (this._octave === null) {
      throw Error(
        "Note this._octave is null when note value is neither None nor Dead"
      );
    }

    const openString = this.trackContext.instrument.tuning[this._stringNum - 1];

    if (openString.octave === null) {
      throw Error("Open string this._octave is null");
    }

    const openTotal = getSemitonesFromNote(
      openString.noteValue,
      openString.octave
    );
    const targetTotal = getSemitonesFromNote(this._noteValue, this._octave);

    let fret = targetTotal - openTotal;
    if (fret < 0) {
      throw new Error("Calculated fret below valid range");
    }

    const maxFret = this.trackContext.instrument.fretsCount;

    // Clamp to the fretboard upper bound instead of wrapping around.
    if (fret > maxFret) {
      fret = maxFret;
    }

    this._fret = fret;
  }

  /**
   * Sets both note value and octave
   * @param newNoteValue - New note value
   * @param newOctave - New octave value
   */
  public setNote(newNoteValue: NoteValue, newOctave: number | null): void {
    this._noteValue = newNoteValue;
    this._octave = newOctave;
    this.calculateFretFromNote();
  }

  /**
   * Returns note in the format "{Note value}{Octave}". Examples: A#2, B3, c4, f#1
   * @returns Note in the format "{Note value}{Octave}"
   */
  public getNoteStr(): string {
    switch (this._noteValue) {
      case NoteValue.None:
        return "";
      case NoteValue.Dead:
        return "x";
      default:
        return `${this._noteValue}${this._octave}`;
    }
  }

  public getBendContinuationPitch(): number | undefined {
    if (!this.hasTechnique(GuitarTechniqueType.LetRing)) {
      return undefined;
    }
    const previousBeat = this.beat.voiceBar.bar.staff.getPrevBeat(this.beat);
    const previousNote = previousBeat?.notes?.find(
      (n) => n instanceof GuitarNote && n.stringNum === this.stringNum
    );
    if (!(previousNote instanceof GuitarNote)) {
      return undefined;
    }
    const previousBend = previousNote.techniques.find(
      (t) => t.type === GuitarTechniqueType.Bend
    );
    return previousBend?.bendOptions?.terminalPitch;
  }

  /**
   * Applies, updates, or removes a technique on this note.
   */
  public setTechnique(
    type: GuitarTechniqueType,
    bendOptions: BendTechniqueOptions | null = null
  ): boolean {
    const existingTechnique = this._techniques.find((t) => t.type === type);
    if (existingTechnique !== undefined) {
      if (
        existingTechnique.type === GuitarTechniqueType.Bend &&
        bendOptions !== null
      ) {
        if (!isBendValidForContinuation(this, bendOptions)) {
          return false;
        }
        const incompatibleTypes = BEND_TYPE_INCOMPATIBILITY[bendOptions.type];
        if (
          this._techniques.some(
            (t) => t !== existingTechnique && incompatibleTypes.includes(t.type)
          )
        ) {
          return false;
        }
        return existingTechnique.replaceBendOptions(bendOptions);
      }
      return this.removeTechnique(type);
    }

    return this.addTechnique(new GuitarTechnique(this, type, bendOptions));
  }

  /**
   * Adds new technique to the note
   * @param guitarTechnique Guitar technique to add
   * @returns True if technique added succesfully, false if can't add this technique
   */
  public addTechnique(guitarTechnique: GuitarTechnique): boolean {
    if (!this.isTechniqueApplicable(guitarTechnique.type)) {
      return false;
    }

    if (
      guitarTechnique.bendOptions !== null &&
      !isBendValidForContinuation(this, guitarTechnique.bendOptions)
    ) {
      return false;
    }

    if (
      this._techniques.some((technique) =>
        guitarTechniquesIncompatible(technique, guitarTechnique)
      )
    ) {
      return false;
    }

    this._techniques.push(guitarTechnique);
    return true;
  }

  /**
   * Removes technique from the note
   * @param type Technique type
   * @returns True if removed
   */
  public removeTechnique(type: GuitarTechniqueType): boolean {
    const techniqueIndex = this._techniques.findIndex((t) => t.type === type);
    if (techniqueIndex === -1) {
      return false;
    }

    this._techniques.splice(techniqueIndex, 1);
    return true;
  }

  /**
   * Remove all techniques
   */
  public clearTechniques(): void {
    this._techniques = [];
  }

  /**
   * Sorts techniques
   */
  public sortTechniques(): void {
    this._techniques.sort((a, b) => b.type - a.type);
  }

  /**
   * Determines whether provided technique can be applied to the current note
   * @param type Technique type
   * @returns True if applicable, false otherwise
   */
  public isTechniqueApplicable(type: GuitarTechniqueType): boolean {
    if (this._fret === null || this._fret === -1) {
      return false;
    }

    if (type === GuitarTechniqueType.Slide && this._fret === 0) {
      return false;
    }

    if (TRANSITIONAL_TECHNIQUES.has(type)) {
      const nextNote = this.beat.voiceBar.bar.staff.getNextNote(this);
      if (!(nextNote instanceof GuitarNote) || nextNote._fret === this._fret) {
        return false;
      }
    }

    return !this._techniques.some((technique) =>
      guitarTechniqueTypesIncompatible(technique.type, type)
    );
  }

  /**
   * Checks if the guitar note has a technique applied
   * @param type Technique type
   * @returns True if applied, false otherwise
   */
  public hasTechnique(type: GuitarTechniqueType): boolean {
    return this._techniques.some((ge) => ge.type === type);
  }

  /**
   * Compares contents of this guitar note with some other note
   * (ignoring UUID)
   * @param otherNote Note to compare with
   * @returns True if equal, false otherwise
   */
  public compare(otherNote: GuitarNote): boolean {
    return (
      this._noteValue === otherNote._noteValue &&
      this._octave === otherNote._octave &&
      this._fret === otherNote._fret &&
      this._stringNum === otherNote._stringNum
    );
  }

  /**
   * Deep copy of the guitar note
   * @param beat Beat that will own the copied note
   * @returns Deep copy of the guitar note
   */
  public deepCopy(beat: Beat<Guitar> = this.beat): GuitarNote {
    const note = new GuitarNote(
      beat,
      beat.trackContext,
      this._stringNum,
      this._fret
    );
    note._techniques = this._techniques.map((technique) =>
      technique.deepCopy(note)
    );

    return note;
  }

  /** Note value setter */
  public set noteValue(newNoteValue: NoteValue) {
    this._noteValue = newNoteValue;
    this.calculateFretFromNote();
  }
  /** Note value getter */
  public get noteValue(): NoteValue {
    return this._noteValue;
  }

  /** Octave setter */
  public set octave(newOctave: number | null) {
    this._octave = newOctave;
    this.calculateFretFromNote();
  }
  /** Octave getter */
  public get octave(): number | null {
    return this._octave;
  }

  /** String number setter */
  public set fret(newFret: number | null) {
    const fretsCount = this.trackContext.instrument.fretsCount;
    if (newFret !== null) {
      this._fret = Math.min(newFret, fretsCount);
    } else {
      this._fret = null;
      this.clearTechniques();
    }
    this.calcNoteFromFret();
  }
  /** Fret number */
  public get fret(): number | null {
    return this._fret;
  }

  /** String number getter */
  public get stringNum(): number {
    return this._stringNum;
  }

  /** Techniques array */
  public get techniques(): GuitarTechnique[] {
    return this._techniques;
  }
}
