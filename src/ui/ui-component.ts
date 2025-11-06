import { NotationComponent } from "@/notation/notation-component";
import { SideControlsComponent } from "./side-controls/side-contros-component";
import { TopControlsComponent } from "./top-controls";
import "./styles.scss";

export class UIComponent {
  readonly rootDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly topComponent: TopControlsComponent;
  readonly sideComponent: SideControlsComponent;

  constructor(rootDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.rootDiv = rootDiv;
    this.notationComponent = notationComponent;

    this.topComponent = new TopControlsComponent(
      this.rootDiv,
      this.notationComponent
    );
    this.sideComponent = new SideControlsComponent(
      this.rootDiv,
      this.notationComponent
    );
  }

  public render(): void {
    this.notationComponent.rootDiv.classList.add("tu-editor");

    this.topComponent.render();
    this.sideComponent.render();
  }
}

// /**
//  * Initializes TabUI UI controls:
//  * - Note buttons
//  * - Effect buttons
//  * - Measure buttons
//  * - Top controls (play controls + track selector)
//  * @param notationComponent Notation view (for event binding)
//  */
// export function initUI(notationComponent: NotationComponent): void {
//   notationComponent.rootDiv.classList.add("tu-editor");

//   initTopControls(notationComponent);
//   initSideControls(notationComponent);
// }

// export class UIView {
//   // readonly score: Score;
//   private _tabController: TabController;

//   readonly rootDiv: HTMLDivElement;

//   constructor(
//     // score: Score,
//     tabController: TabController,
//     rootDiv: HTMLDivElement
//   ) {
//     this._tabController = tabController;
//     // this.score = score;

//     this.rootDiv = rootDiv;
//   }

//   public init(): void {
//     initNoteControls()
//   }
// }

// /**
//  * TabUI entry point.
//  * Responsible for initializing UI, renderers, events etc
//  */
// export class TabUIEditor {
//   readonly rootDiv: HTMLDivElement;
//   readonly score: Score;
//   readonly notationComponent: NotationComponent;

//   constructor(rootDiv: HTMLDivElement, score: Score) {
//     this.rootDiv = rootDiv;
//     this.score = score;
//     this.editor = new Editor(rootDiv, this.score);
//   }

//   /**
//    * Initializes TabUI Editor
//    */
//   init(): void {
//     // Step 1. Initialize basic controls
//     initNoteControls();
//   }
// }
