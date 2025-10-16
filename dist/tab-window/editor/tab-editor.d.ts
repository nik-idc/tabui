import { Bar } from "../../models/bar";
import { GuitarEffectOptions } from "../../models/guitar-effect/guitar-effect-options";
import { GuitarEffectType } from "../../models/guitar-effect/guitar-effect-type";
import { NoteDuration } from "../../models/note-duration";
import { Tab } from "../../models/tab";
import { BarElement } from "../elements/bar-element";
import { BeatElement } from "../elements/beat-element";
import { NoteElement } from "../elements/note-element";
import { SelectedElement, SelectedMoveDirection } from "../elements/selected-element";
import { SelectedElementsAndIds, TabElement } from "../elements/tab-element";
import { SelectionManager } from "../selection/selection-manager";
export declare class TabEditor {
    private _tab;
    readonly undoStack: Tab[];
    readonly redoStack: Tab[];
    private _selectionManager;
    readonly tabElement: TabElement;
    constructor(tab: Tab, tabElement: TabElement);
    selectNoteElement(noteElement: NoteElement): void;
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
    selectNoteElementUsingIds(tabLineElementId: number, barElementId: number, beatElementId: number, noteElementId: number): void;
    private moveSelectedNoteRight;
    moveSelectedNote(direction: SelectedMoveDirection): void;
    getSelectedNoteElementsAndIds(): SelectedElementsAndIds;
    setSelectedNoteFret(newFret: number | undefined): void;
    changeSelectedBarTempo(newTempo: number): void;
    changeSelectedBarBeats(newBeats: number): void;
    changeSelectedBarDuration(newDuration: NoteDuration): void;
    changeSelectedBeatDuration(newDuration: NoteDuration): void;
    applyEffectSingle(effectType: GuitarEffectType, effectOptions?: GuitarEffectOptions): boolean;
    removeEffectSingle(effectType: GuitarEffectType, effectOptions?: GuitarEffectOptions): void;
    getSelectedElement(): SelectedElement | undefined;
    /**
     * Checks if note element is the selected element
     * @param noteElement Note element to check
     * @returns True if selected, false otherwise
     */
    isNoteElementSelected(noteElement: NoteElement): boolean;
    clearSelection(): void;
    selectBeat(beatElement: BeatElement): void;
    selectBeatUsingIds(tabLineElementId: number, barElementId: number, beatElementId: number): void;
    changeSelectionDuration(newDuration: NoteDuration): void;
    copy(): void;
    paste(): void;
    /**
     * Delete every selected beat
     * @param beats
     */
    deleteBeats(): void;
    insertBar(bar: Bar): void;
    insertBeat(barElement: BarElement, prevBeatElement: BeatElement): void;
    undo(): void;
    redo(): void;
    get selectionManager(): SelectionManager;
}
