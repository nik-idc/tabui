import { Tab } from "./../models/tab";
import { TabLineDim } from "./tab-line-dim";
import { NoteElement } from "./elements/note-element";
import { BarElement } from "./elements/bar-element";
import { Point } from "./shapes/point";
import { Bar } from "./../models/bar";
import { NoteDuration } from "./../models/note-duration";

export class TabWindow {
  readonly tab: Tab;
  readonly dim: TabLineDim;
  readonly barElements: BarElement[];
  readonly barsLines: number[][];
  public selectedNoteElement: NoteElement | undefined;
  private _linesPath: string;

  constructor(tab: Tab, dim: TabLineDim) {
    this.tab = tab;
    this.dim = dim;
    this.barElements = [];
    this.barsLines = [];
    this.selectedNoteElement = undefined;

    // Create path
    this._linesPath = "";
    for (let strId = 0; strId < this.tab.guitar.stringsCount; strId++) {
      this._linesPath += `M0,${
        this.dim.durationsLineHeight + strId * this.dim.noteMinSize
      }H${this.dim.tabLineWidth}`;
    }
  }

  private createBarElements(): void {
    this.barElements.length = 0;
    let barCoords = new Point(0, this.dim.durationsLineHeight);

    // Create bar elements
    for (let barId = 0; barId < this.tab.bars.length; barId++) {
      let showMeasure;
      if (
        barId == 0 ||
        this.tab.bars[barId - 1].measure != this.tab.bars[barId].measure
      ) {
        showMeasure = true;
      } else {
        showMeasure = false;
      }

      let showTempo = false;
      if (
        barId == 0 ||
        this.tab.bars[barId - 1].tempo != this.tab.bars[barId].tempo
      ) {
        showTempo = true;
      } else {
        showTempo = false;
      }

      let barElement = new BarElement(
        this,
        barCoords,
        this.tab.bars[barId],
        showMeasure,
        showTempo
      );
      this.barElements.push(barElement);
      // Update x position of next bar element
      barCoords.x += barElement.rect.width;
    }
  }

  private splitIntoLines(): void {
    this.barsLines.length = 0;

    // Split into lines
    for (
      let barId = 0;
      barId < this.barElements.length;
      barId += this.dim.barsPerLine
    ) {
      let lineStartId = barId;
      let lineEndId;
      if (this.barElements.length - barId >= this.dim.barsPerLine) {
        lineEndId = barId + this.dim.barsPerLine;
      } else {
        lineEndId = this.barElements.length;
      }
      let line = Array.from(
        Array(lineEndId - lineStartId).keys(),
        (num) => num + lineStartId
      );
      // Calculate line scale
      let lineBarsWidth = 0;
      for (let lineBarId of line) {
        lineBarsWidth += this.barElements[lineBarId].rect.width;
      }
      let scale = this.dim.tabLineWidth / lineBarsWidth;
      // Subtract the first rectangle x from the rest
      let dx = -this.barElements[line[0]].rect.x;
      let dy = 0;
      for (let lineBarId of line) {
        this.barElements[lineBarId].translateBy(dx, dy);
      }
      // Apply scale and push to the lines array
      for (let lineBarId of line) {
        this.barElements[lineBarId].scaleBarHorBy(scale);
      }

      this.barsLines.push(line);
    }
  }

  calc(): void {
    this.createBarElements();
    this.splitIntoLines();
  }

  moveTabSelectedNoteDown(): void {
    // Check if a note is selected
    if (!this.selectedNoteElement) {
      return;
    }

    let strNum = this.selectedNoteElement.note.strNum;
    let newStrNum = strNum == this.tab.guitar.stringsCount ? 1 : strNum + 1;
    this.selectedNoteElement =
      this.selectedNoteElement.chordElement.noteElements[newStrNum - 1];
  }

  moveTabSelectedNoteUp(): void {
    // Check if a note is selected
    if (!this.selectedNoteElement) {
      return;
    }

    let strNum = this.selectedNoteElement.note.strNum;
    let newStrNum = strNum == 1 ? this.tab.guitar.stringsCount : strNum - 1;
    this.selectedNoteElement =
      this.selectedNoteElement.chordElement.noteElements[newStrNum - 1];
  }

  moveTabSelectedNoteLeft(): void {
    // Check if a note is selected
    if (!this.selectedNoteElement) {
      return;
    }

    let barElement = this.selectedNoteElement.chordElement.barElement;
    let barElementId = this.barElements.indexOf(barElement);
    let chordElement = this.selectedNoteElement.chordElement;
    let chordElementId = barElement.chordElements.indexOf(chordElement);
    let strNum = this.selectedNoteElement.note.strNum;

    if (chordElementId > 0 && barElement.chordElements.length > 1) {
      // Move selected note 1 chord to the left if current chord is not the first chord
      let newChordElementId = chordElementId - 1;
      this.selectedNoteElement =
        barElement.chordElements[newChordElementId].noteElements[strNum - 1];
    } else if (chordElementId == 0 && barElementId > 0) {
      // Make the last note of previous bar the selected note
      let newBarElementId = barElementId - 1;
      let newBarLastChordId =
        this.barElements[newBarElementId].chordElements.length - 1;
      this.selectedNoteElement =
        this.barElements[newBarElementId].chordElements[
          newBarLastChordId
        ].noteElements[strNum - 1];
    }
  }

  moveTabSelectedNoteRight(): void {
    // Check if a note is selected
    if (!this.selectedNoteElement) {
      return;
    }

    // let selectedNoteEl = this.bar
    let barElement = this.selectedNoteElement.chordElement.barElement;
    let barElementId = this.barElements.indexOf(barElement);
    let chordElement = this.selectedNoteElement.chordElement;
    let chordElementId = barElement.chordElements.indexOf(chordElement);
    let strNum = this.selectedNoteElement.note.strNum;

    if (chordElementId < barElement.chordElements.length - 1) {
      // Move selected note 1 chord to the right if it isn't the last chord in the bar
      let newChordElementId = chordElementId + 1;
      this.selectedNoteElement =
        barElement.chordElements[newChordElementId].noteElements[strNum - 1];
    } else if (chordElementId == barElement.chordElements.length - 1) {
      if (barElementId == this.barElements.length - 1) {
        // Create new bar
        let newBar = new Bar(
          this.tab.guitar,
          120,
          4,
          NoteDuration.Quarter,
          undefined
        );
        this.tab.bars.push(newBar);
        this.calc();
      }

      // Make the first note of the next bar the selected one
      let newBarElementId = barElementId + 1;
      this.selectedNoteElement =
        this.barElements[newBarElementId].chordElements[0].noteElements[
          strNum - 1
        ];
    }
  }

  get linesPath(): string {
    return this._linesPath;
  }
}
