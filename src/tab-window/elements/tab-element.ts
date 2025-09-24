import { Bar } from "../../models/bar";
import { Beat } from "../../models/beat";
import { GuitarNote } from "../../models/guitar-note";
import { Score } from "../../models/score";
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
import { randomInt } from "../../misc/random-int";

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
  tabLineElement: TabLineElement;
  /**
   * If of the bar element (within the tab line element)
   */
  barElement: BarElement;
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
  readonly uuid: number;
  private _score: Score;
  /**
   * Tab object to get data from
   */
  private _tabIndex: number;
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

  constructor(score: Score, tabIndex: number, dim: TabWindowDim) {
    this.uuid = randomInt();
    this._score = score;
    this._tabIndex = tabIndex;
    this._tab = this._score.tracks[this._tabIndex];
    this.dim = dim;
    this._selectionRects = [];

    this.calc();
  }

  private addBar(bar: Bar, prevBar: Bar): void {
    const lastTabLine = this._tabLineElements[this._tabLineElements.length - 1];
    const barElement = BarElement.createBarElement(
      this.dim,
      bar,
      prevBar,
      lastTabLine.rect.rightTop.x,
      lastTabLine.effectLabelsRect.height
    );
    const addRes = lastTabLine.addBar(bar, barElement, prevBar);

    if (!addRes) {
      const newTabLine = new TabLineElement(
        this._tab,
        this.dim,
        lastTabLine.rect.leftBottom
      );
      this._tabLineElements.push(newTabLine);
      barElement.update(prevBar, 0);
      newTabLine.addBar(bar, barElement, prevBar);
    }
  }

  /**
   * Calc tab window. Goes through every bar of a tab and calculates
   * the resulting window with multiple bar lines
   */
  public calc(): void {
    this._selectionRects = [];

    const oldBarElements = this._tabLineElements.flatMap(
      (line) => line.barElements
    );

    const oldLines = this._tabLineElements;
    this._tabLineElements = [];

    let currentLine =
      oldLines.shift() ||
      new TabLineElement(this._tab, this.dim, new Point(0, 0));
    currentLine.barElements = [];
    currentLine.rect.set(0, 0, 0, this.dim.tabLineMinHeight);
    currentLine.effectLabelsRect.setDimensions(0, 0);
    this._tabLineElements.push(currentLine);

    for (let barIndex = 0; barIndex < this._tab.bars.length; barIndex++) {
      const bar = this._tab.bars[barIndex];
      const prevBar = this._tab.bars[barIndex - 1];

      const oldElementIndex = oldBarElements.findIndex(
        (e) => e.bar.uuid === bar.uuid
      );
      let barElement: BarElement;

      if (oldElementIndex > -1) {
        barElement = oldBarElements.splice(oldElementIndex, 1)[0];
      } else {
        barElement = BarElement.createBarElement(this.dim, bar, prevBar, 0, 0);
      }
      barElement.update(prevBar, currentLine.rect.rightTop.x);

      if (!currentLine.barElementFits(barElement)) {
        barElement.update(prevBar, 0);

        currentLine.justifyElements();
        currentLine.calcEffectGap();

        const prevLine = currentLine;
        currentLine =
          oldLines.shift() ||
          new TabLineElement(this._tab, this.dim, new Point(0, 0));
        currentLine.barElements = [];
        currentLine.rect.set(
          0,
          prevLine.rect.bottom,
          0,
          this.dim.tabLineMinHeight + prevLine.effectLabelsRect.height
        );
        currentLine.effectLabelsRect.setDimensions(0, 0);
        this._tabLineElements.push(currentLine);
      }

      currentLine.addBar(bar, barElement, prevBar);
    }

    currentLine.calcEffectGap();
  }

  /**
   * Handles added beat after moving right
   */
  private handleAddedBeat(selectedElement: SelectedElement): void {
    const { tabLineElementId, barElementId } =
      this.getSelectedNoteElementsAndIds(selectedElement);
    const tabLineElement = this._tabLineElements[tabLineElementId];
    const barElement = tabLineElement.barElements[barElementId];

    barElement.bar.appendBeat();
    // barElement.appendBeat();
    this.calc();
  }

  /**
   * Handles added bar after moving right
   * @param addedBar Added bar
   */
  private handleAddedBar(addedBar: Bar): void {
    // Add bar
    // this._tab.bars.push(addedBar);
    this._score.appendBar(this._tabIndex, addedBar);

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
    let tabLineElement: TabLineElement | undefined;
    let barElement: BarElement | undefined;
    let tabLineElementId: number = -1;
    let barElementId: number = -1;
    this._tabLineElements.some((tle, tleIndex) => {
      return tle.barElements.some((be, beIndex) => {
        tabLineElement = tle;
        tabLineElementId = tleIndex;
        barElement = be;
        barElementId = beIndex;
        return be.bar.uuid === selectedElement.bar.uuid;
      });
    });

    if (tabLineElement === undefined || barElement === undefined) {
      throw Error("Could not find elements");
    }

    const beatElement = barElement.beatElements[selectedElement.beatId];
    const noteElement =
      beatElement === undefined
        ? undefined
        : beatElement.beatNotesElement.noteElements[
            selectedElement.stringNum - 1
          ];

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

  public recalcBeatElementSelection(selectionBeats: Beat[]): void {
    for (const tabLineElement of this._tabLineElements) {
      for (const barElement of tabLineElement.barElements) {
        for (const beatElement of barElement.beatElements) {
          beatElement.selected = selectionBeats.some((beat) => {
            return beat.uuid === beatElement.beat.uuid;
          });
        }
      }
    }
  }

  public resetTab(newTab: Tab): void {
    this._tab = newTab;
    this.calc();
  }

  public findCorrespondingBarElement(bar: Bar): BarElement | undefined {
    for (const tabLineElement of this._tabLineElements) {
      for (const barElement of tabLineElement.barElements) {
        if (barElement.bar.uuid === bar.uuid) {
          return barElement;
        }
      }
    }

    return undefined;
  }

  public findCorrespondingBeatElement(beat: Beat): BeatElement | undefined {
    for (const tabLineElement of this._tabLineElements) {
      for (const barElement of tabLineElement.barElements) {
        for (const beatElement of barElement.beatElements) {
          if (beatElement.beat.uuid === beat.uuid) {
            return beatElement;
          }
        }
      }
    }

    return undefined;
  }

  public findCorrespondingNoteElement(
    note: GuitarNote
  ): NoteElement | undefined {
    for (const tabLineElement of this._tabLineElements) {
      for (const barElement of tabLineElement.barElements) {
        for (const beatElement of barElement.beatElements) {
          for (const noteElement of beatElement.beatNotesElement.noteElements)
            if (noteElement.note.uuid === note.uuid) {
              return noteElement;
            }
        }
      }
    }

    return undefined;
  }

  public getBeatElementByUUID(beatUUID: number): BeatElement | undefined {
    for (const tabLineElement of this._tabLineElements) {
      for (const barElement of tabLineElement.barElements) {
        for (const beatElement of barElement.beatElements) {
          if (beatElement.beat.uuid === beatUUID) {
            return beatElement;
          }
        }
      }
    }

    return undefined;
  }

  public getBeatElementGlobalCoords(neededBeatElement: BeatElement): Point {
    let foundTabLineElement: TabLineElement | undefined;
    let foundBarElement: BarElement | undefined;
    for (const tabLineElement of this._tabLineElements) {
      for (const barElement of tabLineElement.barElements) {
        for (const beatElement of barElement.beatElements) {
          if (beatElement.beat.uuid === neededBeatElement.beat.uuid) {
            foundTabLineElement = tabLineElement;
            foundBarElement = barElement;
            break;
          }
        }
      }
    }

    if (foundTabLineElement === undefined || foundBarElement === undefined) {
      throw Error(
        "Could not find beat element's tab line element or bar element"
      );
    }

    const tleOffset = new Point(0, foundTabLineElement.rect.y);
    const barOffset = new Point(foundBarElement.rect.x, tleOffset.y);

    return new Point(
      barOffset.x + neededBeatElement.rect.x,
      barOffset.y + neededBeatElement.rect.y
    );
  }

  public get tabLineElements(): TabLineElement[] {
    return this._tabLineElements;
  }

  public get selectionRects(): Rect[] {
    return this._selectionRects;
  }
}
