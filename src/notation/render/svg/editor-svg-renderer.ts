import {
  BeatElement,
  NoteElement,
  NotationElement,
  NotationElementClass,
  TrackController,
} from "../../controller";
import type { ResolvedAssetConfig } from "../../../config/asset-url-resolver";
import { createSVG, createSVGG, Rect } from "../../../shared";
import { EditorRenderer } from "../editor-renderer";
import { EditorRenderOptions } from "../editor-renderer";
import { ElementRenderer } from "../element-renderer";
import {
  ELEMENT_ORDER,
  ElementDiff,
  TrackElement,
} from "../../controller/element/track-element";
import { BarElement } from "../../controller/element/bar/bar-element";
import { TabBeatElement } from "../../controller/element/beat/tab-beat-element";
import { TabBeatRhythmElement } from "../../controller/element/beat/tab-beat-rhythm-element";
import { TabNoteSlotElement } from "../../controller/element/note/tab-note-slot-element";
import { GuitarTechniqueElement } from "../../controller/element/technique/guitar-technique/guitar-technique-element";
import { GuitarTechniqueLabelElement } from "../../controller/element/technique/guitar-technique/guitar-technique-label-element";
import { BeamSegmentElement } from "../../controller/element/bar/beam-segment-element";
import { BarTupletGroupElement } from "../../controller/element/bar/bar-tuplet-group-element";
import { Beat, VoiceNumber } from "../../model";
import { createRendererForElement } from "./support/renderer-factory";
import { SelectionOverlayRenderer } from "./selection-overlay-renderer";
import { BeatInteractionRenderer } from "./beat-interaction-renderer";
import { PlayerOverlayRenderer } from "./player-overlay-renderer";
import { TrackLineElement } from "../../controller/element/track/track-line-element";
import { TabUILayoutMode } from "../../../config/tabui-config";

enum VoicePart {
  Content = "content",
  Rhythm = "rhythm",
}

type BarContainer = {
  /** Wrapper translated to the bar's line-local position. */
  wrapper: SVGGElement;
  /** Bar-owned non-voice containers keyed by element class. */
  layerContainers: Map<NotationElementClass, SVGGElement>;
  /** Voice content/rhythm containers under this bar, keyed by model voice number. */
  voiceContainers: {
    [VoicePart.Content]: Map<VoiceNumber, SVGGElement>;
    [VoicePart.Rhythm]: Map<VoiceNumber, SVGGElement>;
  };
};

type TrackLineContainer = {
  /** Wrapper translated to the track line's global position. */
  wrapper: SVGGElement;
  /** Line-owned element containers keyed by element class. */
  layerContainers: Map<NotationElementClass, SVGGElement>;
  /** Bar wrappers retained under this line, keyed by bar stable identity. */
  barContainers: Map<string, BarContainer>;
};

// NOTE: Strong hint that the current model of doing labels is architecturally flawed.
const BAR_OWNED_ELEMENT_CLASSES = new Set<NotationElementClass>([
  BarElement,
  GuitarTechniqueLabelElement,
]);

const ELEMENT_VOICE_PART = new Map<NotationElementClass, VoicePart>([
  [TabBeatElement, VoicePart.Content],
  [TabNoteSlotElement, VoicePart.Content],
  [GuitarTechniqueElement, VoicePart.Content],
  [TabBeatRhythmElement, VoicePart.Rhythm],
  [BeamSegmentElement, VoicePart.Rhythm],
  [BarTupletGroupElement, VoicePart.Rhythm],
]);

const DEFAULT_RENDER_OPTIONS: EditorRenderOptions = {
  renderNotation: true,
  forceNotation: false,
  overlays: {
    selection: true,
    player: true,
  },
};

const TRACK_LINE_VIEWPORT_MARGIN_RATIO = 0.25;
const SINGLE_LINE_VIEWPORT_MARGIN_RATIO = 0.2;

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
  /** Extra materialized lines retained beyond rendered overscan. */
  private static readonly MATERIALIZED_LINE_CACHE_MARGIN = 2;
  /** Master bars retained before and after the horizontal viewport. */
  private static readonly VIEWPORT_OVERSCAN_BARS = 2;

  /** Notation-only scroll viewport wrapper. */
  readonly notationViewportDiv: HTMLDivElement;
  /** Root SVG <svg> element */
  readonly rootSVGElement: SVGSVGElement;
  /** Path to any assets */
  readonly assetsPath: ResolvedAssetConfig;
  /** Track controller rendered by this renderer instance. */
  readonly trackController: TrackController;

  /** Registry mapping stable element identity to renderer. */
  private _rendererRegistry: Map<string, ElementRenderer>;
  private _trackLineContainers: Map<string, TrackLineContainer>;
  private _mountedRendererIdentities: Set<string>;
  private _lastRenderedViewportStart?: number;
  private _lastRenderedViewportEnd?: number;
  private _lastRenderedMasterBarStart?: number;
  private _lastRenderedMasterBarEnd?: number;
  /** Viewport scroll listener. */
  private _viewportScrollListener?: EventListener;
  /** Viewport rectangle inside notation scroll container. */
  private _viewportRect: Rect;

  /** Root group for all notation content. */
  private _notationSVGGroup: SVGGElement;
  /** Selection interaction layer (selection preview / selected note / beat rects). */
  private _selectionSVGGroup: SVGGElement;
  /** Selection overlay renderer (preview + note/beat selection visuals). */
  private _selectionOverlayRenderer: SelectionOverlayRenderer;
  /** Interaction-only layer for delegated beat hitbox events. */
  private _interactionSVGGroup: SVGGElement;
  /** Beat interaction layer renderer (hitboxes + delegated events). */
  private _beatInteractionRenderer: BeatInteractionRenderer;
  /** Player interaction layer (player cursor). */
  private _playerSVGGroup: SVGGElement;
  /** Player overlay renderer (player cursor) */
  private _playerOverlayRenderer: PlayerOverlayRenderer;

  private calculateScrollTopForTrackLine(lineBounds: Rect): number | undefined {
    if (this._viewportRect.height <= 0) {
      return undefined;
    }

    let targetScrollTop: number | undefined;
    if (lineBounds.height >= this._viewportRect.height) {
      if (
        lineBounds.y < this._viewportRect.y ||
        lineBounds.bottom > this._viewportRect.bottom
      ) {
        targetScrollTop = lineBounds.y;
      }
    } else {
      const viewportMargin =
        this._viewportRect.height * TRACK_LINE_VIEWPORT_MARGIN_RATIO;
      const safeZoneTop = this._viewportRect.y + viewportMargin;
      const safeZoneBottom = this._viewportRect.bottom - viewportMargin;
      if (lineBounds.y < safeZoneTop || lineBounds.bottom > safeZoneBottom) {
        targetScrollTop = lineBounds.y - viewportMargin;
      }
    }

    if (targetScrollTop === undefined) {
      return undefined;
    }

    targetScrollTop = Math.max(0, targetScrollTop);
    return targetScrollTop === this._viewportRect.y
      ? undefined
      : targetScrollTop;
  }

  /**
   * Render a track window using SVG
   * @param rootDiv Root container element
   * @param assetsPath Path to assets
   */
  constructor(
    notationViewportDiv: HTMLDivElement,
    trackController: TrackController,
    assetsPath: ResolvedAssetConfig
  ) {
    this.notationViewportDiv = notationViewportDiv;
    this.notationViewportDiv.classList.toggle(
      "tu-single-line-notation",
      trackController.trackElement.layoutMode === TabUILayoutMode.SingleLine
    );
    this.rootSVGElement = createSVG();
    this.rootSVGElement.classList.add("tu-root-svg");
    this.notationViewportDiv.appendChild(this.rootSVGElement);

    this.assetsPath = assetsPath;
    this.trackController = trackController;

    this._rendererRegistry = new Map();
    this._trackLineContainers = new Map();
    this._mountedRendererIdentities = new Set();
    this._viewportRect = new Rect();
    this.setViewportRect();

    this._notationSVGGroup = createSVGG();
    this._notationSVGGroup.setAttribute("id", "tu-notation");
    this._selectionSVGGroup = createSVGG();
    this._selectionSVGGroup.setAttribute("id", "tu-selection");
    this._selectionOverlayRenderer = new SelectionOverlayRenderer(
      this._selectionSVGGroup,
      this.trackController
    );
    this._interactionSVGGroup = createSVGG();
    this._interactionSVGGroup.setAttribute("id", "tu-interaction");
    this._beatInteractionRenderer = new BeatInteractionRenderer(
      this._interactionSVGGroup,
      this.trackController
    );
    this._playerSVGGroup = createSVGG();
    this._playerSVGGroup.setAttribute("id", "tu-player");
    this._playerOverlayRenderer = new PlayerOverlayRenderer(
      this._playerSVGGroup,
      this.trackController,
      this.ensureBeatVisible.bind(this),
      this.followHorizontalPosition.bind(this)
    );

    this.mountRootLayers();
    this.syncRootSVGDimensions();
  }

  private mountDomChild(
    parent: SVGGElement | undefined,
    child: SVGGElement
  ): void {
    if (parent === undefined || child.parentNode === parent) {
      return;
    }

    parent.appendChild(child);
  }

  private unmountDomChild(
    parent: SVGGElement | undefined,
    child: SVGGElement
  ): void {
    if (parent === undefined || child.parentNode !== parent) {
      return;
    }

    parent.removeChild(child);
  }

  private mountRootLayers(): void {
    const padding = this.trackController.layoutDimensions.HORIZONTAL_PADDING;
    const contentTransform = `translate(${padding}, 0)`;
    this._interactionSVGGroup.setAttribute("transform", contentTransform);
    this._notationSVGGroup.setAttribute("transform", contentTransform);
    this._selectionSVGGroup.setAttribute("transform", contentTransform);
    this._playerSVGGroup.setAttribute("transform", contentTransform);

    this.rootSVGElement.appendChild(this._interactionSVGGroup);
    this.rootSVGElement.appendChild(this._notationSVGGroup);
    this.rootSVGElement.appendChild(this._selectionSVGGroup);
    this.rootSVGElement.appendChild(this._playerSVGGroup);
  }

  private setViewportRect(): void {
    const padding = this.trackController.layoutDimensions.HORIZONTAL_PADDING;
    this._viewportRect.set(
      this.notationViewportDiv.scrollLeft - padding,
      this.notationViewportDiv.scrollTop,
      this.notationViewportDiv.clientWidth,
      this.notationViewportDiv.clientHeight
    );
  }

  private calculateScrollLeftForBounds(bounds: Rect): number | undefined {
    if (this._viewportRect.width <= 0) {
      return undefined;
    }

    const margin = this._viewportRect.width * SINGLE_LINE_VIEWPORT_MARGIN_RATIO;
    const safeLeft = this._viewportRect.x + margin;
    const safeRight = this._viewportRect.right - margin;
    let target: number | undefined;
    if (bounds.width >= this._viewportRect.width) {
      if (
        bounds.x < this._viewportRect.x ||
        bounds.right > this._viewportRect.right
      ) {
        target = bounds.x;
      }
    } else if (bounds.x < safeLeft) {
      target = bounds.x - margin;
    } else if (bounds.right > safeRight) {
      target = bounds.right - this._viewportRect.width + margin;
    }

    if (target === undefined) {
      return undefined;
    }
    const padding = this.trackController.layoutDimensions.HORIZONTAL_PADDING;
    return Math.max(0, target + padding);
  }

  /** Keeps an animated cursor position inside the horizontal safe area. */
  private followHorizontalPosition(x: number): void {
    if (
      this.trackController.trackElement.layoutMode !==
      TabUILayoutMode.SingleLine
    ) {
      return;
    }
    this.setViewportRect();
    const scrollLeft = this.calculateScrollLeftForBounds(new Rect(x, 0, 1, 1));
    if (scrollLeft === undefined) {
      return;
    }

    this.notationViewportDiv.scrollLeft = scrollLeft;
    this.setViewportRect();
  }

  /** Materializes a beat's bar and optionally follows it in the viewport. */
  public ensureBeatVisible(
    beat: Beat,
    follow: boolean
  ): BeatElement | undefined {
    let trackLineElement =
      this.trackController.trackElement.getTrackLineElementForBeat(beat);
    const placement =
      this.trackController.trackElement.getTrackLineBarForBeat(beat);
    if (trackLineElement === undefined || placement === undefined) {
      return undefined;
    }

    this.setViewportRect();
    if (follow) {
      const scrollTop = this.calculateScrollTopForTrackLine(
        trackLineElement.globalBoundingBox
      );
      if (scrollTop !== undefined) {
        this.notationViewportDiv.scrollTop = scrollTop;
      }
      if (
        this.trackController.trackElement.layoutMode ===
        TabUILayoutMode.SingleLine
      ) {
        const scrollLeft = this.calculateScrollLeftForBounds(
          new Rect(placement.x, 0, placement.finalizedWidth, 1)
        );
        if (scrollLeft !== undefined) {
          this.notationViewportDiv.scrollLeft = scrollLeft;
        }
      }
      this.setViewportRect();
    }

    const masterBarIndex = placement.masterBarIndex;
    const lastMasterBarIndex =
      this.trackController.track.score.masterBars.length - 1;
    const startMasterBarIndex = Math.max(
      0,
      masterBarIndex - EditorSVGRenderer.VIEWPORT_OVERSCAN_BARS
    );
    const endMasterBarIndex = Math.min(
      lastMasterBarIndex,
      masterBarIndex + EditorSVGRenderer.VIEWPORT_OVERSCAN_BARS
    );
    const lineIndex =
      this.trackController.trackElement.trackLineElements.indexOf(
        trackLineElement
      );
    this.trackController.trackElement.update({
      lineRange: { startLineIndex: lineIndex, endLineIndex: lineIndex },
      masterBarRange: { startMasterBarIndex, endMasterBarIndex },
      rebuildSkeleton: false,
      forceElements: false,
      dematerializeOutsideRange: {
        startLineIndex: lineIndex,
        endLineIndex: lineIndex,
      },
      dematerializeOutsideMasterBarRange: {
        startMasterBarIndex,
        endMasterBarIndex,
      },
    });
    this._lastRenderedViewportStart = undefined;
    this.renderNotation({
      renderNotation: true,
      forceNotation: false,
      overlays: { selection: false, player: false },
    });
    trackLineElement =
      this.trackController.trackElement.getTrackLineElementForBeat(beat);
    return this.trackController.trackElement.getBeatElement(beat);
  }

  public detachViewportScrollEvent(): void {
    if (this._viewportScrollListener === undefined) {
      return;
    }

    this.notationViewportDiv.removeEventListener(
      "scroll",
      this._viewportScrollListener
    );
    this._viewportScrollListener = undefined;
  }

  public attachViewportScrollEvent(eventHandler: (event: Event) => void): void {
    this.detachViewportScrollEvent();

    this._viewportScrollListener = eventHandler as EventListener;
    this.notationViewportDiv.addEventListener(
      "scroll",
      this._viewportScrollListener
    );
  }

  /** Returns the overscanned track-line range retained for the viewport. */
  private getLinesInViewport(): {
    start: number;
    end: number;
  } {
    const viewportTop = this._viewportRect.y;
    const viewportBottom = this._viewportRect.bottom;
    const trackLines = this.trackController.trackElement.trackLineElements;

    let firstVisibleIndex = -1;
    let lastVisibleIndex = -1;
    for (let i = 0; i < trackLines.length; i++) {
      const lineRect = trackLines[i].globalBoundingBox;
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
      // Find the nearest line to the current scroll position
      let nearestLineIndex = 0;
      for (let i = 0; i < trackLines.length; i++) {
        if (trackLines[i].globalBoundingBox.y > viewportTop) {
          break;
        }
        nearestLineIndex = i;
      }

      return {
        start: Math.max(
          0,
          nearestLineIndex - EditorSVGRenderer.VIEWPORT_OVERSCAN_LINES
        ),
        end: Math.min(
          trackLines.length - 1,
          nearestLineIndex + EditorSVGRenderer.VIEWPORT_OVERSCAN_LINES
        ),
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

  private getMasterBarsInViewport(): { start: number; end: number } {
    const bars =
      this.trackController.trackElement.trackLineElements[0]?.trackLineBars;
    if (bars === undefined || bars.length === 0) {
      return { start: 0, end: -1 };
    }

    let firstVisible = -1;
    let lastVisible = -1;
    for (const bar of bars) {
      const intersects =
        bar.x + bar.finalizedWidth >= this._viewportRect.x &&
        bar.x <= this._viewportRect.right;
      if (!intersects) {
        continue;
      }
      firstVisible = firstVisible === -1 ? bar.masterBarIndex : firstVisible;
      lastVisible = bar.masterBarIndex;
    }
    if (firstVisible === -1) {
      firstVisible = bars[bars.length - 1].masterBarIndex;
      lastVisible = firstVisible;
    }

    return {
      start: Math.max(
        0,
        firstVisible - EditorSVGRenderer.VIEWPORT_OVERSCAN_BARS
      ),
      end: Math.min(
        bars.length - 1,
        lastVisible + EditorSVGRenderer.VIEWPORT_OVERSCAN_BARS
      ),
    };
  }

  /**
   * Applies active voice opacity and paint order for all voice containers in a bar.
   */
  private refreshBarContainerVoicePresentation(
    barContainer: BarContainer
  ): void {
    const activeVoiceNumber = this.trackController.activeVoiceNumber;
    const voiceContainers = new Map([
      ...barContainer.voiceContainers[VoicePart.Content],
      ...barContainer.voiceContainers[VoicePart.Rhythm],
    ]);
    for (const [voiceNumber, voiceContainer] of voiceContainers) {
      const opacity = voiceNumber === activeVoiceNumber ? "1" : "0.5";
      if (voiceContainer.getAttribute("opacity") !== opacity) {
        voiceContainer.setAttribute("opacity", opacity);
      }

      this.mountDomChild(barContainer.wrapper, voiceContainer);
    }
  }

  /** Ensures a track line wrapper and its line-owned containers exist. */
  private mountTrackLineContainer(
    trackLineElement: TrackLineElement
  ): TrackLineContainer {
    const x = trackLineElement.globalCoords.x;
    const y = trackLineElement.globalCoords.y;
    const transform = `translate(${x}, ${y})`;

    const stableIdentity = trackLineElement.getStableIdentity();
    const existingLineContainer = this._trackLineContainers.get(stableIdentity);
    if (existingLineContainer !== undefined) {
      existingLineContainer.wrapper.setAttribute("transform", transform);
      return existingLineContainer;
    }

    const wrapper = createSVGG();
    wrapper.setAttribute("transform", transform);

    const layerContainers = new Map<NotationElementClass, SVGGElement>();
    for (const elementClass of ELEMENT_ORDER) {
      if (
        BAR_OWNED_ELEMENT_CLASSES.has(elementClass) ||
        ELEMENT_VOICE_PART.has(elementClass)
      ) {
        continue;
      }

      const container = createSVGG();
      layerContainers.set(elementClass, container);
      this.mountDomChild(wrapper, container);
    }

    const trackLineContainer = {
      wrapper,
      layerContainers,
      barContainers: new Map(),
    };
    this._trackLineContainers.set(stableIdentity, trackLineContainer);
    return trackLineContainer;
  }

  /** Ensures a bar wrapper and its bar-owned containers exist under a track line. */
  private mountBarContainer(
    trackLineContainer: TrackLineContainer,
    barElement: BarElement
  ): BarContainer {
    const x = barElement.lineLocalCoords.x;
    const y = barElement.lineLocalCoords.y;
    const barWrapperTransform = `translate(${x}, ${y})`;

    const stableIdentity = barElement.getStableIdentity();
    const existingContainer =
      trackLineContainer.barContainers.get(stableIdentity);
    if (existingContainer !== undefined) {
      existingContainer.wrapper.setAttribute("transform", barWrapperTransform);
      return existingContainer;
    }

    const wrapper = createSVGG();
    wrapper.setAttribute("transform", barWrapperTransform);

    const layerContainers = new Map<NotationElementClass, SVGGElement>();
    for (const elementClass of BAR_OWNED_ELEMENT_CLASSES) {
      const container = createSVGG();
      layerContainers.set(elementClass, container);
      this.mountDomChild(wrapper, container);
    }

    const barContainer: BarContainer = {
      wrapper,
      layerContainers,
      voiceContainers: {
        [VoicePart.Content]: new Map<VoiceNumber, SVGGElement>(),
        [VoicePart.Rhythm]: new Map<VoiceNumber, SVGGElement>(),
      },
    };
    trackLineContainer.barContainers.set(stableIdentity, barContainer);
    return barContainer;
  }

  /** Ensures the voice container for a bar/voice/part exists. */
  private mountVoiceContainer(
    barContainer: BarContainer,
    voiceNumber: VoiceNumber,
    voicePart: VoicePart
  ): SVGGElement {
    const voiceContainers = barContainer.voiceContainers[voicePart];
    let voiceContainer = voiceContainers.get(voiceNumber);
    if (voiceContainer === undefined) {
      voiceContainer = createSVGG();
      voiceContainers.set(voiceNumber, voiceContainer);
      this.refreshBarContainerVoicePresentation(barContainer);
    }

    const isActive = voiceNumber === this.trackController.activeVoiceNumber;
    const opacity = isActive ? "1" : "0.5";
    if (voiceContainer.getAttribute("opacity") !== opacity) {
      voiceContainer.setAttribute("opacity", opacity);
    }

    return voiceContainer;
  }

  /**
   * Resolves the correct line/bar/voice container for an element
   * and mounts the renderer to that container
   */
  private mountRenderer(
    renderer: ElementRenderer,
    element: NotationElement
  ): void {
    const stableIdentity = element.getStableIdentity();
    const trackLineContainer = this.mountTrackLineContainer(
      element.owningTrackLineElement
    );
    const elementClass = element.constructor as NotationElementClass;
    const owningBarElement = element.owningBarElement;
    if (owningBarElement === null) {
      const lineLayerContainer =
        trackLineContainer.layerContainers.get(elementClass);
      const rendererContainer = renderer.ensureContainerGroup();
      this.mountDomChild(lineLayerContainer, rendererContainer);
      this._mountedRendererIdentities.add(stableIdentity);
      return;
    }

    const barContainer = this.mountBarContainer(
      trackLineContainer,
      owningBarElement
    );
    const voicePart = ELEMENT_VOICE_PART.get(elementClass);
    if (voicePart === undefined || element.voiceNumber === null) {
      const barLayerContainer = barContainer.layerContainers.get(elementClass);
      const rendererContainer = renderer.ensureContainerGroup();
      this.mountDomChild(barLayerContainer, rendererContainer);
      this._mountedRendererIdentities.add(stableIdentity);
      return;
    }

    const voiceContainer = this.mountVoiceContainer(
      barContainer,
      element.voiceNumber,
      voicePart
    );
    const rendererContainer = renderer.ensureContainerGroup();
    this.mountDomChild(voiceContainer, rendererContainer);
    this._mountedRendererIdentities.add(stableIdentity);
    return;
  }

  /** Detaches a renderer container and forgets its mounted identity. */
  private unmountRenderer(
    stableIdentity: string,
    renderer: ElementRenderer | undefined
  ): void {
    renderer?.detachContainerGroup();
    this._mountedRendererIdentities.delete(stableIdentity);
  }

  /** Returns whether the renderer identity is still mounted in the root SVG. */
  private isRendererMounted(
    stableIdentity: string,
    renderer: ElementRenderer
  ): boolean {
    if (!this._mountedRendererIdentities.has(stableIdentity)) {
      return false;
    }

    const group = renderer.ensureContainerGroup();
    if (this.rootSVGElement.contains(group)) {
      return true;
    }

    this._mountedRendererIdentities.delete(stableIdentity);
    return false;
  }

  /** Retains only bar containers that still belong to one materialized line. */
  private reconcileLineBarContainers(
    lineContainer: TrackLineContainer,
    trackLineElement: TrackLineElement
  ): void {
    const currentBarStableIdentities = new Set<string>();
    for (const barElement of trackLineElement.allBarElements()) {
      const stableIdentity = barElement.getStableIdentity();
      currentBarStableIdentities.add(stableIdentity);

      const barContainer = this.mountBarContainer(lineContainer, barElement);
      this.mountDomChild(lineContainer.wrapper, barContainer.wrapper);
    }

    for (const [stableIdentity, barContainer] of lineContainer.barContainers) {
      if (currentBarStableIdentities.has(stableIdentity)) {
        continue;
      }

      barContainer.wrapper.remove();
      lineContainer.barContainers.delete(stableIdentity);
    }
  }

  /**
   * Reconciles retained SVG containers with the visible line set.
   */
  private reconcileVisibleContainers(
    visibleTrackLines: TrackLineElement[]
  ): void {
    const visibleStableIdentities = new Set(
      visibleTrackLines.map((tle) => tle.getStableIdentity())
    );

    for (const trackLineElement of visibleTrackLines) {
      const lineContainer = this.mountTrackLineContainer(trackLineElement);
      this.reconcileLineBarContainers(lineContainer, trackLineElement);
      this.mountDomChild(this._notationSVGGroup, lineContainer.wrapper);
    }

    for (const [stableIdentity, lineContainer] of this._trackLineContainers) {
      if (visibleStableIdentities.has(stableIdentity)) {
        continue;
      }

      this.unmountDomChild(this._notationSVGGroup, lineContainer.wrapper);
      this._trackLineContainers.delete(stableIdentity);
    }
  }

  /**
   * Refreshes active-voice opacity and paint order for retained containers.
   */
  private refreshContainerPresentation(): void {
    for (const trackLineContainer of this._trackLineContainers.values()) {
      for (const barContainer of trackLineContainer.barContainers.values()) {
        this.refreshBarContainerVoicePresentation(barContainer);
      }
    }
  }

  private disposeRemovedRenderers(
    diff: ElementDiff,
    diffIncludesSkeletonRebuild: boolean
  ): void {
    for (const stableIdentities of diff.removed.values()) {
      for (const stableIdentity of stableIdentities) {
        const renderer = this._rendererRegistry.get(stableIdentity);
        if (renderer === undefined) {
          continue;
        }

        if (!diffIncludesSkeletonRebuild) {
          this.unmountRenderer(stableIdentity, renderer);
          continue;
        }

        renderer.unrender();
        this.unmountRenderer(stableIdentity, renderer);
        this._rendererRegistry.delete(stableIdentity);
      }
    }
  }

  /** Detaches offscreen renderers while keeping them reusable. */
  private detachOffscreenRenderers(visibleIdentities: Set<string>): void {
    const mountedIdentities = [...this._mountedRendererIdentities];
    for (const stableIdentity of mountedIdentities) {
      if (visibleIdentities.has(stableIdentity)) {
        continue;
      }

      this.unmountRenderer(
        stableIdentity,
        this._rendererRegistry.get(stableIdentity)
      );
    }
  }

  private getUpdatedVisibleIdentities(
    diff: ElementDiff,
    visibleIdentities: Set<string>
  ): Set<string> {
    const updatedIdentities = new Set<string>();

    for (const diffUpdatedIdentities of diff.updated.values()) {
      for (const stableIdentity of diffUpdatedIdentities) {
        if (!visibleIdentities.has(stableIdentity)) {
          continue;
        }

        updatedIdentities.add(stableIdentity);
      }
    }

    return updatedIdentities;
  }

  private createRendererElement(element: NotationElement): {
    renderer: ElementRenderer | undefined;
    isNewRenderer: boolean;
  } {
    const stableIdentity = element.getStableIdentity();
    const existingRenderer = this._rendererRegistry.get(stableIdentity);
    if (existingRenderer !== undefined) {
      return { renderer: existingRenderer, isNewRenderer: false };
    }

    const renderer = createRendererForElement(
      this.trackController,
      element,
      this.assetsPath
    );
    if (renderer === undefined) {
      return { renderer: undefined, isNewRenderer: false };
    }

    this._rendererRegistry.set(stableIdentity, renderer);
    return { renderer, isNewRenderer: true };
  }

  private renderVisibleElementRenderers(
    elementsByUpdateStatus: Map<NotationElement, boolean>,
    options: EditorRenderOptions
  ): ElementRenderer[] {
    const activeRenderers: ElementRenderer[] = [];

    for (const [element, isUpdated] of elementsByUpdateStatus) {
      const stableIdentity = element.getStableIdentity();
      const { renderer, isNewRenderer } = this.createRendererElement(element);
      if (renderer === undefined) {
        continue;
      }

      const wasMounted = this.isRendererMounted(stableIdentity, renderer);
      const shouldRender =
        options.forceNotation || isNewRenderer || isUpdated || !wasMounted;

      // Renderer identity is stable, but rematerialization can replace the
      // element object carrying current geometry and ownership references.
      renderer.updateElementReference(element);
      this.mountRenderer(renderer, element);

      if (wasMounted && !shouldRender) {
        activeRenderers.push(renderer);
        continue;
      }

      if (shouldRender) {
        renderer.render();
      }

      activeRenderers.push(renderer);
    }

    return activeRenderers;
  }

  private reconcileRendererState(
    visibleElements: NotationElement[],
    options: EditorRenderOptions
  ): ElementRenderer[] {
    const diffIncludesSkeletonRebuild =
      this.trackController.trackElement.skeletonWasRebuilt;
    const diff = this.trackController.trackElement.consumeDiff();
    const visibleIdentities = new Set(
      visibleElements.map((ve) => ve.getStableIdentity())
    );

    this.disposeRemovedRenderers(diff, diffIncludesSkeletonRebuild);
    this.detachOffscreenRenderers(visibleIdentities);
    const updatedIdentities = this.getUpdatedVisibleIdentities(
      diff,
      visibleIdentities
    );

    const elementsByUpdateStatus = new Map();
    for (const element of visibleElements) {
      const isUpdated = updatedIdentities.has(element.getStableIdentity());
      elementsByUpdateStatus.set(element, isUpdated);
    }
    return this.renderVisibleElementRenderers(elementsByUpdateStatus, options);
  }

  private *getMountedRenderers(): Generator<ElementRenderer> {
    for (const stableIdentity of this._mountedRendererIdentities) {
      const renderer = this._rendererRegistry.get(stableIdentity);
      if (renderer !== undefined) {
        yield renderer;
      }
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
    this._beatInteractionRenderer.attachEvent(eventType, eventHandler);
  }

  public detachBeatInteractionEvent<K extends keyof SVGElementEventMap>(
    eventType: K
  ): void {
    this._beatInteractionRenderer.detachEvent(eventType);
  }

  private syncRootSVGDimensions(): void {
    const trackWindowHeight = this.trackController.trackElement.height;
    const padding = this.trackController.layoutDimensions.HORIZONTAL_PADDING;
    const trackWindowWidth =
      this.trackController.trackElement.width + padding * 2;
    const VB = `0 0 ${trackWindowWidth} ${trackWindowHeight}`;
    this.rootSVGElement.setAttribute("viewBox", VB);
    this.rootSVGElement.setAttribute("width", `${trackWindowWidth}`);
    this.rootSVGElement.setAttribute("height", `${trackWindowHeight}`);
  }

  private renderNotation(options: EditorRenderOptions): void {
    this.setViewportRect();

    const { start, end } = this.getLinesInViewport();
    const singleLine =
      this.trackController.trackElement.layoutMode ===
      TabUILayoutMode.SingleLine;
    const masterBarRange = singleLine
      ? this.getMasterBarsInViewport()
      : {
          start: 0,
          end: this.trackController.track.score.masterBars.length - 1,
        };
    if (
      !options.forceNotation &&
      this._lastRenderedViewportStart === start &&
      this._lastRenderedViewportEnd === end &&
      this._lastRenderedMasterBarStart === masterBarRange.start &&
      this._lastRenderedMasterBarEnd === masterBarRange.end &&
      !this.trackController.trackElement.hasPendingElementDiff()
    ) {
      return;
    }

    const lastLineIndex =
      this.trackController.trackElement.trackLineElements.length - 1;
    const retainedStart = Math.max(
      0,
      start - EditorSVGRenderer.MATERIALIZED_LINE_CACHE_MARGIN
    );
    const retainedEnd = Math.min(
      lastLineIndex,
      end + EditorSVGRenderer.MATERIALIZED_LINE_CACHE_MARGIN
    );

    // Ensure that the viewport's elements are up to date.
    this.trackController.trackElement.update({
      lineRange: { startLineIndex: start, endLineIndex: end },
      masterBarRange: {
        startMasterBarIndex: masterBarRange.start,
        endMasterBarIndex: masterBarRange.end,
      },
      rebuildSkeleton: false,
      forceElements: false,
      dematerializeOutsideRange: {
        startLineIndex: retainedStart,
        endLineIndex: retainedEnd,
      },
      dematerializeOutsideMasterBarRange: {
        startMasterBarIndex: masterBarRange.start,
        endMasterBarIndex: masterBarRange.end,
      },
    });
    const visibleLines =
      this.trackController.trackElement.trackLineElements.slice(start, end + 1);
    const visibleElements = visibleLines.flatMap(
      (l) => l.drawableNotationElements
    );

    // Prepare retained SVG scaffolding before mounting renderer content into it.
    this.reconcileVisibleContainers(visibleLines);
    this.refreshContainerPresentation();

    this.reconcileRendererState(visibleElements, options);
    this._lastRenderedViewportStart = start;
    this._lastRenderedViewportEnd = end;
    this._lastRenderedMasterBarStart = masterBarRange.start;
    this._lastRenderedMasterBarEnd = masterBarRange.end;

    this._beatInteractionRenderer.render(visibleElements);

    this.syncRootSVGDimensions();
  }

  /**
   * Render track window using SVG.
   */
  public render(
    options: EditorRenderOptions = DEFAULT_RENDER_OPTIONS
  ): ElementRenderer[] {
    if (options.renderNotation) {
      this.renderNotation(options);
    }

    if (options.overlays.player) {
      this._playerOverlayRenderer.render();
    }
    if (options.overlays.selection) {
      this._selectionOverlayRenderer.render();
    }

    return Array.from(this.getMountedRenderers());
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
    this._trackLineContainers.clear();
    this._mountedRendererIdentities.clear();
    this._lastRenderedViewportStart = undefined;
    this._lastRenderedViewportEnd = undefined;
    this._lastRenderedMasterBarStart = undefined;
    this._lastRenderedMasterBarEnd = undefined;
    this._playerOverlayRenderer.unrender();
    this._selectionOverlayRenderer.unrender();
    this._beatInteractionRenderer.unrender();

    this.rootSVGElement.replaceChildren();
    this.mountRootLayers();
  }

  public dispose(): void {
    this.detachViewportScrollEvent();
    this.unrender();
    this.notationViewportDiv.replaceChildren();
    this.notationViewportDiv.classList.remove("tu-single-line-notation");
  }
}
