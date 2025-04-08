import { Bar } from "../../models/bar";
import { Tab } from "../../models/tab";
import { Point } from "../shapes/point";
import { Rect } from "../shapes/rect";
import { TabWindowDim } from "../tab-window-dim";
import { BarElement } from "./bar-element";
import { BeatElement } from "./beat-element";
import { NoteElement } from "./note-element";
import {
  MoveRightOutput,
  MoveRightResult,
  SelectedElement,
} from "./selected-element";
import { TabLineElement } from "./tab-line-element";

/**
 * Tab window specific selected element ids
 */
export type SelectedElementsAndIds = {
  /**
   * Id of the tab line element
   */
  tabLineElementId: number;
  /**
   * If of the bar element (within the tab line element)
   */
  barElementId: number;
  /**
   * Id of the beat element, same as beat id, in here just
   * for consistency's sake
   */
  beatElementId: number;
  /**
   * String number
   */
  stringNum: number;
  /**
   * Id of the tab line element
   */
  tabLineElement: TabLineElement | undefined;
  /**
   * If of the bar element (within the tab line element)
   */
  barElement: BarElement | undefined;
  /**
   * Id of the beat element, same as beat id, in here just
   * for consistency's sake
   */
  beatElement: BeatElement | undefined;
  /**
   * String number
   */
  noteElement: NoteElement | undefined;
};

export class TabElement {
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
  private _tabLineElements: TabLineElement[] = [];
  private _selectionRects: Rect[];

  constructor(tab: Tab, dim: TabWindowDim) {
    this._tab = tab;
    this.dim = dim;

    this.calc();
  }

  private addBar(bar: Bar, prevBar: Bar): void {
    const lastTabLine = this._tabLineElements[this._tabLineElements.length - 1];
    const addRes = lastTabLine.addBar(bar, prevBar);

    if (!addRes) {
      const newTabLine = new TabLineElement(
        this._tab,
        this.dim,
        lastTabLine.rect.leftBottom
      );
      this._tabLineElements.push(newTabLine);
      newTabLine.addBar(bar, prevBar);
    }
  }

  /**
   * Calc tab window. Goes through every bar of a tab and calculates
   * the resulting window with multiple bar lines
   */
  public calc(): void {
    this._selectionRects = [];

    this._tabLineElements = [
      new TabLineElement(this._tab, this.dim, new Point(0, 0)),
    ];
    for (let barIndex = 0; barIndex < this._tab.bars.length; barIndex++) {
      this.addBar(this._tab.bars[barIndex], this._tab.bars[barIndex - 1]);
    }
  }

  /**
   * Handles added beat after moving right
   */
  public handleAddedBeat(selectedElement: SelectedElement): void {
    const { tabLineElementId, barElementId } =
      this.getSelectedNoteElementsAndIds(selectedElement);
    const tabLineElement = this._tabLineElements[tabLineElementId];
    const barElement = tabLineElement.barElements[barElementId];

    // Check if the bar element fits after appending new beat
    if (tabLineElementId === this._tabLineElements.length - 1) {
      // If at the last then simply remove bar element from current line,
      // create and add new tab line and push the bar element there
      tabLineElement.removeBarElement(barElementId);
      // Append empty beat
      barElement.appendBeat();
      // tabLineElement.barElements.splice(barElementId, 1);

      const barId = selectedElement.barId;
      const bar = this._tab.bars[barId];
      const prevBar = this._tab.bars[barId - 1];
      this.addBar(bar, prevBar);
    } else {
      // Otherwise just redraw the whole thing since might need to
      // recalc every tab line below the current one anyway
      barElement.appendBeat();
      this.calc();
    }
  }

  /**
   * Handles added bar after moving right
   * @param addedBar Added bar
   */
  public handleAddedBar(addedBar: Bar): void {
    // Add bar
    this._tab.bars.push(addedBar);

    // Compute UI
    const bar = this._tab.bars[this._tab.bars.length - 1];
    const prevBar = this._tab.bars[this._tab.bars.length - 2];
    this.addBar(bar, prevBar);
  }

  public handleMoveRight(
    moveRightOutput: MoveRightOutput,
    selectedElement: SelectedElement
  ): void {
    switch (moveRightOutput.result) {
      case MoveRightResult.Nothing:
        break;
      case MoveRightResult.AddedBeat:
        this.handleAddedBeat(selectedElement);
        break;
      case MoveRightResult.AddedBar:
        this.handleAddedBar(moveRightOutput.addedBar);
        break;
      default:
        throw Error("Unexpected outcome after moving note right");
    }
  }

  public getSelectedNoteElementsAndIds(
    selectedElement: SelectedElement
  ): SelectedElementsAndIds {
    let tabLineElement: TabLineElement;
    let barElement: BarElement;
    let tabLineElementId: number;
    let barElementId: number;
    this._tabLineElements.some((tle, tleIndex) => {
      return tle.barElements.some((be, beIndex) => {
        tabLineElement = tle;
        tabLineElementId = tleIndex;
        barElement = be;
        barElementId = beIndex;
        return be.bar.uuid === selectedElement.bar.uuid;
      });
    });

    const beatElement = barElement.beatElements[selectedElement.beatId];
    const noteElement =
      beatElement !== undefined
        ? beatElement.beatNotesElement.noteElements[
            selectedElement.stringNum - 1
          ]
        : undefined;
    return {
      tabLineElementId: tabLineElementId,
      barElementId: barElementId,
      beatElementId: selectedElement.beatId,
      stringNum: selectedElement.stringNum,
      tabLineElement: tabLineElement,
      barElement: barElement,
      beatElement: beatElement,
      noteElement: noteElement,
    };
  }

  public resetSelection(): void {
    for (const tabLineElement of this._tabLineElements) {
      for (const barElement of tabLineElement.barElements) {
        for (const beatElement of barElement.beatElements) {
          beatElement.selected = false;
        }
      }
    }
  }

  public recalcBeatElementSelection(selectionUUIDs: number[]): void {
    for (const tabLineElement of this._tabLineElements) {
      for (const barElement of tabLineElement.barElements) {
        for (const beatElement of barElement.beatElements) {
          beatElement.selected = selectionUUIDs.includes(beatElement.beat.uuid);
        }
      }
    }
  }

  public get tabLineElements(): TabLineElement[] {
    return this._tabLineElements;
  }

  public get selectionRects(): Rect[] {
    return this._selectionRects;
  }
}
