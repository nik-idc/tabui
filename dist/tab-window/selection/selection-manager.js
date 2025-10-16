import { isSelectedElement, SelectedElement, } from "../elements/selected-element";
export class SelectionManager {
    tab;
    /**
     * Selected note element
     */
    _selectedElement;
    _baseSelectionBeat;
    /**
     * Selection beats
     */
    _selectionBeats;
    /**
     * Copied data
     */
    _copiedData;
    constructor(tab) {
        this.tab = tab;
        this._selectionBeats = [];
        this._copiedData = [];
    }
    /**
     * Select new note element
     * @param tabLineElementId Id of the bar elements line containing the beat element
     * @param barElementId Id of the bar element containing the beat element
     * @param beatElementId Id of the beat element containing the note element
     * @param noteElementId Id of the note element
     */
    selectNote(note) {
        this.clearSelection();
        this._selectedElement = new SelectedElement(this.tab, note.uuid);
    }
    /**
     * Move selected note up
     */
    moveSelectedNoteUp() {
        if (this.selectedElement === undefined) {
            throw Error("No note selected");
        }
        this.clearSelection();
        this.selectedElement.moveUp();
    }
    /**
     * Move selected note down
     */
    moveSelectedNoteDown() {
        if (this.selectedElement === undefined) {
            throw Error("No note selected");
        }
        this.clearSelection();
        this.selectedElement.moveDown();
    }
    /**
     * Move selected note left
     */
    moveSelectedNoteLeft() {
        if (this._selectedElement === undefined) {
            throw Error("No note selected");
        }
        if (this._selectionBeats.length !== 0) {
            // Select left most element of selection
            const leftMostNote = this._selectionBeats[0].notes[this.selectedElement ? this.selectedElement.stringNum : 1];
            this.selectNote(leftMostNote);
        }
        if (this._selectionBeats.length === 0 &&
            this.selectedElement === undefined) {
            throw Error("No note selected");
        }
        this._selectedElement.moveLeft();
    }
    /**
     * Move selected note right
     */
    moveSelectedNoteRight() {
        if (this._selectedElement === undefined) {
            throw Error("No note selected");
        }
        if (this._selectionBeats.length !== 0) {
            // Select right most element of selection
            const rightMostNote = this._selectionBeats[this._selectionBeats.length - 1].notes[this.selectedElement ? this.selectedElement.stringNum : 1];
            this.selectNote(rightMostNote);
        }
        if (this._selectionBeats.length === 0 &&
            this.selectedElement === undefined) {
            throw Error("No note selected");
        }
        return this._selectedElement.moveRight();
    }
    /**
     * Selects beats in between the two specified beats (including them)
     * @param beat1UUID UUID of the first beat
     * @param beat2UUID UUID of the last beat
     */
    selectBeatsInBetween(beat1UUID, beat2UUID) {
        const beatsSeq = this.tab.getBeatsSeq();
        let startBeatElementSeqId = -1;
        let endBeatElementSeqId = -1;
        for (let i = 0; i < beatsSeq.length; i++) {
            if (beatsSeq[i].uuid === beat1UUID) {
                startBeatElementSeqId = i;
            }
            if (beatsSeq[i].uuid === beat2UUID) {
                endBeatElementSeqId = i;
            }
        }
        if (startBeatElementSeqId === -1 || endBeatElementSeqId === -1) {
            throw Error("Could not find start and beat elements' ids");
        }
        for (let i = startBeatElementSeqId; i <= endBeatElementSeqId; i++) {
            if (i >= startBeatElementSeqId && i <= endBeatElementSeqId) {
                this._selectionBeats.push(beatsSeq[i]);
            }
        }
    }
    /**
     * Selects specified beat and all the beats between it and base selection element
     * @param beat Beat to select
     */
    selectBeat(beat) {
        if (this._selectedElement) {
            this._selectedElement = undefined;
        }
        const beatsSeq = this.tab.getBeatsSeq();
        let beatSeqId = -1;
        let baseBeatSeqId = -1;
        for (let i = 0; i < beatsSeq.length; i++) {
            if (beatsSeq[i].uuid === beat.uuid) {
                beatSeqId = i;
            }
            else if (this._baseSelectionBeat !== undefined &&
                beatsSeq[i].uuid === this._baseSelectionBeat.uuid) {
                baseBeatSeqId = i;
            }
        }
        let startBeatUUID;
        let endBeatUUID;
        if (this._baseSelectionBeat === undefined || beatSeqId === baseBeatSeqId) {
            this._baseSelectionBeat = beat;
            startBeatUUID = beat.uuid;
            endBeatUUID = beat.uuid;
        }
        else if (beatSeqId > baseBeatSeqId) {
            startBeatUUID = this._baseSelectionBeat.uuid;
            endBeatUUID = beat.uuid;
        }
        else {
            startBeatUUID = beat.uuid;
            endBeatUUID = this._baseSelectionBeat.uuid;
        }
        // Clear selection rects
        this._selectionBeats = [];
        // Select all beats in new selection
        this.selectBeatsInBetween(startBeatUUID, endBeatUUID);
    }
    /**
     * Clears all selection
     */
    clearSelection() {
        this._baseSelectionBeat = undefined;
        this._selectionBeats = [];
    }
    /**
     * Changes duration of all selected beats
     * @param newDuration New duration to set
     */
    changeSelectionDuration(newDuration) {
        for (const beat of this._selectionBeats) {
            beat.duration = newDuration;
        }
    }
    /**
     * Copy selected note/beats (depending on which is currently selected)
     */
    copy() {
        this._copiedData = this._selectedElement
            ? new SelectedElement(this.tab, this._selectedElement.note.uuid)
            : this._selectionBeats;
    }
    /**
     * Builds an array of beats from the specified beat UUIDs
     * @param uuids UUIDs
     * @returns Array of beats from the specified beat UUIDs
     */
    beatsFromUUIDs(uuids) {
        return this.tab.getBeatsSeq().reduce((prev, cur) => {
            if (uuids.includes(cur.uuid)) {
                prev.push(cur);
            }
            return prev;
        }, new Array());
    }
    /**
     * Paste copied data:
     * Paste beats after selected note if selected beats OR
     * Paste note, i.e., change fret value of selected note to that of selected
     * @returns
     */
    paste() {
        if (!isSelectedElement(this._copiedData)) {
            // Return if nothing to paste
            if (this._copiedData.length === 0) {
                return;
            }
            if (this._selectedElement !== undefined) {
                // Insert if currently not selecting
                this._selectedElement.bar.insertBeats(this._selectedElement.beatId, this._copiedData);
            }
            else {
                this.tab.replaceBeats(this._selectionBeats, this._copiedData);
                this.clearSelection();
            }
        }
        else {
            if (this._selectedElement === undefined) {
                throw Error("Attempting to paste a note value but selected element is undefined");
            }
            this._selectedElement.note.fret = this._copiedData.note.fret;
        }
    }
    deleteSelected() {
        this.tab.removeBeats(this._selectionBeats);
        this.clearSelection();
    }
    /**
     * Checks if note element is the selected element
     * @param noteElement Note element to check
     * @returns True if selected, false otherwise
     */
    isNoteElementSelected(noteElement) {
        if (this._selectedElement === undefined) {
            throw Error("No note selected");
        }
        return this._selectedElement.note.uuid === noteElement.note.uuid;
    }
    /**
     * Selected note element
     */
    get selectedElement() {
        return this._selectedElement;
    }
    /**
     *
     */
    get selectionBeats() {
        return this._selectionBeats;
    }
}
//# sourceMappingURL=selection-manager.js.map