import {
  EditorMouseCallbacks,
  EditorKeyboardCallbacks,
  EditorCallbackBinder,
  EditorMouseDefCallbacks,
  EditorKeyboardDefCallbacks,
} from "@/callbacks/editor";
import { TabController, TabControllerDim } from "./element";
import { Score, Tab } from "./model";
import { EditorSVGRenderer, EditorRenderer } from "./render";
import { ElementRenderer } from "./render/element-renderer";

/**
 * Responsible for controllong everything notation-wise
 */
export class NotationComponent {
  private _tabController: TabController;

  readonly rootDiv: HTMLDivElement;
  readonly renderer: EditorRenderer;

  constructor(
    tabController: TabController,
    rootDiv: HTMLDivElement,
    renderer?: EditorRenderer
  ) {
    this._tabController = tabController;

    this.rootDiv = rootDiv;

    this.renderer =
      renderer === undefined
        ? new EditorSVGRenderer(this.rootDiv, import.meta.env.BASE_URL)
        : renderer;
  }

  public render(): ElementRenderer[] {
    return this.renderer.render(this._tabController);
  }

  public loadTrack(newTrack: Tab): ElementRenderer[] {
    this.renderer.unrender();

    // Render new stuff
    const newTabController = new TabController(
      this._tabController.score,
      newTrack,
      this._tabController.dim
    );
    this._tabController = newTabController;
    return this.renderer.render(this._tabController);
  }

  public removeTrack(track: Tab): ElementRenderer[] {
    // Reaaaallly bad, but until the model is fixed, this is how it will be
    const trackIndex = this._tabController.score.tracks.indexOf(track);
    if (trackIndex === -1) {
      throw new Error("Track not in score");
    }

    const trackBefore = this._tabController.score.tracks[trackIndex - 1];
    const trackAfter = this._tabController.score.tracks[trackIndex + 1];
    if (trackBefore === undefined && trackAfter === undefined) {
      throw new Error("Empty score currently unhandled");
    }
    const newTrack = trackBefore !== undefined ? trackBefore : trackAfter;

    this._tabController.score.removeTab(track);

    return this.loadTrack(newTrack);
  }

  public get tabController(): TabController {
    return this._tabController;
  }
}

/**
 * This class should handle
 * - Rendering SVG
 * - Editing model data
 * - Bind event handlers
 */

function buildDefaultDim(tab: Tab): TabControllerDim {
  const dim = new TabControllerDim(
    1200, // width
    14, // noteTextSize
    42, // timeSigTextSize
    28, // tempoTextSize
    40, // durationsHeight
    tab.guitar.stringsCount
  );

  return dim;
}
