import { TabController, TabControllerDim } from "./element";
import { Score, Tab } from "./model";
import {
  EditorSVGRenderer,
  EditorCallbackBinder,
  EditorMouseDefCallbacks,
  EditorKeyboardDefCallbacks,
  EditorMouseCallbacks,
  EditorKeyboardCallbacks,
  EditorRenderer,
} from "./render";
import { ElementRenderer } from "./render/element-renderer";

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

/**
 * Responsible for controllong everything notation-wise
 */
export class NotationView {
  private _tabController: TabController;

  readonly rootDiv: HTMLDivElement;
  readonly renderer: EditorRenderer;

  private _mouseCallbacks: EditorMouseCallbacks;
  private _keyboardCallbacks: EditorKeyboardCallbacks;
  private _callbacksBinder: EditorCallbackBinder;

  constructor(
    tabController: TabController,
    rootDiv: HTMLDivElement,
    renderer?: EditorRenderer,
    mouseCallbacks?: EditorMouseCallbacks,
    keyboardCallbacks?: EditorKeyboardCallbacks
  ) {
    this._tabController = tabController;

    this.rootDiv = rootDiv;

    this.renderer =
      renderer === undefined
        ? new EditorSVGRenderer(this.rootDiv, import.meta.env.BASE_URL)
        : renderer;

    this._mouseCallbacks =
      mouseCallbacks === undefined
        ? new EditorMouseDefCallbacks(
            this.renderer,
            this._tabController,
            this.bindAfterRender.bind(this)
          )
        : mouseCallbacks;
    this._keyboardCallbacks =
      keyboardCallbacks === undefined
        ? new EditorKeyboardDefCallbacks(
            this.renderer,
            this._tabController,
            this.bindAfterRender.bind(this)
          )
        : keyboardCallbacks;
    this._callbacksBinder = new EditorCallbackBinder();
  }

  public bindAfterRender(activeRenderers: ElementRenderer[]): void {
    this._callbacksBinder.dispose();
    this._callbacksBinder.bind(
      this._mouseCallbacks,
      this._keyboardCallbacks,
      activeRenderers
    );
  }

  public renderAndBind(): void {
    const activeRenderers = this.renderer.render(this._tabController);

    // Dispose old events & bind new ones
    this._callbacksBinder.dispose();
    this._callbacksBinder.bind(
      this._mouseCallbacks,
      this._keyboardCallbacks,
      activeRenderers
    );
  }

  public loadTrack(newTabController: TabController): void {
    this.renderer.unrender();

    // Render new stuff
    // const controller = this.buildTabController(trackIndex);
    this._tabController = newTabController;
    const activeRenderers = this.renderer.render(this._tabController);

    this._mouseCallbacks = new EditorMouseDefCallbacks(
      this.renderer,
      this._tabController,
      this.bindAfterRender.bind(this)
    );

    this._keyboardCallbacks = new EditorKeyboardDefCallbacks(
      this.renderer,
      this._tabController,
      this.bindAfterRender.bind(this)
    );

    this._callbacksBinder.dispose();
    this._callbacksBinder = new EditorCallbackBinder();
    this._callbacksBinder.bind(
      this._mouseCallbacks,
      this._keyboardCallbacks,
      activeRenderers
    );
  }

  public get tabController(): TabController {
    return this._tabController;
  }
}
