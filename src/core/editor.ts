// import {
//   Score,
//   TabController,
//   EditorSVGRenderer,
//   EditorCallbackBinder,
//   TabControllerDim,
//   EditorMouseDefCallbacks,
//   EditorKeyboardDefCallbacks,
//   SVGBarRenderer,
//   SVGBeatRenderer,
//   SVGNoteRenderer,
// } from "@/notation";
// import { BendSelectorManager, EditPanel, TemplateBuilder } from "@/ui";

// export interface EditorOptions {
//   svgRoot: SVGSVGElement;
//   bendGraphModal: HTMLDivElement;
//   sideControls: HTMLDivElement;
//   assetsPath: string;
// }

// export class Editor {
//   readonly rootDiv: HTMLDivElement;

//   private _templateBuilder: TemplateBuilder;
//   private _score: Score;
//   private _tabController!: TabController;
//   private _svgRenderer!: EditorSVGRenderer;
//   private _binder!: EditorCallbackBinder;
//   private _bendSelectorManager!: BendSelectorManager;
//   private _editPanel!: EditPanel;
//   private _options: EditorOptions;

//   constructor(rootDiv: HTMLDivElement, score: Score, options: EditorOptions) {
//     this.rootDiv = rootDiv;
//     this._templateBuilder = new TemplateBuilder(this.rootDiv);
//     this._score = score;
//     this._options = options;
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
//     this._options.svgRoot.setAttribute("viewBox", svgRootVB);
//     this._options.svgRoot.setAttribute(
//       "width",
//       `${this._tabController.dim.width}`
//     );
//     this._options.svgRoot.setAttribute("height", `${tabWindowHeight}`);

//     // Unrender what's been already rendered
//     if (this._svgRenderer !== undefined) {
//       this._svgRenderer.unrender();
//     }

//     // Dispose old binder
//     if (this._binder !== undefined) {
//       this._binder.dispose();
//     }

//     // Dispose old edit panel
//     if (this._editPanel !== undefined) {
//       this._editPanel.dispose();
//     }

//     // Create renderers and binders
//     this._svgRenderer = new EditorSVGRenderer(
//       this._tabController,
//       this._options.assetsPath,
//       this._options.svgRoot
//     );
//     this._bendSelectorManager = new BendSelectorManager(
//       this._options.bendGraphModal
//     );

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

//     // Create edit panel
//     this._editPanel = new EditPanel(
//       this._tabController,
//       this._options.sideControls,
//       () => this.bindAfterRender(this._svgRenderer.render()),
//       this._bendSelectorManager
//     );
//     this._editPanel.bind();
//   }

//   private bindAfterRender(
//     activeRenderers: (SVGBarRenderer | SVGBeatRenderer | SVGNoteRenderer)[]
//   ): void {
//     if (this._binder) {
//       this._binder.bind(activeRenderers);
//     }
//   }

//   public init(): void {
//     this._templateBuilder.build();
//     this.loadTrack(0);
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
