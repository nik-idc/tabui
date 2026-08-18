import { Score, Track } from "./model";
import {
  EditorSVGRenderer,
  EditorRenderer,
  EditorRenderOptions,
} from "./render";
import { ElementRenderer } from "./render/element-renderer";
import { TrackController } from "./controller";
import { ResolvedTabUIConfig, TabUIEditorMode } from "../config/tabui-config";
import { EditorLayoutDimensions } from "./controller/editor-layout-dimensions";
import { PlaybackErrorListener, ScorePlayer } from "../player";
import { ScoreLayoutPlanner } from "./controller/layout/score-layout-plan";

/**
 * Responsible for controllong everything notation-wise
 */
export class NotationComponent {
  /** Root div element */
  readonly rootDiv: HTMLDivElement;
  /** Score */
  readonly score: Score;
  /** Renderer */
  private _renderer: EditorRenderer;
  /** Resolved editor config */
  readonly config: ResolvedTabUIConfig;
  /** Layout dimensions */
  readonly layoutDimensions: EditorLayoutDimensions;
  /** Shared score-wide width and wrapped-range planner for active tracks. */
  readonly scoreLayoutPlanner: ScoreLayoutPlanner;

  /** Track controller */
  private _trackController: TrackController;
  /** Score-wide player owned by this notation component. */
  private readonly _scorePlayer: ScorePlayer;
  /** True after the notation component has been disposed. */
  private _disposed: boolean = false;
  /** Current mutation capability, including responsive restrictions. */
  private _editingEnabled: boolean;

  /**
   * Responsible for controllong everything notation-wise
   * @param rootDiv Root div element
   * @param score Score
   * @param renderer Renderer
   */
  constructor(
    notationHostDiv: HTMLDivElement,
    score: Score,
    config: ResolvedTabUIConfig,
    layoutDimensions: EditorLayoutDimensions,
    onPlaybackError?: PlaybackErrorListener,
    renderer?: EditorRenderer
  ) {
    this.score = score;
    this.rootDiv = notationHostDiv;
    this.config = config;
    this.layoutDimensions = layoutDimensions;
    this._editingEnabled =
      this.config.interaction.mode === TabUIEditorMode.Edit;
    this.scoreLayoutPlanner = new ScoreLayoutPlanner(
      this.score,
      this.layoutDimensions
    );
    this._scorePlayer = new ScorePlayer(
      this.score,
      this.score.tracks[0],
      this.config.playback,
      onPlaybackError
    );
    void this._scorePlayer.initialize();
    this._trackController = new TrackController(
      this.score.tracks[0],
      this.layoutDimensions,
      this._scorePlayer,
      this._editingEnabled,
      this.scoreLayoutPlanner,
      this.config.layout.mode
    );
    this._renderer =
      renderer === undefined
        ? new EditorSVGRenderer(
            this.rootDiv,
            this._trackController,
            this.config.assets
          )
        : renderer;
  }

  /**
   * Render current track
   * @returns Active renderers
   */
  public render(options?: EditorRenderOptions): ElementRenderer[] {
    return this._renderer.render(options);
  }

  /**
   * Loads & renders new track
   * @param newTrack New track
   * @returns Active renderers
   */
  public loadTrack(newTrack: Track): ElementRenderer[] {
    const newTrackPlaybackBeat =
      this._scorePlayer.getCurrentBeatForTrack(newTrack);
    const previousScrollLeft = this.rootDiv.scrollLeft;
    const previousScrollTop = this.rootDiv.scrollTop;
    this._renderer.dispose();

    // Render new stuff
    const newTrackController = new TrackController(
      newTrack,
      this.layoutDimensions,
      this._scorePlayer,
      this._editingEnabled,
      this.scoreLayoutPlanner,
      this.config.layout.mode
    );
    this._trackController = newTrackController;
    const renderer = new EditorSVGRenderer(
      this.rootDiv,
      this._trackController,
      this.config.assets
    );
    this._renderer = renderer;
    this.rootDiv.scrollLeft = previousScrollLeft;
    this.rootDiv.scrollTop = previousScrollTop;
    if (newTrackPlaybackBeat !== undefined) {
      renderer.ensureBeatVisible(newTrackPlaybackBeat, true);
    }
    const activeRenderers = renderer.render();
    this._scorePlayer.setActiveTrack(newTrack);
    return activeRenderers;
  }

  public dispose(): void {
    if (this._disposed) {
      return;
    }

    this._disposed = true;
    this._renderer.dispose();
    this._scorePlayer.dispose();
  }

  /** Rebuilds active-track geometry after explicit host layout refresh. */
  public refreshLayout(): void {
    this._trackController.trackElement.refreshLayout();
  }

  /** Materializes and follows the current model-level selection cursor. */
  public ensureSelectedNoteVisible(): void {
    const selectedBeat = this._trackController.selectionCursor?.beat;
    if (selectedBeat !== undefined) {
      this._renderer.ensureBeatVisible(selectedBeat, true);
    }
  }

  /** Applies the current runtime mutation capability to active and future tracks. */
  public setEditingEnabled(editingEnabled: boolean): void {
    this._editingEnabled = editingEnabled;
    this._trackController.setEditingEnabled(editingEnabled);
  }

  /**
   * Removes track & renders the track before/after the removed one
   * @param track Track to remove
   * @returns Active renderers
   */
  public removeTrack(track: Track): ElementRenderer[] | undefined {
    const newTrack = this._trackController.removeTrack(this.score, track);
    if (newTrack === undefined) {
      return undefined;
    }

    return this.loadTrack(newTrack);
  }

  /** Track controller */
  public get trackController(): TrackController {
    return this._trackController;
  }

  public get renderer(): EditorRenderer {
    return this._renderer;
  }
}
