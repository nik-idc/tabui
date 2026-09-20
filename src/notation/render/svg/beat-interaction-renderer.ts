import {
  BarElement,
  BeatElement,
  NotationElement,
  TrackController,
} from "../../controller";
import { TabBeatElement } from "../../controller/element/beat/tab-beat-element";
import { createSVGRect, createSVGText } from "../../../shared";

export class BeatInteractionRenderer {
  readonly trackController: TrackController;

  private _interactionGroup: SVGGElement;
  private _beatInteractionRects: Map<number, SVGRectElement>;
  private _beatInteractionEvents: Map<string, EventListener>;
  private _endGapRects: Map<number, SVGRectElement>;
  private _endGapHints: Map<number, SVGTextElement>;
  private _endGapElements: Map<number, BarElement>;

  constructor(interactionGroup: SVGGElement, trackController: TrackController) {
    this.trackController = trackController;

    this._interactionGroup = interactionGroup;
    this._beatInteractionRects = new Map();
    this._beatInteractionEvents = new Map();
    this._endGapRects = new Map();
    this._endGapHints = new Map();
    this._endGapElements = new Map();
  }

  public render(visibleElements: NotationElement[]): void {
    this._interactionGroup.setAttribute(
      "data-playback-active",
      `${this.trackController.isPlaybackActive}`
    );
    const activeBeatUUIDs = new Set<number>();
    const activeEndGapUUIDs = new Set<number>();

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

      const globalBoundingBox = element.getGlobalVisualBounds();
      rect.setAttribute("x", `${globalBoundingBox.x}`);
      rect.setAttribute("y", `${globalBoundingBox.y}`);
      rect.setAttribute("width", `${globalBoundingBox.width}`);
      rect.setAttribute("height", `${globalBoundingBox.height}`);
    }

    for (const element of visibleElements) {
      if (!(element instanceof BarElement)) {
        continue;
      }
      const voiceBar = element.bar.getVoiceBar(
        this.trackController.activeVoiceNumber
      );
      if (voiceBar === null || voiceBar.actualTicks >= voiceBar.barTicks) {
        continue;
      }

      const modelUUID = element.bar.uuid;
      activeEndGapUUIDs.add(modelUUID);
      this._endGapElements.set(modelUUID, element);
      let rect = this._endGapRects.get(modelUUID);
      if (rect === undefined) {
        rect = createSVGRect();
        rect.setAttribute("fill", "transparent");
        rect.setAttribute("stroke", "none");
        rect.setAttribute("pointer-events", "all");
        rect.setAttribute("data-bar-end-gap-uuid", `${modelUUID}`);
        this._interactionGroup.appendChild(rect);
        this._endGapRects.set(modelUUID, rect);

        const hint = createSVGText();
        hint.textContent = "+";
        hint.setAttribute("class", "tu-end-gap-hint");
        hint.setAttribute("aria-hidden", "true");
        hint.setAttribute("pointer-events", "none");
        hint.setAttribute("text-anchor", "middle");
        hint.setAttribute("dominant-baseline", "central");
        hint.setAttribute("fill", "var(--tu-notation-ink)");
        hint.setAttribute("font-size", "20");
        this._interactionGroup.appendChild(hint);
        this._endGapHints.set(modelUUID, hint);
      }

      const barBounds = element.globalBoundingBox;
      // Extend two gap widths into the bar without changing its layout.
      const targetWidth = element.endGap.width * 3;
      const targetX = barBounds.right - targetWidth;
      rect.setAttribute("x", `${targetX}`);
      rect.setAttribute("y", `${barBounds.y}`);
      rect.setAttribute("width", `${targetWidth}`);
      rect.setAttribute("height", `${barBounds.height}`);
      const hint = this._endGapHints.get(modelUUID)!;
      hint.setAttribute("x", `${targetX + targetWidth / 2}`);
      const staffLines = element.staffLinesGlobal;
      const firstStaffLine = staffLines[0];
      const lastStaffLine = staffLines[staffLines.length - 1];
      hint.setAttribute("y", `${(firstStaffLine.y + lastStaffLine.y) / 2}`);
    }

    for (const [modelUUID, rect] of this._beatInteractionRects) {
      if (activeBeatUUIDs.has(modelUUID)) {
        continue;
      }

      this._interactionGroup.removeChild(rect);
      this._beatInteractionRects.delete(modelUUID);
    }
    for (const [modelUUID, rect] of this._endGapRects) {
      if (activeEndGapUUIDs.has(modelUUID)) {
        continue;
      }
      this._interactionGroup.removeChild(rect);
      this._endGapRects.delete(modelUUID);
      this._interactionGroup.removeChild(this._endGapHints.get(modelUUID)!);
      this._endGapHints.delete(modelUUID);
      this._endGapElements.delete(modelUUID);
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

      const endGapRect = eventTarget.closest("[data-bar-end-gap-uuid]");
      if (endGapRect instanceof SVGRectElement) {
        if (event.type !== "click") {
          return;
        }

        const barUUID = Number(endGapRect.dataset["barEndGapUuid"]);
        const barElement = this._endGapElements.get(barUUID);
        const voiceBar = barElement?.bar.getVoiceBar(
          this.trackController.activeVoiceNumber
        );
        const lastBeat = voiceBar?.beats[voiceBar.beats.length - 1];
        if (lastBeat === undefined) {
          return;
        }

        const element = this.trackController.getBeatElementByUUID(
          lastBeat.uuid
        );
        if (!(element instanceof TabBeatElement)) {
          return;
        }

        eventHandler(event as SVGElementEventMap[K], element);
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

      const element = this.trackController.getBeatElementByUUID(beatUUID);
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
    for (const rect of this._endGapRects.values()) {
      this._interactionGroup.removeChild(rect);
    }
    this._endGapRects.clear();
    for (const hint of this._endGapHints.values()) {
      this._interactionGroup.removeChild(hint);
    }
    this._endGapHints.clear();
    this._endGapElements.clear();

    for (const [eventType, listener] of this._beatInteractionEvents) {
      this._interactionGroup.removeEventListener(eventType, listener);
    }
    this._beatInteractionEvents.clear();
  }
}
