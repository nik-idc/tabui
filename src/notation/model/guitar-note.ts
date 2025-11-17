import { randomInt } from "@/shared";
import { Beat } from "./beat";
import { TabContext } from "./track-context";
import { GuitarTechniqueJSON, GuitarTechnique } from "./guitar-technique";
import { Guitar } from "./instrument/guitar";
import { MusicInstrumentType } from "./instrument/instrument-type";
import {
  NoteValue,
  Note,
  NOTES_ARR,
  NOTES_PER_OCTAVE,
  LOWEST_OCTAVE,
  HIGHEST_OCTAVE,
  NOTE_VALUES_ARR,
} from "./note";
import { GuitarTechniqueType } from "./technique-type";
import { TECHNIQUES_INCOMPATIBILITY } from "./guitar-technique-lists";

/**
 * Guitar note JSON format
 */
export interface GuitarNoteJSON {
  instrumentType: MusicInstrumentType;
  noteValue: NoteValue;
  octave: number | null;
  stringNum: number;
  fret: number | null;
  techniques: GuitarTechniqueJSON[];
}

/**
 * Class that represents a guitar note
 */
export class GuitarNote implements Note<Guitar> {
  /** Guitar note's unique identifier */
  readonly uuid: number;
  /** Beat in which the note lives */
  readonly beat: Beat<Guitar>;
  /** Tab context */
  readonly trackContext: TabContext;

  /** Note value */
  private _noteValue: NoteValue = NoteValue.None;
  /** Octave */
  private _octave: number | null = null;
  /** String number */
  private _stringNum: number = 0;
  /**  Fret number */
  private _fret: number | null;
  /** Techniques applied to the note */
  private _techniques: GuitarTechnique[];

  /**
   * Class that represents a guitar note
   * @param beat Beat in which the note lives
   * @param trackContext Tab context
   * @param stringNum String number
   * @param fret Fret number
   * @param techniques Techniques applied to the note
   */
  constructor(
    beat: Beat<Guitar>,
    trackContext: TabContext,
    stringNum: number,
    fret: number | null = null,
    techniques: GuitarTechnique[] = []
  ) {
    this.uuid = randomInt();
    this.beat = beat;
    this.trackContext = trackContext;

    this._stringNum = stringNum;
    this._fret = fret;
    this._techniques = techniques;

    this.calcNoteFromFret();
  }

  /**
   * Calculate musical note value based on the fret & string number
   */
  private calcNoteFromFret(): void {
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

    const currentIndex = NOTES_ARR.indexOf(openStringNote.noteValue);
    const totalSemitones =
      openStringNote.octave * NOTES_PER_OCTAVE + currentIndex + this._fret;

    const newOctave = Math.floor(totalSemitones / NOTES_PER_OCTAVE);
    const newIndex =
      ((totalSemitones % NOTES_PER_OCTAVE) + NOTES_PER_OCTAVE) %
      NOTES_PER_OCTAVE;

    if (newOctave < LOWEST_OCTAVE || newOctave > HIGHEST_OCTAVE) {
      throw new Error("Octave out of range");
    }

    this._noteValue = NOTES_ARR[newIndex];
    this._octave = newOctave;
  }

  /**
   * Calculate musical note value based on note & octave value
   */
  private calculateFretFromNote(): void {
    if (this._noteValue === NoteValue.None) {
      this._fret = null;
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

    const openIndex = NOTES_ARR.indexOf(openString.noteValue);
    const targetIndex = NOTES_ARR.indexOf(this._noteValue);

    const openTotal = openString.octave * NOTES_PER_OCTAVE + openIndex;

    const targetTotal = this._octave * NOTES_PER_OCTAVE + targetIndex;

    let fret = targetTotal - openTotal;
    if (fret < 0) {
      throw new Error("Calculated fret below valid range");
    }

    const maxFret = this.trackContext.instrument.fretsCount;

    // Apply wrap-around rule for upper bound
    if (fret > maxFret) {
      fret = fret % maxFret;
    }

    this._fret = fret;
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

  /**
   * Adds new technique to the note
   * @param guitarTechnique Guitar technique to add
   * @returns True if technique added succesfully, false if can't add this technique
   */
  public addTechnique(guitarTechnique: GuitarTechnique): boolean {
    // Check if technique to be added is compatible with all the other techniques
    for (const technique of this._techniques) {
      const curIncompatibility = TECHNIQUES_INCOMPATIBILITY[technique.type];
      if (
        curIncompatibility.some((incompatibleType) => {
          return incompatibleType === guitarTechnique.type;
        })
      ) {
        // One of the techniques is incompatible with the
        // to be added technique => discard and return false
        return false;
      }
    }

    // All techniques are compatible with each
    // other => add new technique and return true
    this._techniques.push(guitarTechnique);
    return true;
  }

  /**
   * Removes technique from the note
   * @param type Technique type
   */
  public removeTechnique(type: GuitarTechniqueType): void {
    const techniqueIndex = this._techniques.findIndex((t) => t.type === type);
    if (techniqueIndex === -1) {
      return;
    }

    this._techniques.splice(techniqueIndex, 1);
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
  public techniqueApplicable(type: GuitarTechniqueType): boolean {
    return !this._techniques.some((e) =>
      TECHNIQUES_INCOMPATIBILITY[e.type].includes(type)
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
   * @returns Deep copy of the guitar note
   */
  public deepCopy(): GuitarNote {
    const note = new GuitarNote(
      this.beat,
      this.trackContext,
      this._stringNum,
      this._fret
    );

    for (const technique of this._techniques) {
      this.addTechnique(technique.deepCopy());
    }

    return note;
  }

  /**
   * Parses guitar note into JSON string
   * @returns Parsed JSON string
   */
  public toJSON(): GuitarNoteJSON | null {
    if (this._fret === undefined) {
      return null;
    }

    const fxJSON: GuitarTechniqueJSON[] = [];
    for (const technique of this._techniques) {
      fxJSON.push(technique.toJSON());
    }

    return {
      instrumentType: this.trackContext.instrument.type,
      stringNum: this._stringNum,
      fret: this._fret,
      noteValue: this._noteValue,
      octave: this._octave,
      techniques: fxJSON,
    };
  }

  /**
   * Validates that the passed object is a valid guitar note serialization
   * @param obj Object to validate
   */
  static validateGuitarNote(obj: Record<string, unknown>): GuitarNoteJSON {
    const requiredFields = [
      "noteValue",
      "octave",
      "stringNum",
      "fret",
      "techniques",
    ];
    for (const key of requiredFields) {
      if (obj[key] === undefined) {
        throw new Error(`Missing property: ${key}`);
      }
    }

    if (!NOTE_VALUES_ARR.includes(obj.noteValue as NoteValue)) {
      throw new Error(`Invalid note value: ${obj.noteValue}`);
    }

    if (typeof obj.octave !== "number" && obj.octave !== null) {
      throw new Error(`Invalid octave: expected number or null`);
    }

    if (typeof obj.fret !== "number" && obj.fret !== null) {
      throw new Error(`Invalid fret: expected number or null`);
    }

    if (typeof obj.stringNum !== "number") {
      throw new Error(`Invalid stringNum: expected number`);
    }

    if (!Array.isArray(obj.techniques)) {
      throw new Error(`Invalid techniques: expected array`);
    }

    return {
      instrumentType: obj.instrumentType as MusicInstrumentType,
      noteValue: obj.noteValue as NoteValue,
      octave: obj.octave,
      stringNum: obj.stringNum,
      fret: obj.fret,
      techniques: [],
    };
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
    this._fret = newFret;
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
