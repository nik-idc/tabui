import { BeatElement, NoteElement, TrackController } from "../controller";
import { ElementRenderer } from "./element-renderer";

export interface EditorRenderer {
  showSelectionPreview(noteElement: NoteElement): void;
  hideSelectionPreview(): void;

  attachBeatInteractionEvent<K extends keyof SVGElementEventMap>(
    eventType: K,
    eventHandler: (event: SVGElementEventMap[K], beatElement: BeatElement) => void
  ): void;

  attachViewportScrollEvent(
    eventHandler: (event: Event) => void
  ): void;

  render(trackController: TrackController): ElementRenderer[];
  renderSelectionOverlay(trackController: TrackController): void;
  unrender(): void;
}
