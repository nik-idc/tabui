import { Bar } from "./bar";
import { Beat } from "./beat";
import { Guitar } from "./guitar";
import { GuitarEffectOptions } from "./guitar-effect/guitar-effect-options";
import { GuitarEffectType } from "./guitar-effect/guitar-effect-type";
import { GuitarNote } from "./guitar-note";
/**
 * Class that represents a guitar tab
 */
export declare class Tab {
    /**
     * Tab id
     */
    readonly id: number | undefined;
    /**
     * Tab name
     */
    name: string;
    /**
     * Artist
     */
    artist: string;
    /**
     * Song
     */
    song: string;
    /**
     * Guitar
     */
    readonly guitar: Guitar;
    /**
     * Bars of the tab
     */
    readonly bars: Bar[];
    /**
     * Public status
     */
    readonly isPublic: boolean;
    /**
     * Class that represents a guitar tab
     * @param id Tab id
     * @param name Tab name
     * @param artist Artist
     * @param song Song
     * @param guitar Guitar
     * @param bars Bars of the tab
     * @param isPublic Public status
     */
    constructor(id?: number | undefined, name?: string, artist?: string, song?: string, guitar?: Guitar, bars?: Bar[] | undefined, isPublic?: boolean);
    /**
     * Removes beat from tab
     * @param beatToRemove Beat to remove
     */
    removeBeat(beatToRemove: Beat): void;
    /**
     * Removes beats from tab
     * @param beats Beats to remove
     */
    removeBeats(beats: Beat[]): void;
    /**
     * Replaces beat section with another beat section
     * @param oldBeats Old beats
     * @param newBeats New beats
     */
    replaceBeats(oldBeats: Beat[], newBeats: Beat[]): void;
    /**
     * Applies bend to a note
     * @param barIndex Bar index
     * @param beatIndex Beat index
     * @param stringNum String number
     * @param bendPitch Bend pitch
     * @returns True if applied, false otherwise
     */
    private applyBend;
    /**
     * Applies bend to a note
     * @param barIndex Bar index
     * @param beatIndex Beat index
     * @param stringNum String number
     * @param bendPitch Bend pitch
     * @param bendReleasePitch Bend release pitch
     * @returns True if applied, false otherwise
     */
    private applyBendAndRelease;
    /**
     * Applies bend to a note
     * @param barIndex Bar index
     * @param beatIndex Beat index
     * @param stringNum String number
     * @param prebendPitch Prebend pitch
     * @returns True if applied, false otherwise
     */
    private applyPrebend;
    /**
     * Applies bend to a note
     * @param barIndex Bar index
     * @param beatIndex Beat index
     * @param stringNum String number
     * @param prebendPitch Prebend pitch
     * @param bendReleasePitch Bend release pitch
     * @returns True if applied, false otherwise
     */
    private applyPrebendAndRelease;
    /**
     * Applies vibrato to a note
     * @param barIndex Bar index
     * @param beatIndex Beat index
     * @param stringNum String number
     * @returns True if applied, false otherwise
     */
    private applyVibrato;
    /**
     * Applies slide to a note
     * @param barIndex Bar index
     * @param beatIndex Beat index
     * @param stringNum String number
     * @returns True if applied, false otherwise
     */
    private applySlide;
    /**
     * Applies hammer-on/pull-off to a note
     * @param barIndex Bar index
     * @param beatIndex Beat index
     * @param stringNum String number
     * @returns True if applied, false otherwise
     */
    private applyHammerOnOrPullOff;
    /**
     * Applies pinch harmonic to a note
     * @param barIndex Bar index
     * @param beatIndex Beat index
     * @param stringNum String number
     * @returns True if applied, false otherwise
     */
    private applyPinchHarmonic;
    /**
     * Applies natural harmonic to a note
     * @param barIndex Bar index
     * @param beatIndex Beat index
     * @param stringNum String number
     * @returns True if applied, false otherwise
     */
    private applyNaturalHarmonic;
    /**
     * Applies palm mute to a note
     * @param barIndex Bar index
     * @param beatIndex Beat index
     * @param stringNum String number
     * @returns True if applied, false otherwise
     */
    private applyPalmMute;
    /**
     * Applies specified effect
     * @param barIndex Bar index
     * @param beatIndex Beat index
     * @param stringNum String number
     * @param effect Effect to apply
     * @returns True if effect applied or no note to apply effect to, false
     * if effect inapplicable to specified note
     */
    applyEffectToNote(barIndex: number, beatIndex: number, stringNum: number, effectType: GuitarEffectType, effectOptions?: GuitarEffectOptions): boolean;
    removeEffectFromNote(barIndex: number, beatIndex: number, stringNum: number, effectIndex: number): void;
    /**
     * Applies effects to all notes in specified beats
     * @param beats Beats array
     * @param effect Effect to apply
     * @returns True if the effect applied to all notes
     */
    applyEffectToBeats(beats: Beat[], effectType: GuitarEffectType, effectOptions?: GuitarEffectOptions): boolean;
    /**
     * Get next beat in the tab
     * @param barIndex Bar index
     * @param beatIndex Beat index (inside the bar)
     * @returns Beat (or undefined if can't get next beat)
     */
    getNextBeat(barIndex: number, beatIndex: number): Beat | undefined;
    /**
     * Get next beat in the tab
     * @param barIndex Bar index
     * @param beatIndex Beat index (inside the bar)
     * @returns Beat (or undefined if can't get next beat)
     */
    getPrevBeat(barIndex: number, beatIndex: number): Beat | undefined;
    /**
     * All the beats as an array. Does a flat map, so consider performance
     */
    getBeatsSeq(): Beat[];
    getNotesSeq(): GuitarNote[];
    findBarByUUID(barUUID: number): Bar | undefined;
    findBeatByUUID(beatUUID: number): Beat | undefined;
    findNoteByUUID(noteUUID: number): GuitarNote | undefined;
    findBeatsBar(beat: Beat): Bar;
    findNotesBeat(note: GuitarNote): Beat;
    findNotesBar(note: GuitarNote): Bar;
    deepCopy(): Tab;
    /**
     * Full song name
     */
    get fullSongName(): string;
    /**
     * Parses a JSON object into a Tab class object
     * @param obj JSON object to parse
     * @returns Parsed Tab object
     */
    static fromObject(obj: any): Tab;
}
