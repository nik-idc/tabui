import { NoteElement } from "./note-element";
import { ChordElement } from "./chord-element";
import { BarElement } from "./bar-element";
import { TabWindow } from "../tab-window";
import { Bar } from "../../models/bar";
import { Point } from "../shapes/point";
import { Chord } from "../../models/chord";
import { Note } from "../../models/note";
import { GuitarNote } from "../../models/guitar-note";
import { Tab } from "../../models/tab";
import { TabLineElement } from "./tab-line-element";

/**
 * Tests if a specified element is a 'SelectedElement' instance
 * @param element Element
 * @returns True if is an instance, false otherwise
 */
export function isSelectedElement(
  element: SelectedElement | any
): element is SelectedElement {
  return (element as SelectedElement).stringNum !== undefined;
}

/**
 * Types of outcomes for moving a note right
 */
export enum MoveRightResult {
  Nothing,
  AddedChord,
  AddedBar,
}

/**
 * Move right output type
 */
export type MoveRightOutput = {
  result: MoveRightResult;
  addedBar?: Bar;
};

/**
 * Class that contains all necessary information
 * about a selected element
 */
export class SelectedElement {
  /**
   * Class that contains all necessary information
   * about a selected element
   * @param _tab Tab
   * @param _barId Bar id
   * @param _chordId Chord id (chord element id at the same time)
   * @param _stringNum String number
   */
  constructor(
    private _tab: Tab,
    private _barId: number = 0,
    private _chordId: number = 0,
    private _stringNum: number = 1
  ) {}

  /**
   * Move selected note up (or to the last string if current is the first)
   */
  public moveUp(): void {
    const stringsCount = this._tab.guitar.stringsCount;
    const newstringNum =
      this._stringNum === 1 ? stringsCount : this._stringNum - 1;

    this._stringNum = newstringNum;
  }

  /**
   * Move selected note down (or to the first string if current is the last)
   */
  public moveDown(): void {
    const stringsCount = this._tab.guitar.stringsCount;
    const newstringNum =
      this._stringNum === stringsCount ? 1 : this._stringNum + 1;

    this._stringNum = newstringNum;
  }

  /**
   * Move selected note left (or to the last note of the previous bar)
   */
  public moveLeft(): void {
    // If not first bar chord
    if (this._chordId !== 0) {
      this._chordId--;
      return;
    }

    // Do nothing if last bar and last chord
    if (this._barId === 0) {
      return;
    }

    // Move to the left bar
    this._barId--;
    this._chordId = this.bar.chords.length - 1;
  }

  /**
   * Move selected note right (or to the first note of the next bar)
   * @returns A move right result
   */
  public moveRight(): MoveRightOutput {
    // Check if can add chords to the bar
    if (
      this._chordId === this.bar.chords.length - 1 &&
      !this.bar.durationsFit &&
      this.bar.actualDuration() < this.bar.beats * this.bar.duration
    ) {
      // If the current chord is not the last one of the bar AND
      // If durations don't fit AND
      // If currently actual bar duration is less than the correct one
      // append a new chord and select it
      // !!
      // -- commented this because tab manipulations will be done
      // -- outside of this class
      // this.bar.appendChord();
      // !!
      this._chordId++;

      // Recalc tab window
      // this._tabWindow.calc();
      return { result: MoveRightResult.AddedChord };
    }

    if (this._chordId !== this.bar.chords.length - 1) {
      // Can't add more chords but can move to the next chord
      this._chordId++;

      // return false;
      return { result: MoveRightResult.Nothing };
    }

    // Can't move to next chord OR add more chords, move to the next bar
    if (this._barId !== this._tab.bars.length - 1) {
      this._barId++;
      this._chordId = 0;

      // return false;
      return { result: MoveRightResult.Nothing };
    }

    // If current bar is the last one of the tab
    const newBar = new Bar(
      this._tab.guitar,
      this.bar.tempo,
      this.bar.beats,
      this.bar.duration,
      [new Chord(this._tab.guitar, this.chord.duration)]
    );
    // !!
    // -- commented this because tab manipulations will be done
    // -- outside of this class
    // this._tab.bars.push(newBar);
    // !!
    this._barId++;
    this._chordId = 0;

    // Recalc tab window
    // this._tabWindow.calc();
    // return true;
    return { result: MoveRightResult.AddedBar, addedBar: newBar };
  }

  /**
   * Selected note
   */
  public get note(): GuitarNote {
    return this._tab.bars[this._barId].chords[this._chordId].notes[
      this._stringNum - 1
    ];
  }

  /**
   * Selected chord
   */
  public get chord(): Chord {
    return this._tab.bars[this._barId].chords[this._chordId];
  }

  /**
   * Selected bar
   */
  public get bar(): Bar {
    return this._tab.bars[this._barId];
  }

  /**
   * Selected tab
   */
  public get tab(): Tab {
    return this._tab;
  }

  /**
   * Selected note's string number
   */
  public get stringNum(): number {
    return this._stringNum;
  }

  /**
   * Selected chord id
   */
  public get chordId(): number {
    return this._chordId;
  }

  /**
   * Selected bar id
   */
  public get barId(): number {
    return this._barId;
  }

  // /**
  //  * Selected note element
  //  */
  // public get noteElementId(): number {
  //   return this._stringNum - 1;
  // }

  // /**
  //  * Selected chord element
  //  */
  // public get chordElementId(): number {
  //   return this._chordId;
  // }

  // /**
  //  * Selected bar element id (sequential)
  //  */
  // public get barElementSeqId(): number {
  //   return this._barId;
  // }

  // /**
  //  * Selected bar element id (in the tab line)
  //  */
  // public get barElementId(): number {
  //   const barElement = this._tabWindow.barElementsSeq[this._barId];
  //   return this._tabWindow.tabLineElements[
  //     this.tabLineElementId
  //   ].barElements.indexOf(barElement);
  // }

  // /**
  //  * Selected tab line element
  //  */
  // public get tabLineElementId(): number {
  //   const a = this._tabWindow.
  //   return Math.floor(
  //     this._tabWindow.tabLineElements[this._].rect.y /
  //       this._tabWindow.dim.tabLineHeight
  //   );
  // }

  // /**
  //  * Selected note element
  //  */
  // public get noteElement(): NoteElement {
  //   return this.chordElement.noteElements[this.noteElementId];
  // }

  // /**
  //  * Selected chord element
  //  */
  // public get chordElement(): ChordElement {
  //   return this.barElement.chordElements[this.chordElementId];
  // }

  // /**
  //  * Selected bar element
  //  */
  // public get barElement(): BarElement {
  //   return this._tabWindow.barElementsSeq[this._barId];
  // }

  // /**
  //  * Selected bar elements line
  //  */
  // public get tabLineElements(): TabLineElement {
  //   return this._tabWindow.tabLineElements[this.tabLineElementId];
  // }

  // /**
  //  * Selected tab window element
  //  */
  // public get tabWindow(): TabWindow {
  //   return this._tabWindow;
  // }
}
