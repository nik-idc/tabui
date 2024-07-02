import { NoteElement } from "./note-element";
import { ChordElement } from "./chord-element";
import { BarElement } from "./bar-element";
import { TabLineElement } from "./tab-line-element";
import { TabWindow } from "../tab-window";
import { Bar } from "../../models/bar";
import { Point } from "../shapes/point";

/**
 * Class that contains all necessary information
 * about a selected element
 */
export class SelectedElement {
  /**
   * Class that contains all necessary information
   * about a selected element
   * @param _noteElement Note element
   * @param _chordElement Chord element containing the note element
   * @param _barElement Bar element containing the chord element
   * @param _tabLineElement Tab line element containing the bar element
   * @param _tabWindow Tab window containing the tab line element
   */
  constructor(
    private _noteElement: NoteElement,
    private _chordElement: ChordElement,
    private _barElement: BarElement,
    private _tabLineElement: TabLineElement,
    private _tabWindow: TabWindow
  ) {}

  /**
   * Move selected note up (or to the last string if current is the first)
   */
  public moveUp(): void {
    const strNum = this._noteElement.note.strNum;
    const strCount = this._noteElement.note.guitar.stringsCount;
    const newStrNum = strNum === 1 ? strCount : strNum - 1;

    this._noteElement = this._chordElement.noteElements[newStrNum - 1];
  }

  /**
   * Move selected note down (or to the first string if current is the last)
   */
  public moveDown(): void {
    const strNum = this._noteElement.note.strNum;
    const strCount = this._noteElement.note.guitar.stringsCount;
    const newStrNum = strNum === strCount ? 1 : strNum + 1;

    this._noteElement = this._chordElement.noteElements[newStrNum - 1];
  }

  /**
   * Move selected note left (or to the last note of the previous bar)
   */
  public moveLeft(): void {
    const strNum = this._noteElement.note.strNum;
    const chordId = this._barElement.chordElements.indexOf(this._chordElement);

    // Move the chord left in the bar or move selected
    // note to that last chord of the previous bar
    if (chordId !== 0) {
      this._chordElement = this._barElement.chordElements[chordId - 1];
      // 'strNum - 1' because 'strNum' starts from 1
      this._noteElement = this._chordElement.noteElements[strNum - 1];
    } else {
      const barId = this._tabLineElement.barElements.indexOf(this._barElement);
      const tabLineId = this._tabWindow.tabLineElements.indexOf(
        this._tabLineElement
      );

      // Move to the last chord of the previous bar on the same line or
      // move to that last chord of the last bar of the previous tab line
      if (barId !== 0) {
        this._barElement = this._tabLineElement.barElements[barId - 1];
        this._chordElement =
          this._barElement.chordElements[
            this._barElement.chordElements.length - 1
          ];
        // 'strNum - 1' because 'strNum' starts from 1
        this._noteElement = this._chordElement.noteElements[strNum - 1];
      } else {
        // Don't do anything if can't move left
        if (tabLineId === 0) return;

        const prevTabLine = this._tabWindow.tabLineElements[tabLineId - 1];
        const prevTabLineLastBar =
          prevTabLine.barElements[prevTabLine.barElements.length - 1];
        const prevTabLineLastChord =
          prevTabLineLastBar.chordElements[
            prevTabLineLastBar.chordElements.length - 1
          ];

        this._tabLineElement = prevTabLine;
        this._barElement = prevTabLineLastBar;
        this._chordElement = prevTabLineLastChord;
        this._noteElement = prevTabLineLastChord.noteElements[strNum - 1];
      }
    }
  }

  /**
   * Move selected note right (or to the first note of the next bar)
   */
  public moveRight(): void {
    const strNum = this._noteElement.note.strNum;
    const chordId = this._barElement.chordElements.indexOf(this._chordElement);

    // Move the chord right in the bar or move selected
    // note to the first chord of the next bar
    if (chordId !== this._barElement.chordElements.length - 1) {
      this._chordElement = this._barElement.chordElements[chordId + 1];
      // 'strNum - 1' because 'strNum' starts from 1
      this._noteElement = this._chordElement.noteElements[strNum - 1];
    } else {
      const barId = this._tabLineElement.barElements.indexOf(this._barElement);
      const tabLineId = this._tabWindow.tabLineElements.indexOf(
        this._tabLineElement
      );

      // Move to the first chord of the next bar on the same line or
      // move to that first chord of the first bar of the next tab line
      if (barId !== this._tabLineElement.barElements.length - 1) {
        this._barElement = this._tabLineElement.barElements[barId + 1];
        this._chordElement = this._barElement.chordElements[0];
        // 'strNum - 1' because 'strNum' starts from 1
        this._noteElement = this._chordElement.noteElements[strNum - 1];
      } else {
        // Insert new bar (and new tab line if needed) if can't move right
        if (tabLineId === this._tabWindow.tabLineElements.length - 1) {
          const newBar = new Bar(
            this._tabWindow.tab.guitar,
            this._barElement.bar.tempo,
            this._barElement.bar.beats,
            this._barElement.bar.duration,
            this._barElement.bar.chords
          );
          const tabLinesCount = this._tabWindow.tabLineElements.length;
          this._tabWindow.insertBar(newBar);

          if (this._tabWindow.tabLineElements.length === tabLinesCount + 1) {
            this._tabLineElement =
              this._tabWindow.tabLineElements[
                this._tabWindow.tabLineElements.length - 1
              ];
            this._barElement = this._tabLineElement.barElements[0];
            this._chordElement = this._barElement.chordElements[0];
            this._noteElement = this._chordElement.noteElements[strNum - 1];
          } else {
            this._barElement =
              this._tabLineElement.barElements[
                this._tabLineElement.barElements.length - 1
              ];
            this._chordElement = this._barElement.chordElements[0];
            this._noteElement = this._chordElement.noteElements[strNum - 1];
          }
        } else {
          const nextTabLine = this._tabWindow.tabLineElements[tabLineId + 1];
          const nextTabLineFirstBar = nextTabLine.barElements[0];
          const nextTabLineFirstChord = nextTabLineFirstBar.chordElements[0];

          this._tabLineElement = nextTabLine;
          this._barElement = nextTabLineFirstBar;
          this._chordElement = nextTabLineFirstChord;
          this._noteElement = nextTabLineFirstChord.noteElements[strNum - 1];
        }
      }
    }
  }

  /**
   * Selected note element
   */
  public get noteElement(): NoteElement {
    return this._noteElement;
  }
  /**
   * Selected chord element
   */
  public get chordElement(): ChordElement {
    return this._chordElement;
  }
  /**
   * Selected bar element
   */
  public get barElement(): BarElement {
    return this._barElement;
  }
  /**
   * Selected tab line element
   */
  public get tabLineElement(): TabLineElement {
    return this._tabLineElement;
  }
  /**
   * Selected tab window element
   */
  public get tabWindow(): TabWindow {
    return this._tabWindow;
  }
}
