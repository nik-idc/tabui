import {
  BeatElement,
  NoteElement,
  NotationElement,
  EditorLayoutDimensions,
  TrackController,
  NotationElementClass,
} from "@/notation/controller";
import type { ResolvedAssetConfig } from "@/config/asset-url-resolver";
import { createSVG, createSVGG, Rect } from "@/shared";
import { EditorRenderer } from "../editor-renderer";
import { ElementRenderer } from "../element-renderer";
import { TabBeatElement } from "@/notation/controller/element/beat/tab-beat-element";
import { ELEMENT_ORDER } from "@/notation/controller/element/track-element";
import { createRendererForElement } from "./support/renderer-factory";
import { SelectionOverlayRenderer } from "./selection-overlay-renderer";
import { TrackLineElement } from "@/notation/controller/element/track/track-line-element";
import { TrackLineInfoElement } from "@/notation/controller/element/track/track-line-info-element";
import { StaffLineElement } from "@/notation/controller/element/staff/staff-line-element";
import { NotationStyleLineElement } from "@/notation/controller/element/staff/notation-style-line-element";
import { TechGapElement } from "@/notation/controller/element/staff/tech-gap-element";
import { TechGapLineElement } from "@/notation/controller/element/staff/tech-gap-line-element";
import { BarElement } from "@/notation/controller/element/bar/bar-element";
import { VoiceBarElement } from "@/notation/controller/element/bar/voice-bar-element";
import { VoiceBarRhythmElement } from "@/notation/controller/element/bar/voice-bar-rhythm-element";
import { TabBeatRhythmElement } from "@/notation/controller/element/beat/tab-beat-rhythm-element";
import { TabNoteElement } from "@/notation/controller/element/note/tab-note-element";
import { GuitarTechniqueElement } from "@/notation/controller/element/technique/guitar-technique/guitar-technique-element";
import { GuitarTechniqueLabelElement } from "@/notation/controller/element/technique/guitar-technique/guitar-technique-label-element";
import { BeamSegmentElement } from "@/notation/controller/element/bar/beam-segment-element";
import { BarTupletGroupElement } from "@/notation/controller/element/bar/bar-tuplet-group-element";
import { getOwningTrackLineElement } from "@/notation/controller/element/track/update/track-element-update-helpers";
import { getOwningBarElement } from "@/notation/controller/element/track/update/track-element-update-helpers";
import { BeatInteractionRenderer } from "./beat-interaction-renderer";
import { PlayerOverlayRenderer } from "./player-overlay-renderer";
import { ensureDomChildAtIndex, toDomIdFragment } from "./support/misc";
import { VoiceNumber } from "@/notation/model";

type TrackLineGroup = {
  wrapper: SVGGElement;
  layerGroups: Map<NotationElementClass, SVGGElement>;
  barGroups: Map<string, BarGroup>;
};

type BarGroup = {
  wrapper: SVGGElement;
  layerGroups: Map<NotationElementClass, SVGGElement>;
  voiceContentGroups: Map<VoiceNumber, SVGGElement>;
  voiceRhythmGroups: Map<VoiceNumber, SVGGElement>;
};

const BAR_OWNED_ELEMENT_CLASSES: Array<NotationElementClass> = [
  BarElement,
  GuitarTechniqueLabelElement,
];

const VOICE_CONTENT_ELEMENT_CLASSES: Array<NotationElementClass> = [
  VoiceBarElement,
  TabBeatElement,
  TabNoteElement,
  GuitarTechniqueElement,
];

const VOICE_RHYTHM_ELEMENT_CLASSES: Array<NotationElementClass> = [
  VoiceBarRhythmElement,
  TabBeatRhythmElement,
  BeamSegmentElement,
  BarTupletGroupElement,
];

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

  /** Notation-only scroll viewport wrapper. */
  readonly notationViewportDiv: HTMLDivElement;
  /** Root SVG <svg> element */
  readonly rootSVGElement: SVGSVGElement;
  /** Path to any assets */
  readonly assetsPath: ResolvedAssetConfig;
  /** Track controller rendered by this renderer instance. */
  readonly trackController: TrackController;

  /** Track line wrapper groups keyed by stable identity. */
  private _trackLineGroups: Map<string, TrackLineGroup>;
  /** Registry mapping stable element identity to renderer. */
  private _rendererRegistry: Map<string, ElementRenderer>;
  /** Renderer UUIDs currently mounted in layer groups. */
  private _mountedRendererUUIDs: Set<string>;
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

  /**
   * Render a track window using SVG
   * @param rootDiv Root container element
   * @param assetsPath Path to assets
   */
  constructor(
    rootDiv: HTMLDivElement,
    trackController: TrackController,
    assetsPath: ResolvedAssetConfig
  ) {
    this.notationViewportDiv = document.createElement("div");
    this.notationViewportDiv.classList.add("tu-notation-viewport");
    this.rootSVGElement = createSVG();
    this.rootSVGElement.classList.add("tu-root-svg");
    this.notationViewportDiv.appendChild(this.rootSVGElement);
    rootDiv.appendChild(this.notationViewportDiv);

    this.assetsPath = assetsPath;
    this.trackController = trackController;

    this._trackLineGroups = new Map();
    this._rendererRegistry = new Map();
    this._mountedRendererUUIDs = new Set();
    this._viewportRect = new Rect();
    this.syncViewportState();

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
      this.trackController
    );

    this.mountRootLayers();
  }

  private mountRootLayers(): void {
    this.rootSVGElement.appendChild(this._interactionSVGGroup);
    this.rootSVGElement.appendChild(this._notationSVGGroup);
    this.rootSVGElement.appendChild(this._selectionSVGGroup);
    this.rootSVGElement.appendChild(this._playerSVGGroup);
  }

  private ensureBarGroup(
    trackLineGroup: TrackLineGroup,
    barElement: BarElement
  ): BarGroup {
    const stableIdentity = barElement.getStableIdentity();
    const existingGroup = trackLineGroup.barGroups.get(stableIdentity);

    const translateX = barElement.lineLocalCoords.x;
    const translateY = barElement.lineLocalCoords.y;
    const barWrapperTransform = `translate(${translateX}, ${translateY})`;
    if (existingGroup !== undefined) {
      existingGroup.wrapper.setAttribute("transform", barWrapperTransform);
      return existingGroup;
    }

    const wrapper = createSVGG();
    wrapper.setAttribute(
      "id",
      `tu-bar-wrapper-${toDomIdFragment(stableIdentity)}`
    );
    wrapper.setAttribute("transform", barWrapperTransform);

    const layerGroups = new Map<NotationElementClass, SVGGElement>();
    for (const elementClass of BAR_OWNED_ELEMENT_CLASSES) {
      const group = createSVGG();
      group.setAttribute(
        "data-layer",
        elementClass.name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
      );
      layerGroups.set(elementClass, group);
      wrapper.appendChild(group);
    }

    const barGroup = {
      wrapper,
      layerGroups,
      voiceContentGroups: new Map<VoiceNumber, SVGGElement>(),
      voiceRhythmGroups: new Map<VoiceNumber, SVGGElement>(),
    };
    trackLineGroup.barGroups.set(stableIdentity, barGroup);
    return barGroup;
  }

  private ensureVoiceGroup(
    barGroup: BarGroup,
    voiceNumber: VoiceNumber,
    voiceKind: "content" | "rhythm"
  ): SVGGElement {
    const groups =
      voiceKind === "content"
        ? barGroup.voiceContentGroups
        : barGroup.voiceRhythmGroups;
    let group = groups.get(voiceNumber);
    if (group === undefined) {
      group = createSVGG();
      group.setAttribute("data-voice", `${voiceNumber}`);
      group.setAttribute("data-voice-kind", voiceKind);
      groups.set(voiceNumber, group);
    }

    const isActive = voiceNumber === this.trackController.activeVoiceNumber;
    group.setAttribute("opacity", isActive ? "1" : "0.5");
    this.syncBarVoiceGroupOrder(barGroup);

    return group;
  }

  private syncBarVoiceGroupOrder(barGroup: BarGroup): void {
    this.appendVoiceGroupsInOrder(barGroup, barGroup.voiceContentGroups);
    this.appendVoiceGroupsInOrder(barGroup, barGroup.voiceRhythmGroups);
  }

  private appendVoiceGroupsInOrder(
    barGroup: BarGroup,
    groups: Map<VoiceNumber, SVGGElement>
  ): void {
    const inactiveVoiceNumbers = [...groups.keys()].filter(
      (voiceNumber) => voiceNumber !== this.trackController.activeVoiceNumber
    );
    const activeGroup = groups.get(this.trackController.activeVoiceNumber);

    for (const voiceNumber of inactiveVoiceNumbers) {
      barGroup.wrapper.appendChild(groups.get(voiceNumber)!);
    }
    if (activeGroup !== undefined) {
      barGroup.wrapper.appendChild(activeGroup);
    }
  }

  private getVoiceContentNumber(element: NotationElement): VoiceNumber | null {
    if (element instanceof VoiceBarElement) {
      return element.voiceBar.voiceNumber;
    }
    if (element instanceof TabBeatElement) {
      return element.beat.voiceBar.voiceNumber;
    }
    if (element instanceof TabNoteElement) {
      return element.beatElement.beat.voiceBar.voiceNumber;
    }
    if (element instanceof GuitarTechniqueElement) {
      return element.noteElement.beatElement.beat.voiceBar.voiceNumber;
    }

    return null;
  }

  private getVoiceRhythmNumber(element: NotationElement): VoiceNumber | null {
    if (element instanceof VoiceBarRhythmElement) {
      return element.voiceNumber;
    }
    if (element instanceof TabBeatRhythmElement) {
      return element.voiceBarRhythmElement.voiceNumber;
    }
    if (element instanceof BeamSegmentElement) {
      return element.voiceBarRhythmElement.voiceNumber;
    }
    if (element instanceof BarTupletGroupElement) {
      return element.voiceBarRhythmElement.voiceNumber;
    }

    return null;
  }

  private syncTrackLineBarGroups(
    trackLineGroup: TrackLineGroup,
    trackLineElement: TrackLineElement
  ): void {
    const visibleBarStableIdentities = new Set<string>();
    let barGroupIndex = trackLineGroup.layerGroups.size;

    // Ensure existence of visible bar groups
    for (const staffLineElement of trackLineElement.staffLineElements) {
      for (const notationStyleLineElement of staffLineElement.styleLinesAsArray) {
        for (const barElement of notationStyleLineElement.barElements) {
          const stableIdentity = barElement.getStableIdentity();
          visibleBarStableIdentities.add(stableIdentity);

          const barGroup = this.ensureBarGroup(trackLineGroup, barElement);
          ensureDomChildAtIndex(
            trackLineGroup.wrapper,
            barGroup.wrapper,
            barGroupIndex
          );
          barGroupIndex++;
        }
      }
    }

    // Remove stale bar groups from the track line group
    for (const [stableIdentity, barGroup] of trackLineGroup.barGroups) {
      if (visibleBarStableIdentities.has(stableIdentity)) {
        continue;
      }

      barGroup.wrapper.remove();
      trackLineGroup.barGroups.delete(stableIdentity);
    }
  }

  private ensureTrackLineGroup(
    trackLineElement: TrackLineElement
  ): TrackLineGroup {
    // Check for existing track line group and simply update if it exists
    const stableIdentity = trackLineElement.getStableIdentity();
    const existingLineGroup = this._trackLineGroups.get(stableIdentity);
    if (existingLineGroup !== undefined) {
      existingLineGroup.wrapper.setAttribute(
        "transform",
        `translate(${trackLineElement.globalCoords.x}, ${trackLineElement.globalCoords.y})`
      );
      this.syncTrackLineBarGroups(existingLineGroup, trackLineElement);
      return existingLineGroup;
    }

    // Create the line wrapper
    const wrapper = createSVGG();
    wrapper.setAttribute(
      "id",
      `tu-track-line-wrapper-${toDomIdFragment(stableIdentity)}`
    );
    wrapper.setAttribute(
      "transform",
      `translate(${trackLineElement.globalCoords.x}, ${trackLineElement.globalCoords.y})`
    );

    // Create the layer groups & populate the wrapper with them
    const layerGroups = new Map<NotationElementClass, SVGGElement>();
    const sanitizedStableIdentity = toDomIdFragment(stableIdentity);
    for (const elementClass of ELEMENT_ORDER) {
      // Skip not track line owned elements (e.g. track line info is per track line)
      if (
        BAR_OWNED_ELEMENT_CLASSES.includes(elementClass) ||
        VOICE_CONTENT_ELEMENT_CLASSES.includes(elementClass) ||
        VOICE_RHYTHM_ELEMENT_CLASSES.includes(elementClass)
      ) {
        continue;
      }

      const group = createSVGG();
      group.setAttribute(
        "id",
        `tu-line-${sanitizedStableIdentity}-${elementClass.name
          .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
          .toLowerCase()}`
      );
      layerGroups.set(elementClass, group);
      wrapper.appendChild(group);
    }

    const trackLineGroup = { wrapper, layerGroups, barGroups: new Map() };
    this.syncTrackLineBarGroups(trackLineGroup, trackLineElement);
    this._trackLineGroups.set(stableIdentity, trackLineGroup);
    return trackLineGroup;
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

  private reconcileLinesViewport(
    start: number,
    end: number
  ): NotationElement[] {
    const visibleTrackLines =
      this.trackController.trackElement.trackLineElements.slice(start, end + 1);
    const visibleStableIdentities = new Set(
      visibleTrackLines.map((trackLineElement) =>
        trackLineElement.getStableIdentity()
      )
    );

    for (let i = 0; i < visibleTrackLines.length; i++) {
      const trackLineElement = visibleTrackLines[i];
      const trackLineGroup = this.ensureTrackLineGroup(trackLineElement);
      ensureDomChildAtIndex(this._notationSVGGroup, trackLineGroup.wrapper, i);
    }

    for (const [stableIdentity, trackLineGroup] of this._trackLineGroups) {
      if (visibleStableIdentities.has(stableIdentity)) {
        continue;
      }

      trackLineGroup.wrapper.remove();
      this._trackLineGroups.delete(stableIdentity);
    }

    // WARNING: This used to be `tle.ownedNotationElements`. It helped not
    // drag performance down, but it exposed a flaw of stale `_ownedNotationElements`.
    // For now, this uses `refreshOwnedNotationElements` to ensure correctness. But
    // later this must be changed back to avoid performance bottlenecks.
    return visibleTrackLines.flatMap((tle) =>
      tle.refreshOwnedNotationElements()
    );
  }

  private removeByDiff(stableIdentities: Iterable<string>): void {
    for (const stableIdentity of stableIdentities) {
      const renderer = this._rendererRegistry.get(stableIdentity);
      if (renderer === undefined) {
        continue;
      }

      renderer.unrender();
      renderer.detachContainerGroup();
      this._rendererRegistry.delete(stableIdentity);
      this._mountedRendererUUIDs.delete(stableIdentity);
    }
  }

  private cullInvisibleRenderers(visibleStableIdentities: Set<string>): void {
    for (const stableIdentity of this._mountedRendererUUIDs) {
      if (visibleStableIdentities.has(stableIdentity)) {
        continue;
      }

      const renderer = this._rendererRegistry.get(stableIdentity);
      if (renderer === undefined) {
        this._mountedRendererUUIDs.delete(stableIdentity);
        continue;
      }

      renderer.detachContainerGroup();
      this._mountedRendererUUIDs.delete(stableIdentity);
    }
  }

  private ensureRendererMounted(
    renderer: ElementRenderer,
    element: NotationElement
  ): void {
    const owningTrackLineElement = getOwningTrackLineElement(element);
    const trackLineGroup = this.ensureTrackLineGroup(owningTrackLineElement);
    const owningBarElement = getOwningBarElement(element);
    let layer: SVGGElement | undefined = undefined;
    if (owningBarElement === null) {
      layer = trackLineGroup.layerGroups.get(
        element.constructor as NotationElementClass
      );
    } else {
      const barGroup = this.ensureBarGroup(trackLineGroup, owningBarElement);
      const voiceContentNumber = this.getVoiceContentNumber(element);
      const voiceRhythmNumber = this.getVoiceRhythmNumber(element);
      if (voiceContentNumber !== null) {
        layer = this.ensureVoiceGroup(barGroup, voiceContentNumber, "content");
      } else if (voiceRhythmNumber !== null) {
        layer = this.ensureVoiceGroup(barGroup, voiceRhythmNumber, "rhythm");
      } else {
        layer = barGroup.layerGroups.get(
          element.constructor as NotationElementClass
        );
      }
    }
    if (layer === undefined) {
      return;
    }

    const group = renderer.ensureContainerGroup();

    if (group.parentNode !== layer) {
      layer.appendChild(group);
    }
  }

  private updateRendererElement(
    renderer: ElementRenderer,
    element: NotationElement
  ): void {
    const mutableRenderer = renderer as any;
    if (element instanceof TrackLineElement) {
      mutableRenderer.trackLineElement = element;
    } else if (element instanceof TrackLineInfoElement) {
      mutableRenderer.trackLineInfoElement = element;
    } else if (element instanceof StaffLineElement) {
      mutableRenderer.staffLineElement = element;
    } else if (element instanceof NotationStyleLineElement) {
      mutableRenderer.styleLineElement = element;
    } else if (element instanceof TechGapElement) {
      mutableRenderer.techGapElement = element;
    } else if (element instanceof TechGapLineElement) {
      mutableRenderer.techGapLineElement = element;
    } else if (element instanceof BarElement) {
      mutableRenderer.barElement = element;
    } else if (element instanceof VoiceBarElement) {
      mutableRenderer.voiceBarElement = element;
    } else if (element instanceof TabBeatElement) {
      mutableRenderer.beatElement = element;
    } else if (element instanceof VoiceBarRhythmElement) {
      mutableRenderer.voiceBarRhythmElement = element;
    } else if (element instanceof TabBeatRhythmElement) {
      mutableRenderer.beatRhythmElement = element;
    } else if (element instanceof TabNoteElement) {
      mutableRenderer.noteElement = element;
    } else if (element instanceof GuitarTechniqueElement) {
      mutableRenderer.techniqueElement = element;
    } else if (element instanceof GuitarTechniqueLabelElement) {
      mutableRenderer.techniqueLabelElement = element;
    } else if (element instanceof BeamSegmentElement) {
      mutableRenderer.beamSegment = element;
    } else if (element instanceof BarTupletGroupElement) {
      mutableRenderer.tupletElement = element;
    }
  }

  private renderReconciled(
    visibleElements: NotationElement[],
    forceRender: boolean = false
  ): ElementRenderer[] {
    const diff = this.trackController.trackElement.consumeDiff();

    const visibleStableIdentities = new Set(
      visibleElements.map((element) => element.getStableIdentity())
    );

    // Step 1: Unrender removed elements
    for (const uuidSet of diff.removed.values()) {
      this.removeByDiff(uuidSet);
    }

    // Step 2: Detach invisible renderers but keep them cached for reuse.
    this.cullInvisibleRenderers(visibleStableIdentities);

    // Step 3: Re-render visible elements when needed (new, updated, remounted).
    const updatedVisibleUUIDs = new Set<string>();
    for (const updatedIdentities of diff.updated.values()) {
      for (const stableIdentity of updatedIdentities) {
        if (visibleStableIdentities.has(stableIdentity)) {
          updatedVisibleUUIDs.add(stableIdentity);
        }
      }
    }

    const activeRenderers: ElementRenderer[] = [];
    for (const element of visibleElements) {
      const stableIdentity = element.getStableIdentity();
      let renderer = this._rendererRegistry.get(stableIdentity);
      let isNewRenderer = false;
      if (renderer === undefined) {
        const newRenderer = createRendererForElement(
          this.trackController,
          element,
          this.assetsPath
        );
        if (newRenderer === undefined) {
          continue;
        }

        renderer = newRenderer;
        this._rendererRegistry.set(stableIdentity, renderer);
        isNewRenderer = true;
      }

      const wasMounted = this._mountedRendererUUIDs.has(stableIdentity);
      this.updateRendererElement(renderer, element);

      this.ensureRendererMounted(renderer, element);
      this._mountedRendererUUIDs.add(stableIdentity);

      if (
        forceRender ||
        isNewRenderer ||
        updatedVisibleUUIDs.has(stableIdentity) ||
        !wasMounted
      ) {
        renderer.render();
      }

      activeRenderers.push(renderer);
    }

    return activeRenderers;
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
    const VB = `0 0 ${EditorLayoutDimensions.WIDTH} ${trackWindowHeight}`;
    this.rootSVGElement.setAttribute("viewBox", VB);
    this.rootSVGElement.setAttribute(
      "width",
      `${EditorLayoutDimensions.WIDTH}`
    );
    this.rootSVGElement.setAttribute("height", `${trackWindowHeight}`);
  }

  /**
   * Render track window using SVG
   */
  public render(): ElementRenderer[] {
    this.syncViewportState();

    const { start, end } = this.getLinesInViewport();
    const visibleElements = this.reconcileLinesViewport(start, end);
    const activeRenderers = this.renderReconciled(visibleElements);

    this._beatInteractionRenderer.render(visibleElements);
    this._playerOverlayRenderer.render();
    this._selectionOverlayRenderer.render();

    this.syncRootSVGDimensions();

    return activeRenderers;
  }

  public renderVisibleNoChange(): ElementRenderer[] {
    this.syncViewportState();

    const { start, end } = this.getLinesInViewport();
    const visibleElements = this.reconcileLinesViewport(start, end);
    // Active voice is controller state, not an element diff. Force-rendering the
    // visible set is a temporary bridge so opacity and hitboxes update after a
    // selection-only voice switch without pretending the model changed.
    const activeRenderers = this.renderReconciled(visibleElements, true);

    this._beatInteractionRenderer.render(visibleElements);
    this._playerOverlayRenderer.render();
    this._selectionOverlayRenderer.render();

    this.syncRootSVGDimensions();

    return activeRenderers;
  }

  public renderSelectionOverlay(): void {
    this._selectionOverlayRenderer.render();
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
    this._trackLineGroups.clear();
    this._playerOverlayRenderer.unrender();
    this._selectionOverlayRenderer.unrender();
    this._beatInteractionRenderer.unrender();

    this.rootSVGElement.replaceChildren();
    this.mountRootLayers();
  }

  public dispose(): void {
    this.unrender();
    this.notationViewportDiv.remove();
  }
}
