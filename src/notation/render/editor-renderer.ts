import { NoteElement, TrackController } from "../controller";
import { ElementRenderer } from "./element-renderer";

export interface EditorRenderer {
  showSelectionPreview(noteElement: NoteElement): void;
  hideSelectionPreview(): void;

  render(trackController: TrackController): ElementRenderer[];
  unrender(): void;
}
