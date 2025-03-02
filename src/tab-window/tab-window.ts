import { Tab } from "./../models/tab";
import { TabWindowDim } from "./tab-window-dim";
import { NoteElement } from "./elements/note-element";
import { BarElement } from "./elements/bar-element";
import { Point } from "./shapes/point";
import { Bar } from "./../models/bar";
import { NoteDuration } from "./../models/note-duration";
import { ChordElement } from "./elements/chord-element";
import {
  MoveRightResult,
  SelectedElement,
  isSelectedElement,
} from "./elements/selected-element";
import { Chord } from "../models/chord";
import { SelectionElement } from "./elements/selection-element";
import { Rect } from "./shapes/rect";
import { TabLineElement } from "./elements/tab-line-element";
import { GuitarEffect } from "../models/guitar-effect";

/**
 * Tab window specific selected element ids
 */
export type SelectedElementWindowIds = {
  /**
   * Id of the tab line element
   */
  tabLineElementId: number;
  /**
   * If of the bar element (within the tab line element)
   */
  barElementId: number;
  /**
   * Id of the chord element, same as chord id, in here just
   * for consistency's sake
   */
  chordElementId: number;
  /**
   * String number
   */
  stringNum: number;
};

/**
 * Class that handles creating a tab window
 */
export class TabWindow {
  /**
   * Tab object to get data from
   */
  private _tab: Tab;
  /**
   * Dimensions object
   */
  readonly dim: TabWindowDim;
  /**
   * Tab line elements
   */
  private _tabLineElements: TabLineElement[];
  /**
   * Selected note element
   */
  private _selectedElement: SelectedElement | undefined;
  /**
   * Selection elements before selection was cleared
   */
  private _lastSelectionElements: SelectionElement[];
  /**
   * Copied data
   */
  private _copiedData: SelectedElement | SelectionElement[];
  /**
   * Selection elements
   */
  private _selectionElements: SelectionElement[];
  /**
   * Selection rectangles
   */
  private _selectionRects: (Rect | undefined)[];
  /**
   * Base element of selection
   */
  private _baseSelectionElement?: SelectionElement;

  /**
   * Class that handles creating a tab window
   * @param tab Tab object
   * @param dim Tab window dimensions
   */
  constructor(tab: Tab, dim: TabWindowDim) {
    if (tab.bars.length === 0) {
      tab.bars.push(
        new Bar(tab.guitar, 120, 4, NoteDuration.Quarter, [
          new Chord(tab.guitar, NoteDuration.Quarter),
        ])
      );
    }
    this._tab = tab;
    this.dim = dim;
    this._tabLineElements = [];
    this._selectionElements = [];
    this._selectionRects = [];

    this.calc();
  }

  private createBarElement(bar: Bar, prevBar?: Bar): BarElement {
    /**
     * TODO: THIS FUNCTION HAS TO GO TO 'BarElement' CLASS
     * AS A STATIC METHOD
     */

    const showSignature =
      prevBar !== undefined ? bar.signature !== prevBar.signature : true;
    const showTempo =
      prevBar !== undefined ? bar.tempo !== prevBar.tempo : true;

    const coords = new Point(0, 0);
    const barElement = new BarElement(
      this.dim,
      coords,
      bar,
      showSignature,
      showTempo
    );

    return barElement;
  }

  /**
   * Adds new bar element to
   * @param barIndex Index of the bar
   * @param coords Coords of the current tab line element (top-left)
   */
  public addBarElement(barIndex: number, coords: Point): void {
    let curTabLine = this._tabLineElements[this._tabLineElements.length - 1];

    const barElement = this.createBarElement(
      this._tab.bars[barIndex],
      this._tab.bars[barIndex - 1]
    );

    if (!curTabLine.barElementFits(barElement)) {
      coords.y += this.dim.tabLineHeight;
      this._tabLineElements.push(new TabLineElement(this.dim, coords));
      curTabLine = this._tabLineElements[this._tabLineElements.length - 1];
    }

    curTabLine.addBarElement(barElement);
  }

  /**
   * Calc tab window. Goes through every bar of a tab and calculates
   * the resulting window with multiple bar lines
   */
  public calc(): void {
    const coords = new Point(0, 0);
    this._tabLineElements = [new TabLineElement(this.dim, coords)];
    for (let barIndex = 0; barIndex < this._tab.bars.length; barIndex++) {
      this.addBarElement(barIndex, coords);
    }
  }

  /**
   * Select new note element
   * @param tabLineElementId Id of the bar elements line containing the chord element
   * @param barElementId Id of the bar element containing the chord element
   * @param chordElementId Id of the chord element containing the note element
   * @param noteElementId Id of the note element
   */
  public selectNoteElement(
    tabLineElementId: number,
    barElementId: number,
    chordElementId: number,
    noteElementId: number
  ): void {
    this.clearSelection();

    // Get current note element's info
    const tabLineElement = this._tabLineElements[tabLineElementId];
    const barElement = tabLineElement.barElements[barElementId];
    const chordElement = barElement.chordElements[chordElementId];
    const noteElement = chordElement.noteElements[noteElementId];

    const barId = this._tab.bars.indexOf(barElement.bar);
    const chordId = this._tab.bars[barId].chords.indexOf(chordElement.chord);
    const stringNum = noteElement.note.stringNum;

    // Select
    this._selectedElement = new SelectedElement(
      this._tab,
      barId,
      chordId,
      stringNum
    );
  }

  /**
   * Adds chord to selection & update selection rects
   * @param tabLineElementId Bar elements line id
   * @param barElementId Bar element id
   * @param chordElementId Chord element id
   * @param chordElementSeqId Sequential chord element id
   */
  private addChordToSelection(
    tabLineElementId: number,
    barElementId: number,
    chordElementId: number,
    chordElementSeqId: number
  ): void {
    const newSelectionElement = new SelectionElement(
      tabLineElementId,
      barElementId,
      chordElementId,
      chordElementSeqId
    );

    if (
      this._selectionElements.length === 0 &&
      this._baseSelectionElement === undefined
    ) {
      this._baseSelectionElement = newSelectionElement;
    }

    this._selectionElements.push(newSelectionElement);

    const tabLineElement = this._tabLineElements[tabLineElementId];
    const barElement = tabLineElement.barElements[barElementId];
    const chordElement = barElement.chordElements[chordElementId];

    if (this._selectionRects[tabLineElementId] === undefined) {
      this._selectionRects[tabLineElementId] = new Rect(
        chordElement === barElement.chordElements[0]
          ? barElement.rect.x
          : chordElement.rect.x,
        chordElement.rect.y,
        chordElement.rect.width,
        chordElement.rect.height
      );
    } else {
      this._selectionRects[tabLineElementId].width =
        chordElement.rect.rightTop.x - this._selectionRects[tabLineElementId].x;
    }
  }

  /**
   * Selects chords in between the two specified chords (including them)
   * @param startTabLineElementId Bar line id of the starting chord
   * @param startBarElementId Bar element id of the starting chord
   * @param startChordElementId Chord element id of the starting chord
   * @param endTabLineElementId Bar line id of the end chord
   * @param endBarElementId Bar element id of the end chord
   * @param endChordElementId Chord element id of the end chord
   */
  private selectChordsInBetween(
    startTabLineElementId: number,
    startBarElementId: number,
    startChordElementId: number,
    endTabLineElementId: number,
    endBarElementId: number,
    endChordElementId: number
  ): void {
    const chordsSeq = this._tab.getChordsSeq();

    const startChordElementSeqId = chordsSeq.indexOf(
      this._tabLineElements[startTabLineElementId].barElements[
        startBarElementId
      ].chordElements[startChordElementId].chord
    );
    const endChordElementSeqId = chordsSeq.indexOf(
      this._tabLineElements[endTabLineElementId].barElements[endBarElementId]
        .chordElements[endChordElementId].chord
    );
    let seqIndex = chordsSeq.indexOf(
      this._tabLineElements[startTabLineElementId].barElements[0]
        .chordElements[0].chord
    );

    for (let i = startTabLineElementId; i <= endTabLineElementId; i++) {
      const barsCount = this._tabLineElements[i].barElements.length;
      for (let j = 0; j < barsCount; j++) {
        const chordsCount =
          this._tabLineElements[i].barElements[j].chordElements.length;
        for (let k = 0; k < chordsCount; k++) {
          if (
            seqIndex >= startChordElementSeqId &&
            seqIndex <= endChordElementSeqId
          ) {
            this.addChordToSelection(i, j, k, seqIndex);
          }
          seqIndex++;
        }
      }
    }
  }

  /**
   * Selects specified chord and all the chords between it and base selection element
   * @param tabLineElementId Id of the line of bar elements
   * @param barElementId Bar element id
   * @param chordElementId Chord element id
   * @returns
   */
  public selectChord(
    tabLineElementId: number,
    barElementId: number,
    chordElementId: number
  ): void {
    if (this._selectedElement) {
      this._selectedElement = undefined;
    }

    const chordElement =
      this._tabLineElements[tabLineElementId].barElements[barElementId]
        .chordElements[chordElementId];
    const chordSeqId = this._tab.getChordsSeq().indexOf(chordElement.chord);
    // const chordElementSeqId = this._chordElementsSeq.indexOf(chordElement);

    let startTabLineElementId: number;
    let startBarElementId: number;
    let startChordElementId: number;
    let endTabLineElementId: number;
    let endBarElementId: number;
    let endChordElementId: number;

    if (
      this._baseSelectionElement === undefined ||
      chordSeqId === this._baseSelectionElement.chordElementSeqId
    ) {
      startTabLineElementId = tabLineElementId;
      startBarElementId = barElementId;
      startChordElementId = chordElementId;
      endTabLineElementId = tabLineElementId;
      endBarElementId = barElementId;
      endChordElementId = chordElementId;
    } else if (chordSeqId > this._baseSelectionElement.chordElementSeqId) {
      startTabLineElementId = this._baseSelectionElement.tabLineElementId;
      startBarElementId = this._baseSelectionElement.barElementId;
      startChordElementId = this._baseSelectionElement.chordElementId;
      endTabLineElementId = tabLineElementId;
      endBarElementId = barElementId;
      endChordElementId = chordElementId;
    } else {
      startTabLineElementId = tabLineElementId;
      startBarElementId = barElementId;
      startChordElementId = chordElementId;
      endTabLineElementId = this._baseSelectionElement.tabLineElementId;
      endBarElementId = this._baseSelectionElement.barElementId;
      endChordElementId = this._baseSelectionElement.chordElementId;
    }

    // Clear selection rects
    this._selectionElements = [];
    for (let i = 0; i < this._selectionRects.length; i++) {
      this._selectionRects[i] = undefined;
    }

    // Select all chords in new selection
    this.selectChordsInBetween(
      startTabLineElementId,
      startBarElementId,
      startChordElementId,
      endTabLineElementId,
      endBarElementId,
      endChordElementId
    );
  }

  /**
   * Clears all selection
   */
  public clearSelection(): void {
    this._baseSelectionElement = undefined;
    this._selectionElements = [];
    for (let i = 0; i < this._selectionRects.length; i++) {
      this._selectionRects[i] = undefined;
    }
  }

  /**
   * Copy selected note/chords (depending on which is currently selected)
   */
  public copy(): void {
    this._copiedData = this._selectedElement
      ? new SelectedElement(
          this._tab,
          this._selectedElement.barId,
          this._selectedElement.chordId,
          this._selectedElement.stringNum
        )
      : this._selectionElements;
  }

  private insertChords(): void {
    if (isSelectedElement(this._copiedData)) {
      return;
    }

    // Insert selection chords after specified chord
    const chordSeqId = this._tab.getChordsSeq();
    const chords = this._copiedData.map((se) => {
      return chordSeqId[se.chordElementSeqId].deepCopy();
    });
    this._selectedElement.bar.insertChords(
      this._selectedElement.chordId,
      chords
    );

    // Recalc
    // this.clearSelection();
    this.calc();
  }

  private replaceChords(): void {
    if (isSelectedElement(this._copiedData)) {
      return;
    }

    const chordSeqId = this._tab.getChordsSeq();
    const oldChords = this._selectionElements.map((se) => {
      return chordSeqId[se.chordElementSeqId];
    });
    const copiedChords = this._copiedData.map((se) => {
      return chordSeqId[se.chordElementSeqId];
    });
    this._tab.replaceChords(oldChords, copiedChords);

    this.clearSelection();
    this.calc();
  }

  /**
   * Paste copied data:
   * Paste chords after selected note if selected chords OR
   * Paste note, i.e., change fret value of selected note to that of selected
   * @returns
   */
  public paste(): void {
    if (!isSelectedElement(this._copiedData)) {
      // Return if nothing to paste
      if (this._copiedData.length === 0) {
        return;
      }

      if (this._selectionElements.length === 0) {
        this.insertChords();
      } else {
        this.replaceChords();
      }
    } else {
      this._selectedElement.note.fret = this._copiedData.note.fret;
    }
  }

  /**
   * Delete every selected chord
   * @param chords
   */
  public deleteChords(): void {
    // PROBLEM: Removing chords individually by id leads to issues
    // SOLUTION #1: Use chords uuid instead

    const chords = this._selectionElements.map((se) => {
      const tabLineElement = this._tabLineElements[se.tabLineElementId];
      const barElement = tabLineElement.barElements[se.barElementId];
      const chordElement = barElement.chordElements[se.chordElementId];
      return chordElement.chord;
    });

    this._tab.removeChords(chords);

    // for (const se of this._selectionElements) {
    //   const tabLineElement = this._tabLineElements[se.tabLineElementId];
    //   const barElement = tabLineElement.barElements[se.barElementId];
    //   const chordElement = barElement.chordElements[se.chordElementId];
    //   barElement.removeChordByUUID(chordElement.chord.uuid);
    // }

    // Recalc
    this.clearSelection();
    this.calc();
  }

  /**
   * Gets chords from selection (as a get function because this is a .map wrapper)
   * @returns Selected chords ('Chord' class)
   */
  public getSelectionChords(): Chord[] {
    const chordSeqId = this._tab.getChordsSeq();
    return this._selectionElements.map((se) => {
      return chordSeqId[se.chordElementSeqId];
    });
  }

  /**
   * Checks if note element is the selected element
   * @param noteElement Note element to check
   * @returns True if selected, false otherwise
   */
  public isNoteElementSelected(noteElement: NoteElement): boolean {
    return this._selectedElement.note.uuid === noteElement.note.uuid;
  }

  /**
   * Gets all UI ids of the selected element
   * @returns Ids: tabLineElementId, barElementId, chordElementId, stringNum
   */
  public getSelectedNoteElementIds(): SelectedElementWindowIds {
    let barElementId = -1;
    const tabLineElementId = this._tabLineElements.findIndex((tle) => {
      barElementId = tle.barElements.findIndex((be) => {
        return be.bar.uuid === this._selectedElement.bar.uuid;
      });
      return barElementId !== -1;
    });

    return {
      tabLineElementId: tabLineElementId,
      barElementId: barElementId,
      chordElementId: this._selectedElement.chordId,
      stringNum: this._selectedElement.stringNum,
    };
  }

  /**
   * Move selected note up
   */
  public moveSelectedNoteUp(): void {
    if (this._selectedElement === undefined) {
      throw Error("No note selected");
    }

    this.clearSelection();

    this._selectedElement.moveUp();
  }

  /**
   * Move selected note down
   */
  public moveSelectedNoteDown(): void {
    if (this._selectedElement === undefined) {
      throw Error("No note selected");
    }

    this.clearSelection();

    this._selectedElement.moveDown();
  }

  /**
   * Move selected note left
   */
  public moveSelectedNoteLeft(): void {
    if (this._selectionElements.length !== 0) {
      // Select left most element of selection
      const leftMostElement = this._selectionElements[0];
      const barElement =
        this._tabLineElements[leftMostElement.tabLineElementId].barElements[
          leftMostElement.barElementId
        ];
      const barId = this._tab.bars.indexOf(barElement.bar);
      this._selectedElement = new SelectedElement(
        this._tab,
        barId,
        leftMostElement.chordElementId,
        this._selectedElement ? this._selectedElement.stringNum : 1
      );

      this.clearSelection();
    }

    if (
      this._selectionElements.length === 0 &&
      this._selectedElement === undefined
    ) {
      throw Error("No note selected");
    }

    this._selectedElement.moveLeft();
  }

  /**
   * Handles added chord after moving right
   */
  private handleAddedChord(): void {
    // Find bar element
    let tabLineElement: TabLineElement;
    let barElement: BarElement;
    let barElementId: number;
    this._tabLineElements.find((tle) => {
      return tle.barElements.some((be, beIndex) => {
        tabLineElement = tle;
        barElement = be;
        barElementId = beIndex;
        return be.bar.uuid === this._selectedElement.bar.uuid;
      });
    });

    // Check if the bar element fits after appending new chord
    if (
      tabLineElement === this._tabLineElements[this._tabLineElements.length - 1]
    ) {
      // If at the last then simply remove bar element from current line,
      // create and add new tab line and push the bar element there

      tabLineElement.removeBarElement(barElementId);
      // Append empty chord
      barElement.appendChord();
      // tabLineElement.barElements.splice(barElementId, 1);

      const barIndex = this._tab.bars.indexOf(barElement.bar);
      this.addBarElement(barIndex, tabLineElement.rect.leftTop);
    } else {
      // Otherwise just redraw the whole thing since might need to
      // recalc every tab line below the current one anyway
      barElement.appendChord();
      this.calc();
    }
  }

  /**
   * Handles added bar after moving right
   * @param addedBar Added bar
   */
  private handleAddedBar(addedBar: Bar): void {
    // Add bar
    this._tab.bars.push(addedBar);

    // Compute UI
    const coords =
      this._tabLineElements[this._tabLineElements.length - 1].rect.leftTop;
    this.addBarElement(this._tab.bars.length - 1, coords);
  }

  /**
   * Move selected note right
   */
  public moveSelectedNoteRight(): void {
    if (this._selectionElements.length !== 0) {
      // Select right most element of selection
      const rightMostElement =
        this._selectionElements[this._selectionElements.length - 1];
      const barElement =
        this._tabLineElements[rightMostElement.tabLineElementId].barElements[
          rightMostElement.barElementId
        ];
      const barId = this._tab.bars.indexOf(barElement.bar);
      this._selectedElement = new SelectedElement(
        this._tab,
        barId,
        rightMostElement.chordElementId,
        this._selectedElement ? this._selectedElement.stringNum : 1
      );

      this.clearSelection();
    }

    if (
      this._selectionElements.length === 0 &&
      this._selectedElement === undefined
    ) {
      throw Error("No note selected");
    }

    const moveRightOutput = this._selectedElement.moveRight();
    switch (moveRightOutput.result) {
      case MoveRightResult.Nothing:
        break;
      case MoveRightResult.AddedChord:
        this.handleAddedChord();
        break;
      case MoveRightResult.AddedBar:
        this.handleAddedBar(moveRightOutput.addedBar);
        break;
      default:
        throw Error("Unexpected outcome after moving note right");
    }
  }

  public changeSelectedBarTempo(newTempo: number): void {
    const ids = this.getSelectedNoteElementIds();
    const { tabLineElementId, barElementId } = ids;
    const tabLineElement = this._tabLineElements[tabLineElementId];
    const barElement = tabLineElement.barElements[barElementId];

    barElement.changeTempo(newTempo);
    this.calc();
  }

  public changeSelectedBarBeats(newBeats: number): void {
    const ids = this.getSelectedNoteElementIds();
    const { tabLineElementId, barElementId } = ids;
    const tabLineElement = this._tabLineElements[tabLineElementId];
    const barElement = tabLineElement.barElements[barElementId];

    barElement.changeBarBeats(newBeats);
    this.calc();
  }

  public changeSelectedBarDuration(newDuration: NoteDuration): void {
    const ids = this.getSelectedNoteElementIds();
    const { tabLineElementId, barElementId } = ids;
    const tabLineElement = this._tabLineElements[tabLineElementId];
    const barElement = tabLineElement.barElements[barElementId];

    barElement.changeBarDuration(newDuration);
    this.calc();
  }

  public changeSelectedChordDuration(newDuration: NoteDuration): void {
    const ids = this.getSelectedNoteElementIds();
    const { tabLineElementId, barElementId, chordElementId } = ids;
    const tabLineElement = this._tabLineElements[tabLineElementId];
    const barElement = tabLineElement.barElements[barElementId];
    const chordElement = barElement.chordElements[chordElementId];

    barElement.changeChordDuration(chordElement.chord, newDuration);
    this.calc();
  }

  public changeSelectedNoteValue(newNoteValue: number): void {
    const ids = this.getSelectedNoteElementIds();
    const { tabLineElementId, barElementId, chordElementId, stringNum } = ids;
    const tabLineElement = this._tabLineElements[tabLineElementId];
    const barElement = tabLineElement.barElements[barElementId];
    const chordElement = barElement.chordElements[chordElementId];
    const noteElement = chordElement.noteElements[stringNum - 1];

    noteElement.note.fret = newNoteValue;
  }

  public applyEffect(effect: GuitarEffect): boolean {
    let applyRes: boolean = false;
    if (this._selectedElement !== undefined) {
      // Apply effect to selected element
      applyRes = this._tab.applyEffectToNote(
        this._selectedElement.barId,
        this._selectedElement.chordId,
        this._selectedElement.stringNum,
        effect
      );

      if (applyRes) {
        // Effect applied => need to recalc the affected note element
        const ids = this.getSelectedNoteElementIds();
        this._tabLineElements[ids.tabLineElementId].barElements[
          ids.barElementId
        ].chordElements[ids.chordElementId].noteElements[
          ids.stringNum - 1
        ].calc();
      }
    } else if (this._selectionElements.length !== 0) {
      // Apply effect to all elements in selection
      const chords = this._selectionElements.map((se) => {
        return this._tabLineElements[se.tabLineElementId].barElements[
          se.barElementId
        ].chordElements[se.chordElementId].chord;
      });
      applyRes = this._tab.applyEffectToChords(chords, effect);

      if (applyRes) {
        // Effects applied to all selected chord elements => recalc every affected chord element
        for (const selectionElement of this._selectionElements) {
          this._tabLineElements[selectionElement.tabLineElementId].barElements[
            selectionElement.barElementId
          ].chordElements[selectionElement.chordElementId].calc();
        }
      }
    }

    return applyRes;
  }

  public insertBar(bar: Bar): void {
    this._tab.bars.push(bar);
    this.calc();
  }

  public insertChord(
    barElement: BarElement,
    prevChordElement: ChordElement
  ): void {
    const index = barElement.chordElements.indexOf(prevChordElement);
    if (index < 0 || index >= barElement.chordElements.length) {
      return;
    }

    barElement.insertEmptyChord(index);
    this.calc();
  }

  public get tab(): Tab {
    return this._tab;
  }

  public get tabLineElements(): TabLineElement[] {
    return this._tabLineElements;
  }

  /**
   * Selected note element
   */
  public get selectedElement(): SelectedElement {
    return this._selectedElement;
  }

  /**
   * Selected note element
   */
  public get selectionElements(): SelectionElement[] {
    return this._selectionElements;
  }

  /**
   * Selection rectangles
   */
  public get selectionRects(): (Rect | undefined)[] {
    return this._selectionRects;
  }
}
