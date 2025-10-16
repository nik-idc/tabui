import { Beat } from "../../models/beat";
import { Rect } from "../shapes/rect";
import { TabWindowDim } from "../tab-window-dim";
import { NoteElement } from "./note-element";
/**
 * Class that handles drawing note elements of the beat
 */
export declare class BeatNotesElement {
    /**
     * Tab window dimensions
     */
    readonly dim: TabWindowDim;
    /**
     * Beat
     */
    readonly beat: Beat;
    /**
     * Rectangle
     */
    readonly rect: Rect;
    /**
     * Note elements
     */
    readonly noteElements: NoteElement[];
    /**
     * Class that handles drawing note elements of the beat
     * @param dim Tab window dimensions
     * @param beat Beat
     * @param width Width of the beat element
     * @param labelsGapHeight Height of the labels gap. Dictates the y-axis of the rect
     */
    constructor(dim: TabWindowDim, beat: Beat, width: number, labelsGapHeight?: number);
    /**
     * Calculate the note elements
     */
    calc(): void;
    scaleHorBy(scale: number): void;
}
