import {
  TabWindow,
  TabWindowDim,
  TabWindowSVGRenderer,
  TabWindowCallbackBinder,
  TabWindowMouseDefCallbacks,
  TabWindowKeyboardDefCallbacks,
  SVGBarRenderer,
  SVGBeatRenderer,
  SVGNoteRenderer,
  Score,
} from ".";
import { BendSelectorManager } from "./tab-window/render/bend-selectors/bend-selector-manager";
import { EditPanel } from "./tab-window/render/panels/edit-panel";

export interface TabUIOptions {
  svgRoot: SVGSVGElement;
  bendGraphModal: HTMLDivElement;
  sideControls: HTMLDivElement;
  assetsPath: string;
}

export class TabUI {
  private score: Score;
  private tabWindow!: TabWindow;
  private svgRenderer!: TabWindowSVGRenderer;
  private binder!: TabWindowCallbackBinder;
  private bendSelectorManager!: BendSelectorManager;
  private editPanel!: EditPanel;

  constructor(score: Score, private options: TabUIOptions) {
    this.score = score;
  }

  public loadTrack(trackIndex: number): void {
    const tab = this.score.tracks[trackIndex];

    // Create TabWindow
    const dim = new TabWindowDim(
      1200, // width
      14, // noteTextSize
      42, // timeSigTextSize
      28, // tempoTextSize
      40, // durationsHeight
      tab.guitar.stringsCount
    );
    this.tabWindow = new TabWindow(this.score, tab, dim);
    this.tabWindow.selectNoteElementUsingIds(0, 0, 0, 0);

    // Set SVG root properties
    let tabWindowHeight = 0;
    const tabLineElements = this.tabWindow.getTabLineElements();
    for (const tabLineElement of tabLineElements) {
      tabWindowHeight += tabLineElement.rect.height;
    }
    const svgRootVB = `0 0 ${this.tabWindow.dim.width} ${tabWindowHeight}`;
    this.options.svgRoot.setAttribute("viewBox", svgRootVB);
    this.options.svgRoot.setAttribute("width", `${this.tabWindow.dim.width}`);
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
    this.svgRenderer = new TabWindowSVGRenderer(
      this.tabWindow,
      this.options.assetsPath,
      this.options.svgRoot
    );
    this.bendSelectorManager = new BendSelectorManager(
      this.options.bendGraphModal
    );

    this.binder = new TabWindowCallbackBinder(
      new TabWindowMouseDefCallbacks(this.svgRenderer, () =>
        this.renderAndBind(this.svgRenderer.render())
      ),
      new TabWindowKeyboardDefCallbacks(
        this.svgRenderer,
        () => this.renderAndBind(this.svgRenderer.render()),
        this.bendSelectorManager
      )
    );

    this.renderAndBind(this.svgRenderer.render());

    // Create edit panel
    this.editPanel = new EditPanel(
      this.tabWindow,
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
    this.tabWindow.startPlayer();
  }

  public pause(): void {
    this.tabWindow.stopPlayer();
  }

  public stop(): void {
    this.tabWindow.stopPlayer();
  }

  public setLooped(): void {
    this.tabWindow.setLooped();
  }

  public getIsLooped(): boolean {
    return this.tabWindow.getIsLooped();
  }
}