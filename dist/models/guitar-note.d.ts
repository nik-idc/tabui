import { Guitar } from "./guitar";
import { Note } from "./note";
import { GuitarEffect } from "./guitar-effect/guitar-effect";
import { GuitarEffectType } from "./guitar-effect/guitar-effect-type";
/**
 * Class that represents a guitar note
 */
export declare class GuitarNote {
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
    private _stringNum;
    /**
     * Fret number
     */
    private _fret;
    /**
     * Note value
     */
    private _note;
    /**
     * Effects currently applied to the note
     */
    private _effects;
    /**
     * Class that represents a guitar note
     * @param guitar Guitar on which the note is played
     * @param stringNum String number
     * @param fret Fret number
     */
    constructor(guitar: Guitar, stringNum: number, fret: number | undefined);
    /**
     * Getter/setter for string number
     */
    get stringNum(): number;
    /**
     * Getter/setter for string number
     */
    set stringNum(val: number);
    /**
     * Getter/setter for fret number
     */
    get fret(): number | undefined;
    /**
     * Getter/setter for fret number
     */
    set fret(val: number | undefined);
    /**
     * Calculate musical note value based on the fret & string number
     * @returns
     */
    private calcNote;
    /**
     * Adds new effect to the note
     * @param guitarEffect Guitar effect to add
     * @returns True if effect added succesfully, false if can't add this effect
     */
    addEffect(guitarEffect: GuitarEffect): boolean;
    removeEffect(effectType: GuitarEffectType): void;
    clearEffects(): void;
    /**
     * Deep copy of the guitar note
     * @returns Deep copy of the guitar note
     */
    deepCopy(): GuitarNote;
    /**
     * Note value of the current note
     */
    get note(): Note;
    /**
     * Effects array
     */
    get effects(): GuitarEffect[];
    /**
     * Parse from object
     * @param obj Object
     * @returns Parsed guitar note
     */
    static fromObject(obj: any): GuitarNote;
    /**
     * Compares two guitar notes for equality (ignores uuid)
     * @param note1 Note 1
     * @param note2 Note 2
     * @returns True if equal (ignoring uuid)
     */
    static compare(note1: GuitarNote, note2: GuitarNote): boolean;
}
