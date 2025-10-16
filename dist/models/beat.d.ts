import { Guitar } from "./guitar";
import { GuitarNote } from "./guitar-note";
import { NoteDuration } from "./note-duration";
/**
 * Class that represents a beat
 */
export declare class Beat {
    /**
     * Beat's unique identifier
     */
    readonly uuid: number;
    /**
     * Guitar on which the beat is played
     */
    readonly guitar: Guitar;
    /**
     * Note duration
     */
    duration: NoteDuration;
    /**
     * Beat notes
     */
    readonly notes: GuitarNote[];
    /**
     * Class that represents a beat
     * @param guitar Guitar on which the beat is played
     * @param duration Note duration
     */
    constructor(guitar: Guitar, duration: NoteDuration);
    deepCopy(): Beat;
    /**
     * Parses a JSON object and returns a beat object
     * @param obj Beat object
     * @returns Parsed beat object
     */
    static fromObject(obj: any): Beat;
    /**
     * Compares two beats for equality (ignores uuid)
     * @param beat1 Beat 1
     * @param beat2 Beat 2
     * @returns True if equal (ignoring uuid)
     */
    static compare(beat1: Beat, beat2: Beat): boolean;
}
