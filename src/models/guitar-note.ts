import { Guitar } from "./guitar";
import { Note, NoteValue, NotesArr } from "./note";
import { randomInt } from "../misc/random-int";
import { EFFECTS_INCOMPATIBILITY } from "./guitar-effect/guitar-effect-lists";
import { GuitarEffect } from "./guitar-effect/guitar-effect";
import { GuitarEffectType } from "./guitar-effect/guitar-effect-type";

/**
 * Class that represents a guitar note
 */
export class GuitarNote {
  /**
   * Guitar note's unique identifier
   */
  readonly uuid: number;
  /**
   * Guitar on which the note is played
   */
  readonly guitar: Guitar;
  /**
   * String number
   */
  private _stringNum: number = 0;
  /**
   * Fret number
   */
  private _fret: number | undefined;
  /**
   * Note value
   */
  private _note: Note;
  /**
   * Effects currently applied to the note
   */
  private _effects: GuitarEffect[];

  /**
   * Class that represents a guitar note
   * @param guitar Guitar on which the note is played
   * @param stringNum String number
   * @param fret Fret number
   */
  constructor(
    guitar: Guitar,
    stringNum: number,
    fret?: number,
    effects: GuitarEffect[] = []
  ) {
    this.uuid = randomInt();
    this.guitar = guitar;
    this._stringNum = stringNum;
    this._fret = fret;
    this._effects = effects;
    this._note = new Note(NoteValue.None);

    this.calcNote();
  }

  /**
   * Getter/setter for string number
   */
  get stringNum(): number {
    return this._stringNum;
  }

  /**
   * Getter/setter for fret number
   */
  get fret(): number | undefined {
    return this._fret;
  }

  /**
   * Getter/setter for fret number
   */
  set fret(val: number | undefined) {
    // Undefined means no note
    if (val === undefined) {
      this._fret = undefined;
      this.calcNote();
      return;
    }

    if (typeof val === "number") {
      if (val < 0) {
        throw Error("Negative numbers can't be fret values");
      }

      this._fret =
        val <= this.guitar.fretsCount ? val : val % this.guitar.fretsCount;
      this.calcNote();
    }
  }

  /**
   * Calculate musical note value based on the fret & string number
   * @returns
   */
  private calcNote(): void {
    if (this._fret === undefined) {
      this._note = new Note(NoteValue.None);
      return;
    }

    if (typeof this._fret === "string") {
      this._note = new Note(NoteValue.Dead);
      return;
    }

    const tuning = this.guitar.tuning;
    const openStringNote = tuning[this._stringNum - 1];
    const note = new Note(openStringNote.noteValue, openStringNote.octave);
    note.raiseNote(this._fret);
    this._note = note;
  }

  /**
   * Adds new effect to the note
   * @param guitarEffect Guitar effect to add
   * @returns True if effect added succesfully, false if can't add this effect
   */
  public addEffect(guitarEffect: GuitarEffect): boolean {
    // Check if effect to be added is compatible with all the other effects
    for (const effect of this._effects) {
      const curIncompatibility = EFFECTS_INCOMPATIBILITY[effect.effectType];
      if (
        curIncompatibility.some((incompatibleType) => {
          return incompatibleType === guitarEffect.effectType;
        })
      ) {
        // One of the effects is incompatible with the
        // to be added effect => discard and return false
        return false;
      }
    }

    // All effects are compatible with each
    // other => add new effect and return true
    this._effects.push(guitarEffect);
    return true;
  }

  public removeEffect(effectType: GuitarEffectType): void {}

  public clearEffects(): void {
    this._effects = [];
  }

  /**
   * Deep copy of the guitar note
   * @returns Deep copy of the guitar note
   */
  public deepCopy(): GuitarNote {
    const note = new GuitarNote(this.guitar, this._stringNum, this._fret);

    for (const effect of this._effects) {
      note.addEffect(effect.deepCopy());
    }

    return note;
  }

  /**
   * Note value of the current note
   */
  public get note(): Note {
    return this._note;
  }

  /**
   * Effects array
   */
  public get effects(): GuitarEffect[] {
    return this._effects;
  }

  /**
   * Parses guitar note into simple object
   * @returns Simple parsed object
   */
  public toJSONObj(): Object | null {
    if (this._fret === undefined) {
      return null;
    }

    const fxJSON = [];
    for (const effect of this._effects) {
      fxJSON.push(effect.toJSONObj());
    }

    return {
      stringNum: this._stringNum,
      fret: this._fret,
      note: this._note.toJSONObj(),
      effects: fxJSON,
    };
  }

  /**
   * Parses guitar note into JSON string
   * @returns Parsed JSON string
   */
  public toJSON(): string {
    return JSON.stringify(this.toJSONObj());
  }

  /**
   * Parse from object
   * @param guitar Guitar for the track
   * @param obj Object
   * @returns Parsed guitar note
   */
  static fromJSON(guitar: Guitar, obj: any): GuitarNote {
    if (obj === null && obj === "null") {
      throw Error("Can't parse a null guitar note");
    }

    if (
      obj.stringNum === undefined ||
      obj.fret === undefined ||
      obj.note === undefined ||
      obj.effects === undefined
    ) {
      throw Error(
        `Invalid JSON to parse into guitar note, obj: ${JSON.stringify(obj)}`
      );
    }

    const effects: GuitarEffect[] = [];
    for (const effect of obj.effects) {
      effects.push(GuitarEffect.fromJSON(effect));
    }

    const stringNum = obj.stringNum === undefined ? 0 : obj.stringNum;
    const fret = obj.fret;
    return new GuitarNote(guitar, stringNum, fret, effects);
  }

  /**
   * Compares two guitar notes for equality (ignores uuid)
   * @param note1 Note 1
   * @param note2 Note 2
   * @returns True if equal (ignoring uuid)
   */
  static compare(note1: GuitarNote, note2: GuitarNote): boolean {
    return (
      note1._fret === note2._fret &&
      note1._note === note2._note &&
      note1._stringNum === note2._stringNum &&
      note1.guitar === note2.guitar
    );
  }
}
