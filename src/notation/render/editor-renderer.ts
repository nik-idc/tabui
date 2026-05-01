import { BeatElement, NoteElement } from "../controller";
import { ElementRenderer } from "./element-renderer";

export interface EditorRenderer {
  showSelectionPreview(noteElement: NoteElement): void;
  hideSelectionPreview(): void;

  attachBeatInteractionEvent<K extends keyof SVGElementEventMap>(
    eventType: K,
    eventHandler: (
      event: SVGElementEventMap[K],
      beatElement: BeatElement
    ) => void
  ): void;

  detachBeatInteractionEvent<K extends keyof SVGElementEventMap>(
    eventType: K
  ): void;

  attachViewportScrollEvent(eventHandler: (event: Event) => void): void;

  render(): ElementRenderer[];
  renderSelectionOverlay(): void;
  unrender(): void;
  dispose(): void;
}
