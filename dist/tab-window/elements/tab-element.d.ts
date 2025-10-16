import { Bar } from "../../models/bar";
import { Beat } from "../../models/beat";
import { GuitarNote } from "../../models/guitar-note";
import { Tab } from "../../models/tab";
import { Point } from "../shapes/point";
import { Rect } from "../shapes/rect";
import { TabWindowDim } from "../tab-window-dim";
import { BarElement } from "./bar-element";
import { BeatElement } from "./beat-element";
import { NoteElement } from "./note-element";
import { MoveRightOutput, SelectedElement } from "./selected-element";
import { TabLineElement } from "./tab-line-element";
/**
 * Tab window specific selected element ids
 */
export type SelectedElementsAndIds = {
    /**
     * Id of the tab line element
     */
    tabLineElementId: number;
    /**
     * If of the bar element (within the tab line element)
     */
    barElementId: number;
    /**
     * Id of the beat element, same as beat id, in here just
     * for consistency's sake
     */
    beatElementId: number;
    /**
     * String number
     */
    stringNum: number;
    /**
     * Id of the tab line element
     */
    tabLineElement: TabLineElement;
    /**
     * If of the bar element (within the tab line element)
     */
    barElement: BarElement;
    /**
     * Id of the beat element, same as beat id, in here just
     * for consistency's sake
     */
    beatElement: BeatElement | undefined;
    /**
     * String number
     */
    noteElement: NoteElement | undefined;
};
export declare class TabElement {
    /**
     * Tab object to get data from
     */
    private _tab;
    /**
     * Dimensions object
     */
    readonly dim: TabWindowDim;
    /**
     * Tab line elements
     */
    private _tabLineElements;
    private _selectionRects;
    constructor(tab: Tab, dim: TabWindowDim);
    private addBar;
    /**
     * Calc tab window. Goes through every bar of a tab and calculates
     * the resulting window with multiple bar lines
     */
    calc(): void;
    /**
     * Handles added beat after moving right
     */
    handleAddedBeat(selectedElement: SelectedElement): void;
    /**
     * Handles added bar after moving right
     * @param addedBar Added bar
     */
    handleAddedBar(addedBar: Bar): void;
    handleMoveRight(moveRightOutput: MoveRightOutput, selectedElement: SelectedElement): void;
    getSelectedNoteElementsAndIds(selectedElement: SelectedElement): SelectedElementsAndIds;
    resetSelection(): void;
    recalcBeatElementSelection(selectionBeats: Beat[]): void;
    resetTab(newTab: Tab): void;
    findCorrespondingBarElement(bar: Bar): BarElement | undefined;
    findCorrespondingBeatElement(beat: Beat): BeatElement | undefined;
    findCorrespondingNoteElement(note: GuitarNote): NoteElement | undefined;
    getBeatElementByUUID(beatUUID: number): BeatElement | undefined;
    getBeatElementGlobalCoords(neededBeatElement: BeatElement): Point;
    get tabLineElements(): TabLineElement[];
    get selectionRects(): Rect[];
}
