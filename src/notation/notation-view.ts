import { TemplateBuilder, BendSelectorManager, EditPanel } from "@/ui";
import { TabController, TabControllerDim } from "./element";
import { Score, Tab } from "./model";
import {
  EditorSVGRenderer,
  EditorCallbackBinder,
  EditorMouseDefCallbacks,
  EditorKeyboardDefCallbacks,
  SVGBarRenderer,
  SVGBeatRenderer,
  SVGNoteRenderer,
  EditorMouseCallbacks,
  EditorKeyboardCallbacks,
  EditorRenderer,
} from "./render";
import { createSVG } from "@/shared";
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
    this._callbacksBinder = new EditorCallbackBinder();

    // Dispose old events & bind new ones
    this._callbacksBinder.dispose();
    this._callbacksBinder.bind(
      this._mouseCallbacks,
      this._keyboardCallbacks,
      activeRenderers
    );
  }

  public get tabController(): TabController {
    return this._tabController;
  }

  public get mouseCallbacks(): TabController {
    return this._tabController;
  }

  public get keyboardCallbacks(): TabController {
    return this._tabController;
  }

  public get callbacksBinder(): TabController {
    return this._tabController;
  }

  // public setSelectedElementFret(newFret: number | undefined): void {
  //   this._tabController.setSelectedElementFret
  // }

  // public setSelectedBeatDots(newDots: number): void {}

  // public setSelectedBeatsTuplet(
  //   normalCount: number,
  //   tupletCount: number
  // ): void {}

  // public changeSelectedBarTempo(newTempo: number): void {}

  // public changeSelectedBarBeats(newBeats: number): void {}

  // public changeSelectedBarDuration(newDuration: NoteDuration): void {}

  // public setSelectedBarRepeatStart(): void {}

  // public setSelectedBarRepeatEnd(): void {}

  // public changeSelectedBeatDuration(newDuration: NoteDuration): void {}

  // public applyEffectSingle(
  //   effectType: GuitarEffectType,
  //   effectOptions?: GuitarEffectOptions
  // ): boolean {}

  // public removeEffectSingle(
  //   effectType: GuitarEffectType,
  //   effectOptions?: GuitarEffectOptions
  // ): void {}
}

// /**
//  * Responsible for controllong everything notation-wise
//  */
// export class _NotationView {
//   readonly rootDiv: HTMLDivElement;

//   private _score: Score;
//   private _tabController: TabController;
//   private _svgRenderer: EditorSVGRenderer;
//   private _binder: EditorCallbackBinder;
//   private _svgRoot: SVGSVGElement;
//   private _assetsPath: string;

//   constructor(rootDiv: HTMLDivElement, score: Score) {
//     this.rootDiv = rootDiv;
//     this._score = score;
//   }

//   public loadTrack(trackIndex: number): void {
//     const tab = this._score.tracks[trackIndex];

//     // Create TabController
//     const dim = new TabControllerDim(
//       1200, // width
//       14, // noteTextSize
//       42, // timeSigTextSize
//       28, // tempoTextSize
//       40, // durationsHeight
//       tab.guitar.stringsCount
//     );
//     this._tabController = new TabController(this._score, tab, dim);
//     this._tabController.selectNoteElementUsingIds(0, 0, 0, 0);

//     // Set SVG root properties
//     let tabWindowHeight = 0;
//     const tabLineElements = this._tabController.getTabLineElements();
//     for (const tabLineElement of tabLineElements) {
//       tabWindowHeight += tabLineElement.rect.height;
//     }
//     const svgRootVB = `0 0 ${this._tabController.dim.width} ${tabWindowHeight}`;
//     this._svgRoot.setAttribute("viewBox", svgRootVB);
//     this._svgRoot.setAttribute("width", `${this._tabController.dim.width}`);
//     this._svgRoot.setAttribute("height", `${tabWindowHeight}`);

//     // Unrender what's been already rendered
//     if (this._svgRenderer !== undefined) {
//       this._svgRenderer.unrender();
//     }

//     // Dispose old binder
//     if (this._binder !== undefined) {
//       this._binder.dispose();
//     }

//     // // Dispose old edit panel
//     // if (this._editPanel !== undefined) {
//     //   this._editPanel.dispose();
//     // }

//     // Create renderers and binders
//     this._svgRenderer = new EditorSVGRenderer(
//       this._tabController,
//       this._assetsPath,
//       this._svgRoot
//     );
//     // this._bendSelectorManager = new BendSelectorManager(
//     //   this._bendGraphModal
//     // );

//     this._binder = new EditorCallbackBinder(
//       new EditorMouseDefCallbacks(this._svgRenderer, () =>
//         this.bindAfterRender(this._svgRenderer.render())
//       ),
//       new EditorKeyboardDefCallbacks(
//         this._svgRenderer,
//         () => this.bindAfterRender(this._svgRenderer.render()),
//         this._bendSelectorManager
//       )
//     );

//     this.bindAfterRender(this._svgRenderer.render());

//     // // Create edit panel
//     // this._editPanel = new EditPanel(
//     //   this._tabController,
//     //   this._sideControls,
//     //   () => this.bindAfterRender(this._svgRenderer.render()),
//     //   this._bendSelectorManager
//     // );
//     // this._editPanel.bind();
//   }

//   private bindAfterRender(
//     activeRenderers: (SVGBarRenderer | SVGBeatRenderer | SVGNoteRenderer)[]
//   ): void {
//     if (this._binder) {
//       this._binder.bind(activeRenderers);
//     }
//   }

//   public init(): void {
//     // this._templateBuilder.build();
//     // this.loadTrack(0);
//   }

//   public play(): void {
//     this._tabController.startPlayer();
//   }

//   public pause(): void {
//     this._tabController.stopPlayer();
//   }

//   public stop(): void {
//     this._tabController.stopPlayer();
//   }

//   public setLooped(): void {
//     this._tabController.setLooped();
//   }

//   public getIsLooped(): boolean {
//     return this._tabController.getIsLooped();
//   }
// }
