import { Bar } from "../../models/bar";
import { Beat } from "../../models/beat";
/**
 * Tests if a specified element is a 'SelectedElement' instance
 * @param element Element
 * @returns True if is an instance, false otherwise
 */
export function isSelectedElement(element) {
    return element.stringNum !== undefined;
}
export var SelectedMoveDirection;
(function (SelectedMoveDirection) {
    SelectedMoveDirection[SelectedMoveDirection["Left"] = 0] = "Left";
    SelectedMoveDirection[SelectedMoveDirection["Right"] = 1] = "Right";
    SelectedMoveDirection[SelectedMoveDirection["Up"] = 2] = "Up";
    SelectedMoveDirection[SelectedMoveDirection["Down"] = 3] = "Down";
})(SelectedMoveDirection || (SelectedMoveDirection = {}));
/**
 * Types of outcomes for moving a note right
 */
export var MoveRightResult;
(function (MoveRightResult) {
    MoveRightResult[MoveRightResult["Nothing"] = 0] = "Nothing";
    MoveRightResult[MoveRightResult["AddedBeat"] = 1] = "AddedBeat";
    MoveRightResult[MoveRightResult["AddedBar"] = 2] = "AddedBar";
})(MoveRightResult || (MoveRightResult = {}));
/**
 * Class that contains all necessary information
 * about a selected element
 */
export class SelectedElement {
    _tab;
    _noteUUID;
    _barId = 0;
    _beatId = 0;
    _stringNum = 1;
    /**
     * Class that contains all necessary information
     * about a selected element
     * @param _tab Tab
     * @param _noteUUID Note UUID
     */
    constructor(_tab, _noteUUID) {
        this._tab = _tab;
        this._noteUUID = _noteUUID;
        this.tab.bars.some((bar, barIndex) => {
            return bar.beats.some((beat, beatIndex) => {
                return beat.notes.some((note, noteIndex) => {
                    this._barId = barIndex;
                    this._beatId = beatIndex;
                    this._stringNum = note.stringNum;
                    return note.uuid === this._noteUUID;
                });
            });
        });
    }
    /**
     * Move selected note up (or to the last string if current is the first)
     */
    moveUp() {
        const stringsCount = this._tab.guitar.stringsCount;
        const newstringNum = this._stringNum === 1 ? stringsCount : this._stringNum - 1;
        this._stringNum = newstringNum;
    }
    /**
     * Move selected note down (or to the first string if current is the last)
     */
    moveDown() {
        const stringsCount = this._tab.guitar.stringsCount;
        const newstringNum = this._stringNum === stringsCount ? 1 : this._stringNum + 1;
        this._stringNum = newstringNum;
    }
    /**
     * Move selected note left (or to the last note of the previous bar)
     */
    moveLeft() {
        // If not first bar beat
        if (this._beatId !== 0) {
            this._beatId--;
            return;
        }
        // Do nothing if last bar and last beat
        if (this._barId === 0) {
            return;
        }
        // Move to the left bar
        this._barId--;
        this._beatId = this.bar.beats.length - 1;
    }
    /**
     * Move selected note right (or to the first note of the next bar)
     * @returns A move right result
     */
    moveRight() {
        // Check if can add beats to the bar
        if (this._beatId === this.bar.beats.length - 1 &&
            !this.bar.durationsFit &&
            this.bar.actualDuration() < this.bar.beatsCount * this.bar.duration) {
            // If the current beat is not the last one of the bar AND
            // If durations don't fit AND
            // If currently actual bar duration is less than the correct one
            // append a new beat and select it
            // !!
            // -- commented this because tab manipulations will be done
            // -- outside of this class
            // this.bar.appendBeat();
            // !!
            this._beatId++;
            // Recalc tab window
            // this._tabWindow.calc();
            return { result: MoveRightResult.AddedBeat };
        }
        if (this._beatId !== this.bar.beats.length - 1) {
            // Can't add more beats but can move to the next beat
            this._beatId++;
            // return false;
            return { result: MoveRightResult.Nothing };
        }
        // Can't move to next beat OR add more beats, move to the next bar
        if (this._barId !== this._tab.bars.length - 1) {
            this._barId++;
            this._beatId = 0;
            // return false;
            return { result: MoveRightResult.Nothing };
        }
        // If current bar is the last one of the tab
        const newBar = new Bar(this._tab.guitar, this.bar.tempo, this.bar.beatsCount, this.bar.duration, [new Beat(this._tab.guitar, this.beat.duration)]);
        // !!
        // -- commented this because tab manipulations will be done
        // -- outside of this class
        // this._tab.bars.push(newBar);
        // !!
        this._barId++;
        this._beatId = 0;
        // Recalc tab window
        // this._tabWindow.calc();
        // return true;
        return { result: MoveRightResult.AddedBar, addedBar: newBar };
    }
    /**
     * Selected note
     */
    get note() {
        return this._tab.bars[this._barId].beats[this._beatId].notes[this._stringNum - 1];
    }
    /**
     * Selected beat
     */
    get beat() {
        return this._tab.bars[this._barId].beats[this._beatId];
    }
    /**
     * Selected bar
     */
    get bar() {
        return this._tab.bars[this._barId];
    }
    /**
     * Selected tab
     */
    get tab() {
        return this._tab;
    }
    /**
     * Selected note's string number
     */
    get stringNum() {
        return this._stringNum;
    }
    /**
     * Selected beat id
     */
    get beatId() {
        return this._beatId;
    }
    /**
     * Selected bar id
     */
    get barId() {
        return this._barId;
    }
}
//# sourceMappingURL=selected-element.js.map