import { Rect } from "../shapes/rect";
import { Point } from "../shapes/point";
import { GuitarNote } from "./../../models/guitar-note";
import { TabWindowDim } from "../tab-window-dim";
import { GuitarEffectElement } from "./effects/guitar-effect-element";
/**
 * Class that handles drawing note element in the tab
 */
export declare class NoteElement {
    /**
     * Tab window dimensions
     */
    readonly dim: TabWindowDim;
    /**
     * The note
     */
    readonly note: GuitarNote;
    /**
     * Rectangle of the main clickable-area rectangle
     */
    readonly rect: Rect;
    /**
     * Rectangle of the note text rectangle
     */
    readonly textRect: Rect;
    /**
     * Rectangle of the note text rectangle
     */
    readonly textCoords: Point;
    /**
     * Array of guitar effect elements
     */
    private _guitarEffectElements;
    /**
     * Class that handles drawing note element in the tab
     * @param dim Tab window dimensions
     * @param width Width of the beat element
     * @param note Note
     */
    constructor(dim: TabWindowDim, width: number, note: GuitarNote);
    /**
     * Calculate dimensions of the note element
     */
    calc(): void;
    scaleHorBy(scale: number): void;
    get guitarEffectElements(): GuitarEffectElement[];
}
