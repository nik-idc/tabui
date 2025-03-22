import { NoteElement } from "./note-element";
import { BeatElement } from "./beat-element";
import { BarElement } from "./bar-element";
import { TabWindow } from "../tab-window";
import { Bar } from "../../models/bar";
import { Point } from "../shapes/point";
import { Beat } from "../../models/beat";
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
  AddedBeat,
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
   * @param _beatId Beat id (beat element id at the same time)
   * @param _stringNum String number
   */
  constructor(
    private _tab: Tab,
    private _barId: number = 0,
    private _beatId: number = 0,
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
    // If not first bar beat
    if (this._beatId !== 0) {
      this._beatId--;
      return;
    }

    // Do nothing if last bar and last beat
    if (this._barId === 0) {
      return;
    }

    // Move to the left bar
    this._barId--;
    this._beatId = this.bar.beats.length - 1;
  }

  /**
   * Move selected note right (or to the first note of the next bar)
   * @returns A move right result
   */
  public moveRight(): MoveRightOutput {
    // Check if can add beats to the bar
    if (
      this._beatId === this.bar.beats.length - 1 &&
      !this.bar.durationsFit &&
      this.bar.actualDuration() < this.bar.beatsCount * this.bar.duration
    ) {
      // If the current beat is not the last one of the bar AND
      // If durations don't fit AND
      // If currently actual bar duration is less than the correct one
      // append a new beat and select it
      // !!
      // -- commented this because tab manipulations will be done
      // -- outside of this class
      // this.bar.appendBeat();
      // !!
      this._beatId++;

      // Recalc tab window
      // this._tabWindow.calc();
      return { result: MoveRightResult.AddedBeat };
    }

    if (this._beatId !== this.bar.beats.length - 1) {
      // Can't add more beats but can move to the next beat
      this._beatId++;

      // return false;
      return { result: MoveRightResult.Nothing };
    }

    // Can't move to next beat OR add more beats, move to the next bar
    if (this._barId !== this._tab.bars.length - 1) {
      this._barId++;
      this._beatId = 0;

      // return false;
      return { result: MoveRightResult.Nothing };
    }

    // If current bar is the last one of the tab
    const newBar = new Bar(
      this._tab.guitar,
      this.bar.tempo,
      this.bar.beatsCount,
      this.bar.duration,
      [new Beat(this._tab.guitar, this.beat.duration)]
    );
    // !!
    // -- commented this because tab manipulations will be done
    // -- outside of this class
    // this._tab.bars.push(newBar);
    // !!
    this._barId++;
    this._beatId = 0;

    // Recalc tab window
    // this._tabWindow.calc();
    // return true;
    return { result: MoveRightResult.AddedBar, addedBar: newBar };
  }

  /**
   * Selected note
   */
  public get note(): GuitarNote {
    return this._tab.bars[this._barId].beats[this._beatId].notes[
      this._stringNum - 1
    ];
  }

  /**
   * Selected beat
   */
  public get beat(): Beat {
    return this._tab.bars[this._barId].beats[this._beatId];
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
   * Selected beat id
   */
  public get beatId(): number {
    return this._beatId;
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
  //  * Selected beat element
  //  */
  // public get beatElementId(): number {
  //   return this._beatId;
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
  //   return this.beatElement.noteElements[this.noteElementId];
  // }

  // /**
  //  * Selected beat element
  //  */
  // public get beatElement(): BeatElement {
  //   return this.barElement.beatElements[this.beatElementId];
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
