import { MoveRightResult, SelectedMoveDirection, } from "../elements/selected-element";
import { SelectionManager } from "../selection/selection-manager";
export class TabEditor {
    _tab;
    undoStack;
    redoStack;
    _selectionManager;
    tabElement;
    constructor(tab, tabElement) {
        this._tab = tab;
        this.undoStack = [];
        this.redoStack = [];
        this._selectionManager = new SelectionManager(this._tab);
        this.tabElement = tabElement;
    }
    selectNoteElement(noteElement) {
        this._selectionManager.selectNote(noteElement.note);
    }
    /**
     * Selects note element using element ids.
     * NOTE: This function does not inform TabPlayer class of the change
     * of the current beat so if you are using TabPlayer class, use
     * TabWindow.selectNoteElementUsingIds instead
     * @param tabLineElementId Tab Line Element Id
     * @param barElementId Bar Element Id
     * @param beatElementId Beat Element Id
     * @param noteElementId Note Element Id
     */
    selectNoteElementUsingIds(tabLineElementId, barElementId, beatElementId, noteElementId) {
        const noteElement = this.tabElement.tabLineElements[tabLineElementId].barElements[barElementId].beatElements[beatElementId].beatNotesElement.noteElements[noteElementId];
        this._selectionManager.selectNote(noteElement.note);
    }
    moveSelectedNoteRight() {
        if (this._selectionManager.selectedElement === undefined) {
            throw Error("Can't move right, selected note is undefined");
        }
        const beforeMoveRight = this._tab.deepCopy();
        const moveRightOutput = this._selectionManager.moveSelectedNoteRight();
        if (moveRightOutput.result !== MoveRightResult.Nothing) {
            this.undoStack.push(beforeMoveRight);
        }
        this.tabElement.handleMoveRight(moveRightOutput, this._selectionManager.selectedElement);
    }
    moveSelectedNote(direction) {
        switch (direction) {
            case SelectedMoveDirection.Left:
                this._selectionManager.moveSelectedNoteLeft();
                break;
            case SelectedMoveDirection.Right:
                // this._selectionManager.moveSelectedNoteRight();
                this.moveSelectedNoteRight();
                break;
            case SelectedMoveDirection.Up:
                this._selectionManager.moveSelectedNoteUp();
                break;
            case SelectedMoveDirection.Down:
                this._selectionManager.moveSelectedNoteDown();
                break;
            default:
                break;
        }
    }
    getSelectedNoteElementsAndIds() {
        if (this._selectionManager.selectedElement === undefined) {
            throw Error("Selected note is undefined");
        }
        return this.tabElement.getSelectedNoteElementsAndIds(this._selectionManager.selectedElement);
    }
    setSelectedNoteFret(newFret) {
        if (this._selectionManager.selectedElement === undefined) {
            throw Error("Selected note is undefined");
        }
        this.undoStack.push(this._tab.deepCopy());
        this._selectionManager.selectedElement.note.fret = newFret;
    }
    changeSelectedBarTempo(newTempo) {
        this.undoStack.push(this._tab.deepCopy());
        const { barElement } = this.getSelectedNoteElementsAndIds();
        barElement.changeTempo(newTempo);
        this.tabElement.calc();
    }
    changeSelectedBarBeats(newBeats) {
        this.undoStack.push(this._tab.deepCopy());
        const { barElement } = this.getSelectedNoteElementsAndIds();
        barElement.changeBarBeats(newBeats);
        this.tabElement.calc();
    }
    changeSelectedBarDuration(newDuration) {
        this.undoStack.push(this._tab.deepCopy());
        const { barElement } = this.getSelectedNoteElementsAndIds();
        barElement.changeBarDuration(newDuration);
        this.tabElement.calc();
    }
    changeSelectedBeatDuration(newDuration) {
        this.undoStack.push(this._tab.deepCopy());
        const { barElement, beatElement } = this.getSelectedNoteElementsAndIds();
        if (beatElement === undefined) {
            return;
        }
        barElement.changeBeatDuration(beatElement.beat, newDuration);
        this.tabElement.calc();
    }
    applyEffectSingle(effectType, effectOptions) {
        const elsAndIds = this.getSelectedNoteElementsAndIds();
        const beforeApply = this._tab.deepCopy();
        const result = elsAndIds.tabLineElement.applyEffectSingle(elsAndIds.barElementId, elsAndIds.beatElementId, elsAndIds.stringNum, effectType, effectOptions);
        if (!result) {
            return false;
        }
        if (result) {
            this.undoStack.push(beforeApply);
        }
        if (elsAndIds.tabLineElementId !==
            this.tabElement.tabLineElements.length - 1) {
            elsAndIds.tabLineElement.justifyElements();
        }
        return true;
    }
    removeEffectSingle(effectType, effectOptions) {
        const elsAndIds = this.getSelectedNoteElementsAndIds();
        if (elsAndIds.noteElement === undefined) {
            return;
        }
        const effectIndex = elsAndIds.noteElement.guitarEffectElements.findIndex((gfe) => {
            return (gfe.effect.effectType === effectType &&
                gfe.effect.options === effectOptions);
        });
        if (effectIndex === -1) {
            return;
        }
        this.undoStack.push(this._tab.deepCopy());
        elsAndIds.tabLineElement.removeEffectSingle(elsAndIds.barElementId, elsAndIds.beatElementId, elsAndIds.stringNum, effectIndex);
        if (elsAndIds.tabLineElementId !==
            this.tabElement.tabLineElements.length - 1) {
            elsAndIds.tabLineElement.justifyElements();
        }
    }
    getSelectedElement() {
        return this._selectionManager.selectedElement;
    }
    /**
     * Checks if note element is the selected element
     * @param noteElement Note element to check
     * @returns True if selected, false otherwise
     */
    isNoteElementSelected(noteElement) {
        return this._selectionManager.isNoteElementSelected(noteElement);
    }
    clearSelection() {
        this._selectionManager.clearSelection();
        this.tabElement.resetSelection();
    }
    selectBeat(beatElement) {
        this._selectionManager.selectBeat(beatElement.beat);
        this.tabElement.recalcBeatElementSelection(this._selectionManager.selectionBeats);
    }
    selectBeatUsingIds(tabLineElementId, barElementId, beatElementId) {
        const beatElement = this.tabElement.tabLineElements[tabLineElementId].barElements[barElementId].beatElements[beatElementId];
        this._selectionManager.selectBeat(beatElement.beat);
        this.tabElement.recalcBeatElementSelection(this._selectionManager.selectionBeats);
    }
    changeSelectionDuration(newDuration) {
        this.undoStack.push(this._tab.deepCopy());
        this._selectionManager.changeSelectionDuration(newDuration);
        this.tabElement.calc();
    }
    copy() {
        this._selectionManager.copy();
    }
    paste() {
        this._selectionManager.paste();
        this.tabElement.calc();
    }
    /**
     * Delete every selected beat
     * @param beats
     */
    deleteBeats() {
        this._selectionManager.deleteSelected();
        this.tabElement.calc();
    }
    insertBar(bar) {
        this._tab.bars.push(bar);
        this.tabElement.calc();
    }
    insertBeat(barElement, prevBeatElement) {
        const index = barElement.beatElements.indexOf(prevBeatElement);
        if (index < 0 || index >= barElement.beatElements.length) {
            return;
        }
        barElement.insertEmptyBeat(index);
        this.tabElement.calc();
    }
    undo() {
        const prevTab = this.undoStack.pop();
        if (prevTab === undefined) {
            return;
        }
        this.redoStack.push(this._tab.deepCopy());
        this._tab = prevTab;
        this._selectionManager = new SelectionManager(this._tab);
        this.tabElement.resetTab(this._tab);
    }
    redo() {
        const nextTab = this.redoStack.pop();
        if (nextTab === undefined) {
            return;
        }
        this.undoStack.push(nextTab.deepCopy());
        this._tab = nextTab;
        this._selectionManager = new SelectionManager(this._tab);
        this.tabElement.resetTab(this._tab);
    }
    get selectionManager() {
        return this._selectionManager;
    }
}
//# sourceMappingURL=tab-editor.js.map