import { Tab } from "./../models/tab";
import { TabWindowDim } from "./tab-window-dim";
import { NoteElement } from "./elements/note-element";
import { BarElement } from "./elements/bar-element";
import { Point } from "./shapes/point";
import { Bar } from "./../models/bar";
import { NoteDuration } from "./../models/note-duration";
import { ChordElement } from "./elements/chord-element";
import {
  SelectedElement,
  isSelectedElement,
} from "./elements/selected-element";
import { Chord } from "../models/chord";
import { SelectionElement } from "./elements/selection-element";
import { Rect } from "./shapes/rect";
import { TabLineElement } from "./elements/tab-line-element";

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
   * Chord elements
   */
  private _chordElementsSeq: ChordElement[];
  /**
   * Bar elements
   */
  private _barElementsSeq: BarElement[];
  /**
   * Lines of bar elements
   */
  private _barElementLines: BarElement[][];
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
    this._barElementsSeq = [];
    this._barElementLines = [];
    this._selectionElements = [];
    this._selectionRects = [];

    this.calc();
  }

  /**
   * Justifies elements in a bar line
   * @param barElements Elements of a bar line
   * @returns
   */
  private justifyBarElementsLine(barElements: BarElement[]): void {
    // Calc width of empty space
    const gapWidth =
      this.dim.width - barElements[barElements.length - 1].rect.rightTop.x;

    if (gapWidth === 0) {
      return;
    }

    // Calc sum width of all bar elements
    let sumWidth = 0;
    for (const barElement of barElements) {
      sumWidth += barElement.rect.width;
    }

    // Go through each bar element and increase their
    // width according to how their current width relates
    // to the width of the empty space
    const scale = this.dim.width / sumWidth;
    for (const barElement of barElements) {
      barElement.scaleBarHorBy(scale);
    }
  }

  /**
   * Calc, place and scale all bar elements
   */
  private calcBarElements(): void {
    this._barElementsSeq = [];
    this._barElementLines = [];

    let coords = new Point(0, 0);

    for (let i = 0; i < this._tab.bars.length; i++) {
      const showSignature =
        i > 0
          ? this._tab.bars[i].signature !== this._tab.bars[i - 1].signature
          : true;
      const showTempo =
        i > 0 ? this._tab.bars[i].tempo !== this._tab.bars[i - 1].tempo : true;

      const barElement = new BarElement(
        this.dim,
        coords,
        this._tab.bars[i],
        showSignature,
        showTempo
      );

      if (i === 0) {
        this._barElementsSeq.push(barElement);
        this._barElementLines.push([barElement]);
      } else {
        const lastBarElement =
          this._barElementsSeq[this._barElementsSeq.length - 1];

        const barFits =
          lastBarElement.rect.rightTop.x + barElement.rect.width <=
          this.dim.width;
        if (!barFits) {
          coords = new Point(0, coords.y + this.dim.tabLineHeight);

          this.justifyBarElementsLine(
            this._barElementLines[this._barElementLines.length - 1]
          );
          this._barElementLines.push([]);
        } else {
          coords = new Point(lastBarElement.rect.rightTop.x, coords.y);
        }

        barElement.setCoords(coords);
        this._barElementsSeq.push(barElement);
        this._barElementLines[this._barElementLines.length - 1].push(
          barElement
        );
      }
    }

    // Justify last bar elements line
    this.justifyBarElementsLine(
      this._barElementLines[this._barElementLines.length - 1]
    );

    // Get a singular array of all chord elements
    this._chordElementsSeq = this._barElementsSeq.flatMap((be) => {
      return be.chordElements;
    });

    // Build a selection rects array for every tab line
    this._selectionRects = [];
    for (const barElementLine of this._barElementLines) {
      this._selectionRects.push(undefined);
    }
  }

  /**
   * Calc tab window. Goes through every bar of a tab and calculates
   * the resulting window with multiple bar lines
   */
  public calc(): void {
    this.calcBarElements();
  }

  /**
   * Select new note element
   * @param barElementLineId Id of the bar elements line containing the chord element
   * @param barElementId Id of the bar element containing the chord element
   * @param chordElementId Id of the chord element containing the note element
   * @param noteElementId Id of the note element
   */
  public selectNoteElement(
    barElementLineId: number,
    barElementId: number,
    chordElementId: number,
    noteElementId: number
  ): void {
    this.clearSelection();

    // Get current note element's info
    const barElement = this._barElementLines[barElementLineId][barElementId];
    const chordElement = barElement.chordElements[chordElementId];
    const noteElement = chordElement.noteElements[noteElementId];

    const barId = this.tab.bars.indexOf(barElement.bar);
    const chordId = this.tab.bars[barId].chords.indexOf(chordElement.chord);
    const stringNum = noteElement.note.stringNum;

    // Select
    this._selectedElement = new SelectedElement(
      this,
      barId,
      chordId,
      stringNum
    );
  }

  /**
   * Adds chord to selection & update selection rects
   * @param barElementsLineId Bar elements line id
   * @param barElementId Bar element id
   * @param chordElementId Chord element id
   * @param chordElementSeqId Sequential chord element id
   */
  private addChordToSelection(
    barElementsLineId: number,
    barElementId: number,
    chordElementId: number,
    chordElementSeqId: number
  ): void {
    const newSelectionElement = new SelectionElement(
      barElementsLineId,
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

    const barElementLine = this._barElementLines[barElementsLineId];
    const barElement = barElementLine[barElementId];
    const chordElement = this._chordElementsSeq[chordElementSeqId];

    if (this._selectionRects[barElementsLineId] === undefined) {
      this._selectionRects[barElementsLineId] = new Rect(
        chordElement === barElement.chordElements[0]
          ? barElement.rect.x
          : chordElement.rect.x,
        chordElement.rect.y,
        chordElement.rect.width,
        chordElement.rect.height
      );
    } else {
      this._selectionRects[barElementsLineId].width =
        chordElement.rect.rightTop.x -
        this._selectionRects[barElementsLineId].x;
    }
  }

  /**
   * Selects chords in between the two specified chords (including them)
   * @param startBarElementsLineId Bar line id of the starting chord
   * @param startBarElementId Bar element id of the starting chord
   * @param startChordElementId Chord element id of the starting chord
   * @param endBarElementsLineId Bar line id of the end chord
   * @param endBarElementId Bar element id of the end chord
   * @param endChordElementId Chord element id of the end chord
   */
  private selectChordsInBetween(
    startBarElementsLineId: number,
    startBarElementId: number,
    startChordElementId: number,
    endBarElementsLineId: number,
    endBarElementId: number,
    endChordElementId: number
  ): void {
    const startChordElementSeqId = this._chordElementsSeq.indexOf(
      this._barElementLines[startBarElementsLineId][startBarElementId]
        .chordElements[startChordElementId]
    );
    const endChordElementSeqId = this._chordElementsSeq.indexOf(
      this._barElementLines[endBarElementsLineId][endBarElementId]
        .chordElements[endChordElementId]
    );
    let seqIndex = this._chordElementsSeq.indexOf(
      this._barElementLines[startBarElementsLineId][0].chordElements[0]
    );

    for (let i = startBarElementsLineId; i <= endBarElementsLineId; i++) {
      const barsCount = this._barElementLines[i].length;
      for (let j = 0; j < barsCount; j++) {
        const chordsCount = this._barElementLines[i][j].chordElements.length;
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
   * @param barElementsLineId Id of the line of bar elements
   * @param barElementId Bar element id
   * @param chordElementId Chord element id
   * @returns
   */
  public selectChord(
    barElementsLineId: number,
    barElementId: number,
    chordElementId: number
  ): void {
    if (this._selectedElement) {
      this._selectedElement = undefined;
    }

    const chordElement =
      this._barElementLines[barElementsLineId][barElementId].chordElements[
        chordElementId
      ];
    const chordElementSeqId = this._chordElementsSeq.indexOf(chordElement);

    let startBarElementsLineId: number;
    let startBarElementId: number;
    let startChordElementId: number;
    let endBarElementsLineId: number;
    let endBarElementId: number;
    let endChordElementId: number;

    if (
      this._baseSelectionElement === undefined ||
      chordElementSeqId === this._baseSelectionElement.chordElementSeqId
    ) {
      startBarElementsLineId = barElementsLineId;
      startBarElementId = barElementId;
      startChordElementId = chordElementId;
      endBarElementsLineId = barElementsLineId;
      endBarElementId = barElementId;
      endChordElementId = chordElementId;
    } else if (
      chordElementSeqId > this._baseSelectionElement.chordElementSeqId
    ) {
      startBarElementsLineId = this._baseSelectionElement.barElementsLineId;
      startBarElementId = this._baseSelectionElement.barElementId;
      startChordElementId = this._baseSelectionElement.chordElementId;
      endBarElementsLineId = barElementsLineId;
      endBarElementId = barElementId;
      endChordElementId = chordElementId;
    } else {
      startBarElementsLineId = barElementsLineId;
      startBarElementId = barElementId;
      startChordElementId = chordElementId;
      endBarElementsLineId = this._baseSelectionElement.barElementsLineId;
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
      startBarElementsLineId,
      startBarElementId,
      startChordElementId,
      endBarElementsLineId,
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
          this,
          this._selectedElement.barElementId,
          this._selectedElement.chordElementId,
          this._selectedElement.stringNum
        )
      : this._selectionElements;
  }

  private insertChords(): void {
    if (isSelectedElement(this._copiedData)) {
      return;
    }

    // Get indices
    const barElementLineId = this._selectedElement.barElementsLineId;
    const barElementId = this._selectedElement.barElementId;
    const chordElementId = this._selectedElement.chordElementId;

    // Insert selection chords after specified chord
    const barElement = this._barElementLines[barElementLineId][barElementId];
    const chords = this._copiedData.map((se) => {
      return this._chordElementsSeq[se.chordElementSeqId].chord.deepCopy();
    });
    barElement.bar.insertChords(chordElementId, chords);

    // Recalc
    // this.clearSelection();
    this.calc();
  }

  private replaceChords(): void {
    if (isSelectedElement(this._copiedData)) {
      return;
    }

    const oldChords = this._selectionElements.map((se) => {
      return this._chordElementsSeq[se.chordElementSeqId].chord;
    });
    const copiedChords = this._copiedData.map((se) => {
      return this._chordElementsSeq[se.chordElementSeqId].chord;
    });
    this.tab.replaceChords(oldChords, copiedChords);

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
    for (const se of this._selectionElements) {
      const barElementsLine = this._barElementLines[se.barElementsLineId];
      const barElement = barElementsLine[se.barElementId];
      const chord = this._chordElementsSeq[se.chordElementSeqId].chord;
      const chordId = barElement.bar.chords.indexOf(chord);
      barElement.removeChord(chordId);
    }

    // Recalc
    this.clearSelection();
    this.calc();
  }

  /**
   * Gets chords from selection (as a get function because this is a .map wrapper)
   * @returns Selected chords ('Chord' class)
   */
  public getSelectionChords(): Chord[] {
    return this._selectionElements.map((se) => {
      return this._chordElementsSeq[se.chordElementSeqId].chord;
    });
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
      const leftMostElementId = this._selectionElements[0];
      this._selectedElement = new SelectedElement(
        this,
        leftMostElementId.barElementId,
        leftMostElementId.chordElementId,
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
   * Move selected note right
   */
  public moveSelectedNoteRight(): void {
    if (this._selectionElements.length !== 0) {
      // Select right most element of selection
      const rightMostElement =
        this._selectionElements[this._selectionElements.length - 1];
      this._selectedElement = new SelectedElement(
        this,
        rightMostElement.barElementId,
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

    this._selectedElement.moveRight();
  }

  public changeSelectedBarTempo(newTempo: number): void {
    this._selectedElement.barElement.changeTempo(newTempo);
    this.calc();
  }

  public changeSelectedBarBeats(newBeats: number): void {
    this._selectedElement.barElement.changeBarBeats(newBeats);
    this.calc();
  }

  public changeSelectedBarDuration(newDuration: NoteDuration): void {
    this._selectedElement.barElement.changeBarDuration(newDuration);
    this.calc();
  }

  public changeSelectedChordDuration(newDuration: NoteDuration): void {
    const chord = this._selectedElement.chordElement.chord;
    this._selectedElement.barElement.changeChordDuration(chord, newDuration);
    this.calc();
  }

  public changeSelectedNoteValue(newNoteValue: number): void {
    this._selectedElement.noteElement.note.fret = newNoteValue;
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

  public get barElementsSeq(): BarElement[] {
    return this._barElementsSeq;
  }

  public get barElementLines(): BarElement[][] {
    return this._barElementLines;
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

  public get chordElementsSeq(): ChordElement[] {
    return this._chordElementsSeq;
  }
}
