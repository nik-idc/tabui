import { Tab } from "./../models/tab";
import { TabWindowDim } from "./tab-window-dim";
import { NoteElement } from "./elements/note-element";
import { BarElement } from "./elements/bar-element";
import { Bar } from "./../models/bar";
import { NoteDuration } from "./../models/note-duration";
import { BeatElement } from "./elements/beat-element";
import {
  MoveRightResult,
  SelectedElement,
  SelectedMoveDirection,
} from "./elements/selected-element";
import { GuitarEffectOptions } from "../models/guitar-effect/guitar-effect-options";
import { GuitarEffectType } from "../models/guitar-effect/guitar-effect-type";
import { SelectionManager } from "./selection/selection-manager";
import { SelectedElementsAndIds, TabElement } from "./elements/tab-element";
import { TabPlayer } from "./player/tab-player";
import { TabEditor } from "./editor/tab-editor";
import { Beat } from "../models/beat";
import { TabLineElement } from "./elements/tab-line-element";
import { Point } from "./shapes/point";
import { Score } from "../models/score";

/**
 * Class that handles creating a tab window.
 */
export class TabWindow {
  private _score: Score;
  /**
   * Tab object to get data from
   */
  private _tab: Tab;
  /**
   * Dimensions object
   */
  readonly dim: TabWindowDim;
  private _tabElement: TabElement;
  private _tabEditor: TabEditor;
  private _tabPlayer: TabPlayer | undefined;

  /**
   * Class that handles creating a tab window
   * @param score Score object
   * @param tab Tab object
   * @param dim Tab window dimensions
   */
  constructor(score: Score, tab: Tab, dim: TabWindowDim) {
    this._score = score;
    this._tab = tab;
    this.dim = dim;

    const tabIndex = this._score.tracks.indexOf(this._tab);
    this._tabElement = new TabElement(this._score, tabIndex, this.dim);
    this._tabEditor = new TabEditor(this._score, tabIndex, this._tabElement);

    if (typeof window !== "undefined") {
      this._tabPlayer = new TabPlayer(this._tab);
    } else {
      this._tabPlayer = undefined;
    }
  }

  public calcTabElement(): void {
    this._tabElement.calc();
  }

  public getTabLineElements(): TabLineElement[] {
    return this._tabElement.tabLineElements;
  }

  public getBeatElementGlobalCoords(beatElement: BeatElement): Point {
    return this._tabElement.getBeatElementGlobalCoords(beatElement);
  }

  public getNoteElementGlobalCoords(noteElement: NoteElement): Point {
    return this._tabElement.getNoteElementGlobalCoords(noteElement);
  }

  public getNoteTextGlobalCoords(noteElement: NoteElement): Point {
    return this._tabElement.getNoteTextGlobalCoords(noteElement);
  }

  public getBeatElementByUUID(beatUUID: number): BeatElement | undefined {
    return this._tabElement.getBeatElementByUUID(beatUUID);
  }

  public recalcBeatElementSelection(): void {
    this._tabElement.recalcBeatElementSelection(
      this._tabEditor.selectionManager.selectionBeats
    );
  }

  public selectNoteElement(noteElement: NoteElement): void {
    if (this._tabPlayer === undefined) {
      return;
    }

    this._tabEditor.selectNoteElement(noteElement);

    const selectedElement = this._tabEditor.selectionManager.selectedElement;
    if (selectedElement === undefined) {
      throw Error("Selected element undefined after selection");
    }

    this._tabPlayer.setCurrentBeat(selectedElement.beat);
  }

  public selectNoteElementUsingIds(
    tabLineElementId: number,
    barElementId: number,
    beatElementId: number,
    noteElementId: number
  ): void {
    this._tabEditor.selectNoteElementUsingIds(
      tabLineElementId,
      barElementId,
      beatElementId,
      noteElementId
    );

    const selectedElement = this._tabEditor.selectionManager.selectedElement;
    if (selectedElement === undefined) {
      throw Error("Selected element undefined after selection");
    }

    if (this._tabPlayer !== undefined) {
      this._tabPlayer.setCurrentBeat(selectedElement.beat);
    }
  }

  public moveSelectedNote(moveDirection: SelectedMoveDirection): void {
    this._tabEditor.moveSelectedNote(moveDirection);
  }

  public setSelectedElementFret(newFret: number | undefined): void {
    this._tabEditor.setSelectedNoteFret(newFret);
  }

  public setSelectedBeatDots(newDots: number): void {
    this._tabEditor.setSelectedBeatDots(newDots);
  }

  public setSelectedBeatsTuplet(
    normalCount: number,
    tupletCount: number
  ): void {
    this._tabEditor.setSelectedBeatsTuplet(normalCount, tupletCount);
  }

  public changeSelectedBarTempo(newTempo: number): void {
    this._tabEditor.changeSelectedBarTempo(newTempo);
  }

  public changeSelectedBarBeats(newBeats: number): void {
    this._tabEditor.changeSelectedBarBeats(newBeats);
  }

  public changeSelectedBarDuration(newDuration: NoteDuration): void {
    this._tabEditor.changeSelectedBarDuration(newDuration);
  }

  public setSelectedBarRepeatStart(): void {
    this._tabEditor.setSelectedBarRepeatStart();
  }

  public setSelectedBarRepeatEnd(): void {
    this._tabEditor.setSelectedBarRepeatEnd();
  }

  public changeSelectedBeatDuration(newDuration: NoteDuration): void {
    this._tabEditor.changeSelectedBeatDuration(newDuration);
  }

  public applyEffectSingle(
    effectType: GuitarEffectType,
    effectOptions?: GuitarEffectOptions
  ): boolean {
    return this._tabEditor.applyEffectSingle(effectType, effectOptions);
  }

  public removeEffectSingle(
    effectType: GuitarEffectType,
    effectOptions?: GuitarEffectOptions
  ): void {
    this._tabEditor.removeEffectSingle(effectType, effectOptions);
  }

  public getSelectedElement(): SelectedElement | undefined {
    return this._tabEditor.getSelectedElement();
  }

  public isNoteElementSelected(noteElement: NoteElement): boolean {
    return this._tabEditor.isNoteElementSelected(noteElement);
  }

  public clearSelection(): void {
    this._tabEditor.clearSelection();
  }

  public selectBeat(beatElement: BeatElement): void {
    this._tabEditor.selectBeat(beatElement);
  }

  public selectBeatUsingIds(
    tabLineElementId: number,
    barElementId: number,
    beatElementId: number
  ): void {
    this._tabEditor.selectBeatUsingIds(
      tabLineElementId,
      barElementId,
      beatElementId
    );
  }

  public deleteSelectedBeats(): void {
    this._tabEditor.deleteBeats();
  }

  public prependBar(): void {
    this._tabEditor.prependBar();
  }

  public appendBar(): void {
    this._tabEditor.appendBar();
  }

  public insertBar(barIndex: number): void {
    this._tabEditor.insertBar(barIndex);
  }

  public removeBar(barIndex: number): void {
    const selectedElement = this._tabEditor.getSelectedElement();
    if (selectedElement !== undefined && selectedElement.barId === barIndex) {
      this._tabEditor.clearSelectedElement();
    }

    this._tabEditor.removeBar(barIndex);
  }

  public copy(): void {
    this._tabEditor.copy();
  }

  public paste(): void {
    this._tabEditor.paste();
  }

  public changeSelectionDuration(newDuration: NoteDuration): void {
    this._tabEditor.changeSelectionDuration(newDuration);
  }

  public getSelectionBeats(): Beat[] {
    return this._tabEditor.selectionManager.selectionBeats;
  }

  public undo(): void {
    this._tabEditor.undo();
  }

  public redo(): void {
    this._tabEditor.redo();
  }

  public startPlayer(): void {
    if (this._tabPlayer === undefined) {
      return;
    }

    this._tabPlayer.start();
  }

  public stopPlayer(): void {
    if (this._tabPlayer === undefined) {
      return;
    }

    this._tabPlayer.stop();
  }

  public setLooped(): void {
    if (this._tabPlayer === undefined) {
      return;
    }

    this._tabPlayer.setLooped();
  }

  public getIsPlaying(): boolean {
    if (this._tabPlayer === undefined) {
      return false;
    }

    return this._tabPlayer.isPlaying;
  }

  public getIsLooped(): boolean {
    if (this._tabPlayer === undefined) {
      return false;
    }

    return this._tabPlayer.isLooped;
  }

  public getSelectedBeat(): Beat | undefined {
    const selectedElement = this._tabEditor.selectionManager.selectedElement;
    if (selectedElement === undefined) {
      return undefined;
    }

    return selectedElement.beat;
  }

  public getSelectedBeatElement(): BeatElement | undefined {
    const selectedElement = this._tabEditor.selectionManager.selectedElement;
    if (selectedElement === undefined) {
      return undefined;
    }

    return this._tabEditor.getSelectedNoteElementsAndIds().beatElement;
  }

  public getPlayerCurrentBeatElement(): BeatElement | undefined {
    if (this._tabPlayer === undefined) {
      // throw Error("Tab player undefined");
      return undefined;
    }

    if (this._tabPlayer.currentBeat === undefined) {
      throw Error("Tab player current beat undefined");
    }

    const beatElement = this._tabElement.findCorrespondingBeatElement(
      this._tabPlayer.currentBeat
    );

    if (beatElement === undefined) {
      throw Error("Failed to find corresponding beat element");
    }

    return beatElement;
  }

  public getWindowHeight(): number {
    let tabWindowHeight = 0;
    const tabLineElements = this._tabElement.tabLineElements;
    for (const tabLineElement of tabLineElements) {
      tabWindowHeight += tabLineElement.rect.height;
    }

    return tabWindowHeight;
  }

  public get tab(): Tab {
    return this._tab;
  }

  public get tabPlayer(): TabPlayer | undefined {
    return this._tabPlayer;
  }
}
