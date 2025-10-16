import { TabElement } from "./elements/tab-element";
import { TabPlayer } from "./player/tab-player";
import { TabEditor } from "./editor/tab-editor";
/**
 * Class that handles creating a tab window.
 */
export class TabWindow {
    /**
     * Tab object to get data from
     */
    _tab;
    /**
     * Dimensions object
     */
    dim;
    _tabElement;
    _tabEditor;
    _tabPlayer;
    /**
     * Class that handles creating a tab window
     * @param tab Tab object
     * @param dim Tab window dimensions
     */
    constructor(tab, dim) {
        this._tab = tab;
        this.dim = dim;
        this._tabElement = new TabElement(this._tab, this.dim);
        this._tabEditor = new TabEditor(this._tab, this._tabElement);
        if (typeof window !== "undefined") {
            this._tabPlayer = new TabPlayer(this._tab);
        }
        else {
            this._tabPlayer = undefined;
        }
    }
    calcTabElement() {
        this._tabElement.calc();
    }
    getTabLineElements() {
        return this._tabElement.tabLineElements;
    }
    getBeatElementGlobalCoords(beatElement) {
        return this._tabElement.getBeatElementGlobalCoords(beatElement);
    }
    getBeatElementByUUID(beatUUID) {
        return this._tabElement.getBeatElementByUUID(beatUUID);
    }
    recalcBeatElementSelection() {
        this._tabElement.recalcBeatElementSelection(this._tabEditor.selectionManager.selectionBeats);
    }
    selectNoteElement(noteElement) {
        if (this._tabPlayer === undefined) {
            return;
        }
        this._tabEditor.selectNoteElement(noteElement);
        const selectedElement = this._tabEditor.selectionManager.selectedElement;
        if (selectedElement === undefined) {
            throw Error("Selected element undefined after selection");
        }
        this._tabPlayer.setCurrentBeat(selectedElement.beat);
    }
    selectNoteElementUsingIds(tabLineElementId, barElementId, beatElementId, noteElementId) {
        this._tabEditor.selectNoteElementUsingIds(tabLineElementId, barElementId, beatElementId, noteElementId);
        const selectedElement = this._tabEditor.selectionManager.selectedElement;
        if (selectedElement === undefined) {
            throw Error("Selected element undefined after selection");
        }
        if (this._tabPlayer !== undefined) {
            this._tabPlayer.setCurrentBeat(selectedElement.beat);
        }
    }
    moveSelectedNote(moveDirection) {
        this._tabEditor.moveSelectedNote(moveDirection);
    }
    setSelectedElementFret(newFret) {
        this._tabEditor.setSelectedNoteFret(newFret);
    }
    changeSelectedBarTempo(newTempo) {
        this._tabEditor.changeSelectedBarTempo(newTempo);
    }
    changeSelectedBarBeats(newBeats) {
        this._tabEditor.changeSelectedBarBeats(newBeats);
    }
    changeSelectedBarDuration(newDuration) {
        this._tabEditor.changeSelectedBarDuration(newDuration);
    }
    changeSelectedBeatDuration(newDuration) {
        this._tabEditor.changeSelectedBeatDuration(newDuration);
    }
    applyEffectSingle(effectType, effectOptions) {
        return this._tabEditor.applyEffectSingle(effectType, effectOptions);
    }
    removeEffectSingle(effectType, effectOptions) {
        this._tabEditor.removeEffectSingle(effectType, effectOptions);
    }
    getSelectedElement() {
        return this._tabEditor.getSelectedElement();
    }
    isNoteElementSelected(noteElement) {
        return this._tabEditor.isNoteElementSelected(noteElement);
    }
    clearSelection() {
        this._tabEditor.clearSelection();
    }
    selectBeat(beatElement) {
        this._tabEditor.selectBeat(beatElement);
    }
    selectBeatUsingIds(tabLineElementId, barElementId, beatElementId) {
        this._tabEditor.selectBeatUsingIds(tabLineElementId, barElementId, beatElementId);
    }
    deleteSelectedBeats() {
        this._tabEditor.deleteBeats();
    }
    copy() {
        this._tabEditor.copy();
    }
    paste() {
        this._tabEditor.paste();
    }
    changeSelectionDuration(newDuration) {
        this._tabEditor.changeSelectionDuration(newDuration);
    }
    getSelectionBeats() {
        return this._tabEditor.selectionManager.selectionBeats;
    }
    undo() {
        this._tabEditor.undo();
    }
    redo() {
        this._tabEditor.redo();
    }
    startPlayer() {
        if (this._tabPlayer === undefined) {
            return;
        }
        this._tabPlayer.start();
    }
    stopPlayer() {
        if (this._tabPlayer === undefined) {
            return;
        }
        this._tabPlayer.stop();
    }
    getSelectedBeat() {
        const selectedElement = this._tabEditor.selectionManager.selectedElement;
        if (selectedElement === undefined) {
            return undefined;
        }
        return selectedElement.beat;
    }
    getSelectedBeatElement() {
        const selectedElement = this._tabEditor.selectionManager.selectedElement;
        if (selectedElement === undefined) {
            return undefined;
        }
        return this._tabEditor.getSelectedNoteElementsAndIds().beatElement;
    }
    getPlayerCurrentBeatElement() {
        if (this._tabPlayer === undefined) {
            // throw Error("Tab player undefined");
            return undefined;
        }
        if (this._tabPlayer.currentBeat === undefined) {
            throw Error("Tab player current beat undefined");
        }
        const beatElement = this._tabElement.findCorrespondingBeatElement(this._tabPlayer.currentBeat);
        if (beatElement === undefined) {
            throw Error("Failed to find corresponding beat element");
        }
        return beatElement;
    }
    get tab() {
        return this._tab;
    }
}
//# sourceMappingURL=tab-window.js.map