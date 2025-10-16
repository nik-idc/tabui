import { Bar } from "../../models/bar";
import { Beat } from "../../models/beat";
import { GuitarNote } from "../../models/guitar-note";
import { Tab } from "../../models/tab";
/**
 * Tests if a specified element is a 'SelectedElement' instance
 * @param element Element
 * @returns True if is an instance, false otherwise
 */
export declare function isSelectedElement(element: SelectedElement | any): element is SelectedElement;
export declare enum SelectedMoveDirection {
    Left = 0,
    Right = 1,
    Up = 2,
    Down = 3
}
/**
 * Types of outcomes for moving a note right
 */
export declare enum MoveRightResult {
    Nothing = 0,
    AddedBeat = 1,
    AddedBar = 2
}
/**
 * Move right output type
 */
export type MoveRightOutput = {
    result: MoveRightResult.Nothing;
    addedBar?: undefined;
} | {
    result: MoveRightResult.AddedBeat;
    addedBar?: undefined;
} | {
    result: MoveRightResult.AddedBar;
    addedBar: Bar;
};
/**
 * Class that contains all necessary information
 * about a selected element
 */
export declare class SelectedElement {
    private _tab;
    private _noteUUID;
    private _barId;
    private _beatId;
    private _stringNum;
    /**
     * Class that contains all necessary information
     * about a selected element
     * @param _tab Tab
     * @param _noteUUID Note UUID
     */
    constructor(_tab: Tab, _noteUUID: number);
    /**
     * Move selected note up (or to the last string if current is the first)
     */
    moveUp(): void;
    /**
     * Move selected note down (or to the first string if current is the last)
     */
    moveDown(): void;
    /**
     * Move selected note left (or to the last note of the previous bar)
     */
    moveLeft(): void;
    /**
     * Move selected note right (or to the first note of the next bar)
     * @returns A move right result
     */
    moveRight(): MoveRightOutput;
    /**
     * Selected note
     */
    get note(): GuitarNote;
    /**
     * Selected beat
     */
    get beat(): Beat;
    /**
     * Selected bar
     */
    get bar(): Bar;
    /**
     * Selected tab
     */
    get tab(): Tab;
    /**
     * Selected note's string number
     */
    get stringNum(): number;
    /**
     * Selected beat id
     */
    get beatId(): number;
    /**
     * Selected bar id
     */
    get barId(): number;
}
