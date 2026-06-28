import {
  BeatElement,
  NotationElement,
  TrackController,
} from "@/notation/controller";
import { TabBeatElement } from "@/notation/controller/element/beat/tab-beat-element";
import { createSVGRect } from "@/shared";

export class BeatInteractionRenderer {
  readonly trackController: TrackController;

  private _interactionGroup: SVGGElement;
  private _beatInteractionRects: Map<number, SVGRectElement>;
  private _beatInteractionEvents: Map<string, EventListener>;

  constructor(interactionGroup: SVGGElement, trackController: TrackController) {
    this.trackController = trackController;

    this._interactionGroup = interactionGroup;
    this._beatInteractionRects = new Map();
    this._beatInteractionEvents = new Map();
  }

  public render(visibleElements: NotationElement[]): void {
    const activeBeatUUIDs = new Set<number>();

    for (const element of visibleElements) {
      if (!(element instanceof TabBeatElement)) {
        continue;
      }
      if (
        element.beat.voiceBar.voiceNumber !==
        this.trackController.activeVoiceNumber
      ) {
        continue;
      }

      const modelUUID = element.beat.uuid;
      activeBeatUUIDs.add(modelUUID);

      let rect = this._beatInteractionRects.get(modelUUID);
      if (rect === undefined) {
        rect = createSVGRect();
        rect.setAttribute("fill", "transparent");
        rect.setAttribute("stroke", "none");
        rect.setAttribute("pointer-events", "all");
        rect.setAttribute("data-beat-uuid", `${modelUUID}`);
        this._interactionGroup.appendChild(rect);
        this._beatInteractionRects.set(modelUUID, rect);
      }

      const globalBoundingBox = element.globalBoundingBox;
      rect.setAttribute("x", `${globalBoundingBox.x}`);
      rect.setAttribute("y", `${globalBoundingBox.y}`);
      rect.setAttribute("width", `${globalBoundingBox.width}`);
      rect.setAttribute("height", `${globalBoundingBox.height}`);
    }

    for (const [modelUUID, rect] of this._beatInteractionRects) {
      if (activeBeatUUIDs.has(modelUUID)) {
        continue;
      }

      this._interactionGroup.removeChild(rect);
      this._beatInteractionRects.delete(modelUUID);
    }
  }

  public attachEvent<K extends keyof SVGElementEventMap>(
    eventType: K,
    eventHandler: (
      event: SVGElementEventMap[K],
      beatElement: BeatElement
    ) => void
  ): void {
    const listener = (event: Event): void => {
      const eventTarget = event.target;
      if (!(eventTarget instanceof Element)) {
        return;
      }

      const beatRect = eventTarget.closest("[data-beat-uuid]");
      if (!(beatRect instanceof SVGRectElement)) {
        return;
      }

      const beatUUID = Number(beatRect.dataset["beatUuid"]);
      if (Number.isNaN(beatUUID)) {
        return;
      }

      const element =
        this.trackController.trackElement.getBeatElementByUUID(beatUUID);
      if (!(element instanceof TabBeatElement)) {
        return;
      }

      eventHandler(event as SVGElementEventMap[K], element);
    };

    const oldListener = this._beatInteractionEvents.get(eventType);
    if (oldListener !== undefined) {
      this._interactionGroup.removeEventListener(eventType, oldListener);
    }

    this._interactionGroup.addEventListener(eventType, listener);
    this._beatInteractionEvents.set(eventType, listener);
  }

  public detachEvent<K extends keyof SVGElementEventMap>(eventType: K): void {
    const listener = this._beatInteractionEvents.get(eventType);
    if (listener === undefined) {
      return;
    }

    this._interactionGroup.removeEventListener(eventType, listener);
    this._beatInteractionEvents.delete(eventType);
  }

  public unrender(): void {
    for (const rect of this._beatInteractionRects.values()) {
      this._interactionGroup.removeChild(rect);
    }
    this._beatInteractionRects.clear();

    for (const [eventType, listener] of this._beatInteractionEvents) {
      this._interactionGroup.removeEventListener(eventType, listener);
    }
    this._beatInteractionEvents.clear();
  }
}
