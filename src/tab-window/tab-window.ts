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
   * First element of selection
   */
  private _firstSelectionElement: SelectionElement | undefined;

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

  public selectChordsInBetween(
    barElementId1: number,
    chordElementId1: number,
    barElementId2: number,
    chordElementId2: number
  ) {
    let startBarElementId: number;
    let startChordElementId: number;
    let endBarElementId: number;
    let endChordElementId: number;

    if (barElementId1 < barElementId2) {
      startBarElementId = barElementId1;
      startChordElementId = chordElementId1;
      endBarElementId = barElementId2;
      endChordElementId = chordElementId2;
    } else if (barElementId1 > barElementId2) {
      startBarElementId = barElementId2;
      startChordElementId = chordElementId2;
      endBarElementId = barElementId1;
      endChordElementId = chordElementId1;
    } else {
      if (chordElementId1 < chordElementId2) {
        startBarElementId = barElementId1;
        startChordElementId = chordElementId1;
        endBarElementId = barElementId1;
        endChordElementId = chordElementId2;
      } else if (chordElementId1 > chordElementId2) {
        startBarElementId = barElementId1;
        startChordElementId = chordElementId2;
        endBarElementId = barElementId1;
        endChordElementId = chordElementId1;
      } else {
        this.selectChord(barElementId1, chordElementId1);
        return;
      }
    }

    for (let i = 0; i < this._barElements.length; i++) {
      for (let j = 0; j < this._barElements[i].chordElements.length; j++) {
        if (startBarElementId === endBarElementId && i === startBarElementId) {
          if (j >= startChordElementId && j <= endChordElementId) {
            this.selectChord(i, j);
          }
        } else if (startBarElementId !== endBarElementId) {
          if (i === startBarElementId && j >= startChordElementId) {
            this.selectChord(i, j);
          } else if (i > startBarElementId && i < endBarElementId) {
            this.selectChord(i, j);
          } else if (i === endBarElementId && j <= endChordElementId) {
            this.selectChord(i, j);
          }
        }
      }
    }
  }

  /**
   * Add new chord to selection elements array
   * @param barElementId Id of the bar element containing the chord element
   * @param chordElementId Id of the chord element containing the note element
   */
  public selectChord(barElementId: number, chordElementId: number): void {
    // Unselect currently selected note element
    if (this._selectedElement !== undefined) {
      this._selectedElement.noteElement.isSelected = false;
      this._selectedElement = undefined;
    }

    // Get current chord element's info
    const barElement = this._barElements[barElementId];
    const chordElement = barElement.chordElements[chordElementId];
    const barId = this.tab.bars.indexOf(barElement.bar);
    const chordId = this.tab.bars[barId].chords.indexOf(chordElement.chord);
    if (chordElement.inSelection) {
      // Already in selection, do nothing
      return;
    }

    // Mark as selected
    chordElement.inSelection = true;

    // Add to selection
    if (this._selectionElements.length === 0) {
      // Mark first selection element
      this._firstSelectionElement = new SelectionElement(this, barId, chordId);
      this._selectionElements.push(this._firstSelectionElement);
      return;
    }
    
    const lastSelectedElement =
      this._selectionElements[this._selectionElements.length - 1];

    const indexDiff = Math.abs(barElementId - lastSelectedElement.barElementId);
    if (indexDiff > 1) {
      this.selectChordsInBetween(
        barElementId,
        chordElementId,
        lastSelectedElement.barElementId,
        lastSelectedElement.chordElementId
      );
    } else if (indexDiff === 1) {
      this._selectionElements.push(new SelectionElement(this, barId, chordId));
    }
  }

  public unselectChord(barElementId: number, chordElementId: number) {
    // Get current chord element's info
    const barElement = this._barElements[barElementId];
    const chordElement = barElement.chordElements[chordElementId];
    if (!chordElement.inSelection) {
      // Already not in selection, do nothing
      return;
    }

    // Mark as selected
    chordElement.inSelection = false;

    const index = this._selectionElements.findIndex((se) => {
      return (
        se.barElementId === barElementId && se.chordElementId === chordElementId
      );
    });
    if (index === 0) {
      this._firstSelectionElement.chordElement.inSelection = false;
      this._firstSelectionElement = this._selectionElements[1];
    }
    this._selectionElements.splice(index, 1);
  }

  public clearSelection(): void {
    // Dispose of selection
    for (const selectionElement of this._selectionElements) {
      selectionElement.chordElement.inSelection = false;
    }
    this._selectionElements = [];
  }

  // public nextChordElementIds(
  //   barElementsLineId: number,
  //   barElementId: number,
  //   chordElementId: number
  // ): number[] {}

  // public prevChordElementIds(
  //   barElementsLineId: number,
  //   barElementId: number,
  //   chordElementId: number
  // ): number[] {}

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
      return se.chord;
    });
    barElement.bar.insertChords(chordElementId, chords);

    // Recalc
    this.calc();
  }

  public moveSelectedNoteUp(): void {
    // Check if a note is selected
    if (!this._selectedElement) {
      return;
    }

    this._selectedElement.moveUp();
  }

  public moveSelectedNoteDown(): void {
    // Check if a note is selected
    if (!this._selectedElement) {
      return;
    }

    this._selectedElement.moveDown();
  }

  public moveSelectedNoteLeft(): void {
    // Check if a note is selected
    if (!this._selectedElement) {
      return;
    }

    this._selectedElement.moveLeft();
  }

  public moveSelectedNoteRight(): void {
    // Check if a note is selected
    if (!this._selectedElement) {
      return;
    }

    this._selectedElement.moveRight();
  }

  public changeSelectedBarTempo(newTempo: number): void {
    // Check if a note is selected
    if (!this._selectedElement) {
      return;
    }

    this._selectedElement.barElement.changeTempo(newTempo);
    this.calc();
  }

  public changeSelectedBarBeats(newBeats: number): void {
    // Check if a note is selected
    if (!this._selectedElement) {
      return;
    }

    this._selectedElement.barElement.changeBarBeats(newBeats);
    this.calc();
  }

  public changeSelectedBarDuration(newDuration: NoteDuration): void {
    // Check if a note is selected
    if (!this._selectedElement) {
      return;
    }

    this._selectedElement.barElement.changeBarDuration(newDuration);
    this.calc();
  }

  public changeSelectedChordDuration(newDuration: NoteDuration): void {
    // Check if a note is selected
    if (!this._selectedElement) {
      return;
    }

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
}
