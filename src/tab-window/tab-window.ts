import { Tab } from "./../models/tab";
import { TabWindowDim } from "./tab-window-dim";
import { NoteElement } from "./elements/note-element";
import { BarElement } from "./elements/bar-element";
import { Point } from "./shapes/point";
import { Bar } from "./../models/bar";
import { NoteDuration } from "./../models/note-duration";
import { BeatElement } from "./elements/beat-element";
import {
  MoveRightResult,
  SelectedElement,
  isSelectedElement,
} from "./elements/selected-element";
import { Beat } from "../models/beat";
import { SelectionElement } from "./elements/selection-element";
import { Rect } from "./shapes/rect";
import { TabLineElement } from "./elements/tab-line-element";
import { GuitarEffect } from "../../src/models/guitar-effect/guitar-effect";
import { GuitarEffectOptions } from "../../src/models/guitar-effect/guitar-effect-options";
import { GuitarEffectType } from "../../src/models/guitar-effect/guitar-effect-type";
import { tabEvent, TabEventArgs, TabEventType } from "../events/tab-event";

/**
 * Tab window specific selected element ids
 */
export type SelectedElementWindowIds = {
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
};

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
   * Tab line elements
   */
  private _tabLineElements: TabLineElement[] = [];
  /**
   * Selected note element
   */
  private _selectedElement: SelectedElement | undefined;
  /**
   * Selection elements before selection was cleared
   */
  private _lastSelectionElements: SelectionElement[];
  /**
   * Copied data
   */
  private _copiedData: SelectedElement | SelectionElement[];
  /**
   * Selection elements
   */
  private _selectionElements: SelectionElement[] = [];
  /**
   * Selection rectangles
   */
  private _selectionRects: (Rect | undefined)[] = [];
  /**
   * Base element of selection
   */
  private _baseSelectionElement?: SelectionElement;

  /**
   * Class that handles creating a tab window
   * @param tab Tab object
   * @param dim Tab window dimensions
   */
  constructor(tab: Tab, dim: TabWindowDim) {
    this._tab = tab;
    this.dim = dim;

    tabEvent.on(TabEventType.LineMovementTriggered, (args) => {
      this.onEffectLabelAdded(args);
    });

    this.calc();
  }

  private addBar(bar: Bar, prevBar: Bar): void {
    const lastTabLine = this._tabLineElements[this._tabLineElements.length - 1];
    const addRes = lastTabLine.addBar(bar, prevBar);

    if (!addRes) {
      const newTabLine = new TabLineElement(
        this.tab,
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
    this._tabLineElements = [
      new TabLineElement(this.tab, this.dim, new Point(0, 0)),
    ];
    for (let barIndex = 0; barIndex < this._tab.bars.length; barIndex++) {
      this.addBar(this._tab.bars[barIndex], this._tab.bars[barIndex - 1]);

      // const addedRes = curTabLine.addBar(
      //   this._tab.bars[barIndex],
      //   this._tab.bars[barIndex - 1]
      // );

      // if (addedRes) {
      //   this._tabLineElements.push(
      //     new TabLineElement(this.dim, curTabLine.rect.leftBottom)
      //   );
      //   curTabLine = this._tabLineElements[this._tabLineElements.length - 1];
      // }
    }
  }

  /**
   * Select new note element
   * @param tabLineElementId Id of the bar elements line containing the beat element
   * @param barElementId Id of the bar element containing the beat element
   * @param beatElementId Id of the beat element containing the note element
   * @param noteElementId Id of the note element
   */
  public selectNoteElement(
    tabLineElementId: number,
    barElementId: number,
    beatElementId: number,
    noteElementId: number
  ): void {
    this.clearSelection();

    // Get current note element's info
    const tabLineElement = this._tabLineElements[tabLineElementId];
    const barElement = tabLineElement.barElements[barElementId];
    const beatElement = barElement.beatElements[beatElementId];
    const noteElement = beatElement.noteElements[noteElementId];

    const barId = this._tab.bars.indexOf(barElement.bar);
    const beatId = this._tab.bars[barId].beats.indexOf(beatElement.beat);
    const stringNum = noteElement.note.stringNum;

    // Select
    this._selectedElement = new SelectedElement(
      this._tab,
      barId,
      beatId,
      stringNum
    );
  }

  /**
   * Adds beat to selection & update selection rects
   * @param tabLineElementId Bar elements line id
   * @param barElementId Bar element id
   * @param beatElementId Beat element id
   * @param beatElementSeqId Sequential beat element id
   */
  private addBeatToSelection(
    tabLineElementId: number,
    barElementId: number,
    beatElementId: number,
    beatElementSeqId: number
  ): void {
    const newSelectionElement = new SelectionElement(
      tabLineElementId,
      barElementId,
      beatElementId,
      beatElementSeqId
    );

    if (
      this._selectionElements.length === 0 &&
      this._baseSelectionElement === undefined
    ) {
      this._baseSelectionElement = newSelectionElement;
    }

    this._selectionElements.push(newSelectionElement);

    const tabLineElement = this._tabLineElements[tabLineElementId];
    const barElement = tabLineElement.barElements[barElementId];
    const beatElement = barElement.beatElements[beatElementId];

    if (this._selectionRects[tabLineElementId] === undefined) {
      this._selectionRects[tabLineElementId] = new Rect(
        beatElement === barElement.beatElements[0]
          ? barElement.rect.x
          : beatElement.rect.x,
        beatElement.rect.y,
        beatElement.rect.width,
        beatElement.rect.height
      );
    } else {
      this._selectionRects[tabLineElementId].width =
        beatElement.rect.rightTop.x - this._selectionRects[tabLineElementId].x;
    }
  }

  /**
   * Selects beats in between the two specified beats (including them)
   * @param startTabLineElementId Bar line id of the starting beat
   * @param startBarElementId Bar element id of the starting beat
   * @param startBeatElementId Beat element id of the starting beat
   * @param endTabLineElementId Bar line id of the end beat
   * @param endBarElementId Bar element id of the end beat
   * @param endBeatElementId Beat element id of the end beat
   */
  private selectBeatsInBetween(
    startTabLineElementId: number,
    startBarElementId: number,
    startBeatElementId: number,
    endTabLineElementId: number,
    endBarElementId: number,
    endBeatElementId: number
  ): void {
    const beatsSeq = this._tab.getBeatsSeq();

    const startBeatElementSeqId = beatsSeq.indexOf(
      this._tabLineElements[startTabLineElementId].barElements[
        startBarElementId
      ].beatElements[startBeatElementId].beat
    );
    const endBeatElementSeqId = beatsSeq.indexOf(
      this._tabLineElements[endTabLineElementId].barElements[endBarElementId]
        .beatElements[endBeatElementId].beat
    );
    let seqIndex = beatsSeq.indexOf(
      this._tabLineElements[startTabLineElementId].barElements[0]
        .beatElements[0].beat
    );

    for (let i = startTabLineElementId; i <= endTabLineElementId; i++) {
      const barsCount = this._tabLineElements[i].barElements.length;
      for (let j = 0; j < barsCount; j++) {
        const beatsCount =
          this._tabLineElements[i].barElements[j].beatElements.length;
        for (let k = 0; k < beatsCount; k++) {
          if (
            seqIndex >= startBeatElementSeqId &&
            seqIndex <= endBeatElementSeqId
          ) {
            this.addBeatToSelection(i, j, k, seqIndex);
          }
          seqIndex++;
        }
      }
    }
  }

  /**
   * Selects specified beat and all the beats between it and base selection element
   * @param tabLineElementId Id of the line of bar elements
   * @param barElementId Bar element id
   * @param beatElementId Beat element id
   * @returns
   */
  public selectBeat(
    tabLineElementId: number,
    barElementId: number,
    beatElementId: number
  ): void {
    if (this._selectedElement) {
      this._selectedElement = undefined;
    }

    const beatElement =
      this._tabLineElements[tabLineElementId].barElements[barElementId]
        .beatElements[beatElementId];
    const beatSeqId = this._tab.getBeatsSeq().indexOf(beatElement.beat);
    // const beatElementSeqId = this._beatElementsSeq.indexOf(beatElement);

    let startTabLineElementId: number;
    let startBarElementId: number;
    let startBeatElementId: number;
    let endTabLineElementId: number;
    let endBarElementId: number;
    let endBeatElementId: number;

    if (
      this._baseSelectionElement === undefined ||
      beatSeqId === this._baseSelectionElement.beatElementSeqId
    ) {
      startTabLineElementId = tabLineElementId;
      startBarElementId = barElementId;
      startBeatElementId = beatElementId;
      endTabLineElementId = tabLineElementId;
      endBarElementId = barElementId;
      endBeatElementId = beatElementId;
    } else if (beatSeqId > this._baseSelectionElement.beatElementSeqId) {
      startTabLineElementId = this._baseSelectionElement.tabLineElementId;
      startBarElementId = this._baseSelectionElement.barElementId;
      startBeatElementId = this._baseSelectionElement.beatElementId;
      endTabLineElementId = tabLineElementId;
      endBarElementId = barElementId;
      endBeatElementId = beatElementId;
    } else {
      startTabLineElementId = tabLineElementId;
      startBarElementId = barElementId;
      startBeatElementId = beatElementId;
      endTabLineElementId = this._baseSelectionElement.tabLineElementId;
      endBarElementId = this._baseSelectionElement.barElementId;
      endBeatElementId = this._baseSelectionElement.beatElementId;
    }

    // Clear selection rects
    this._selectionElements = [];
    for (let i = 0; i < this._selectionRects.length; i++) {
      this._selectionRects[i] = undefined;
    }

    // Select all beats in new selection
    this.selectBeatsInBetween(
      startTabLineElementId,
      startBarElementId,
      startBeatElementId,
      endTabLineElementId,
      endBarElementId,
      endBeatElementId
    );
  }

  /**
   * Clears all selection
   */
  public clearSelection(): void {
    this._baseSelectionElement = undefined;
    this._selectionElements = [];
    for (let i = 0; i < this._selectionRects.length; i++) {
      this._selectionRects[i] = undefined;
    }
  }

  /**
   * Copy selected note/beats (depending on which is currently selected)
   */
  public copy(): void {
    this._copiedData = this._selectedElement
      ? new SelectedElement(
          this._tab,
          this._selectedElement.barId,
          this._selectedElement.beatId,
          this._selectedElement.stringNum
        )
      : this._selectionElements;
  }

  private insertBeats(): void {
    if (isSelectedElement(this._copiedData)) {
      return;
    }

    // Insert selection beats after specified beat
    const beatSeqId = this._tab.getBeatsSeq();
    const beats = this._copiedData.map((se) => {
      return beatSeqId[se.beatElementSeqId].deepCopy();
    });
    this._selectedElement.bar.insertBeats(this._selectedElement.beatId, beats);

    // Recalc
    // this.clearSelection();
    this.calc();
  }

  private replaceBeats(): void {
    if (isSelectedElement(this._copiedData)) {
      return;
    }

    const beatSeqId = this._tab.getBeatsSeq();
    const oldBeats = this._selectionElements.map((se) => {
      return beatSeqId[se.beatElementSeqId];
    });
    const copiedBeats = this._copiedData.map((se) => {
      return beatSeqId[se.beatElementSeqId];
    });
    this._tab.replaceBeats(oldBeats, copiedBeats);

    this.clearSelection();
    this.calc();
  }

  /**
   * Paste copied data:
   * Paste beats after selected note if selected beats OR
   * Paste note, i.e., change fret value of selected note to that of selected
   * @returns
   */
  public paste(): void {
    if (!isSelectedElement(this._copiedData)) {
      // Return if nothing to paste
      if (this._copiedData.length === 0) {
        return;
      }

      if (this._selectionElements.length === 0) {
        this.insertBeats();
      } else {
        this.replaceBeats();
      }
    } else {
      this._selectedElement.note.fret = this._copiedData.note.fret;
    }
  }

  /**
   * Delete every selected beat
   * @param beats
   */
  public deleteBeats(): void {
    // PROBLEM: Removing beats individually by id leads to issues
    // SOLUTION #1: Use beats uuid instead

    const beats = this._selectionElements.map((se) => {
      const tabLineElement = this._tabLineElements[se.tabLineElementId];
      const barElement = tabLineElement.barElements[se.barElementId];
      const beatElement = barElement.beatElements[se.beatElementId];
      return beatElement.beat;
    });

    this._tab.removeBeats(beats);

    // for (const se of this._selectionElements) {
    //   const tabLineElement = this._tabLineElements[se.tabLineElementId];
    //   const barElement = tabLineElement.barElements[se.barElementId];
    //   const beatElement = barElement.beatElements[se.beatElementId];
    //   barElement.removeBeatByUUID(beatElement.beat.uuid);
    // }

    // Recalc
    this.clearSelection();
    this.calc();
  }

  /**
   * Gets beats from selection (as a get function because this is a .map wrapper)
   * @returns Selected beats ('Beat' class)
   */
  public getSelectionBeats(): Beat[] {
    const beatSeqId = this._tab.getBeatsSeq();
    return this._selectionElements.map((se) => {
      return beatSeqId[se.beatElementSeqId];
    });
  }

  /**
   * Checks if note element is the selected element
   * @param noteElement Note element to check
   * @returns True if selected, false otherwise
   */
  public isNoteElementSelected(noteElement: NoteElement): boolean {
    return this._selectedElement.note.uuid === noteElement.note.uuid;
  }

  /**
   * Gets all UI ids of the selected element
   * @returns Ids: tabLineElementId, barElementId, beatElementId, stringNum
   */
  public getSelectedNoteElementIds(): SelectedElementWindowIds {
    let barElementId = -1;
    const tabLineElementId = this._tabLineElements.findIndex((tle) => {
      barElementId = tle.barElements.findIndex((be) => {
        return be.bar.uuid === this._selectedElement.bar.uuid;
      });
      return barElementId !== -1;
    });

    return {
      tabLineElementId: tabLineElementId,
      barElementId: barElementId,
      beatElementId: this._selectedElement.beatId,
      stringNum: this._selectedElement.stringNum,
    };
  }

  /**
   * Move selected note up
   */
  public moveSelectedNoteUp(): void {
    if (this._selectedElement === undefined) {
      throw Error("No note selected");
    }

    this.clearSelection();

    this._selectedElement.moveUp();
  }

  /**
   * Move selected note down
   */
  public moveSelectedNoteDown(): void {
    if (this._selectedElement === undefined) {
      throw Error("No note selected");
    }

    this.clearSelection();

    this._selectedElement.moveDown();
  }

  /**
   * Move selected note left
   */
  public moveSelectedNoteLeft(): void {
    if (this._selectionElements.length !== 0) {
      // Select left most element of selection
      const leftMostElement = this._selectionElements[0];
      const barElement =
        this._tabLineElements[leftMostElement.tabLineElementId].barElements[
          leftMostElement.barElementId
        ];
      const barId = this._tab.bars.indexOf(barElement.bar);
      this._selectedElement = new SelectedElement(
        this._tab,
        barId,
        leftMostElement.beatElementId,
        this._selectedElement ? this._selectedElement.stringNum : 1
      );

      this.clearSelection();
    }

    if (
      this._selectionElements.length === 0 &&
      this._selectedElement === undefined
    ) {
      throw Error("No note selected");
    }

    this._selectedElement.moveLeft();
  }

  /**
   * Handles added beat after moving right
   */
  private handleAddedBeat(): void {
    // Find bar element
    let tabLineElement: TabLineElement;
    let barElement: BarElement;
    let barElementId: number;
    this._tabLineElements.find((tle) => {
      return tle.barElements.some((be, beIndex) => {
        tabLineElement = tle;
        barElement = be;
        barElementId = beIndex;
        return be.bar.uuid === this._selectedElement.bar.uuid;
      });
    });

    // Check if the bar element fits after appending new beat
    if (
      tabLineElement === this._tabLineElements[this._tabLineElements.length - 1]
    ) {
      // If at the last then simply remove bar element from current line,
      // create and add new tab line and push the bar element there

      tabLineElement.removeBarElement(barElementId);
      // Append empty beat
      barElement.appendBeat();
      // tabLineElement.barElements.splice(barElementId, 1);

      const barIndex = this._tab.bars.indexOf(barElement.bar);
      const bar = this._tab.bars[barIndex];
      const prevBar = this._tab.bars[barIndex - 1];
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
  private handleAddedBar(addedBar: Bar): void {
    // Add bar
    this._tab.bars.push(addedBar);

    // Compute UI
    const bar = this._tab.bars[this._tab.bars.length - 1];
    const prevBar = this._tab.bars[this._tab.bars.length - 2];
    this.addBar(bar, prevBar);
  }

  /**
   * Move selected note right
   */
  public moveSelectedNoteRight(): void {
    if (this._selectionElements.length !== 0) {
      // Select right most element of selection
      const rightMostElement =
        this._selectionElements[this._selectionElements.length - 1];
      const barElement =
        this._tabLineElements[rightMostElement.tabLineElementId].barElements[
          rightMostElement.barElementId
        ];
      const barId = this._tab.bars.indexOf(barElement.bar);
      this._selectedElement = new SelectedElement(
        this._tab,
        barId,
        rightMostElement.beatElementId,
        this._selectedElement ? this._selectedElement.stringNum : 1
      );

      this.clearSelection();
    }

    if (
      this._selectionElements.length === 0 &&
      this._selectedElement === undefined
    ) {
      throw Error("No note selected");
    }

    const moveRightOutput = this._selectedElement.moveRight();
    switch (moveRightOutput.result) {
      case MoveRightResult.Nothing:
        break;
      case MoveRightResult.AddedBeat:
        this.handleAddedBeat();
        break;
      case MoveRightResult.AddedBar:
        this.handleAddedBar(moveRightOutput.addedBar);
        break;
      default:
        throw Error("Unexpected outcome after moving note right");
    }
  }

  public changeSelectedBarTempo(newTempo: number): void {
    const ids = this.getSelectedNoteElementIds();
    const { tabLineElementId, barElementId } = ids;
    const tabLineElement = this._tabLineElements[tabLineElementId];
    const barElement = tabLineElement.barElements[barElementId];

    barElement.changeTempo(newTempo);
    this.calc();
  }

  public changeSelectedBarBeats(newBeats: number): void {
    const ids = this.getSelectedNoteElementIds();
    const { tabLineElementId, barElementId } = ids;
    const tabLineElement = this._tabLineElements[tabLineElementId];
    const barElement = tabLineElement.barElements[barElementId];

    barElement.changeBarBeats(newBeats);
    this.calc();
  }

  public changeSelectedBarDuration(newDuration: NoteDuration): void {
    const ids = this.getSelectedNoteElementIds();
    const { tabLineElementId, barElementId } = ids;
    const tabLineElement = this._tabLineElements[tabLineElementId];
    const barElement = tabLineElement.barElements[barElementId];

    barElement.changeBarDuration(newDuration);
    this.calc();
  }

  public changeSelectedBeatDuration(newDuration: NoteDuration): void {
    const ids = this.getSelectedNoteElementIds();
    const { tabLineElementId, barElementId, beatElementId } = ids;
    const tabLineElement = this._tabLineElements[tabLineElementId];
    const barElement = tabLineElement.barElements[barElementId];
    const beatElement = barElement.beatElements[beatElementId];

    barElement.changeBeatDuration(beatElement.beat, newDuration);
    this.calc();
  }

  public changeSelectedNoteValue(newNoteValue: number): void {
    const ids = this.getSelectedNoteElementIds();
    const { tabLineElementId, barElementId, beatElementId, stringNum } = ids;
    const tabLineElement = this._tabLineElements[tabLineElementId];
    const barElement = tabLineElement.barElements[barElementId];
    const beatElement = barElement.beatElements[beatElementId];
    const noteElement = beatElement.noteElements[stringNum - 1];

    noteElement.note.fret = newNoteValue;
  }

  private onEffectLabelAdded(
    args: TabEventArgs[TabEventType.LineMovementTriggered]
  ): void {
    const affectedTabLineIndex = this._tabLineElements.findIndex((tle) => {
      return tle.barElements.some((barEl) => {
        return barEl.beatElements.some((beatEl) => {
          return beatEl.beat.uuid === args.beatUUID;
        });
      });
    });

    for (let i = affectedTabLineIndex; i < this._tabLineElements.length; i++) {
      this._tabLineElements[i].rect.y += args.distance;
    }
  }

  public applyEffect(
    effectType: GuitarEffectType,
    effectOptions?: GuitarEffectOptions
  ): boolean {
    let applyRes: boolean = false;
    if (this._selectedElement !== undefined) {
      // Apply effect to selected element
      applyRes = this._tab.applyEffectToNote(
        this._selectedElement.barId,
        this._selectedElement.beatId,
        this._selectedElement.stringNum,
        effectType,
        effectOptions
      );

      if (applyRes) {
        // Effect applied => need to recalc the affected note element
        const ids = this.getSelectedNoteElementIds();
        this._tabLineElements[ids.tabLineElementId].barElements[
          ids.barElementId
        ].beatElements[ids.beatElementId].calc();
      }
    } else if (this._selectionElements.length !== 0) {
      // Apply effect to all elements in selection
      const beats = this._selectionElements.map((se) => {
        return this._tabLineElements[se.tabLineElementId].barElements[
          se.barElementId
        ].beatElements[se.beatElementId].beat;
      });
      applyRes = this._tab.applyEffectToBeats(beats, effectType, effectOptions);

      if (applyRes) {
        // Effects applied to all selected beat elements => recalc every affected beat element
        for (const selectionElement of this._selectionElements) {
          this._tabLineElements[selectionElement.tabLineElementId].barElements[
            selectionElement.barElementId
          ].beatElements[selectionElement.beatElementId].calc();
        }
      }
    }

    return applyRes;
  }

  public insertBar(bar: Bar): void {
    this._tab.bars.push(bar);
    this.calc();
  }

  public insertBeat(
    barElement: BarElement,
    prevBeatElement: BeatElement
  ): void {
    const index = barElement.beatElements.indexOf(prevBeatElement);
    if (index < 0 || index >= barElement.beatElements.length) {
      return;
    }

    barElement.insertEmptyBeat(index);
    this.calc();
  }

  public get tab(): Tab {
    return this._tab;
  }

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
   * Selected note element
   */
  public get selectionElements(): SelectionElement[] {
    return this._selectionElements;
  }

  /**
   * Selection rectangles
   */
  public get selectionRects(): (Rect | undefined)[] {
    return this._selectionRects;
  }
}
