import { NoteElement, TabController } from "../element";
import { ElementRenderer } from "./element-renderer";

export interface EditorRenderer {
  render(tabController: TabController): ElementRenderer[];

  hideSelectionPreview(): void;
  showSelectionPreview(
    tabController: TabController,
    noteElement: NoteElement
  ): void;

  unrender(): void;
}
