import { Beat } from "./beat";
import { Guitar } from "./guitar";
import { NoteDuration } from "./note-duration";
/**
 * Class that represents a musical bar
 */
export declare class Bar {
    /**
     * Bar's unqiue identifier
     */
    readonly uuid: number;
    /**
     * Guitar on which the bar is played
     */
    readonly guitar: Guitar;
    /**
     * Tempo of the bar
     */
    private _tempo;
    /**
     * Number of beats for the bar (upper number in time signature)
     */
    private _beatsCount;
    /**
     * The duration of the note that constitutes a whole bar
     * (upper number in time signature)
     */
    duration: NoteDuration;
    /**
     * Array of all beats in the bar
     */
    readonly beats: Beat[];
    /**
     * Class that represents a musical bar
     * @param guitar Guitar on which the bar is played
     * @param tempo Tempo of the bar
     * @param beatsCount Number of beats for the bar
     * @param duration The duration of the note that constitutes a whole bar
     * @param beats Array of all beats in the bar
     */
    constructor(guitar: Guitar, tempo: number, beatsCount: number, duration: NoteDuration, beats: Beat[] | undefined);
    /**
     * Gets actual duration of all the beats in the bar
     * @returns Sum of all bar's beats' durations
     */
    actualDuration(): number;
    /**
     * Inserts empty beat in the bar before beat with index 'index'
     * @param index Index of the beat that will be prepended by the new beat
     */
    insertEmptyBeat(index: number): void;
    /**
     * Prepends beat to the beginning of the bar
     */
    prependBeat(): void;
    /**
     * Appends beat to the end of the bar
     */
    appendBeat(): void;
    /**
     * Removes beat at index
     * @param index Index of the beat to be removed
     */
    removeBeat(index: number): void;
    /**
     * Uses UUID to delete beat
     * @param uuid Beat's UUID
     */
    removeBeatByUUID(uuid: number): void;
    /**
     * Insert beats after specified beat
     * @param beatId Id of the beat after which to insert
     * @param beats Beats to insert
     */
    insertBeats(beatId: number, beats: Beat[]): void;
    /**
     * Changes duration of a beat
     * @param beat Beat to change the duration of
     * @param duration New beat duration
     */
    changeBeatDuration(beat: Beat, duration: NoteDuration): void;
    beatPlayable(beatToCheck: Beat): boolean;
    deepCopy(): Bar;
    /**
     * Beats (upper number in time signature) getter/setter
     */
    get beatsCount(): number;
    /**
     * Beats (upper number in time signature) getter/setter
     */
    set beatsCount(newBeats: number);
    /**
     * Tempo getter/setter
     */
    set tempo(newTempo: number);
    /**
     * Tempo getter/setter
     */
    get tempo(): number;
    /**
     * Indicates if all beats in the bar fit
     */
    get durationsFit(): boolean;
    /**
     * Time signature value
     */
    get signature(): number;
    /**
     * Parses a JSON object into a Bar class object
     * @param obj JSON object to parse
     * @returns Parsed Bar object
     */
    static fromObject(obj: any): Bar;
    /**
     * Compares two bars for equality (ignores uuid)
     * @param bar1 Bar 1
     * @param bar2 Bar 2
     * @returns True if equal (ignoring uuid)
     */
    static compare(bar1: Bar, bar2: Bar): boolean;
}
