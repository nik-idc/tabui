import { ScorePlayer } from "@/player";
import { Track } from "../model";
import { TrackElement, BeatElement } from "./element";
import { TrackControllerEditor } from "./editor/track-controller-editor";
import { Rect } from "@/shared";

// TODO(P0-ARCH): Revisit whether this type should remain the main runtime
// facade or whether editing/playback/render access should be split more clearly.
//
// TODO(P0-ARCH): Revisit naming. "TrackController" feels vague for a type that
// owns runtime/editor/playback concerns.
//
// TODO(P0-READABILITY): Reduce deep access chains like
// `trackController.trackControllerEditor.selectionManager...`.
// Add dedicated façade getters where useful so this remains the main entry
// point into the controller layer.

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
      this._scorePlayer = new ScorePlayer(this.track.score);
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
    this._scorePlayer.setCurrentBeat(selection[0]);
    if (selection.length > 1) {
      this._scorePlayer.setLoopSection(selection[0], selection[1]);
    }

    this._scorePlayer.start();
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
   * @returns
   */
  public toggleLoop(): void {
    if (this._scorePlayer === undefined) {
      return;
    }

    this._scorePlayer.toggleLoop();
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

  /** Current beat elemnet of the player */
  public get playerCurrentBeatElement(): BeatElement | undefined {
    if (this._scorePlayer === undefined) {
      return undefined;
    }

    if (this._scorePlayer.currentBeat === undefined) {
      throw Error("Track player current beat undefined");
    }

    const beatElement = this._trackElement.findCorrespondingBeatElement(
      this._scorePlayer.currentBeat
    );

    if (beatElement === undefined) {
      throw Error("Failed to find corresponding beat element");
    }

    return beatElement;
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
      trackWindowHeight += trackLineElement.rect.height;
    }

    return trackWindowHeight;
  }

  /** Track element */
  public get trackElement(): TrackElement {
    return this._trackElement;
  }

  /** Track controller editor */
  public get trackControllerEditor(): TrackControllerEditor {
    return this._trackControllerEditor;
  }

  /** Selection manager */
  public get selectionManager() {
    return this._trackControllerEditor.selectionManager;
  }

  /** Command manager */
  public get commandManager() {
    return this._trackControllerEditor.commandManager;
  }

  /** Score player (undefined if testing outside of a browser) */
  public get trackPlayer(): ScorePlayer | undefined {
    return this._scorePlayer;
  }
}
