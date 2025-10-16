import { Point } from "../shapes/point";
import { MoveRightResult, } from "./selected-element";
import { TabLineElement } from "./tab-line-element";
export class TabElement {
    /**
     * Tab object to get data from
     */
    _tab;
    /**
     * Dimensions object
     */
    dim;
    /**
     * Tab line elements
     */
    _tabLineElements = [];
    _selectionRects;
    constructor(tab, dim) {
        this._tab = tab;
        this.dim = dim;
        this._selectionRects = [];
        this.calc();
    }
    addBar(bar, prevBar) {
        const lastTabLine = this._tabLineElements[this._tabLineElements.length - 1];
        const addRes = lastTabLine.addBar(bar, prevBar);
        if (!addRes) {
            const newTabLine = new TabLineElement(this._tab, this.dim, lastTabLine.rect.leftBottom);
            this._tabLineElements.push(newTabLine);
            newTabLine.addBar(bar, prevBar);
        }
    }
    /**
     * Calc tab window. Goes through every bar of a tab and calculates
     * the resulting window with multiple bar lines
     */
    calc() {
        this._selectionRects = [];
        this._tabLineElements = [
            new TabLineElement(this._tab, this.dim, new Point(0, 0)),
        ];
        for (let barIndex = 0; barIndex < this._tab.bars.length; barIndex++) {
            this.addBar(this._tab.bars[barIndex], this._tab.bars[barIndex - 1]);
        }
    }
    /**
     * Handles added beat after moving right
     */
    handleAddedBeat(selectedElement) {
        const { tabLineElementId, barElementId } = this.getSelectedNoteElementsAndIds(selectedElement);
        const tabLineElement = this._tabLineElements[tabLineElementId];
        const barElement = tabLineElement.barElements[barElementId];
        // Check if the bar element fits after appending new beat
        if (tabLineElementId === this._tabLineElements.length - 1) {
            // If at the last then simply remove bar element from current line,
            // create and add new tab line and push the bar element there
            tabLineElement.removeBarElement(barElementId);
            // Append empty beat
            barElement.appendBeat();
            // tabLineElement.barElements.splice(barElementId, 1);
            const barId = selectedElement.barId;
            const bar = this._tab.bars[barId];
            const prevBar = this._tab.bars[barId - 1];
            this.addBar(bar, prevBar);
        }
        else {
            // Otherwise just redraw the whole thing since might need to
            // recalc every tab line below the current one anyway
            barElement.appendBeat();
            this.calc();
        }
    }
    /**
     * Handles added bar after moving right
     * @param addedBar Added bar
     */
    handleAddedBar(addedBar) {
        // Add bar
        this._tab.bars.push(addedBar);
        // Compute UI
        const bar = this._tab.bars[this._tab.bars.length - 1];
        const prevBar = this._tab.bars[this._tab.bars.length - 2];
        this.addBar(bar, prevBar);
    }
    handleMoveRight(moveRightOutput, selectedElement) {
        switch (moveRightOutput.result) {
            case MoveRightResult.Nothing:
                break;
            case MoveRightResult.AddedBeat:
                this.handleAddedBeat(selectedElement);
                break;
            case MoveRightResult.AddedBar:
                this.handleAddedBar(moveRightOutput.addedBar);
                break;
            default:
                throw Error("Unexpected outcome after moving note right");
        }
    }
    getSelectedNoteElementsAndIds(selectedElement) {
        let tabLineElement;
        let barElement;
        let tabLineElementId = -1;
        let barElementId = -1;
        this._tabLineElements.some((tle, tleIndex) => {
            return tle.barElements.some((be, beIndex) => {
                tabLineElement = tle;
                tabLineElementId = tleIndex;
                barElement = be;
                barElementId = beIndex;
                return be.bar.uuid === selectedElement.bar.uuid;
            });
        });
        if (tabLineElement === undefined || barElement === undefined) {
            throw Error("Could not find elements");
        }
        const beatElement = barElement.beatElements[selectedElement.beatId];
        const noteElement = beatElement === undefined
            ? undefined
            : beatElement.beatNotesElement.noteElements[selectedElement.stringNum - 1];
        return {
            tabLineElementId: tabLineElementId,
            barElementId: barElementId,
            beatElementId: selectedElement.beatId,
            stringNum: selectedElement.stringNum,
            tabLineElement: tabLineElement,
            barElement: barElement,
            beatElement: beatElement,
            noteElement: noteElement,
        };
    }
    resetSelection() {
        for (const tabLineElement of this._tabLineElements) {
            for (const barElement of tabLineElement.barElements) {
                for (const beatElement of barElement.beatElements) {
                    beatElement.selected = false;
                }
            }
        }
    }
    recalcBeatElementSelection(selectionBeats) {
        for (const tabLineElement of this._tabLineElements) {
            for (const barElement of tabLineElement.barElements) {
                for (const beatElement of barElement.beatElements) {
                    beatElement.selected = selectionBeats.some((beat) => {
                        return beat.uuid === beatElement.beat.uuid;
                    });
                }
            }
        }
    }
    resetTab(newTab) {
        this._tab = newTab;
        this.calc();
    }
    findCorrespondingBarElement(bar) {
        for (const tabLineElement of this._tabLineElements) {
            for (const barElement of tabLineElement.barElements) {
                if (barElement.bar.uuid === bar.uuid) {
                    return barElement;
                }
            }
        }
        return undefined;
    }
    findCorrespondingBeatElement(beat) {
        for (const tabLineElement of this._tabLineElements) {
            for (const barElement of tabLineElement.barElements) {
                for (const beatElement of barElement.beatElements) {
                    if (beatElement.beat.uuid === beat.uuid) {
                        return beatElement;
                    }
                }
            }
        }
        return undefined;
    }
    findCorrespondingNoteElement(note) {
        for (const tabLineElement of this._tabLineElements) {
            for (const barElement of tabLineElement.barElements) {
                for (const beatElement of barElement.beatElements) {
                    for (const noteElement of beatElement.beatNotesElement.noteElements)
                        if (noteElement.note.uuid === note.uuid) {
                            return noteElement;
                        }
                }
            }
        }
        return undefined;
    }
    getBeatElementByUUID(beatUUID) {
        for (const tabLineElement of this._tabLineElements) {
            for (const barElement of tabLineElement.barElements) {
                for (const beatElement of barElement.beatElements) {
                    if (beatElement.beat.uuid === beatUUID) {
                        return beatElement;
                    }
                }
            }
        }
        return undefined;
    }
    getBeatElementGlobalCoords(neededBeatElement) {
        let foundTabLineElement;
        let foundBarElement;
        for (const tabLineElement of this._tabLineElements) {
            for (const barElement of tabLineElement.barElements) {
                for (const beatElement of barElement.beatElements) {
                    if (beatElement.beat.uuid === neededBeatElement.beat.uuid) {
                        foundTabLineElement = tabLineElement;
                        foundBarElement = barElement;
                        break;
                    }
                }
            }
        }
        if (foundTabLineElement === undefined || foundBarElement === undefined) {
            throw Error("Could not find beat element's tab line element or bar element");
        }
        const tleOffset = new Point(0, foundTabLineElement.rect.y);
        const barOffset = new Point(foundBarElement.rect.x, tleOffset.y);
        return new Point(barOffset.x + neededBeatElement.rect.x, barOffset.y + neededBeatElement.rect.y);
    }
    get tabLineElements() {
        return this._tabLineElements;
    }
    get selectionRects() {
        return this._selectionRects;
    }
}
//# sourceMappingURL=tab-element.js.map