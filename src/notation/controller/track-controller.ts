import { ScorePlayer } from "../../player";
import type { PlaybackOptions } from "../../player";
import {
  Track,
  Bar,
  Beat,
  NoteDuration,
  BarRepeatStatus,
  TechniqueType,
  VoiceNumber,
  Score,
  MusicInstrument,
  TrackInstrumentChangeMode,
} from "../model";
import { TrackElement, BeatElement, NoteElement } from "./element";
import { TrackControllerEditor } from "./editor/track-controller-editor";
import { Rect } from "../../shared";
import { SelectedNote, SelectedMoveDirection } from "./selection/selected-note";
import { SelectionManager } from "./selection/selection-manager";
import { BendTechniqueOptions } from "../model/bend-options";
import { EditorLayoutDimensions } from "./editor-layout-dimensions";

/**
 * Class that handles editing, playing & calculating geometry of a track
 */
export class TrackController {
  /** Track object to get data from */
  readonly track: Track;
  /** Layout dimensions */
  readonly layoutDimensions: EditorLayoutDimensions;

  /** Track element */
  private _trackElement: TrackElement;
  /** Track controller editor */
  private _trackControllerEditor: TrackControllerEditor;
  /** Optional score-wide player provided by the owning runtime. */
  private readonly _scorePlayer?: ScorePlayer;

  /**
   * Class that handles editing, playing & calculating geometry of a track
   * @param track Track
   */
  constructor(
    track: Track,
    layoutDimensions: EditorLayoutDimensions,
    scorePlayer?: ScorePlayer,
    editingEnabled: boolean = true
  ) {
    this.track = track;
    this.layoutDimensions = layoutDimensions;

    this._trackElement = new TrackElement(this.track, this.layoutDimensions);
    this._trackControllerEditor = new TrackControllerEditor(
      this._trackElement,
      editingEnabled
    );
    this._scorePlayer = scorePlayer;

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
    const playbackOptions: PlaybackOptions = { startBeat: selection[0] };
    if (selection.length > 1) {
      this._scorePlayer.setSelectionLoopSection(
        selection[0],
        selection[selection.length - 1]
      );
      playbackOptions.loopEndBeat = selection[selection.length - 1];
    } else {
      this._scorePlayer.clearSelectionLoopSection();
    }

    void this._scorePlayer.start(playbackOptions);
  }

  /**
   * Stops player
   */
  public stopPlayer(): void {
    this._scorePlayer?.stop();
  }

  /** Clears edit selection and seeks active playback to the provided beat. */
  public restartPlayerFromBeat(beat: Beat): void {
    if (!this._scorePlayer?.isPlaying) {
      return;
    }

    this._trackControllerEditor.clearSelection();
    this._trackControllerEditor.clearSelectedNote();
    this._scorePlayer.clearSelectionLoopSection();
    void this._scorePlayer.start({ startBeat: beat });
  }

  private getBarPlaybackStartBeat(
    bar: Bar,
    preferredVoiceNumber: VoiceNumber
  ): Beat | undefined {
    const preferredVoice = bar.getVoiceBar(preferredVoiceNumber);
    const preferredBeat = preferredVoice?.beats.find((beat) =>
      preferredVoice.beatPlayable(beat)
    );
    if (preferredBeat !== undefined) {
      return preferredBeat;
    }

    for (const voiceBar of bar.voiceBarsAsArray) {
      const beat = voiceBar.beats.find((candidate) =>
        voiceBar.beatPlayable(candidate)
      );
      if (beat !== undefined) {
        return beat;
      }
    }
    return undefined;
  }

  private getTrackPlaybackStartBeat(
    preferredBar: Bar,
    preferredVoiceNumber: VoiceNumber
  ): Beat | undefined {
    const preferredBeat = this.getBarPlaybackStartBeat(
      preferredBar,
      preferredVoiceNumber
    );
    if (preferredBeat !== undefined) {
      return preferredBeat;
    }

    const masterBarIndex = preferredBar.staff.bars.indexOf(preferredBar);
    for (const staff of this.track.staves) {
      if (staff === preferredBar.staff) {
        continue;
      }

      const beat = this.getBarPlaybackStartBeat(
        staff.bars[masterBarIndex],
        preferredVoiceNumber
      );
      if (beat !== undefined) {
        return beat;
      }
    }
    return undefined;
  }

  /** Selects the first bar and seeks active playback to it. */
  public selectFirstBar(): void {
    if (!this._scorePlayer?.isPlaying) {
      this._trackControllerEditor.selectFirstBar();
      return;
    }

    const playbackAnchorBeat = this._scorePlayer.playbackAnchorBeat;
    if (playbackAnchorBeat === undefined) {
      return;
    }

    const currentBar = playbackAnchorBeat.voiceBar.bar;
    const firstBar = currentBar.staff.bars[0];
    const firstBeat = this.getTrackPlaybackStartBeat(
      firstBar,
      playbackAnchorBeat.voiceBar.voiceNumber
    );
    if (firstBeat !== undefined && firstBeat !== playbackAnchorBeat) {
      this.restartPlayerFromBeat(firstBeat);
    }
  }

  /** Selects the previous bar and seeks active playback to it. */
  public selectPreviousBar(): void {
    if (!this._scorePlayer?.isPlaying) {
      this._trackControllerEditor.selectPreviousBar();
      return;
    }

    const playbackAnchorBeat = this._scorePlayer.playbackAnchorBeat;
    if (playbackAnchorBeat === undefined) {
      return;
    }

    const currentBar = playbackAnchorBeat.voiceBar.bar;
    const previousBar = currentBar.staff.getPrevBar(currentBar);
    const previousBeat =
      previousBar === null
        ? undefined
        : this.getTrackPlaybackStartBeat(
            previousBar,
            playbackAnchorBeat.voiceBar.voiceNumber
          );
    if (previousBeat !== undefined) {
      this.restartPlayerFromBeat(previousBeat);
    }
  }

  /** Selects the next bar and seeks active playback to it. */
  public selectNextBar(): void {
    if (!this._scorePlayer?.isPlaying) {
      this._trackControllerEditor.selectNextBar();
      return;
    }

    const playbackAnchorBeat = this._scorePlayer.playbackAnchorBeat;
    if (playbackAnchorBeat === undefined) {
      return;
    }

    const currentBar = playbackAnchorBeat.voiceBar.bar;
    const nextBar = currentBar.staff.getNextBar(currentBar);
    const nextBeat =
      nextBar === null
        ? undefined
        : this.getTrackPlaybackStartBeat(
            nextBar,
            playbackAnchorBeat.voiceBar.voiceNumber
          );
    if (nextBeat !== undefined) {
      this.restartPlayerFromBeat(nextBeat);
    }
  }

  /** Selects the last bar and seeks active playback to it. */
  public selectLastBar(): void {
    if (!this._scorePlayer?.isPlaying) {
      this._trackControllerEditor.selectLastBar();
      return;
    }

    const playbackAnchorBeat = this._scorePlayer.playbackAnchorBeat;
    if (playbackAnchorBeat === undefined) {
      return;
    }

    const currentBar = playbackAnchorBeat.voiceBar.bar;
    const lastBar = currentBar.staff.bars[currentBar.staff.bars.length - 1];
    const lastBeat = this.getTrackPlaybackStartBeat(
      lastBar,
      playbackAnchorBeat.voiceBar.voiceNumber
    );
    if (lastBeat !== undefined && lastBeat !== playbackAnchorBeat) {
      this.restartPlayerFromBeat(lastBeat);
    }
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

  /** Applies current track playback-control state to active playback nodes. */
  public syncTrackPlaybackState(): void {
    this._scorePlayer?.syncTrackPlaybackState();
  }

  /** Applies score-wide playback-control state to active playback nodes. */
  public syncMasterPlaybackState(): void {
    this._scorePlayer?.syncMasterPlaybackState();
  }

  public moveTrack(track: Track, targetIndex: number): boolean {
    if (this.isPlaying) {
      return false;
    }
    return this._trackControllerEditor.moveTrack(track, targetIndex);
  }

  public setScoreName(score: Score, name: string): boolean {
    if (this.isPlaying) {
      return false;
    }
    return this._trackControllerEditor.setScoreName(score, name);
  }

  public setMasterVolume(score: Score, volume: number): boolean {
    const changed = this._trackControllerEditor.setMasterVolume(score, volume);
    if (changed) {
      this.syncMasterPlaybackState();
    }
    return changed;
  }

  public setMasterPan(score: Score, pan: number): boolean {
    const changed = this._trackControllerEditor.setMasterPan(score, pan);
    if (changed) {
      this.syncMasterPlaybackState();
    }
    return changed;
  }

  public addTrack(
    score: Score,
    instrument: MusicInstrument,
    name: string
  ): Track | undefined {
    if (this.isPlaying) {
      return undefined;
    }
    return this._trackControllerEditor.addTrack(score, instrument, name);
  }

  public removeTrack(score: Score, track: Track): Track | undefined {
    if (this.isPlaying) {
      return undefined;
    }
    return this._trackControllerEditor.removeTrack(score, track);
  }

  public setTrackName(track: Track, name: string): boolean {
    if (this.isPlaying) {
      return false;
    }
    return this._trackControllerEditor.setTrackName(track, name);
  }

  public setTrackVolume(track: Track, volume: number): boolean {
    const changed = this._trackControllerEditor.setTrackVolume(track, volume);
    if (changed) {
      this.syncTrackPlaybackState();
    }
    return changed;
  }

  public setTrackPan(track: Track, pan: number): boolean {
    const changed = this._trackControllerEditor.setTrackPan(track, pan);
    if (changed) {
      this.syncTrackPlaybackState();
    }
    return changed;
  }

  public toggleTrackMuted(track: Track): boolean {
    const changed = this._trackControllerEditor.toggleTrackMuted(track);
    if (changed) {
      this.syncTrackPlaybackState();
    }
    return changed;
  }

  public toggleTrackSoloed(track: Track): boolean {
    const changed = this._trackControllerEditor.toggleTrackSoloed(track);
    if (changed) {
      this.syncTrackPlaybackState();
    }
    return changed;
  }

  public setTrackInstrument(
    track: Track,
    instrument: MusicInstrument,
    mode: TrackInstrumentChangeMode
  ): boolean {
    if (this.isPlaying) {
      return false;
    }
    return this._trackControllerEditor.setTrackInstrument(
      track,
      instrument,
      mode
    );
  }

  /** Undo previous action */
  public undo(): void {
    if (this.isPlaying) {
      return;
    }
    this._trackControllerEditor.undoCommand();
    this._trackControllerEditor.syncSelection();
  }

  /** Redo previous action */
  public redo(): void {
    if (this.isPlaying) {
      return;
    }
    this._trackControllerEditor.redoCommand();
    this._trackControllerEditor.syncSelection();
  }

  /** True while score playback is active. */
  public get isPlaying(): boolean {
    return this._scorePlayer?.isPlaying ?? false;
  }

  /** True while score playback is looped. */
  public get isLooped(): boolean {
    return this._scorePlayer?.isLooped ?? false;
  }

  public get editingEnabled(): boolean {
    return this._trackControllerEditor.editingEnabled;
  }

  /** Enables or disables all score mutations for this active track. */
  public setEditingEnabled(editingEnabled: boolean): void {
    this._trackControllerEditor.editingEnabled = editingEnabled;
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
    if (this.isPlaying) {
      return;
    }
    this._trackControllerEditor.setSelectedNoteFret(newFret);
  }

  /**
   * Set duration for selected beats
   * @param newDuration New duration
   */
  public setDuration(newDuration: NoteDuration): void {
    if (this.isPlaying) {
      return;
    }
    this._trackControllerEditor.setDuration(newDuration);
  }

  public setSelectedBeatRest(): void {
    if (this.isPlaying) {
      return;
    }
    this._trackControllerEditor.setSelectedBeatRest();
  }

  /**
   * Set dot count for selected beats
   * @param newDots New dot count
   */
  public setDots(newDots: number): void {
    if (this.isPlaying) {
      return;
    }
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
    if (this.isPlaying) {
      return;
    }
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
    if (this.isPlaying) {
      return;
    }
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
    if (this.isPlaying) {
      return;
    }
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
    if (this.isPlaying) {
      return;
    }
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
    if (this.isPlaying) {
      return;
    }
    this._trackControllerEditor.setTechnique(type, bendOptions);
  }

  /**
   * Move the selected note in the given direction
   * @param direction Move direction
   */
  public moveSelectedNote(direction: SelectedMoveDirection): void {
    if (this.isPlaying) {
      return;
    }
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
    if (this.isPlaying) {
      return;
    }
    this._trackControllerEditor.paste();
  }

  /**
   * Delete all selected beats
   */
  public deleteSelectedBeats(): void {
    if (this.isPlaying) {
      return;
    }
    this._trackControllerEditor.deleteSelectedBeats();
  }

  public insertBeatBeforeSelected(): void {
    if (this.isPlaying) {
      return;
    }
    this._trackControllerEditor.insertBeatBeforeSelected();
  }

  public insertBeatAfterSelected(): void {
    if (this.isPlaying) {
      return;
    }
    this._trackControllerEditor.insertBeatAfterSelected();
  }

  public removeSelectedBeat(): void {
    if (this.isPlaying) {
      return;
    }
    this._trackControllerEditor.removeSelectedBeat();
  }

  public setActiveVoiceNumber(voiceNumber: VoiceNumber): void {
    if (this.isPlaying) {
      return;
    }
    this._trackControllerEditor.setActiveVoiceNumber(voiceNumber);
  }

  public insertBarBeforeSelected(): void {
    if (this.isPlaying) {
      return;
    }
    this._trackControllerEditor.insertBarBeforeSelected();
  }

  public insertBarAfterSelected(): void {
    if (this.isPlaying) {
      return;
    }
    this._trackControllerEditor.insertBarAfterSelected();
  }

  public removeSelectedBar(): void {
    if (this.isPlaying) {
      return;
    }
    this._trackControllerEditor.removeSelectedBar();
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

  /** Last started beat element of the player on the active track. */
  public get playerLastStartedBeatElement(): BeatElement | undefined {
    if (this._scorePlayer?.lastStartedBeat === undefined) {
      return undefined;
    }

    return this._trackElement.getBeatElement(this._scorePlayer.lastStartedBeat);
  }

  /** Current Web Audio clock time used by playback cursor animation. */
  public get playerCurrentTime(): number | undefined {
    return this._scorePlayer?.currentTime;
  }

  /** Current playback generation used to invalidate stale cursor animation. */
  public get playerRunId(): number | undefined {
    return this._scorePlayer?.playbackRunId;
  }

  /** Runtime identity of this controller's score player. */
  public get playerUUID(): number | undefined {
    return this._scorePlayer?.uuid;
  }

  public getBeatElementByUUID(beatUUID: number): BeatElement | undefined {
    const beat = this.getBeatByUUID(beatUUID);
    return beat === undefined
      ? undefined
      : this._trackElement.getBeatElement(beat);
  }

  public getBeatByUUID(beatUUID: number): Beat | undefined {
    for (const staff of this.track.staves) {
      for (const bar of staff.bars) {
        for (const voiceBar of bar.voiceBarsAsArray) {
          const beat = voiceBar.beats.find((voiceBeat) => {
            return voiceBeat.uuid === beatUUID;
          });
          if (beat !== undefined) {
            return beat;
          }
        }
      }
    }

    return undefined;
  }

  /** Track element */
  public get trackElement(): TrackElement {
    return this._trackElement;
  }

  /** Selection manager (for tests and advanced use) */
  public get selectionManager(): SelectionManager {
    return this._trackControllerEditor.selectionManager;
  }

  /** Current active voice number. */
  public get activeVoiceNumber(): VoiceNumber {
    return this._trackControllerEditor.selectionManager.activeVoiceNumber;
  }
}
