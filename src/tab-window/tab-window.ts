import { Tab } from "./../models/tab";
import { TabWindowDim } from "./tab-window-dim";
import { NoteElement } from "./elements/note-element";
import { BarElement } from "./elements/bar-element";
import { Point } from "./shapes/point";
import { Bar } from "./../models/bar";
import { NoteDuration } from "./../models/note-duration";
import { ChordElement } from "./elements/chord-element";
import { SelectedElement } from "./elements/selected-element";
import { Chord } from "../models/chord";
import { SelectionElement } from "./elements/selection-element";

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
  private _barElements: BarElement[];
  /**
   * Lines of bar elements
   */
  private _barElementLines: BarElement[][];
  /**
   * Selected note element
   */
  private _selectedElement: SelectedElement | undefined;
  /**
   * Selection elements
   */
  private _selectionElements: SelectionElement[];
  /**
   * Base element of selection
   */
  private _baseSelectionElement: SelectionElement | undefined;
  /**
   * True if selection is to the right of the first selected element
   */
  private _selectionToRight: boolean;

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
    this._barElements = [];
    this._barElementLines = [];
    this._selectionElements = [];

    this.calc();
  }

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
    this._barElements = [];
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
        this._barElements.push(barElement);
        this._barElementLines.push([barElement]);
      } else {
        const lastBarElement = this._barElements[this._barElements.length - 1];

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
        this._barElements.push(barElement);
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
    this._chordElementsSeq = this._barElements.flatMap((be) => {
      return be.chordElements;
    });
  }

  public calc(): void {
    this.calcBarElements();
  }

  /**
   * Select new note element
   * @param barElementId Id of the bar element containing the chord element
   * @param chordElementId Id of the chord element containing the note element
   * @param noteElementId Id of the note element
   */
  public selectNoteElement(
    barElementId: number,
    chordElementId: number,
    noteElementId: number
  ): void {
    if (this._selectedElement) {
      this._selectedElement.noteElement.isSelected = false;
    }

    this.clearSelection();

    // Get current note element's info
    const barElement = this._barElements[barElementId];
    const chordElement = barElement.chordElements[chordElementId];
    const noteElement = chordElement.noteElements[noteElementId];
    noteElement.isSelected = true;

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
   * Selects all chords in between (including both start and end chords)
   * @param startBarElementId Start bar element id
   * @param startChordElementId Start chord element id
   * @param endBarElementId End bar element id
   * @param endChordElementId End chord element id
   */
  private selectChordsInBetween(
    startBarElementId: number,
    startChordElementId: number,
    endBarElementId: number,
    endChordElementId: number
  ): void {
    if (
      startBarElementId > endBarElementId ||
      (startBarElementId === endBarElementId &&
        startChordElementId > endChordElementId)
    ) {
      throw Error("Selection order incorrect");
    }

    if (
      startBarElementId === endBarElementId &&
      startChordElementId === endChordElementId &&
      (startBarElementId !== this._baseSelectionElement.barElementId ||
        (startBarElementId === this._baseSelectionElement.barElementId &&
          startChordElementId !== this._baseSelectionElement.chordElementId))
    ) {
      throw Error(
        "Selecting in between the same element only allowed for base selection element"
      );
    }

    let seqIndex = this._chordElementsSeq.indexOf(
      this._barElements[startBarElementId].chordElements[0]
    );

    for (let i = startBarElementId; i <= endBarElementId; i++) {
      for (let j = 0; j < this._barElements[i].chordElements.length; j++) {
        if (startBarElementId === endBarElementId) {
          if (j >= startChordElementId && j <= endChordElementId) {
            this._selectionElements.push(new SelectionElement(i, j, seqIndex));
            this._chordElementsSeq[seqIndex].inSelection = true;
          }
        } else {
          if (i === startBarElementId && j >= startChordElementId) {
            this._selectionElements.push(new SelectionElement(i, j, seqIndex));
            this._chordElementsSeq[seqIndex].inSelection = true;
          } else if (i > startBarElementId && i < endBarElementId) {
            this._selectionElements.push(new SelectionElement(i, j, seqIndex));
            this._chordElementsSeq[seqIndex].inSelection = true;
          } else if (i === endBarElementId && j <= endChordElementId) {
            this._selectionElements.push(new SelectionElement(i, j, seqIndex));
            this._chordElementsSeq[seqIndex].inSelection = true;
          }
        }

        seqIndex++;
      }
    }
  }

  /**
   * Selects specified chord and all the chords between it and base selection element
   * @param barElementId Bar element id
   * @param chordElementId Chord element id
   * @returns
   */
  public selectChord(barElementId: number, chordElementId: number): void {
    const chordElement =
      this._barElements[barElementId].chordElements[chordElementId];
    const seqIndex = this._chordElementsSeq.indexOf(chordElement);

    if (this._selectionElements.length === 0) {
      // Unselect selected element
      if (this._selectedElement) {
        this._selectedElement.noteElement.isSelected = false;
        this._selectedElement = undefined;
      }

      // Mark base selection element
      this._baseSelectionElement = new SelectionElement(
        barElementId,
        chordElementId,
        seqIndex
      );
      this._selectionElements = [this._baseSelectionElement];
      chordElement.inSelection = true;
      return;
    }

    // Unselect every element except the base selection element
    for (const selectionElement of this._selectionElements) {
      if (selectionElement !== this._baseSelectionElement) {
        this._chordElementsSeq[selectionElement.chordElementSeqId].inSelection =
          false;
      }
    }
    this._selectionElements = [];

    if (seqIndex > this._baseSelectionElement.chordElementSeqId) {
      this.selectChordsInBetween(
        this._baseSelectionElement.barElementId,
        this._baseSelectionElement.chordElementId,
        barElementId,
        chordElementId
      );
    } else {
      this.selectChordsInBetween(
        barElementId,
        chordElementId,
        this._baseSelectionElement.barElementId,
        this._baseSelectionElement.chordElementId
      );
    }
  }

  /**
   * Unselects last selected chord
   */
  public unselectLastChord() {
    const lastSelectionElement =
      this._selectionElements[this._selectionElements.length - 1];
    const lastSelectionChordElement =
      this._chordElementsSeq[lastSelectionElement.chordElementSeqId];
    lastSelectionChordElement.inSelection = false;
    this._selectionElements.pop();
  }

  /**
   * Clears all selection
   */
  public clearSelection(): void {
    for (const selectionElement of this._selectionElements) {
      this._chordElementsSeq[selectionElement.chordElementSeqId].inSelection =
        false;
    }
    this._baseSelectionElement = undefined;
    this._selectionElements = [];
  }

  /**
   * Insert chords into bar element
   * @param barElementId Id of the bar element containing the chord element
   * @param chordElementId Id of the chord element after which to insert
   * @returns
   */
  public insertChordsAt(barElementId: number, chordElementId: number): void {
    if (this._selectionElements.length === 0) {
      // Return because nothing to insert
      return;
    }

    // Insert selection chords after specified chord
    const barElement = this._barElements[barElementId];
    const chords = this._selectionElements.map((se) => {
      return this._chordElementsSeq[se.chordElementSeqId].chord;
    });
    barElement.bar.insertChords(chordElementId, chords);

    // Recalc
    this.clearSelection();
    this.calc();
  }

  public moveSelectedNoteUp(): void {
    this.clearSelection();
    this._selectedElement.moveUp();
  }

  public moveSelectedNoteDown(): void {
    this.clearSelection();
    this._selectedElement.moveDown();
  }

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

    this._selectedElement.moveLeft();
  }

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

  public get barElements(): BarElement[] {
    return this._barElements;
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

  public get chordElementsSeq(): ChordElement[] {
    return this._chordElementsSeq;
  }
}
