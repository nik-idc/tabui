import { Bar } from "./../../models/bar";
import { Rect } from "../shapes/rect";
import { BeatElement } from "./beat-element";
import { Point } from "../shapes/point";
import { Beat } from "./../../models/beat";
import { TabWindowDim } from "../tab-window-dim";
import { NoteDuration } from "../../models/note-duration";
/**
 * Class that handles drawing beat element in the tab
 */
export declare class BarElement {
    /**
     * Tab window dimensions
     */
    readonly dim: TabWindowDim;
    /**
     * This bar's beat elements
     */
    beatElements: BeatElement[];
    /**
     * If signature is to be shown in the bar
     */
    showSignature: boolean;
    /**
     * If tempo is to be shown in the bar
     */
    showTempo: boolean;
    /**
     * Tempo rectangle
     */
    tempoRect: Rect;
    /**
     * Time signature rectangle
     */
    timeSigRect: Rect;
    /**
     * The height of the gap between durations and notes for effect labels
     */
    private _labelsGapHeight;
    /**
     * Bar element rectangle
     */
    rect: Rect;
    /**
     * Bar element's lines
     * The reason they are here and not in 'TabLineElement' is
     * because, if a bar's durations don't fit the lines of that
     * specific bar, then they need to be red. No way to do that
     * in 'TabLineElement'
     */
    staffLines: Point[][];
    /**
     * The bar
     */
    readonly bar: Bar;
    /**
     * Class that handles drawing beat element in the tab
     * @param dim Tab window dimensions
     * @param barCoords Bar element coords
     * @param bar Bar
     * @param showSignature Whether to show signature
     * @param showTempo Whether to show tempo
     */
    constructor(dim: TabWindowDim, bar: Bar, showSignature: boolean, showTempo: boolean, horizontalBarOffset?: number, labelGapHeight?: number);
    /**
     * TODO: Change all elements except TabLineElement to use local coords
     * Later adjust the render function
     */
    private calcTempoRect;
    private calcTimeSigRect;
    private calcBeatsAndRect;
    private calcStaffLines;
    /**
     * Calculates this bar element
     */
    calc(): void;
    setHeight(newHeight: number): void;
    insertEffectGap(gapHeight: number): void;
    removeEffectGap(): void;
    scaleHorBy(scale: number): void;
    /**
     * Insert empty beat
     * @param index Insertion index
     */
    insertEmptyBeat(index: number): void;
    /**
     * Prepend empty beat
     */
    prependBeat(): void;
    /**
     * Append empty beat
     */
    appendBeat(): void;
    /**
     * Remove beat at index
     * @param index Removal index
     */
    removeBeat(index: number): void;
    /**
     * Remove beat using its UUID
     * @param uuid Beat's UUID
     */
    removeBeatByUUID(uuid: number): void;
    /**
     * Change beat's duration
     * @param beat Beat
     * @param duration New duration
     */
    changeBeatDuration(beat: Beat, duration: number): void;
    /**
     * Change bar's beats value
     * @param beatsCount New beats value
     * @param prevBar Bar preceding this element's bar
     */
    changeBarBeats(beatsCount: number, prevBar?: Bar): void;
    /**
     * Change bar duration
     * @param duration New bar duration
     * @param prevBar Bar preceding this element's bar
     */
    changeBarDuration(duration: NoteDuration, prevBar?: Bar): void;
    /**
     * Change bar tempo
     * @param tempo New tempo
     * @param prevBar Bar preceding this element's bar
     */
    changeTempo(tempo: number, prevBar?: Bar): void;
    /**
     * True if durations fit according to signature values
     */
    get durationsFit(): boolean;
    /**
     * Time signature beats rectangle
     */
    get beatsRect(): Rect;
    /**
     * Time signature beats text coords
     */
    get beatsTextCoords(): Point;
    /**
     * Time signature measure text rectangle
     */
    get measureRect(): Rect;
    /**
     * Time signature measure text coords
     */
    get measureTextCoords(): Point;
    /**
     * Tempo image coords
     */
    get tempoImageRect(): Rect;
    /**
     * Tempo text coords
     */
    get tempoTextCoords(): Point;
    /**
     * Bar left border line (array of 2 points)
     */
    get barLeftBorderLine(): Point[];
    /**
     * Bar right border line (array of 2 points)
     */
    get barRightBorderLine(): Point[];
    /**
     * Creates a new bar element
     * @param dim Tab window dimensions
     * @param bar Bar
     * @param prevBar Previous bar
     * @returns Created bar element
     */
    static createBarElement(dim: TabWindowDim, bar: Bar, prevBar?: Bar, horizontalBarOffset?: number, labelGapHeight?: number): BarElement;
}
