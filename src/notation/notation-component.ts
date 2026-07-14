import { Score, Track } from "./model";
import {
  EditorSVGRenderer,
  EditorRenderer,
  EditorRenderOptions,
} from "./render";
import { ElementRenderer } from "./render/element-renderer";
import { TrackController } from "./controller";
import { ResolvedTabUIConfig } from "../config/tabui-config";
import { EditorLayoutDimensions } from "./controller/editor-layout-dimensions";

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

  /** Track controller */
  private _trackController: TrackController;

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
    renderer?: EditorRenderer
  ) {
    this.score = score;
    this.rootDiv = notationHostDiv;
    this.config = config;
    this.layoutDimensions = layoutDimensions;
    this._trackController = new TrackController(
      this.score.tracks[0],
      this.layoutDimensions,
      this.config.playback
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
    this._trackController.dispose();
    this._renderer.dispose();

    // Render new stuff
    const newTrackController = new TrackController(
      newTrack,
      this.layoutDimensions,
      this.config.playback
    );
    this._trackController = newTrackController;
    this._renderer = new EditorSVGRenderer(
      this.rootDiv,
      this._trackController,
      this.config.assets
    );
    this._trackController.trackElement.update(0, Number.MAX_SAFE_INTEGER);
    return this._renderer.render();
  }

  public dispose(): void {
    this._trackController.dispose();
    this._renderer.dispose();
  }

  /**
   * Removes track & renders the track before/after the removed one
   * @param track Track to remove
   * @returns Active renderers
   */
  public removeTrack(track: Track): ElementRenderer[] {
    const trackIndex = this.score.tracks.indexOf(track);
    const newTrack = this.score.removeTrack(trackIndex);

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
