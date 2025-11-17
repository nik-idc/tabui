import { Bar } from "../../model/models/index";
import { Beat } from "../../model/models/index";
import { GuitarTechniqueOptions } from "../../model/models/index";
import { GuitarTechniqueType } from "../../model/models/index";
import { NoteDuration } from "../../model/models/index";
import { Score } from "../../model/models/index";
import { Tab } from "../../model/models/index";
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

  public selectFirstNote(): void {
    this._selectionManager.selectNote(this._tab.bars[0].beats[0].notes[0]);
  }

  /**
   * Selects note element using element ids.
   * NOTE: This function does not inform TabPlayer class of the change
   * of the current beat so if you are using TabPlayer class, use
   * TabController.selectNoteElementUsingIds instead
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
      this.redoStack.splice(0, this.redoStack.length);
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
    this.redoStack.splice(0, this.redoStack.length);

    // this._selectionManager.selectedElement.note.fret = newFret;
    this._tab.setNoteFret(
      this._selectionManager.selectedElement.barId,
      this._selectionManager.selectedElement.beatId,
      this._selectionManager.selectedElement.stringNum,
      newFret
    );
  }

  public setSelectedBeatDots(newDots: number): void {
    if (this._selectionManager.selectedElement === undefined) {
      throw Error("Selected note is undefined");
    }

    this.undoStack.push(this._tab.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);

    const barIndex = this._selectionManager.selectedElement.barId;
    const beatIndex = this._selectionManager.selectedElement.beatId;
    this._tab.setDots(barIndex, beatIndex, newDots);
    this.tabElement.calc();
  }

  public setSelectionDots(newDots: number): void {
    if (this._selectionManager.selectedElement !== undefined) {
      throw Error("Can't set selection dots, selected note is defined");
    }

    this.undoStack.push(this._tab.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);

    this._tab.setMultipleDots(this._selectionManager.selectionBeats, newDots);
    this.tabElement.calc();
  }

  public setDots(newDots: number): void {
    if (this._selectionManager.selectedElement === undefined) {
      this.setSelectionDots(newDots);
    } else {
      this.setSelectedBeatDots(newDots);
    }
  }

  public setSelectedBeatsTuplet(
    normalCount: number,
    tupletCount: number
  ): void {
    if (normalCount === tupletCount) {
      return;
    }

    this.undoStack.push(this._tab.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);
    let beats: Beat[];
    if (this._selectionManager.selectedElement === undefined) {
      // If selected multiple beats
      beats = this._selectionManager.selectionBeats;
    } else {
      // If only one beat (note) is selected
      beats = [this._selectionManager.selectedElement.beat];
    }
    this._tab.setBarTupletBeats(beats, normalCount, tupletCount);

    this.tabElement.calc();
  }

  public changeSelectedBarTempo(newTempo: number): void {
    this.undoStack.push(this._tab.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);

    const selectedElement = this._selectionManager.selectedElement;
    if (selectedElement === undefined) {
      return;
    }

    selectedElement.bar.setTempo(newTempo);
    this.tabElement.calc();
  }

  public changeSelectedBarBeats(newBeats: number): void {
    this.undoStack.push(this._tab.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);

    const selectedElement = this._selectionManager.selectedElement;
    if (selectedElement === undefined) {
      return;
    }

    selectedElement.bar.setBeatsCount(newBeats);
    this.tabElement.calc();
  }

  public changeSelectedBarDuration(newDuration: NoteDuration): void {
    this.undoStack.push(this._tab.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);

    const selectedElement = this._selectionManager.selectedElement;
    if (selectedElement === undefined) {
      return;
    }

    selectedElement.bar.setDuration(newDuration);
    this.tabElement.calc();
  }

  public setSelectedBarRepeatStart(): void {
    this.undoStack.push(this._tab.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);

    const barIndex = this._selectionManager.selectedElement?.barId;
    if (barIndex === undefined) {
      throw Error("Bar index undefined at set selected bar repeat start");
    }
    this._tab.setRepeatStart(barIndex);

    this.tabElement.calc();
  }

  public setSelectedBarRepeatEnd(): void {
    this.undoStack.push(this._tab.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);

    const barIndex = this._selectionManager.selectedElement?.barId;
    if (barIndex === undefined) {
      throw Error("Bar index undefined at set selected bar repeat end");
    }
    this._tab.setRepeatEnd(barIndex, 2);

    this.tabElement.calc();
  }

  public changeSelectedBeatDuration(newDuration: NoteDuration): void {
    this.undoStack.push(this._tab.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);

    const selectedElement = this._selectionManager.selectedElement;
    if (selectedElement === undefined) {
      return;
    }

    // barElement.changeBeatDuration(beatElement.beat, newDuration);
    this._tab.setBeatDuration(
      selectedElement.barId,
      selectedElement.beatId,
      newDuration
    );
    this.tabElement.calc();
  }

  public applyTechniqueSingle(
    type: GuitarTechniqueType,
    techniqueOptions?: GuitarTechniqueOptions
  ): boolean {
    const elsAndIds = this.getSelectedNoteElementsAndIds();

    const beforeApply = this._tab.deepCopy();
    const result = elsAndIds.tabLineElement.applyTechniqueSingle(
      elsAndIds.barElementId,
      elsAndIds.beatElementId,
      elsAndIds.stringNum,
      type,
      techniqueOptions
    );

    if (!result) {
      return false;
    }

    if (result) {
      this.undoStack.push(beforeApply);
      this.redoStack.splice(0, this.redoStack.length);
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

  public removeTechniqueSingle(
    type: GuitarTechniqueType,
    techniqueOptions?: GuitarTechniqueOptions
  ): void {
    const elsAndIds = this.getSelectedNoteElementsAndIds();
    if (elsAndIds.noteElement === undefined) {
      return;
    }

    const techniqueIndex = elsAndIds.noteElement.guitarTechniqueElements.findIndex(
      (gfe) => {
        return (
          gfe.technique.type === type &&
          gfe.technique.bendOptions === techniqueOptions
        );
      }
    );

    if (techniqueIndex === -1) {
      return;
    }

    this.undoStack.push(this._tab.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);

    elsAndIds.tabLineElement.removeTechniqueSingle(
      elsAndIds.barElementId,
      elsAndIds.beatElementId,
      elsAndIds.stringNum,
      techniqueIndex
    );

    this.tabElement.calc();

    if (
      elsAndIds.tabLineElementId !==
      this.tabElement.tabLineElements.length - 1
    ) {
      elsAndIds.tabLineElement.justifyElements();
    }
  }

  private setTechniqueSingle(
    type: GuitarTechniqueType,
    techniqueOptions?: GuitarTechniqueOptions
  ): boolean {
    const selectedElement = this._selectionManager.selectedElement;
    if (selectedElement === undefined) {
      throw Error("Set technique single called but selected element undefined");
    }

    const applyRes = this._tab.setTechniqueNote(
      selectedElement.barId,
      selectedElement.beatId,
      selectedElement.stringNum,
      type,
      techniqueOptions
    );

    this.tabElement.calc();

    return applyRes;
  }

  private setTechniqueMultiple(
    type: GuitarTechniqueType,
    techniqueOptions?: GuitarTechniqueOptions
  ): boolean {
    if (this._selectionManager.selectedElement !== undefined) {
      throw new Error(
        "Can't set technique for multiple notes, selected element defined"
      );
    }

    this.undoStack.push(this._tab.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);

    const applyRes = this._tab.setTechniqueBeats(
      this._selectionManager.selectionBeats,
      type,
      techniqueOptions
    );

    this.tabElement.calc();

    return applyRes;
  }

  public setTechnique(
    type: GuitarTechniqueType,
    techniqueOptions?: GuitarTechniqueOptions
  ): boolean {
    return this._selectionManager.selectedElement !== undefined
      ? this.setTechniqueSingle(type, techniqueOptions)
      : this.setTechniqueMultiple(type, techniqueOptions);
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
    this.redoStack.splice(0, this.redoStack.length);

    this._selectionManager.changeSelectionDuration(newDuration);
    this.tabElement.calc();
  }

  public changeDuration(newDuration: NoteDuration): void {
    this.undoStack.push(this._tab.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);

    if (this._selectionManager.selectedElement !== undefined) {
      this.changeSelectedBeatDuration(newDuration);
    } else {
      this.changeSelectionDuration(newDuration);
    }

    this.tabElement.calc();
  }

  public copy(): void {
    this._selectionManager.copy();
  }

  public paste(): void {
    this.undoStack.push(this._tab.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);

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

    this.undoStack.push(this._tab.deepCopy());
    this._tab = nextTab;

    this._selectionManager = new SelectionManager(this._tab);
    this.tabElement.resetTab(this._tab);
  }

  public get selectionManager(): SelectionManager {
    return this._selectionManager;
  }
}
