import { Tab } from "./../models/tab";
import { TabWindowDim } from "./tab-window-dim";
import { NoteElement } from "./elements/note-element";
import { NoteDuration } from "./../models/note-duration";
import { BeatElement } from "./elements/beat-element";
import { SelectedElement, SelectedMoveDirection } from "./elements/selected-element";
import { GuitarEffectOptions } from "../models/guitar-effect/guitar-effect-options";
import { GuitarEffectType } from "../models/guitar-effect/guitar-effect-type";
import { Beat } from "../models/beat";
import { TabLineElement } from "./elements/tab-line-element";
import { Point } from "./shapes/point";
/**
 * Class that handles creating a tab window.
 */
export declare class TabWindow {
    /**
     * Tab object to get data from
     */
    private _tab;
    /**
     * Dimensions object
     */
    readonly dim: TabWindowDim;
    private _tabElement;
    private _tabEditor;
    private _tabPlayer;
    /**
     * Class that handles creating a tab window
     * @param tab Tab object
     * @param dim Tab window dimensions
     */
    constructor(tab: Tab, dim: TabWindowDim);
    calcTabElement(): void;
    getTabLineElements(): TabLineElement[];
    getBeatElementGlobalCoords(beatElement: BeatElement): Point;
    getBeatElementByUUID(beatUUID: number): BeatElement | undefined;
    recalcBeatElementSelection(): void;
    selectNoteElement(noteElement: NoteElement): void;
    selectNoteElementUsingIds(tabLineElementId: number, barElementId: number, beatElementId: number, noteElementId: number): void;
    moveSelectedNote(moveDirection: SelectedMoveDirection): void;
    setSelectedElementFret(newFret: number | undefined): void;
    changeSelectedBarTempo(newTempo: number): void;
    changeSelectedBarBeats(newBeats: number): void;
    changeSelectedBarDuration(newDuration: NoteDuration): void;
    changeSelectedBeatDuration(newDuration: NoteDuration): void;
    applyEffectSingle(effectType: GuitarEffectType, effectOptions?: GuitarEffectOptions): boolean;
    removeEffectSingle(effectType: GuitarEffectType, effectOptions?: GuitarEffectOptions): void;
    getSelectedElement(): SelectedElement | undefined;
    isNoteElementSelected(noteElement: NoteElement): boolean;
    clearSelection(): void;
    selectBeat(beatElement: BeatElement): void;
    selectBeatUsingIds(tabLineElementId: number, barElementId: number, beatElementId: number): void;
    deleteSelectedBeats(): void;
    copy(): void;
    paste(): void;
    changeSelectionDuration(newDuration: NoteDuration): void;
    getSelectionBeats(): Beat[];
    undo(): void;
    redo(): void;
    startPlayer(): void;
    stopPlayer(): void;
    getSelectedBeat(): Beat | undefined;
    getSelectedBeatElement(): BeatElement | undefined;
    getPlayerCurrentBeatElement(): BeatElement | undefined;
    get tab(): Tab;
}
