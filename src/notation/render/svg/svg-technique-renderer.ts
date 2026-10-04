import {
  NotationElement,
  TechniqueElement,
  TrackController,
} from "../../controller";
import { createSVGG, createSVGPath } from "../../../shared";
import { ElementRenderer } from "../element-renderer";
import type { ResolvedAssetConfig } from "../../../config/asset-url-resolver";

/**
 * Class for rendering a guitar technique element using SVG
 */
export class SVGTechniqueRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Technique element to render */
  techniqueElement: TechniqueElement;

  /** Container SVG group  */
  private _containerGroupSVG?: SVGGElement;

  /** Technique SVG paths */
  private _techniquePathsSVG?: SVGPathElement[];
  /** Reusable wider targets following each inline technique's geometry. */
  private _hitPathsSVG: SVGPathElement[] = [];
  /** Supplied callbacks keyed by event type. */
  private _attachedEvents = new Map<string, EventListener>();

  /**
   * Class for rendering a guitar technique element using SVG
   * @param trackController Track controller
   * @param techniqueElement Guitar technique element
   * @param assetsPath Unused. Kept for uniform renderer constructor signature.
   */
  constructor(
    trackController: TrackController,
    techniqueElement: TechniqueElement,
    assetsPath: ResolvedAssetConfig
  ) {
    this.trackController = trackController;
    this.techniqueElement = techniqueElement;
    void assetsPath;
  }

  /**
   * Ensures renderer's container group exists and returns it.
   * @returns Renderer's container SVG group element
   */
  public ensureContainerGroup(): SVGGElement {
    if (this._containerGroupSVG !== undefined) {
      return this._containerGroupSVG;
    }

    const techniqueUUID = this.techniqueElement.technique.uuid;
    this._containerGroupSVG = createSVGG();
    this._containerGroupSVG.setAttribute("id", `technique-${techniqueUUID}`);
    this._containerGroupSVG.setAttribute("class", "tu-inline-technique");

    return this._containerGroupSVG;
  }

  public detachContainerGroup(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    for (const eventType of this._attachedEvents.keys()) {
      this.detachMouseEvent(eventType as keyof SVGElementEventMap);
    }
    this._containerGroupSVG.parentNode?.removeChild(this._containerGroupSVG);
  }

  public updateElementReference(element: TechniqueElement): void {
    this.techniqueElement = element;
  }

  /** Attaches a supplied callback using the renderer's current element. */
  public attachMouseEvent<K extends keyof SVGElementEventMap>(
    eventType: K,
    eventHandler: (
      event: SVGElementEventMap[K],
      techniqueElement: TechniqueElement
    ) => void
  ): void {
    const group = this.ensureContainerGroup();
    this.detachMouseEvent(eventType);
    const listener = (event: Event) => {
      eventHandler(event as SVGElementEventMap[K], this.techniqueElement);
    };
    group.addEventListener(eventType, listener);
    this._attachedEvents.set(eventType, listener);
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

  /**
   * Renders the group element which will contain all the
   * data about the technique
   */
  private renderGroup(): void {
    this.ensureContainerGroup();
  }

  /**
   * Render technique's raw SVG
   */
  private renderTechniquePaths(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render technique paths when SVG group undefined");
    }

    const pathDescriptors = this.techniqueElement.pathDescriptors;
    if (pathDescriptors === undefined) {
      throw Error("Tried to render technique paths when descriptors undefined");
    }

    const techniqueUUID = this.techniqueElement.technique.uuid;
    if (this._techniquePathsSVG === undefined) {
      this._techniquePathsSVG = [];
    }

    while (this._techniquePathsSVG.length < pathDescriptors.length) {
      const pathIndex = this._techniquePathsSVG.length;
      const pathElement = createSVGPath();
      pathElement.setAttribute(
        "id",
        `technique-path-${techniqueUUID}-${pathIndex}`
      );
      pathElement.setAttribute("class", "tu-technique-visible-path");
      this._containerGroupSVG.appendChild(pathElement);
      this._techniquePathsSVG.push(pathElement);
    }

    while (this._techniquePathsSVG.length > pathDescriptors.length) {
      const pathElement = this._techniquePathsSVG.pop();
      if (pathElement !== undefined) {
        this._containerGroupSVG.removeChild(pathElement);
      }
    }

    const x = this.techniqueElement.pathOriginBarLocal.x;
    const y = this.techniqueElement.pathOriginBarLocal.y;

    for (let i = 0; i < pathDescriptors.length; i++) {
      const pathElement = this._techniquePathsSVG[i];
      const descriptor = pathDescriptors[i];
      pathElement.setAttribute("transform", `translate(${x}, ${y})`);
      pathElement.setAttribute("d", descriptor.d);

      if (descriptor.attrs !== undefined) {
        for (const [option, value] of Object.entries(descriptor.attrs)) {
          pathElement.setAttribute(option, value);
        }
      }
    }
    this.renderHitPaths();
  }

  /** Updates invisible stroke targets using the visible lines' geometry. */
  private renderHitPaths(): void {
    const group = this._containerGroupSVG!;
    const descriptors = this.techniqueElement.pathDescriptors ?? [];

    // TODO: Add a config option to disable wider hit targets for performance.
    while (this._hitPathsSVG.length < descriptors.length) {
      const path = createSVGPath();
      const index = this._hitPathsSVG.length;
      const uuid = this.techniqueElement.technique.uuid;
      path.setAttribute("id", `technique-hit-path-${uuid}-${index}`);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "transparent");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("pointer-events", "stroke");
      group.appendChild(path);
      this._hitPathsSVG.push(path);
    }
    while (this._hitPathsSVG.length > descriptors.length) {
      group.removeChild(this._hitPathsSVG.pop()!);
    }

    const origin = this.techniqueElement.pathOriginBarLocal;
    const strokeWidth = `${this.trackController.trackElement.layoutDimensions.NOTE_TEXT_SIZE / 2}`;
    for (let i = 0; i < descriptors.length; i++) {
      const hasFill =
        descriptors[i].attrs?.fill !== undefined &&
        descriptors[i].attrs?.fill !== "none";
      const fill = hasFill ? "transparent" : "none";
      const pointerEvents = hasFill ? "all" : "stroke";
      const descriptor = descriptors[i].d;
      const transform = `translate(${origin.x}, ${origin.y})`;

      this._hitPathsSVG[i].setAttribute("fill", fill);
      this._hitPathsSVG[i].setAttribute("pointer-events", pointerEvents);
      this._hitPathsSVG[i].setAttribute("stroke-width", strokeWidth);
      this._hitPathsSVG[i].setAttribute("d", descriptor);
      this._hitPathsSVG[i].setAttribute("transform", transform);
    }
  }

  /**
   * Unrender technique's custom HTML (like bend curves, palm mute text etc)
   */
  private unrenderTechniquePaths(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to unrender technique paths when SVG group undefined");
    }

    if (this._techniquePathsSVG === undefined) {
      return;
    }

    for (const pathElement of this._techniquePathsSVG) {
      this._containerGroupSVG.removeChild(pathElement);
    }
    this._techniquePathsSVG = undefined;
    for (const path of this._hitPathsSVG) {
      this._containerGroupSVG.removeChild(path);
    }
    this._hitPathsSVG = [];
  }

  /**
   * Render a note's technique
   */
  public render(): void {
    this.renderGroup();

    // Render technique custom HTML if necessary, remove it otherwise
    if (this.techniqueElement.pathDescriptors !== undefined) {
      this.renderTechniquePaths();
    } else {
      this.unrenderTechniquePaths();
    }
  }

  /**
   * Unrender all technique element's DOM element
   */
  public unrender(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    this.unrenderTechniquePaths();
  }
}
