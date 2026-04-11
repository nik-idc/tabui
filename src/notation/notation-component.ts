import { Score, Track } from "./model";
import { EditorSVGRenderer, EditorRenderer } from "./render";
import { ElementRenderer } from "./render/element-renderer";
import { TrackController } from "./controller";
import { ResolvedTabUIConfig } from "@/config/tabui-config";

/**
 * Responsible for controllong everything notation-wise
 */
export class NotationComponent {
  /** Root div element */
  readonly rootDiv: HTMLDivElement;
  /** Score */
  readonly score: Score;
  /** Renderer */
  readonly renderer: EditorRenderer;
  /** Resolved editor config */
  readonly config: ResolvedTabUIConfig;

  /** Track controller */
  private _trackController: TrackController;

  /**
   * Responsible for controllong everything notation-wise
   * @param rootDiv Root div element
   * @param score Score
   * @param renderer Renderer
   */
  constructor(
    rootDiv: HTMLDivElement,
    score: Score,
    config: ResolvedTabUIConfig,
    renderer?: EditorRenderer
  ) {
    this.score = score;
    this.rootDiv = rootDiv;
    this.config = config;
    this.renderer =
      renderer === undefined
        ? new EditorSVGRenderer(this.rootDiv, this.config.assets)
        : renderer;

    this._trackController = new TrackController(this.score.tracks[0]);
  }

  /**
   * Render current track
   * @returns Active renderers
   */
  public render(): ElementRenderer[] {
    return this.renderer.render(this._trackController);
  }

  /**
   * Loads & renders new track
   * @param newTrack New track
   * @returns Active renderers
   */
  public loadTrack(newTrack: Track): ElementRenderer[] {
    this._trackController.dispose();
    this.renderer.unrender();

    // Render new stuff
    const newTrackController = new TrackController(newTrack);
    this._trackController = newTrackController;
    this._trackController.trackElement.update();
    return this.renderer.render(this._trackController);
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
}
