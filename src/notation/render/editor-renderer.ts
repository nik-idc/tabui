import { BeatElement, NoteElement } from "../controller";
import { ElementRenderer } from "./element-renderer";

export type EditorRenderOptions = {
  /**
   * Runs notation viewport reconciliation and element renderer updates.
   * Disable this for overlay-only refreshes such as drag selection feedback.
   */
  renderNotation: boolean;
  /**
   * Re-renders visible notation even when viewport and element diff state could
   * otherwise be reused. This is for controller-only presentation changes such
   * as active voice switching.
   */
  forceNotation: boolean;
  /** Overlay layers that can be refreshed after notation work or on their own. */
  overlays: {
    /** Selection preview, selected note, and selected beat rectangles. */
    selection: boolean;
    /** Playback cursor overlay. */
    player: boolean;
  };
};

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

  render(options?: EditorRenderOptions): ElementRenderer[];
  unrender(): void;
  dispose(): void;
}
