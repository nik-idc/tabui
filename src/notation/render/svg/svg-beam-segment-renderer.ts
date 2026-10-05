import { BeamSegmentElement, TrackController } from "../../controller";
import { createSVGG, createSVGPath, createSVGRect } from "../../../shared";
import { ElementRenderer } from "../element-renderer";
import type { ResolvedAssetConfig } from "../../../config/asset-url-resolver";

/**
 * Class for rendering a tuplet segment using SVG
 */
export class SVGBeamSegmentRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Beam segment element */
  beamSegment: BeamSegmentElement;
  /** Path to any assets */
  readonly assetsPath: ResolvedAssetConfig;

  /** Container SVG group */
  private _containerGroupSVG?: SVGGElement;
  /** Long beam rectangle */
  private _longRectSVG?: SVGRectElement[];
  /** Short beam rectangles */
  private _shortRectSVG?: SVGRectElement[];
  /** Hit targets for long beam rectangles */
  private _longHitPathsSVG?: SVGPathElement[];
  /** Hit targets for short beam rectangles */
  private _shortHitPathsSVG?: SVGPathElement[];
  /** Supplied callbacks keyed by event type. */
  private _attachedEvents = new Map<string, EventListener>();
  /** Beam hover listeners keyed by event type. */
  private _hoverListeners = new Map<string, EventListener>();

  /**
   * Class for rendering a tuplet segment using SVG
   * @param trackController Track controller
   * @param beamSegment Beam segment element
   * @param assetsPath Path to assets
   */
  constructor(
    trackController: TrackController,
    beamSegment: BeamSegmentElement,
    assetsPath: ResolvedAssetConfig
  ) {
    this.trackController = trackController;
    this.beamSegment = beamSegment;

    this.assetsPath = assetsPath;
  }

  public detachContainerGroup(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    this.setHoverGroup(false);
    for (const eventType of this._attachedEvents.keys()) {
      this.detachMouseEvent(eventType as keyof SVGElementEventMap);
    }
    for (const eventType of this._hoverListeners.keys()) {
      this.detachHoverEvent(eventType);
    }
    this._containerGroupSVG.parentNode?.removeChild(this._containerGroupSVG);
  }

  public updateElementReference(element: BeamSegmentElement): void {
    this.setHoverGroup(false);
    this.beamSegment = element;
  }

  /**
   * Ensures renderer's container group exists and returns it.
   * @returns Renderer's container SVG group element
   */
  public ensureContainerGroup(): SVGGElement {
    if (this._containerGroupSVG !== undefined) {
      return this._containerGroupSVG;
    }

    const beamUUID = this.beamSegment.uuid;
    this._containerGroupSVG = createSVGG();
    this._containerGroupSVG.setAttribute("id", `beam-segment-${beamUUID}`);
    this._containerGroupSVG.setAttribute("class", "tu-beam");

    return this._containerGroupSVG;
  }

  /**
   * Renders the group element which will contain all the
   * data about the bar
   */
  private renderGroup(): void {
    const group = this.ensureContainerGroup();
    this.setHoverGroup(false);
    group.removeAttribute("transform");
    const barUUID = this.beamSegment.owningBarElement.bar.uuid;
    const groupKey = `${barUUID}-${this.beamSegment.voiceNumber}-${
      this.beamSegment.curBeatElement.beat.beamGroupId
    }`;
    group.setAttribute("data-beam-group", groupKey);
    this.attachHoverListeners();
  }

  /** Attaches the listeners that highlight every segment in this beam group. */
  private attachHoverListeners(): void {
    const group = this._containerGroupSVG;
    if (group === undefined || this._hoverListeners.size > 0) {
      return;
    }
    const enterListener = this.handlePointerEnter.bind(this);
    const leaveListener = this.handlePointerLeave.bind(this);
    group.addEventListener("pointerenter", enterListener);
    group.addEventListener("pointerleave", leaveListener);
    this._hoverListeners.set("pointerenter", enterListener);
    this._hoverListeners.set("pointerleave", leaveListener);
  }

  /** Highlights all rendered beam segments with the current group key. */
  private handlePointerEnter(): void {
    this.setHoverGroup(true);
  }

  /** Removes the highlight from all rendered beam segments with the current key. */
  private handlePointerLeave(): void {
    this.setHoverGroup(false);
  }

  /** Sets or clears the hover class for this beam group in its owning SVG. */
  private setHoverGroup(hovered: boolean): void {
    const group = this._containerGroupSVG;
    const key = group?.getAttribute("data-beam-group");
    const svg = group?.ownerSVGElement;
    if (key === null || key === undefined || svg == null) {
      return;
    }
    const peers = svg.querySelectorAll<SVGGElement>(
      `[data-beam-group="${key}"]`
    );
    for (const peer of peers) {
      peer.classList.toggle("tu-beam-hover", hovered);
    }
  }

  /** Attaches a callback using the renderer's current beam segment. */
  public attachMouseEvent<K extends keyof SVGElementEventMap>(
    eventType: K,
    eventHandler: (
      event: SVGElementEventMap[K],
      beamSegment: BeamSegmentElement
    ) => void
  ): void {
    const group = this.ensureContainerGroup();
    this.detachMouseEvent(eventType);
    const listener = (this.dispatchMouseEvent<K>).bind(this, eventHandler);
    group.addEventListener(eventType, listener);
    this._attachedEvents.set(eventType, listener);
  }

  /** Dispatches an event using the renderer's current beam segment. */
  private dispatchMouseEvent<K extends keyof SVGElementEventMap>(
    eventHandler: (
      event: SVGElementEventMap[K],
      beamSegment: BeamSegmentElement
    ) => void,
    event: Event
  ): void {
    eventHandler(event as SVGElementEventMap[K], this.beamSegment);
  }

  /** Detaches a previously supplied callback. */
  public detachMouseEvent<K extends keyof SVGElementEventMap>(
    eventType: K
  ): void {
    const listener = this._attachedEvents.get(eventType);
    if (listener === undefined) {
      return;
    }
    this._containerGroupSVG?.removeEventListener(eventType, listener);
    this._attachedEvents.delete(eventType);
  }

  /** Detaches an internal hover listener. */
  private detachHoverEvent(eventType: string): void {
    const listener = this._hoverListeners.get(eventType);
    if (listener === undefined) {
      return;
    }
    this._containerGroupSVG?.removeEventListener(eventType, listener);
    this._hoverListeners.delete(eventType);
  }

  /**
   * Renders beam segment's long rectangle
   */
  private renderLongRect(index: number): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render beam long rect when SVG group undefined");
    }

    if (this._longRectSVG === undefined) {
      throw Error("Tried to render beam long rect when SVG group undefined");
    }

    const beamUUID = this.beamSegment.uuid;
    if (this._longRectSVG[index] === undefined) {
      this._longRectSVG[index] = createSVGRect();

      // Set id
      const id = `beam-long-rect-${beamUUID}-rect`;
      this._longRectSVG[index].setAttribute("id", id);
      this._longRectSVG[index].setAttribute("fill", "var(--tu-notation-ink)");
      this._longRectSVG[index].setAttribute("class", "tu-beam-visible");

      // Add element to root SVG element
      this._containerGroupSVG.appendChild(this._longRectSVG[index]);
    }

    const longRectsBarLocal = this.beamSegment.longRectsBarLocal;
    const x = `${longRectsBarLocal[index].x}`;
    const y = `${longRectsBarLocal[index].y}`;
    const width = `${longRectsBarLocal[index].width}`;
    const height = `${longRectsBarLocal[index].height}`;
    this._longRectSVG[index].setAttribute("x", x);
    this._longRectSVG[index].setAttribute("y", y);
    this._longRectSVG[index].setAttribute("width", width);
    this._longRectSVG[index].setAttribute("height", height);
    this.renderHitPath(
      index,
      this.beamSegment.longRectsBarLocal[index],
      this._longHitPathsSVG
    );
  }

  /**
   * Unrenders beam segment's long rectangle
   */
  private unrenderLongRect(index: number): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to unrender beam long rect when SVG group undefined");
    }

    if (
      this._longRectSVG === undefined ||
      this._longRectSVG[index] === undefined
    ) {
      return;
    }

    this._containerGroupSVG.removeChild(this._longRectSVG[index]);
    this._longRectSVG.splice(index, 1);
    this.unrenderHitPath(index, this._longHitPathsSVG);
  }

  /**
   * Renders beam segment's long rectangles
   */
  private renderLongRects(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render beam long rect when SVG group undefined");
    }

    if (this._longRectSVG === undefined) {
      this._longRectSVG = [];
    }
    if (this._longHitPathsSVG === undefined) {
      this._longHitPathsSVG = [];
    }

    while (this._longRectSVG.length > this.beamSegment.longRects.length) {
      this.unrenderLongRect(this._longRectSVG.length - 1);
    }

    for (let i = 0; i < this.beamSegment.longRects.length; i++) {
      this.renderLongRect(i);
    }
  }

  /**
   * Unrenders beam segment's long rectangles
   */
  private unrenderLongRects(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to unrender beam long rect when SVG group undefined");
    }

    if (this._longRectSVG === undefined) {
      return;
    }

    while (this._longRectSVG.length > 0) {
      this.unrenderLongRect(this._longRectSVG.length - 1);
    }

    this._longRectSVG = undefined;
    this._longHitPathsSVG = undefined;
  }

  /**
   * Renders beam segment's short rectangle
   */
  private renderShortRect(index: number): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render beam short rect when SVG group undefined");
    }

    if (this._shortRectSVG === undefined) {
      throw Error("Tried to render beam short rect when SVG group undefined");
    }

    const beamUUID = this.beamSegment.uuid;
    if (this._shortRectSVG[index] === undefined) {
      this._shortRectSVG[index] = createSVGRect();

      // Set id
      const id = `beam-short-rect-${beamUUID}-rect-${index}`;
      this._shortRectSVG[index].setAttribute("id", id);
      this._shortRectSVG[index].setAttribute("fill", "var(--tu-notation-ink)");
      this._shortRectSVG[index].setAttribute("class", "tu-beam-visible");

      // Add element to root SVG element
      this._containerGroupSVG.appendChild(this._shortRectSVG[index]);
    }

    const shortRectsBarLocal = this.beamSegment.shortRectsBarLocal;
    const x = `${shortRectsBarLocal[index].x}`;
    const y = `${shortRectsBarLocal[index].y}`;
    const width = `${shortRectsBarLocal[index].width}`;
    const height = `${shortRectsBarLocal[index].height}`;
    this._shortRectSVG[index].setAttribute("x", x);
    this._shortRectSVG[index].setAttribute("y", y);
    this._shortRectSVG[index].setAttribute("width", width);
    this._shortRectSVG[index].setAttribute("height", height);
    this.renderHitPath(
      index,
      this.beamSegment.shortRectsBarLocal[index],
      this._shortHitPathsSVG
    );
  }

  /**
   * Renders beam segment's short rectangle
   */
  private unrenderShortRect(index: number): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to unrender tuplet segment when SVG group undefined");
    }

    if (
      this._shortRectSVG === undefined ||
      this._shortRectSVG[index] === undefined
    ) {
      return;
    }

    this._containerGroupSVG.removeChild(this._shortRectSVG[index]);
    this._shortRectSVG.splice(index, 1);
    this.unrenderHitPath(index, this._shortHitPathsSVG);
  }

  /**
   * Renders beam segment's short rectangles
   */
  private renderShortRects(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render beam short rect when SVG group undefined");
    }

    if (this._shortRectSVG === undefined) {
      this._shortRectSVG = [];
    }
    if (this._shortHitPathsSVG === undefined) {
      this._shortHitPathsSVG = [];
    }

    while (this._shortRectSVG.length > this.beamSegment.shortRects.length) {
      this.unrenderShortRect(this._shortRectSVG.length - 1);
    }

    for (let i = 0; i < this.beamSegment.shortRects.length; i++) {
      this.renderShortRect(i);
    }
  }

  /**
   * Unrenders beam segment's short rectangles
   */
  private unrenderShortRects(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render beam short rect when SVG group undefined");
    }

    if (this._shortRectSVG === undefined) {
      return;
    }

    while (this._shortRectSVG.length > 0) {
      this.unrenderShortRect(this._shortRectSVG.length - 1);
    }

    this._shortRectSVG = undefined;
    this._shortHitPathsSVG = undefined;
  }

  /** Renders or updates a padded rectangular beam hit target. */
  private renderHitPath(
    index: number,
    rect: { x: number; y: number; width: number; height: number },
    paths: SVGPathElement[] | undefined
  ): void {
    if (this._containerGroupSVG === undefined || paths === undefined) {
      throw Error("Tried to render beam hit path when SVG group undefined");
    }
    if (paths[index] === undefined) {
      paths[index] = createSVGPath();
      paths[index].setAttribute("class", "tu-beam-hit");
      paths[index].setAttribute("fill", "transparent");
      paths[index].setAttribute("pointer-events", "all");
      this._containerGroupSVG.appendChild(paths[index]);
    }
    const padding =
      this.trackController.trackElement.layoutDimensions.noteTextSize / 8;
    const x = rect.x - padding;
    const y = rect.y - padding;
    const width = rect.width + padding * 2;
    const height = rect.height + padding * 2;
    paths[index].setAttribute(
      "d",
      `M ${x} ${y} h ${width} v ${height} h -${width} Z`
    );
  }

  /** Removes a rectangular beam hit target. */
  private unrenderHitPath(
    index: number,
    paths: SVGPathElement[] | undefined
  ): void {
    const path = paths?.[index];
    if (path === undefined) {
      return;
    }
    this._containerGroupSVG?.removeChild(path);
    paths?.splice(index, 1);
  }

  /**
   * Render tuplet segment
   */
  public render(): void {
    this.renderGroup();

    this.renderLongRects();
    this.renderShortRects();
    const group = this._containerGroupSVG;
    const key = group?.getAttribute("data-beam-group");
    const hovered = group?.ownerSVGElement?.querySelector(
      `[data-beam-group="${key}"]:hover`
    );
    this.setHoverGroup(hovered != null);
  }

  /**
   * Unrender everything
   */
  public unrender(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    this.setHoverGroup(false);
    this.unrenderLongRects();
    this.unrenderShortRects();
  }
}
