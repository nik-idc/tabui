import { Tab } from "./../models/tab";
import { TabWindowDim } from "./tab-window-dim";
import { NoteElement } from "./elements/note-element";
import { BarElement } from "./elements/bar-element";
import { Point } from "./shapes/point";
import { Bar } from "./../models/bar";
import { NoteDuration } from "./../models/note-duration";
import { BeatElement } from "./elements/beat-element";
import {
  MoveRightResult,
  SelectedElement,
  SelectedMoveDirection,
  isSelectedElement,
} from "./elements/selected-element";
import { Beat } from "../models/beat";
import { SelectionElement } from "./elements/selection-element";
import { Rect } from "./shapes/rect";
import { TabLineElement } from "./elements/tab-line-element";
import { GuitarEffect } from "../../src/models/guitar-effect/guitar-effect";
import { GuitarEffectOptions } from "../../src/models/guitar-effect/guitar-effect-options";
import { GuitarEffectType } from "../../src/models/guitar-effect/guitar-effect-type";
import { tabEvent, TabEventArgs, TabEventType } from "../events/tab-event";
import { SelectionManager } from "./selection/selection-manager";
import { GuitarNote } from "../models/guitar-note";
import { SelectedElementsAndIds, TabElement } from "./elements/tab-element";

/**
 * Class that handles creating a tab window
 */
export class TabWindow {
  /**
   * Tab object to get data from
   */
  readonly tab: Tab;
  /**
   * Dimensions object
   */
  readonly dim: TabWindowDim;
  private _selectionManager: SelectionManager;
  private _tabElement: TabElement;

  /**
   * Class that handles creating a tab window
   * @param tab Tab object
   * @param dim Tab window dimensions
   */
  constructor(tab: Tab, dim: TabWindowDim) {
    this.tab = tab;
    this.dim = dim;
    this._selectionManager = new SelectionManager(this.tab);
    this._tabElement = new TabElement(this.tab, this.dim);
  }

  public calcTabElement(): void {
    this._tabElement.calc();
  }

  public selectNoteElement(noteElement: NoteElement): void {
    this._selectionManager.selectNote(noteElement.note);
  }

  public selectNoteElementUsingIds(
    tabLineElementId: number,
    barElementId: number,
    beatElementId: number,
    noteElementId: number
  ): void {
    const noteElement =
      this._tabElement.tabLineElements[tabLineElementId].barElements[
        barElementId
      ].beatElements[beatElementId].beatNotesElement.noteElements[
        noteElementId
      ];
    this._selectionManager.selectNote(noteElement.note);
  }

  private moveSelectedNoteRight(): void {
    const moveRightOutput = this._selectionManager.moveSelectedNoteRight();
    this._tabElement.handleMoveRight(
      moveRightOutput,
      this._selectionManager.selectedElement
    );
  }

  public moveSelectedNote(direction: SelectedMoveDirection): void {
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

  public getSelectedNoteElementsAndIds(): SelectedElementsAndIds {
    return this._tabElement.getSelectedNoteElementsAndIds(
      this._selectionManager.selectedElement
    );
  }

  public setSelectedNoteFret(newFret: number): void {
    this._selectionManager.selectedElement.note.fret = newFret;
  }

  public changeSelectedBarTempo(newTempo: number): void {
    const { barElement } = this.getSelectedNoteElementsAndIds();

    barElement.changeTempo(newTempo);
    this._tabElement.calc();
  }

  public changeSelectedBarBeats(newBeats: number): void {
    const { barElement } = this.getSelectedNoteElementsAndIds();

    barElement.changeBarBeats(newBeats);
    this._tabElement.calc();
  }

  public changeSelectedBarDuration(newDuration: NoteDuration): void {
    const { barElement } = this.getSelectedNoteElementsAndIds();

    barElement.changeBarDuration(newDuration);
    this._tabElement.calc();
  }

  public changeSelectedBeatDuration(newDuration: NoteDuration): void {
    const { barElement } = this.getSelectedNoteElementsAndIds();

    barElement.changeBeatDuration(
      this._selectionManager.selectedElement.beat,
      newDuration
    );
    this._tabElement.calc();
  }

  /**
   * Checks if note element is the selected element
   * @param noteElement Note element to check
   * @returns True if selected, false otherwise
   */
  public isNoteElementSelected(noteElement: NoteElement): boolean {
    return this._selectionManager.isNoteElementSelected(noteElement);
  }

  public clearSelection(): void {
    this._selectionManager.clearSelection();
    this._tabElement.resetSelection();
  }

  public selectBeat(beatElement: BeatElement): void {
    this._selectionManager.selectBeat(beatElement.beat);

    this._tabElement.recalcBeatElementSelection(
      this._selectionManager.selectionElementsUUIDs
    );
  }

  public selectBeatUsingIds(
    tabLineElementId: number,
    barElementId: number,
    beatElementId: number
  ): void {
    const beatElement =
      this._tabElement.tabLineElements[tabLineElementId].barElements[
        barElementId
      ].beatElements[beatElementId];
    this._selectionManager.selectBeat(beatElement.beat);

    this._tabElement.recalcBeatElementSelection(
      this._selectionManager.selectionElementsUUIDs
    );
  }

  public copy(): void {
    this._selectionManager.copy();
  }

  public paste(): void {
    this._selectionManager.paste();
    this._tabElement.calc();
  }

  /**
   * Delete every selected beat
   * @param beats
   */
  public deleteBeats(): void {
    this._selectionManager.deleteSelected();
    this._tabElement.calc();
  }

  public insertBar(bar: Bar): void {
    this.tab.bars.push(bar);
    this._tabElement.calc();
  }

  public insertBeat(
    barElement: BarElement,
    prevBeatElement: BeatElement
  ): void {
    const index = barElement.beatElements.indexOf(prevBeatElement);
    if (index < 0 || index >= barElement.beatElements.length) {
      return;
    }

    barElement.insertEmptyBeat(index);
    this._tabElement.calc();
  }

  public get selectionManager(): SelectionManager {
    return this._selectionManager;
  }

  public get tabElement(): TabElement {
    return this._tabElement;
  }
}
