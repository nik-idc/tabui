import { ScorePlayer } from "@/player";
import {
  Track,
  Beat,
  NoteDuration,
  BarRepeatStatus,
  TechniqueType,
} from "../model";
import { TrackElement, BeatElement, NoteElement } from "./element";
import { TrackControllerEditor } from "./editor/track-controller-editor";
import { Rect } from "@/shared";
import { SelectedNote, SelectedMoveDirection } from "./selection/selected-note";
import { CommandManager } from "./editor/command/command-manager";
import { SelectionManager } from "./selection/selection-manager";
import { BendTechniqueOptions } from "../model/bend-options";

/**
 * Class that handles editing, playing & calculating geometry of a track
 */
export class TrackController {
  /** Track object to get data from */
  readonly track: Track;

  /** Track element */
  private _trackElement: TrackElement;
  /** Track controller editor */
  private _trackControllerEditor: TrackControllerEditor;
  /** Score player (undefined if testing outside of a browser) */
  private _scorePlayer: ScorePlayer | undefined;

  /**
   * Class that handles editing, playing & calculating geometry of a track
   * @param track Track
   */
  constructor(track: Track) {
    this.track = track;

    this._trackElement = new TrackElement(this.track);
    this._trackControllerEditor = new TrackControllerEditor(this._trackElement);

    if (typeof window !== "undefined") {
      this._scorePlayer = new ScorePlayer(this.track.score, this.track);
    } else {
      this._scorePlayer = undefined;
    }

    this._trackControllerEditor.selectFirstNote();
  }

  /**
   * Starts player
   */
  public startPlayer(): void {
    if (this._scorePlayer === undefined) {
      return;
    }

    const selection =
      this._trackControllerEditor.selectionManager.selectionAsBeats;
    if (selection.length > 1) {
      this._scorePlayer.setLoopSection(
        selection[0],
        selection[selection.length - 1]
      );
      this._scorePlayer.enableLoop();
    } else {
      this._scorePlayer.clearLoopSection();
      this._scorePlayer.disableLoop();
    }

    void this._scorePlayer.start({ startBeat: selection[0] });
  }

  /**
   * Stops player
   */
  public stopPlayer(): void {
    if (this._scorePlayer === undefined) {
      return;
    }

    this._scorePlayer.stop();
  }

  /**
   * Toggles player loop
   */
  public toggleLoop(): void {
    if (this._scorePlayer === undefined) {
      return;
    }

    this._scorePlayer.toggleLoop();
  }

  /** Disposes runtime resources owned by the controller */
  public dispose(): void {
    this._scorePlayer?.dispose();
  }

  /** Undo previous action */
  public undo(): void {
    this._trackControllerEditor.commandManager.undo();
    this._trackElement.update();
    this._trackControllerEditor.syncSelection();
  }

  /** Redo previous action */
  public redo(): void {
    this._trackControllerEditor.commandManager.redo();
    this._trackElement.update();
    this._trackControllerEditor.syncSelection();
  }

  /** True if playing, false if not/player undefined */
  public get isPlaying(): boolean {
    if (this._scorePlayer === undefined) {
      return false;
    }

    return this._scorePlayer.isPlaying;
  }

  /** True if looped, false if not/player undefined */
  public get isLooped(): boolean {
    if (this._scorePlayer === undefined) {
      return false;
    }

    return this._scorePlayer.isLooped;
  }

  /** Currently selected note, or undefined if no note is selected */
  public get selectedNote(): SelectedNote | undefined {
    return this._trackControllerEditor.selectionManager.selectedNote;
  }

  /** True if a note is currently selected */
  public get hasSelectedNote(): boolean {
    return (
      this._trackControllerEditor.selectionManager.selectedNote !== undefined
    );
  }

  /** Selected beats as model objects */
  public get selectionBeats(): Beat[] {
    return this._trackControllerEditor.selectionManager.selectionBeats;
  }

  /**
   * Set selected note's fret
   * @param newFret New fret value (null to clear)
   */
  public setSelectedNoteFret(newFret: number | null): void {
    this._trackControllerEditor.setSelectedNoteFret(newFret);
  }

  /**
   * Set duration for selected beats
   * @param newDuration New duration
   */
  public setDuration(newDuration: NoteDuration): void {
    this._trackControllerEditor.setDuration(newDuration);
  }

  /**
   * Set dot count for selected beats
   * @param newDots New dot count
   */
  public setDots(newDots: number): void {
    this._trackControllerEditor.setDots(newDots);
  }

  /**
   * Set tuplet for selected beats
   * @param normalCount Normal count
   * @param tupletCount Tuplet count
   */
  public setSelectedBeatsTuplet(
    normalCount: number,
    tupletCount: number
  ): void {
    this._trackControllerEditor.setSelectedBeatsTuplet(
      normalCount,
      tupletCount
    );
  }

  /**
   * Set tempo of the bar containing the selected note
   * @param newTempo New tempo value
   */
  public setSelectedBarTempo(newTempo: number): void {
    this._trackControllerEditor.setSelectedBarTempo(newTempo);
  }

  /**
   * Set time signature of the bar containing the selected note
   * @param beatsCount Beats count
   * @param duration Duration
   */
  public setSelectedBarTimeSignature(
    beatsCount?: number,
    duration?: NoteDuration
  ): void {
    this._trackControllerEditor.setSelectedBarTimeSignature(
      beatsCount,
      duration
    );
  }

  /**
   * Set repeat status of the bar containing the selected note
   * @param status New repeat status
   */
  public setSelectedBarRepeatStatus(status: BarRepeatStatus): void {
    this._trackControllerEditor.setSelectedBarRepeatStatus(status);
  }

  /**
   * Set technique on the selected note/beats
   * @param type Technique type
   * @param bendOptions Optional bend options
   */
  public setTechnique(
    type: TechniqueType,
    bendOptions?: BendTechniqueOptions
  ): void {
    this._trackControllerEditor.setTechnique(type, bendOptions);
  }

  /**
   * Move the selected note in the given direction
   * @param direction Move direction
   */
  public moveSelectedNote(direction: SelectedMoveDirection): void {
    this._trackControllerEditor.moveSelectedNote(direction);
  }

  /**
   * Copy the current selection to clipboard
   */
  public copy(): void {
    this._trackControllerEditor.copy();
  }

  /**
   * Paste from clipboard at the current selection
   */
  public paste(): void {
    this._trackControllerEditor.paste();
  }

  /**
   * Delete all selected beats
   */
  public deleteSelectedBeats(): void {
    this._trackControllerEditor.deleteSelectedBeats();
  }

  /**
   * Check if a note element is currently selected
   * @param noteElement Note element to check
   * @returns True if selected, false otherwise
   */
  public isNoteElementSelected(noteElement: NoteElement): boolean {
    return this._trackControllerEditor.isNoteElementSelected(noteElement);
  }

  /**
   * Select a note by its element
   * @param noteElement Note element to select
   */
  public selectNoteElement(noteElement: NoteElement): void {
    this._trackControllerEditor.selectNoteElement(noteElement);
  }

  /**
   * Select a beat element
   * @param beatElement Beat element to select
   */
  public selectBeat(beatElement: BeatElement): void {
    this._trackControllerEditor.selectBeat(beatElement);
  }

  /**
   * Clear the current selection
   */
  public clearSelection(): void {
    this._trackControllerEditor.clearSelection();
  }

  /**
   * Returns an array of selection rectangles
   * @returns Array of selection rectangles
   */
  public getSelectionRects(): Rect[] {
    return this._trackElement.getSelectionRects(
      this._trackControllerEditor.selectionManager.selectionBeats
    );
  }

  /** Height of the controller window */
  public get windowHeight(): number {
    let trackWindowHeight = 0;
    const trackLineElements = this._trackElement.trackLineElements;
    for (const trackLineElement of trackLineElements) {
      trackWindowHeight += trackLineElement.boundingBox.height;
    }

    return trackWindowHeight;
  }

  /** Current beat element of the player on the active track */
  public get playerCurrentBeatElement(): BeatElement | undefined {
    if (
      this._scorePlayer === undefined ||
      this._scorePlayer.currentBeat === undefined
    ) {
      return undefined;
    }

    return this._trackElement.findCorrespondingBeatElement(
      this._scorePlayer.currentBeat
    );
  }

  /** Track element */
  public get trackElement(): TrackElement {
    return this._trackElement;
  }

  /** Command manager (for tests and advanced use) */
  public get commandManager(): CommandManager {
    return this._trackControllerEditor.commandManager;
  }

  /** Selection manager (for tests and advanced use) */
  public get selectionManager(): SelectionManager {
    return this._trackControllerEditor.selectionManager;
  }
}
