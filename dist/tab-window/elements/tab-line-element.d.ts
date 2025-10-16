import { Bar } from "../../models/bar";
import { Point } from "../shapes/point";
import { Rect } from "../shapes/rect";
import { TabWindowDim } from "../tab-window-dim";
import { BarElement } from "./bar-element";
import { Tab } from "../../models/tab";
import { GuitarEffectType } from "../../models/guitar-effect/guitar-effect-type";
import { GuitarEffectOptions } from "../../models/guitar-effect/guitar-effect-options";
/**
 * Class that handles a tab line element
 */
export declare class TabLineElement {
    /**
     * Tab
     */
    readonly tab: Tab;
    /**
     * Tab window dimensions
     */
    readonly dim: TabWindowDim;
    /**
     * Line encapsulating rectangle
     */
    rect: Rect;
    /**
     * Effects encapsulating rectangle (horizontal, as wide as 'rect')
     */
    effectLabelsRect: Rect;
    /**
     * Bar elements on this line
     */
    barElements: BarElement[];
    /**
     * Class that handles a tab line element
     * @param tab Tab
     * @param dim Tab window dimensions
     * @param coords Tab line coordinates
     */
    constructor(tab: Tab, dim: TabWindowDim, coords: Point);
    /**
     * Justifies elements by scaling all their widths
     */
    justifyElements(): void;
    /**
     * True if the bar element fits in this line, false otherwise
     * @param barElement Bar element whose fitness to test
     * @returns True if the bar element fits in this line, false otherwise
     */
    barElementFits(barElement: BarElement): boolean;
    /**
     * Changes the width of the encapsulating and effects rectangles
     * @param dWidth Width by which to change
     */
    private changeWidth;
    setHeight(newHeight: number): void;
    insertEffectGap(gapHeight: number): void;
    removeEffectGap(): void;
    /**
     * Attempts to add a bar to the line
     * @param bar Bar to add
     * @param prevBar Previous bar
     * @returns True if added succesfully, false otherwise
     */
    addBar(bar: Bar, prevBar?: Bar): boolean;
    calc(): void;
    /**
     * Removes bar element
     * @param barElementId Index of the bar element in this line
     */
    removeBarElement(barElementId: number): void;
    applyEffectSingle(barElementId: number, beatElementId: number, stringNum: number, effectType: GuitarEffectType, effectOptions?: GuitarEffectOptions): boolean;
    removeEffectSingle(barElementId: number, beatElementId: number, stringNum: number, effectIndex: number): void;
    getFitToScale(): number;
}
