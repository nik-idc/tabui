import { NoteElement } from "@/notation/controller";
import { ElementRenderer } from "../element-renderer";

export interface SVGNoteRenderer {
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
