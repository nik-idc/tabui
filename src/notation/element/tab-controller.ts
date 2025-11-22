import {
  Score,
  Tab,
  TabPlayer,
  NoteDuration,
  GuitarTechniqueType,
  GuitarTechniqueOptions,
  Beat,
} from "@/notation/model";
import { Point, randomInt } from "@/shared";
import { TabEditor } from "../editor";
import {
  TabElement,
  TabLineElement,
  BeatElement,
  NoteElement,
  SelectedMoveDirection,
  SelectedNote,
} from "../elements";
import { TabControllerDim } from "./tab-controller-dim";

/**
 * Class that handles creating a tab window.
 */
export class TabController {
  readonly uuid: number;
  private _score: Score;
  /**
   * Tab object to get data from
   */
  private _tab: Tab;
  /**
   * Dimensions object
   */
  readonly dim: TabControllerDim;
  private _tabElement: TabElement;
  private _tabEditor: TabEditor;
  private _tabPlayer: TabPlayer | undefined;

  /**
   * Class that handles creating a tab window
   * @param score Score object
   * @param tab Tab object
   * @param dim Tab window dimensions
   */
  constructor(score: Score, tab: Tab, dim: TabControllerDim) {
    this.uuid = randomInt();

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

    this._tabEditor.selectFirstNote();
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

    const selectedNote = this._tabEditor.selectionManager.selectedNote;
    if (selectedNote === undefined) {
      throw Error("Selected element undefined after selection");
    }

    this._tabPlayer.setCurrentBeat(selectedNote.beat);
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

    const selectedNote = this._tabEditor.selectionManager.selectedNote;
    if (selectedNote === undefined) {
      throw Error("Selected element undefined after selection");
    }

    if (this._tabPlayer !== undefined) {
      this._tabPlayer.setCurrentBeat(selectedNote.beat);
    }
  }

  public moveSelectedNote(moveDirection: SelectedMoveDirection): void {
    this._tabEditor.moveSelectedNote(moveDirection);
  }

  public setSelectedNoteFret(newFret: number | undefined): void {
    this._tabEditor.setSelectedNoteFret(newFret);

    this._tabElement.calc();
  }

  public setSelectedBeatDots(newDots: number): void {
    this._tabEditor.setSelectedBeatDots(newDots);
  }

  public setDots(newDots: number): void {
    this._tabEditor.setDots(newDots);
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

  public applyTechniqueSingle(
    type: GuitarTechniqueType,
    techniqueOptions?: GuitarTechniqueOptions
  ): boolean {
    return this._tabEditor.applyTechniqueSingle(type, techniqueOptions);
  }

  public removeTechniqueSingle(
    type: GuitarTechniqueType,
    techniqueOptions?: GuitarTechniqueOptions
  ): void {
    this._tabEditor.removeTechniqueSingle(type, techniqueOptions);
  }

  public setTechnique(
    type: GuitarTechniqueType,
    techniqueOptions?: GuitarTechniqueOptions
  ): boolean {
    return this._tabEditor.setTechnique(type, techniqueOptions);
  }

  public getSelectedNote(): SelectedNote | undefined {
    return this._tabEditor.getSelectedNote();
  }

  /**
   * Returns selection as array:
   * - If not selecting beats, then returns an array containg just the selected element
   * - If selecting beats, then returns the selection array
   */
  public getSelectionAsArray(): Beat[] {
    const selectedNote = this._tabEditor.getSelectedNote();
    if (selectedNote === undefined) {
      return this._tabEditor.selectionManager.selectionBeats;
    } else {
      return [selectedNote.beat];
    }
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
    const selectedNote = this._tabEditor.getSelectedNote();
    if (selectedNote !== undefined && selectedNote.barId === barIndex) {
      this._tabEditor.clearSelectedNote();
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

  public changeDuration(newDuration: NoteDuration): void {
    this._tabEditor.changeDuration(newDuration);
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
    const selectedNote = this._tabEditor.selectionManager.selectedNote;
    if (selectedNote === undefined) {
      return undefined;
    }

    return selectedNote.beat;
  }

  public getSelectedBeatElement(): BeatElement | undefined {
    const selectedNote = this._tabEditor.selectionManager.selectedNote;
    if (selectedNote === undefined) {
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

  public get score(): Score {
    return this._score;
  }

  public get tabPlayer(): TabPlayer | undefined {
    return this._tabPlayer;
  }
}
