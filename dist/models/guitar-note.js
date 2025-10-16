import { Guitar } from "./guitar";
import { Note, NoteValue } from "./note";
import { randomInt } from "../misc/random-int";
import { EFFECTS_INCOMPATIBILITY } from "./guitar-effect/guitar-effect-lists";
/**
 * Class that represents a guitar note
 */
export class GuitarNote {
    /**
     * Guitar note's unique identifier
     */
    uuid;
    /**
     * Guitar on which the note is played
     */
    guitar;
    /**
     * String number
     */
    _stringNum = 0;
    /**
     * Fret number
     */
    _fret;
    /**
     * Note value
     */
    _note;
    /**
     * Effects currently applied to the note
     */
    _effects;
    /**
     * Class that represents a guitar note
     * @param guitar Guitar on which the note is played
     * @param stringNum String number
     * @param fret Fret number
     */
    constructor(guitar, stringNum, fret) {
        this.uuid = randomInt();
        this.guitar = guitar;
        this._stringNum = stringNum;
        this._fret = fret;
        this._effects = [];
        this._note = new Note(NoteValue.None);
        this.calcNote();
    }
    /**
     * Getter/setter for string number
     */
    get stringNum() {
        return this._stringNum;
    }
    /**
     * Getter/setter for string number
     */
    set stringNum(val) {
        // Check string validity
        if (val <= 0 || val > this.guitar.stringsCount) {
            throw Error(`${val} is an invalid string number, only strings
				1 to ${this.guitar.stringsCount} are allowed`);
        }
        this._stringNum = val;
        this.calcNote();
    }
    /**
     * Getter/setter for fret number
     */
    get fret() {
        return this._fret;
    }
    /**
     * Getter/setter for fret number
     */
    set fret(val) {
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
    calcNote() {
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
    addEffect(guitarEffect) {
        // Check if effect to be added is compatible with all the other effects
        for (const effect of this._effects) {
            const curIncompatibility = EFFECTS_INCOMPATIBILITY[effect.effectType];
            if (curIncompatibility.some((incompatibleType) => {
                return incompatibleType === guitarEffect.effectType;
            })) {
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
    removeEffect(effectType) { }
    clearEffects() {
        this._effects = [];
    }
    /**
     * Deep copy of the guitar note
     * @returns Deep copy of the guitar note
     */
    deepCopy() {
        const note = new GuitarNote(this.guitar, this._stringNum, this._fret);
        for (const effect of this._effects) {
            note.addEffect(effect.deepCopy());
        }
        return note;
    }
    /**
     * Note value of the current note
     */
    get note() {
        return this._note;
    }
    /**
     * Effects array
     */
    get effects() {
        return this._effects;
    }
    /**
     * Parse from object
     * @param obj Object
     * @returns Parsed guitar note
     */
    static fromObject(obj) {
        if (obj.guitar === undefined || obj._stringNum === undefined) {
            throw Error("Invalid js object to parse to guitar note");
        }
        let guitar = Guitar.fromObject(obj.guitar); // Parse guitar
        let guitarNote = new GuitarNote(guitar, obj._stringNum, obj._fret); // Create guitar note instance
        return guitarNote;
    }
    /**
     * Compares two guitar notes for equality (ignores uuid)
     * @param note1 Note 1
     * @param note2 Note 2
     * @returns True if equal (ignoring uuid)
     */
    static compare(note1, note2) {
        return (note1._fret === note2._fret &&
            note1._note === note2._note &&
            note1._stringNum === note2._stringNum &&
            note1.guitar === note2.guitar);
    }
}
//# sourceMappingURL=guitar-note.js.map