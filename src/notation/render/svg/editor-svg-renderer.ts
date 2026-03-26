import {
  BeatElement,
  NoteElement,
  NotationElement,
  TabLayoutDimensions,
  TrackController,
} from "@/notation/controller";
import { createSVG, createSVGG, createSVGRect, Rect } from "@/shared";
import { EditorRenderer } from "../editor-renderer";
import { TrackPlayerSVGAnimator } from "./player-svg-animator";
import { ElementRenderer } from "../element-renderer";
import { TabBeatElement } from "@/notation/controller/element/tab-beat-element";
import { ELEMENT_ORDER } from "@/notation/controller/element/track-element";
import { createRendererForElement } from "./support/renderer-factory";
import { rebindRendererElement } from "./support/renderer-rebinder";
import { SelectionOverlayRenderer } from "./selection-overlay-renderer";

/**
 * Render a track window using SVG
 */
export class EditorSVGRenderer implements EditorRenderer {
  /**
   * Static constant value defining how many track lines
   * to render before the first visible track line and after
   * the last visible track line
   */
  private static readonly VIEWPORT_OVERSCAN_LINES = 2;

  /** Root DIV element */
  readonly rootDiv: HTMLDivElement;
  /** Notation-only scroll viewport wrapper. */
  readonly notationViewportDiv: HTMLDivElement;
  /** Root SVG <svg> element */
  readonly rootSVGElement: SVGSVGElement;
  /** Path to any assets */
  readonly assetsPath: string;

  /** Selection overlay renderer (preview + note/beat selection visuals). */
  private _selectionOverlayRenderer: SelectionOverlayRenderer;
  /** Beat interaction layer (hitboxes + delegated events). */
  private _beatInteractionLayer: BeatInteractionLayer;

  /** Player animator */
  private _playerAnimator?: TrackPlayerSVGAnimator;
  /** Player cursor SVG rectangle */
  private _playerCursorRect?: SVGRectElement;

  /** Registry mapping model UUID to renderer. */
  private _rendererRegistry: Map<number, ElementRenderer>;
  /** Renderer UUIDs currently mounted in layer groups. */
  private _mountedRendererUUIDs: Set<number>;
  /** Viewport rectangle inside notation scroll container. */
  private _viewportRect: Rect;

  /** Layer groups - each element type lives in the dedicated SVG <g> element */
  private _layerGroups: Map<Function, SVGGElement>;
  /** Interaction-only layer for delegated beat hitbox events. */
  private _interactionSVGGroup: SVGGElement;
  /** Selection interaction layer (selection preview / selected note / beat rects). */
  private _selectionSVGGroup: SVGGElement;
  /** Player interaction layer (player cursor). */
  private _playerSVGGroup: SVGGElement;
  /** Viewport scroll listener. */
  private _viewportScrollListener?: EventListener;

  /**
   * Render a track window using SVG
   * @param rootDiv Root container element
   * @param assetsPath Path to assets
   */
  constructor(rootDiv: HTMLDivElement, assetsPath: string) {
    this.rootDiv = rootDiv;
    this.notationViewportDiv = document.createElement("div");
    this.notationViewportDiv.classList.add("tu-notation-viewport");
    this.rootSVGElement = createSVG();
    this.rootSVGElement.classList.add("tu-root-svg");
    this.notationViewportDiv.appendChild(this.rootSVGElement);
    this.rootDiv.appendChild(this.notationViewportDiv);

    this.assetsPath = assetsPath;

    this._layerGroups = this.createLayerGroupsByOrder();
    this._interactionSVGGroup = createSVGG();
    this._interactionSVGGroup.setAttribute("id", "tu-interaction");
    this._beatInteractionLayer = new BeatInteractionLayer(
      this._interactionSVGGroup
    );
    this._selectionSVGGroup = createSVGG();
    this._selectionSVGGroup.setAttribute("id", "tu-selection");
    this._selectionOverlayRenderer = new SelectionOverlayRenderer(
      this._selectionSVGGroup
    );
    this._playerSVGGroup = createSVGG();
    this._playerSVGGroup.setAttribute("id", "tu-player");
    this.mountRootLayers();

    this._rendererRegistry = new Map();
    this._mountedRendererUUIDs = new Set();
    this._viewportRect = new Rect();
    this.syncViewportState();
  }

  private mountRootLayers(): void {
    this.rootSVGElement.appendChild(this._interactionSVGGroup);
    for (const elementClass of ELEMENT_ORDER) {
      const layer = this._layerGroups.get(elementClass);
      if (layer !== undefined) {
        this.rootSVGElement.appendChild(layer);
      }
    }
    this.rootSVGElement.appendChild(this._selectionSVGGroup);
    this.rootSVGElement.appendChild(this._playerSVGGroup);
  }

  private createLayerGroupsByOrder(): Map<Function, SVGGElement> {
    const layerGroups = new Map<Function, SVGGElement>();

    for (const elementClass of ELEMENT_ORDER) {
      const group = createSVGG();
      group.setAttribute(
        "id",
        `tu-${elementClass.name
          .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
          .toLowerCase()}`
      );
      layerGroups.set(elementClass, group);
    }

    return layerGroups;
  }

  private syncViewportState(): void {
    this._viewportRect.setCoords(0, this.notationViewportDiv.scrollTop);
    this._viewportRect.setDimensions(
      this.notationViewportDiv.clientWidth,
      this.notationViewportDiv.clientHeight
    );
  }

  public attachViewportScrollEvent(eventHandler: (event: Event) => void): void {
    if (this._viewportScrollListener !== undefined) {
      this.notationViewportDiv.removeEventListener(
        "scroll",
        this._viewportScrollListener
      );
    }

    this._viewportScrollListener = eventHandler as EventListener;
    this.notationViewportDiv.addEventListener(
      "scroll",
      this._viewportScrollListener
    );
  }

  private getVisibleTrackLineRange(trackController: TrackController): {
    start: number;
    end: number;
  } {
    const viewportTop = this._viewportRect.y;
    const viewportBottom = this._viewportRect.bottom;
    const trackLines = trackController.trackElement.trackLineElements;

    let firstVisibleIndex = -1;
    let lastVisibleIndex = -1;
    for (let i = 0; i < trackLines.length; i++) {
      const lineRect = trackLines[i].globalRect;
      const intersectsViewport =
        lineRect.bottom >= viewportTop && lineRect.y <= viewportBottom;
      if (!intersectsViewport) {
        continue;
      }

      if (firstVisibleIndex === -1) {
        firstVisibleIndex = i;
      }
      lastVisibleIndex = i;
    }

    if (firstVisibleIndex === -1 || lastVisibleIndex === -1) {
      return {
        start: 0,
        end: Math.max(0, trackLines.length - 1),
      };
    }

    return {
      start: Math.max(
        0,
        firstVisibleIndex - EditorSVGRenderer.VIEWPORT_OVERSCAN_LINES
      ),
      end: Math.min(
        trackLines.length - 1,
        lastVisibleIndex + EditorSVGRenderer.VIEWPORT_OVERSCAN_LINES
      ),
    };
  }

  private getVisibleElements(
    trackController: TrackController,
    visibleTrackLineRange: { start: number; end: number }
  ): NotationElement[] {
    const trackLines = trackController.trackElement.trackLineElements.slice(
      visibleTrackLineRange.start,
      visibleTrackLineRange.end + 1
    );

    return trackLines.flatMap((trackLine) =>
      trackLine.getAllNotationElements()
    );
  }

  private updateRendererElement(
    renderer: ElementRenderer,
    element: NotationElement
  ): void {
    rebindRendererElement(renderer, element);
  }

  private removeByDiff(modelUUIDs: number[]): void {
    for (const modelUUID of modelUUIDs) {
      const renderer = this._rendererRegistry.get(modelUUID);
      if (renderer === undefined) {
        continue;
      }

      renderer.unrender();
      renderer.detachContainerGroup();
      this._rendererRegistry.delete(modelUUID);
      this._mountedRendererUUIDs.delete(modelUUID);
    }
  }

  private cullInvisibleRenderers(visibleModelUUIDs: Set<number>): void {
    for (const modelUUID of this._mountedRendererUUIDs) {
      if (visibleModelUUIDs.has(modelUUID)) {
        continue;
      }

      const renderer = this._rendererRegistry.get(modelUUID);
      if (renderer === undefined) {
        this._mountedRendererUUIDs.delete(modelUUID);
        continue;
      }

      renderer.detachContainerGroup();
      this._mountedRendererUUIDs.delete(modelUUID);
    }
  }

  private renderReconciled(
    trackController: TrackController,
    visibleElements: NotationElement[]
  ): ElementRenderer[] {
    const diff = trackController.trackElement.getElementDiff();
    const visibleModelUUIDs = new Set(
      visibleElements.map((element) => element.getModelUUID())
    );

    // Step 1: Unrender removed elements
    const removedUUIDs: number[] = [];
    for (const uuidSet of diff.removed.values()) {
      removedUUIDs.push(...uuidSet.values());
    }
    this.removeByDiff(removedUUIDs);

    // Step 2: Detach invisible renderers but keep them cached for reuse.
    this.cullInvisibleRenderers(visibleModelUUIDs);

    // Step 3: Re-render visible elements when needed (new, updated, remounted).
    const updatedVisibleUUIDs = new Set<number>();
    for (const elementMap of diff.updated.values()) {
      for (const element of elementMap.values()) {
        const modelUUID = element.getModelUUID();
        if (visibleModelUUIDs.has(modelUUID)) {
          updatedVisibleUUIDs.add(modelUUID);
        }
      }
    }

    const activeRenderers: ElementRenderer[] = [];
    for (const element of visibleElements) {
      const modelUUID = element.getModelUUID();
      let renderer = this._rendererRegistry.get(modelUUID);
      let isNewRenderer = false;
      if (renderer === undefined) {
        const newRenderer = createRendererForElement(
          trackController,
          element,
          this.assetsPath
        );
        if (newRenderer === undefined) {
          continue;
        }

        renderer = newRenderer;
        this._rendererRegistry.set(modelUUID, renderer);
        isNewRenderer = true;
      }

      const wasMounted = this._mountedRendererUUIDs.has(modelUUID);
      if (updatedVisibleUUIDs.has(modelUUID) || !wasMounted) {
        this.updateRendererElement(renderer, element);
      }

      this.ensureRendererMounted(renderer, element);
      this._mountedRendererUUIDs.add(modelUUID);

      if (isNewRenderer || updatedVisibleUUIDs.has(modelUUID) || !wasMounted) {
        renderer.render();
      }

      activeRenderers.push(renderer);
    }

    return activeRenderers;
  }

  private ensureRendererMounted(
    renderer: ElementRenderer,
    element: NotationElement
  ): void {
    const layer = this._layerGroups.get(element.constructor as Function);
    if (layer === undefined) {
      return;
    }

    const group = renderer.ensureContainerGroup();

    if (group.parentNode !== layer) {
      layer.appendChild(group);
    }
  }

  /**
   * Shows note selection preview
   * @param noteElement Note element to preview
   */
  public showSelectionPreview(noteElement: NoteElement): void {
    this._selectionOverlayRenderer.showSelectionPreview(noteElement);
  }

  /**
   * Hide selection preview (but keep in the DOM)
   */
  public hideSelectionPreview(): void {
    this._selectionOverlayRenderer.hideSelectionPreview();
  }

  public attachBeatInteractionEvent<K extends keyof SVGElementEventMap>(
    eventType: K,
    eventHandler: (
      event: SVGElementEventMap[K],
      beatElement: BeatElement
    ) => void
  ): void {
    this._beatInteractionLayer.attachEvent(eventType, eventHandler);
  }

  /**
   * Render player overlay
   */
  private renderPlayerOverlay(trackController: TrackController): void {
    /**
     * TODO: PLAYER CURSOR NEEDS TO BE RENDERED ON TOP OF
     * EVERYTHING ELSE. THAT MEANS THAT EVERY PAUSE UNRENDERS IT
     * AND EVERY START RENDERS IT
     */

    if (this._playerCursorRect === undefined) {
      this._playerCursorRect = createSVGRect();
      this._playerCursorRect.setAttribute("id", "playerCursor");
    }
    this._playerSVGGroup.appendChild(this._playerCursorRect);

    if (this._playerAnimator === undefined) {
      this._playerAnimator = new TrackPlayerSVGAnimator(
        this._playerCursorRect,
        trackController
      );
      this._playerAnimator.bindToBeatChanged();
    }

    const currentBeatElement = trackController.playerCurrentBeatElement;

    let cursorRect: Rect;
    if (currentBeatElement === undefined) {
      cursorRect = new Rect(0, 0, 0, 0);
    } else {
      const beatElementCoords = currentBeatElement.globalCoords;

      const playerCursorWidth = 5;
      const playerCursorAddHeight = 10;

      cursorRect = new Rect(
        beatElementCoords.x + currentBeatElement.rect.width / 2,
        beatElementCoords.y - playerCursorAddHeight,
        playerCursorWidth,
        currentBeatElement.rect.height + playerCursorAddHeight
      );
    }

    this._playerCursorRect.setAttribute("x", `${cursorRect.x}`);
    this._playerCursorRect.setAttribute("y", `${cursorRect.y}`);
    this._playerCursorRect.setAttribute("width", `${cursorRect.width}`);
    this._playerCursorRect.setAttribute("height", `${cursorRect.height}`);
    this._playerCursorRect.setAttribute("stroke", "black");
    this._playerCursorRect.setAttribute("fill", "purple");
  }

  /**
   * Hide player overlay when not playing
   */
  private hidePlayerOverlay(): void {
    if (this._playerCursorRect === undefined) {
      this._playerCursorRect = createSVGRect();
      this._playerCursorRect.setAttribute("id", "playerCursor");
    }
    this._playerSVGGroup.appendChild(this._playerCursorRect);

    this._playerCursorRect.setAttribute("width", "0");
    this._playerCursorRect.setAttribute("height", "0");
  }

  /**
   * Render track window using SVG
   */
  public render(trackController: TrackController): ElementRenderer[] {
    this.syncViewportState();
    const visibleTrackLineRange =
      this.getVisibleTrackLineRange(trackController);
    const visibleElements = this.getVisibleElements(
      trackController,
      visibleTrackLineRange
    );

    // Render using element diff
    const activeRenderers = this.renderReconciled(
      trackController,
      visibleElements
    );
    this._beatInteractionLayer.render(trackController, visibleElements);
    trackController.trackElement.clearElementDiff();
    trackController.trackElement.clearDirtyElements();

    // Player overlay rect
    if (trackController.isPlaying) {
      this.renderPlayerOverlay(trackController);
    } else {
      this.hidePlayerOverlay();
    }
    this._selectionOverlayRenderer.render(trackController);

    // Update SVG root dimensions
    const trackWindowHeight = trackController.trackElement.height;
    const VB = `0 0 ${TabLayoutDimensions.WIDTH} ${trackWindowHeight}`;
    this.rootSVGElement.setAttribute("viewBox", VB);
    this.rootSVGElement.setAttribute("width", `${TabLayoutDimensions.WIDTH}`);
    this.rootSVGElement.setAttribute("height", `${trackWindowHeight}`);

    return activeRenderers;
  }

  public renderSelectionOverlay(trackController: TrackController): void {
    this._selectionOverlayRenderer.render(trackController);
  }

  /**
   * Unrender the entire track window
   */
  public unrender(): void {
    for (const renderer of this._rendererRegistry.values()) {
      renderer.unrender();
      renderer.detachContainerGroup();
    }

    this._rendererRegistry.clear();
    this._mountedRendererUUIDs.clear();
    if (this._playerCursorRect) {
      this._playerCursorRect.remove();
    }
    this._selectionOverlayRenderer.clear();
    this._beatInteractionLayer.clear();

    this.rootSVGElement.replaceChildren();
    this.mountRootLayers();
  }
}

class BeatInteractionLayer {
  private _interactionGroup: SVGGElement;
  private _beatInteractionRects: Map<number, SVGRectElement>;
  private _beatInteractionEvents: Map<string, EventListener>;
  private _trackController?: TrackController;

  constructor(interactionGroup: SVGGElement) {
    this._interactionGroup = interactionGroup;
    this._beatInteractionRects = new Map();
    this._beatInteractionEvents = new Map();
  }

  public render(
    trackController: TrackController,
    visibleElements: NotationElement[]
  ): void {
    this._trackController = trackController;
    const activeBeatUUIDs = new Set<number>();

    for (const element of visibleElements) {
      if (!(element instanceof TabBeatElement)) {
        continue;
      }

      const modelUUID = element.getModelUUID();
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

      const globalRect = element.globalRect;
      rect.setAttribute("x", `${globalRect.x}`);
      rect.setAttribute("y", `${globalRect.y}`);
      rect.setAttribute("width", `${globalRect.width}`);
      rect.setAttribute("height", `${globalRect.height}`);
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
      if (this._trackController === undefined) {
        return;
      }

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
        this._trackController.trackElement.getElementByModelUUID(beatUUID);
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

  public clear(): void {
    for (const rect of this._beatInteractionRects.values()) {
      this._interactionGroup.removeChild(rect);
    }
    this._beatInteractionRects.clear();

    for (const [eventType, listener] of this._beatInteractionEvents) {
      this._interactionGroup.removeEventListener(eventType, listener);
    }
    this._beatInteractionEvents.clear();
    this._trackController = undefined;
  }
}
