import { NoteElement, TrackController } from "../../controller";

export interface SVGNoteRenderer {
  readonly trackController: TrackController;

  ensureContainerGroup(): SVGGElement;
  detachContainerGroup(): void;

  render(): void;
  unrender(): void;

  attachMouseEvent<K extends keyof SVGElementEventMap>(
    eventType: K,
    eventHandler: (
      event: SVGElementEventMap[K],
      noteElement: NoteElement
    ) => void
  ): void;

  detachMouseEvent<K extends keyof SVGElementEventMap>(eventType: K): void;
  detachAllMouseEvents(): void;
}
