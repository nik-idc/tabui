// export interface TabUIOptions {
//   svgRoot: SVGSVGElement;
//   bendGraphModal: HTMLDivElement;
//   sideControls: HTMLDivElement;
//   assetsPath: string;
// }

// /**
//  * Host of the editor. Accepts a div element inside of which
//  * the tab editor will be constructed
//  */
// export class EditorHost {
//   private _rootDiv: HTMLDivElement;

//   constructor(rootDiv: HTMLDivElement) {
//     this._rootDiv = rootDiv;
//   }
// }

import {
  Score,
  TabController,
  EditorSVGRenderer,
  EditorCallbackBinder,
  TabControllerDim,
  EditorMouseDefCallbacks,
  EditorKeyboardDefCallbacks,
  SVGBarRenderer,
  SVGBeatRenderer,
  SVGNoteRenderer,
} from "@/notation";
import { BendSelectorManager, EditPanel } from "@/ui";

export interface EditorOptions {
  svgRoot: SVGSVGElement;
  bendGraphModal: HTMLDivElement;
  sideControls: HTMLDivElement;
  assetsPath: string;
}

export class Editor {
  private score: Score;
  private tabController!: TabController;
  private svgRenderer!: EditorSVGRenderer;
  private binder!: EditorCallbackBinder;
  private bendSelectorManager!: BendSelectorManager;
  private editPanel!: EditPanel;

  constructor(score: Score, private options: EditorOptions) {
    this.score = score;
  }

  public loadTrack(trackIndex: number): void {
    const tab = this.score.tracks[trackIndex];

    // Create TabController
    const dim = new TabControllerDim(
      1200, // width
      14, // noteTextSize
      42, // timeSigTextSize
      28, // tempoTextSize
      40, // durationsHeight
      tab.guitar.stringsCount
    );
    this.tabController = new TabController(this.score, tab, dim);
    this.tabController.selectNoteElementUsingIds(0, 0, 0, 0);

    // Set SVG root properties
    let tabWindowHeight = 0;
    const tabLineElements = this.tabController.getTabLineElements();
    for (const tabLineElement of tabLineElements) {
      tabWindowHeight += tabLineElement.rect.height;
    }
    const svgRootVB = `0 0 ${this.tabController.dim.width} ${tabWindowHeight}`;
    this.options.svgRoot.setAttribute("viewBox", svgRootVB);
    this.options.svgRoot.setAttribute(
      "width",
      `${this.tabController.dim.width}`
    );
    this.options.svgRoot.setAttribute("height", `${tabWindowHeight}`);

    // Unrender what's been already rendered
    if (this.svgRenderer !== undefined) {
      this.svgRenderer.unrender();
    }

    // Dispose old binder
    if (this.binder !== undefined) {
      this.binder.dispose();
    }

    // Dispose old edit panel
    if (this.editPanel !== undefined) {
      this.editPanel.dispose();
    }

    // Create renderers and binders
    this.svgRenderer = new EditorSVGRenderer(
      this.tabController,
      this.options.assetsPath,
      this.options.svgRoot
    );
    this.bendSelectorManager = new BendSelectorManager(
      this.options.bendGraphModal
    );

    this.binder = new EditorCallbackBinder(
      new EditorMouseDefCallbacks(this.svgRenderer, () =>
        this.renderAndBind(this.svgRenderer.render())
      ),
      new EditorKeyboardDefCallbacks(
        this.svgRenderer,
        () => this.renderAndBind(this.svgRenderer.render()),
        this.bendSelectorManager
      )
    );

    this.renderAndBind(this.svgRenderer.render());

    // Create edit panel
    this.editPanel = new EditPanel(
      this.tabController,
      this.options.sideControls,
      () => this.renderAndBind(this.svgRenderer.render()),
      this.bendSelectorManager
    );
    this.editPanel.bind();
  }

  private renderAndBind(
    activeRenderers: (SVGBarRenderer | SVGBeatRenderer | SVGNoteRenderer)[]
  ): void {
    if (this.binder) {
      this.binder.bind(activeRenderers);
    }
  }

  public play(): void {
    this.tabController.startPlayer();
  }

  public pause(): void {
    this.tabController.stopPlayer();
  }

  public stop(): void {
    this.tabController.stopPlayer();
  }

  public setLooped(): void {
    this.tabController.setLooped();
  }

  public getIsLooped(): boolean {
    return this.tabController.getIsLooped();
  }
}
