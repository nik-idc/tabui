import { Bar } from "../../models/bar";
import { GuitarEffectOptions } from "../../models/guitar-effect/guitar-effect-options";
import { GuitarEffectType } from "../../models/guitar-effect/guitar-effect-type";
import { NoteDuration } from "../../models/note-duration";
import { Score } from "../../models/score";
import { Tab } from "../../models/tab";
import { BarElement } from "../elements/bar-element";
import { BeatElement } from "../elements/beat-element";
import { NoteElement } from "../elements/note-element";
import {
  MoveRightResult,
  SelectedElement,
  SelectedMoveDirection,
} from "../elements/selected-element";
import { SelectedElementsAndIds, TabElement } from "../elements/tab-element";
import { SelectionManager } from "../selection/selection-manager";

export class TabEditor {
  private _score: Score;
  private _tabIndex: number;
  private _tab: Tab;
  readonly undoStack: Tab[];
  readonly redoStack: Tab[];
  private _selectionManager: SelectionManager;
  readonly tabElement: TabElement;

  constructor(score: Score, tabIndex: number, tabElement: TabElement) {
    this._score = score;
    this._tabIndex = tabIndex;
    this._tab = this._score.tracks[this._tabIndex];
    this.undoStack = [];
    this.redoStack = [];
    this._selectionManager = new SelectionManager(this._tab);
    this.tabElement = tabElement;
  }

  public selectNoteElement(noteElement: NoteElement): void {
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
  public selectNoteElementUsingIds(
    tabLineElementId: number,
    barElementId: number,
    beatElementId: number,
    noteElementId: number
  ): void {
    const noteElement =
      this.tabElement.tabLineElements[tabLineElementId].barElements[
        barElementId
      ].beatElements[beatElementId].beatNotesElement.noteElements[
        noteElementId
      ];
    this._selectionManager.selectNote(noteElement.note);
  }

  private moveSelectedNoteRight(): void {
    if (this._selectionManager.selectedElement === undefined) {
      throw Error("Can't move right, selected note is undefined");
    }

    const beforeMoveRight = this._tab.deepCopy();
    const moveRightOutput = this._selectionManager.moveSelectedNoteRight();

    if (moveRightOutput.result !== MoveRightResult.Nothing) {
      this.undoStack.push(beforeMoveRight);
    }

    this.tabElement.handleMoveRight(
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
    if (this._selectionManager.selectedElement === undefined) {
      throw Error("Selected note is undefined");
    }

    return this.tabElement.getSelectedNoteElementsAndIds(
      this._selectionManager.selectedElement
    );
  }

  public setSelectedNoteFret(newFret: number | undefined): void {
    if (this._selectionManager.selectedElement === undefined) {
      throw Error("Selected note is undefined");
    }

    this.undoStack.push(this._tab.deepCopy());

    this._selectionManager.selectedElement.note.fret = newFret;
  }

  public changeSelectedBarTempo(newTempo: number): void {
    this.undoStack.push(this._tab.deepCopy());

    const { barElement } = this.getSelectedNoteElementsAndIds();

    barElement.changeTempo(newTempo);
    this.tabElement.calc();
  }

  public changeSelectedBarBeats(newBeats: number): void {
    this.undoStack.push(this._tab.deepCopy());

    const { barElement } = this.getSelectedNoteElementsAndIds();

    barElement.changeBarBeats(newBeats);
    this.tabElement.calc();
  }

  public changeSelectedBarDuration(newDuration: NoteDuration): void {
    this.undoStack.push(this._tab.deepCopy());

    const { barElement } = this.getSelectedNoteElementsAndIds();

    barElement.changeBarDuration(newDuration);
    this.tabElement.calc();
  }

  public changeSelectedBeatDuration(newDuration: NoteDuration): void {
    this.undoStack.push(this._tab.deepCopy());

    const { barElement, beatElement } = this.getSelectedNoteElementsAndIds();
    if (beatElement === undefined) {
      return;
    }

    barElement.changeBeatDuration(beatElement.beat, newDuration);
    this.tabElement.calc();
  }

  public applyEffectSingle(
    effectType: GuitarEffectType,
    effectOptions?: GuitarEffectOptions
  ): boolean {
    const elsAndIds = this.getSelectedNoteElementsAndIds();

    const beforeApply = this._tab.deepCopy();
    const result = elsAndIds.tabLineElement.applyEffectSingle(
      elsAndIds.barElementId,
      elsAndIds.beatElementId,
      elsAndIds.stringNum,
      effectType,
      effectOptions
    );

    if (!result) {
      return false;
    }

    if (result) {
      this.undoStack.push(beforeApply);
    }

    this.tabElement.calc();

    if (
      elsAndIds.tabLineElementId !==
      this.tabElement.tabLineElements.length - 1
    ) {
      elsAndIds.tabLineElement.justifyElements();
    }

    return true;
  }

  public removeEffectSingle(
    effectType: GuitarEffectType,
    effectOptions?: GuitarEffectOptions
  ): void {
    const elsAndIds = this.getSelectedNoteElementsAndIds();
    if (elsAndIds.noteElement === undefined) {
      return;
    }

    const effectIndex = elsAndIds.noteElement.guitarEffectElements.findIndex(
      (gfe) => {
        return (
          gfe.effect.effectType === effectType &&
          gfe.effect.options === effectOptions
        );
      }
    );

    if (effectIndex === -1) {
      return;
    }

    this.undoStack.push(this._tab.deepCopy());

    elsAndIds.tabLineElement.removeEffectSingle(
      elsAndIds.barElementId,
      elsAndIds.beatElementId,
      elsAndIds.stringNum,
      effectIndex
    );

    this.tabElement.calc();

    if (
      elsAndIds.tabLineElementId !==
      this.tabElement.tabLineElements.length - 1
    ) {
      elsAndIds.tabLineElement.justifyElements();
    }
  }

  public getSelectedElement(): SelectedElement | undefined {
    return this._selectionManager.selectedElement;
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
    this.tabElement.resetSelection();
  }

    /**
   * Clears selected element
   */
  public clearSelectedElement(): void {
    this._selectionManager.clearSelectedElement();
  }

  public selectBeat(beatElement: BeatElement): void {
    this._selectionManager.selectBeat(beatElement.beat);

    this.tabElement.recalcBeatElementSelection(
      this._selectionManager.selectionBeats
    );
  }

  public selectBeatUsingIds(
    tabLineElementId: number,
    barElementId: number,
    beatElementId: number
  ): void {
    const beatElement =
      this.tabElement.tabLineElements[tabLineElementId].barElements[
        barElementId
      ].beatElements[beatElementId];
    this._selectionManager.selectBeat(beatElement.beat);

    this.tabElement.recalcBeatElementSelection(
      this._selectionManager.selectionBeats
    );
  }

  public changeSelectionDuration(newDuration: NoteDuration): void {
    this.undoStack.push(this._tab.deepCopy());

    this._selectionManager.changeSelectionDuration(newDuration);
    this.tabElement.calc();
  }

  public copy(): void {
    this._selectionManager.copy();
  }

  public paste(): void {
    this.undoStack.push(this._tab.deepCopy());

    this._selectionManager.paste();
    this.tabElement.calc();
  }

  /**
   * Delete every selected beat
   * @param beats
   */
  public deleteBeats(): void {
    this._selectionManager.deleteSelected();
    this.tabElement.calc();
  }

  /**
   * Prepends a bar to the tab and all the score tracks
   * @param bar Bar to prepend
   */
  public prependBar(bar?: Bar): void {
    this._score.prependBar(this._tabIndex, bar);
    this.tabElement.calc();
  }

  /**
   * Appends a bar to the tab and all the score tracks
   * @param bar Bar to append
   */
  public appendBar(bar?: Bar): void {
    this._score.appendBar(this._tabIndex, bar);
    this.tabElement.calc();
  }

  /**
   * Inserts a bar to the tab at specified index and all the score tracks
   * @param bar Bar to insert
   */
  public insertBar(barIndex: number, bar?: Bar): void {
    if (barIndex < 0 || barIndex > this._tab.bars.length) {
      throw Error(`Invalid bar index: '${barIndex}'`);
    }

    // this._tab.bars.push(bar);
    this._score.insertBar(this._tabIndex, barIndex, bar);
    this.tabElement.calc();
  }

  /**
   * Removes bar from the score
   * @param barIndex Index of the bar to remove
   */
  public removeBar(barIndex: number): void {
    if (barIndex < 0 || barIndex > this._tab.bars.length) {
      throw Error(`Invalid bar index: '${barIndex}'`);
    }

    this._score.removeBar(barIndex);

    this.tabElement.calc();
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
    this.tabElement.calc();
  }

  public undo(): void {
    const prevTab = this.undoStack.pop();
    if (prevTab === undefined) {
      return;
    }

    this.redoStack.push(this._tab.deepCopy());
    this._tab = prevTab;

    this._selectionManager = new SelectionManager(this._tab);
    this.tabElement.resetTab(this._tab);
  }

  public redo(): void {
    const nextTab = this.redoStack.pop();
    if (nextTab === undefined) {
      return;
    }

    this.undoStack.push(nextTab.deepCopy());
    this._tab = nextTab;

    this._selectionManager = new SelectionManager(this._tab);
    this.tabElement.resetTab(this._tab);
  }

  public get selectionManager(): SelectionManager {
    return this._selectionManager;
  }
}
