import { Beat } from "../../models/beat";
import { GuitarNote } from "../../models/guitar-note";
import { NoteDuration } from "../../models/note-duration";
import { Tab } from "../../models/tab";
import { NoteElement } from "../elements/note-element";
import { MoveRightOutput, SelectedElement } from "../elements/selected-element";
export declare class SelectionManager {
    readonly tab: Tab;
    /**
     * Selected note element
     */
    private _selectedElement;
    private _baseSelectionBeat?;
    /**
     * Selection beats
     */
    private _selectionBeats;
    /**
     * Copied data
     */
    private _copiedData;
    constructor(tab: Tab);
    /**
     * Select new note element
     * @param tabLineElementId Id of the bar elements line containing the beat element
     * @param barElementId Id of the bar element containing the beat element
     * @param beatElementId Id of the beat element containing the note element
     * @param noteElementId Id of the note element
     */
    selectNote(note: GuitarNote): void;
    /**
     * Move selected note up
     */
    moveSelectedNoteUp(): void;
    /**
     * Move selected note down
     */
    moveSelectedNoteDown(): void;
    /**
     * Move selected note left
     */
    moveSelectedNoteLeft(): void;
    /**
     * Move selected note right
     */
    moveSelectedNoteRight(): MoveRightOutput;
    /**
     * Selects beats in between the two specified beats (including them)
     * @param beat1UUID UUID of the first beat
     * @param beat2UUID UUID of the last beat
     */
    private selectBeatsInBetween;
    /**
     * Selects specified beat and all the beats between it and base selection element
     * @param beat Beat to select
     */
    selectBeat(beat: Beat): void;
    /**
     * Clears all selection
     */
    clearSelection(): void;
    /**
     * Changes duration of all selected beats
     * @param newDuration New duration to set
     */
    changeSelectionDuration(newDuration: NoteDuration): void;
    /**
     * Copy selected note/beats (depending on which is currently selected)
     */
    copy(): void;
    /**
     * Builds an array of beats from the specified beat UUIDs
     * @param uuids UUIDs
     * @returns Array of beats from the specified beat UUIDs
     */
    private beatsFromUUIDs;
    /**
     * Paste copied data:
     * Paste beats after selected note if selected beats OR
     * Paste note, i.e., change fret value of selected note to that of selected
     * @returns
     */
    paste(): void;
    deleteSelected(): void;
    /**
     * Checks if note element is the selected element
     * @param noteElement Note element to check
     * @returns True if selected, false otherwise
     */
    isNoteElementSelected(noteElement: NoteElement): boolean;
    /**
     * Selected note element
     */
    get selectedElement(): SelectedElement | undefined;
    /**
     *
     */
    get selectionBeats(): Beat[];
}
