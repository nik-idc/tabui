import { Score, TabController } from "@/notation";
import { initNoteControls } from "./side-controls/note-controls";
import { NotationView } from "@/notation/notation-view";
import { initEffectControls } from "./side-controls/effect-controls";
import { initMeasureControls } from "./side-controls/measure-controls";
import { initTopControls } from "./top-controls";
import "./styles.scss";
import { initSideControls } from "./side-controls/side-controls";

/**
 * Initializes TabUI UI controls:
 * - Note buttons
 * - Effect buttons
 * - Measure buttons
 * - Top controls (play controls + track selector)
 * @param notationView Notation view (for event binding)
 */
export function initUI(notationView: NotationView): void {
  notationView.rootDiv.classList.add("tu-editor");

  initTopControls(notationView);
  initSideControls(notationView);
}

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
//   readonly notationView: NotationView;

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
