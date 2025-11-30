import { NoteElement, TrackController } from "@/notation/controller";
import { ElementRenderer } from "../element-renderer";

export interface SVGNoteRenderer {
  readonly trackController: TrackController;
  render(...params: any): ElementRenderer[] | void;
  unrender(): void;

  attachMouseEvent<K extends keyof SVGElementEventMap>(
    eventType: K,
    eventHandler: (
      event: SVGElementEventMap[K],
      noteElement: NoteElement
    ) => void
  ): void;
}
