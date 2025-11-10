import { NotationComponent } from "@/notation/notation-component";
import { SideControlsComponent } from "./side-controls/side-contros-component";
import { TopControlsComponent } from "./top-controls";
import "./styles.scss";

export class UIComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly topComponent: TopControlsComponent;
  readonly sideComponent: SideControlsComponent;

  constructor(parentDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.topComponent = new TopControlsComponent(
      this.parentDiv,
      this.notationComponent
    );
    this.sideComponent = new SideControlsComponent(
      this.parentDiv,
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
//   notationComponent.parentDiv.classList.add("tu-editor");

//   initTopControls(notationComponent);
//   initSideControls(notationComponent);
// }

// export class UIView {
//   // readonly score: Score;
//   private _tabController: TabController;

//   readonly parentDiv: HTMLDivElement;

//   constructor(
//     // score: Score,
//     tabController: TabController,
//     parentDiv: HTMLDivElement
//   ) {
//     this._tabController = tabController;
//     // this.score = score;

//     this.parentDiv = parentDiv;
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
//   readonly parentDiv: HTMLDivElement;
//   readonly score: Score;
//   readonly notationComponent: NotationComponent;

//   constructor(parentDiv: HTMLDivElement, score: Score) {
//     this.parentDiv = parentDiv;
//     this.score = score;
//     this.editor = new Editor(parentDiv, this.score);
//   }

//   /**
//    * Initializes TabUI Editor
//    */
//   init(): void {
//     // Step 1. Initialize basic controls
//     initNoteControls();
//   }
// }
