import { Tab } from "./../models/tab";
import { TabWindowDim } from "./tab-window-dim";
import { NoteElement } from "./elements/note-element";
import { BarElement } from "./elements/bar-element";
import { Point } from "./shapes/point";
import { Bar } from "./../models/bar";
import { NoteDuration } from "./../models/note-duration";
import { TabLineElement } from "./elements/tab-line-element";
import { ChordElement } from "./elements/chord-element";
import { SelectedElement } from "./elements/selected-element";
import { Chord } from "../models/chord";

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
   * Array of tab lines
   */
  private _tabLineElements: TabLineElement[];
  /**
   * Selected note element
   */
  private _selectedElement: SelectedElement | undefined;
  /**
   * SVG Path for entire tab window
   */
  private _linesPath: string;

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

    // // Create path
    // this._linesPath = "";
    // for (let strId = 0; strId < this._tab.guitar.stringsCount; strId++) {
    //   this._linesPath += `M0,${this.dim.tabLineHeight}H${this.dim.width}`;
    // }
    this.calc();
  }

  /**
   * Calculate tab line elements of the tab
   */
  private calcTabLineElements(): void {
    this._tabLineElements = [new TabLineElement(this.dim, new Point(0, 0))];
    for (const bar of this._tab.bars) {
      const tabLinesCount = this._tabLineElements.length;
      const inserted =
        this._tabLineElements[this._tabLineElements.length - 1].insertBar(bar);
      if (!inserted) {
        const lineCoords = new Point(0, this.dim.tabLineHeight * tabLinesCount);
        this._tabLineElements.push(new TabLineElement(this.dim, lineCoords));
        this._tabLineElements[this._tabLineElements.length - 1].insertBar(bar);
        this._tabLineElements[this._tabLineElements.length - 2].justifyBars();
      }
    }

    // Justify last bar
    const lastTabLineElement =
      this._tabLineElements[this._tabLineElements.length - 1];
    if (lastTabLineElement.barElements.length >= 1) {
      this._tabLineElements[this._tabLineElements.length - 1].justifyBars();
    }
  }

  /**
   * Calculate SVG string lines path
   */
  private calcPath(): void {
    // Create path
    this._linesPath = "";
    for (const tabLineElement of this._tabLineElements) {
      const linesY =
        tabLineElement.rect.y +
        this.dim.durationsHeight +
        this.dim.noteRectHeight / 2;
      const startX = tabLineElement.rect.x;
      const endX = tabLineElement.rect.rightTop.x;
      this._linesPath += `M${startX},${linesY}v${this.dim.timeSigRectHeight}`;
      this._linesPath += `M${endX},${linesY}v${this.dim.timeSigRectHeight}`;
      for (let strId = 0; strId < this._tab.guitar.stringsCount; strId++) {
        // Move to cur string's Y level and draw a horizontal line
        const y =
          tabLineElement.rect.y +
          this.dim.durationsHeight +
          strId * this.dim.noteRectHeight +
          this.dim.noteRectHeight / 2;
        this._linesPath += `M0,${y}H${this.dim.width}`;
      }
    }
  }

  /**
   * Calculate tab window
   */
  public calc(): void {
    this.calcTabLineElements();
    this.calcPath();
  }

  /**
   * Select note element
   * @param noteElement Note element
   * @param chordElement Chord element containing the note element
   * @param barElement Bar element containing the chord element
   * @param tabLineElement Tab line element containing the bar element
   */
  public selectNoteElement(
    noteElement: NoteElement,
    chordElement: ChordElement,
    barElement: BarElement,
    tabLineElement: TabLineElement
  ): void {
    this._selectedElement = new SelectedElement(
      noteElement,
      chordElement,
      barElement,
      tabLineElement,
      this
    );
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

  public get tab(): Tab {
    return this._tab;
  }

  /**
   * Array of tab lines
   */
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
   * SVG Tag lines path string
   */
  public get linesPath(): string {
    return this._linesPath;
  }
}
