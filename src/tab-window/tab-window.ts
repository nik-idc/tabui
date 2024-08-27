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
  // /**
  //  * Array of tab lines
  //  */
  // private _tabLineElements: TabLineElement[];
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
    // this._tabLineElements = [];
    this._barElements = [];
    this._barElementLines = [];

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

  // /**
  //  * Calculate tab line elements of the tab
  //  */
  // private calcTabLineElements(): void {
  //   this._tabLineElements = [new TabLineElement(this.dim, new Point(0, 0))];
  //   for (const bar of this._tab.bars) {
  //     const tabLinesCount = this._tabLineElements.length;
  //     const inserted =
  //       this._tabLineElements[this._tabLineElements.length - 1].insertBar(bar);
  //     if (!inserted) {
  //       const lineCoords = new Point(0, this.dim.tabLineHeight * tabLinesCount);
  //       this._tabLineElements.push(new TabLineElement(this.dim, lineCoords));
  //       this._tabLineElements[this._tabLineElements.length - 1].insertBar(bar);
  //       this._tabLineElements[this._tabLineElements.length - 2].justifyBars();
  //     }
  //   }

  //   // Justify last bar
  //   const lastTabLineElement =
  //     this._tabLineElements[this._tabLineElements.length - 1];
  //   if (lastTabLineElement.barElements.length >= 1) {
  //     this._tabLineElements[this._tabLineElements.length - 1].justifyBars();
  //   }

  //   if (this._selectedElement) {
  //     this._selectedElement.calcElementIds();
  //   }
  // }

  // /**
  //  * Calculate SVG string lines path
  //  */
  // private calcPath(): void {
  //   // Create path
  //   this._linesPath = "";
  //   for (const tabLineElement of this._tabLineElements) {
  //     const linesY =
  //       tabLineElement.rect.y +
  //       this.dim.durationsHeight +
  //       this.dim.noteRectHeight / 2;
  //     const startX = tabLineElement.rect.x;
  //     const endX = tabLineElement.rect.rightTop.x;
  //     this._linesPath += `M${startX},${linesY}v${this.dim.timeSigRectHeight}`;
  //     this._linesPath += `M${endX},${linesY}v${this.dim.timeSigRectHeight}`;
  //     for (let strId = 0; strId < this._tab.guitar.stringsCount; strId++) {
  //       // Move to cur string's Y level and draw a horizontal line
  //       const y =
  //         tabLineElement.rect.y +
  //         this.dim.durationsHeight +
  //         strId * this.dim.noteRectHeight +
  //         this.dim.noteRectHeight / 2;
  //       this._linesPath += `M0,${y}H${this.dim.width}`;
  //     }
  //   }
  // }

  // /**
  //  * Calculate tab window
  //  */
  // public calcOld(): void {
  //   this.calcTabLineElements();
  //   this.calcPath();
  // }

  public calc(): void {
    this.calcBarElements();

    if (this._selectedElement) {
      this._selectedElement.calcElementIds();
    }
  }

  /**
   * Select new note element
   * @param barElementsLineId Id of the bar elements' line containing the bar element
   * @param barElementId Id of the bar element containing the chord element
   * @param chordElementId Id of the chord element containing the note element
   * @param noteElementId Id of the note element
   */
  public selectNoteElement(
    barElementsLineId: number,
    barElementId: number,
    chordElementId: number,
    noteElementId: number
  ): void {
    const barElementsLine = this._barElementLines[barElementsLineId];
    const barElement = barElementsLine[barElementId];
    const chordElement = barElement.chordElements[chordElementId];
    const noteElement = chordElement.noteElements[noteElementId];

    const barId = this.tab.bars.indexOf(barElement.bar);
    const chordId = this.tab.bars[barId].chords.indexOf(chordElement.chord);
    const stringNum = noteElement.note.stringNum;
    this._selectedElement = new SelectedElement(
      this,
      barId,
      chordId,
      stringNum
    );
  }

  public moveSelectedNoteUp(): void {
    // Check if a note is selected
    if (!this._selectedElement) {
      return;
    }

    this._selectedElement.moveUp();
    this.calc();
  }

  public moveSelectedNoteDown(): void {
    // Check if a note is selected
    if (!this._selectedElement) {
      return;
    }

    this._selectedElement.moveDown();
    this.calc();
  }

  public moveSelectedNoteLeft(): void {
    // Check if a note is selected
    if (!this._selectedElement) {
      return;
    }

    this._selectedElement.moveLeft();
    this.calc();
  }

  public moveSelectedNoteRight(): void {
    // Check if a note is selected
    if (!this._selectedElement) {
      return;
    }

    this._selectedElement.moveRight();
    this.calc();
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

  // /**
  //  * Array of tab lines
  //  */
  // public get tabLineElements(): TabLineElement[] {
  //   return this._tabLineElements;
  // }

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
   * SVG Tag lines path string
   */
  public get linesPath(): string {
    return this._linesPath;
  }
}
