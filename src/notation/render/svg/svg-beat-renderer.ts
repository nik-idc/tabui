import { BeatElement, TrackController } from "@/notation/controller";

/**
 * Class for rendering a beat element using SVG
 */
export interface SVGBeatRenderer {
  readonly trackController: TrackController;
  beatElement: BeatElement;

  ensureContainerGroup(): SVGGElement;
  detachContainerGroup(): void;

  render(): void;
  unrender(): void;

  attachMouseEvent<K extends keyof SVGElementEventMap>(
    eventType: K,
    eventHandler: (
      event: SVGElementEventMap[K],
      beatElement: BeatElement
    ) => void
  ): void;

  detachMouseEvent<K extends keyof SVGElementEventMap>(eventType: K): void;
  detachAllMouseEvents(): void;
}
