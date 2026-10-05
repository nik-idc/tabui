import { TechniqueLabelElement, TrackController } from "../../controller";
import { createSVGG, createSVGPath, createSVGText } from "../../../shared";
import { ElementRenderer } from "../element-renderer";
import type { ResolvedAssetConfig } from "../../../config/asset-url-resolver";
import { GuitarTechniqueType } from "../../model";

/**
 * Class for rendering a technique label using SVG
 */
export class SVGTechniqueLabelRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Technique label element */
  techniqueLabelElement: TechniqueLabelElement;
  /** Path to any assets */
  readonly assetsPath: ResolvedAssetConfig;

  /** Container SVG group */
  private _containerGroupSVG?: SVGGElement;
  /** Technique label SVG group */
  private _techniqueLabelSVG?: SVGGElement;
  /** Technique label path nodes */
  private _labelPathsSVG?: SVGPathElement[];
  /** Technique label text nodes */
  private _labelTextsSVG?: SVGTextElement[];
  /** Reusable widened targets following descriptor paths. */
  private _hitPathsSVG: SVGPathElement[] = [];
  /** Reusable targets covering rendered text labels. */
  private _hitTextPathsSVG: SVGPathElement[] = [];
  /** Supplied callbacks keyed by event type. */
  private _attachedEvents = new Map<string, EventListener>();

  /**
   * Class for rendering a technique label using SVG
   * @param trackController Track controller
   * @param techniqueLabelElement Technique label element
   * @param assetsPath Path to assets
   */
  constructor(
    trackController: TrackController,
    techniqueLabelElement: TechniqueLabelElement,
    assetsPath: ResolvedAssetConfig
  ) {
    this.trackController = trackController;
    this.techniqueLabelElement = techniqueLabelElement;

    this.assetsPath = assetsPath;
  }

  /**
   * Ensures renderer's container group exists and returns it.
   * @returns Renderer's container SVG group element
   */
  public ensureContainerGroup(): SVGGElement {
    if (this._containerGroupSVG !== undefined) {
      return this._containerGroupSVG;
    }

    const techLabelUUID = this.techniqueLabelElement.uuid;
    this._containerGroupSVG = createSVGG();
    this._containerGroupSVG.setAttribute(
      "id",
      `technique-label-${techLabelUUID}`
    );
    this._containerGroupSVG.setAttribute("class", "tu-technique-label");

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

  public updateElementReference(element: TechniqueLabelElement): void {
    this.techniqueLabelElement = element;
  }

  /** Attaches a supplied callback using the renderer's current element. */
  public attachMouseEvent<K extends keyof SVGElementEventMap>(
    eventType: K,
    eventHandler: (
      event: SVGElementEventMap[K],
      techniqueLabelElement: TechniqueLabelElement
    ) => void
  ): void {
    const group = this.ensureContainerGroup();
    this.detachMouseEvent(eventType);
    const listener = (this.dispatchMouseEvent<K>).bind(this, eventHandler);
    group.addEventListener(eventType, listener);
    this._attachedEvents.set(eventType, listener);
  }

  /** Dispatches an event using the renderer's current technique label. */
  private dispatchMouseEvent<K extends keyof SVGElementEventMap>(
    eventHandler: (
      event: SVGElementEventMap[K],
      techniqueLabelElement: TechniqueLabelElement
    ) => void,
    event: Event
  ): void {
    eventHandler(event as SVGElementEventMap[K], this.techniqueLabelElement);
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
   * data about the technique label
   */
  private renderGroup(): void {
    this.ensureContainerGroup();
  }

  /**
   * Render an technique label
   * @param beatOffset Global offset of the beat
   * @param this.techniqueLabelElement Technique label element to render
   */
  public render(): void {
    this.renderGroup();

    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render technique label when SVG group undefined");
    }

    const techniqueUUID = this.techniqueLabelElement.technique.uuid;
    if (this._techniqueLabelSVG === undefined) {
      this._techniqueLabelSVG = createSVGG();

      // Set id
      this._techniqueLabelSVG.setAttribute(
        "id",
        `technique-label-group-${techniqueUUID}`
      );

      // Add element to root SVG element
      this._containerGroupSVG.appendChild(this._techniqueLabelSVG);
    }

    if (this._labelPathsSVG === undefined) {
      this._labelPathsSVG = [];
    }
    if (this._labelTextsSVG === undefined) {
      this._labelTextsSVG = [];
    }

    const pathDescriptors = this.techniqueLabelElement.pathDescriptors ?? [];
    const textDescriptors = this.techniqueLabelElement.textDescriptors ?? [];

    while (this._labelPathsSVG.length < pathDescriptors.length) {
      const pathIndex = this._labelPathsSVG.length;
      const pathElement = createSVGPath();
      pathElement.setAttribute(
        "id",
        `technique-label-path-${techniqueUUID}-${pathIndex}`
      );
      this._techniqueLabelSVG.appendChild(pathElement);
      this._labelPathsSVG.push(pathElement);
    }

    while (this._labelPathsSVG.length > pathDescriptors.length) {
      const pathElement = this._labelPathsSVG.pop();
      if (pathElement !== undefined) {
        this._techniqueLabelSVG.removeChild(pathElement);
      }
    }

    while (this._labelTextsSVG.length < textDescriptors.length) {
      const textIndex = this._labelTextsSVG.length;
      const textElement = createSVGText();
      textElement.setAttribute(
        "id",
        `technique-label-text-${techniqueUUID}-${textIndex}`
      );
      this._techniqueLabelSVG.appendChild(textElement);
      this._labelTextsSVG.push(textElement);
    }

    while (this._labelTextsSVG.length > textDescriptors.length) {
      const textElement = this._labelTextsSVG.pop();
      if (textElement !== undefined) {
        this._techniqueLabelSVG.removeChild(textElement);
      }
    }

    const x = this.techniqueLabelElement.descriptorOriginBarLocal.x;
    const y = this.techniqueLabelElement.descriptorOriginBarLocal.y;
    const transform = `translate(${x}, ${y})`;
    this._techniqueLabelSVG.setAttribute("transform", transform);

    for (let i = 0; i < pathDescriptors.length; i++) {
      const pathElement = this._labelPathsSVG[i];
      const descriptor = pathDescriptors[i];
      pathElement.setAttribute("d", descriptor.d);
      if (descriptor.attrs !== undefined) {
        for (const [key, value] of Object.entries(descriptor.attrs)) {
          pathElement.setAttribute(key, value);
        }
      }
      pathElement.setAttribute("class", "tu-technique-label-visible-path");
    }

    for (let i = 0; i < textDescriptors.length; i++) {
      const textElement = this._labelTextsSVG[i];
      const descriptor = textDescriptors[i];
      textElement.textContent = descriptor.text;
      if (descriptor.attrs !== undefined) {
        for (const [key, value] of Object.entries(descriptor.attrs)) {
          textElement.setAttribute(key, value);
        }
      }
      textElement.setAttribute("class", "tu-technique-label-visible-text");
    }

    const interactive =
      this.techniqueLabelElement.technique.type !== GuitarTechniqueType.Bend;
    this._containerGroupSVG.setAttribute(
      "class",
      interactive
        ? "tu-technique-label tu-technique-label-interactive"
        : "tu-technique-label"
    );
    this.renderHitPaths(interactive ? pathDescriptors : []);
    this.renderTextHitPaths(interactive ? textDescriptors : []);
  }

  /** Updates invisible stroke targets using descriptor path geometry. */
  private renderHitPaths(
    pathDescriptors: NonNullable<TechniqueLabelElement["pathDescriptors"]>
  ): void {
    const group = this._containerGroupSVG;
    const descriptorGroup = this._techniqueLabelSVG;
    if (group === undefined || descriptorGroup === undefined) {
      throw Error(
        "Tried to render technique label hit paths before SVG groups were initialized"
      );
    }
    const uuid = this.techniqueLabelElement.technique.uuid;
    while (this._hitPathsSVG.length < pathDescriptors.length) {
      const index = this._hitPathsSVG.length;
      const path = createSVGPath();
      path.setAttribute("id", `technique-label-hit-path-${uuid}-${index}`);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "transparent");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("pointer-events", "stroke");
      group.appendChild(path);
      this._hitPathsSVG.push(path);
    }
    while (this._hitPathsSVG.length > pathDescriptors.length) {
      const path = this._hitPathsSVG.pop();
      if (path !== undefined) {
        group.removeChild(path);
      }
    }

    const strokeWidth = `${
      this.trackController.trackElement.layoutDimensions.noteTextSize / 2
    }`;
    for (let i = 0; i < pathDescriptors.length; i++) {
      const path = this._hitPathsSVG[i];
      path.setAttribute("d", pathDescriptors[i].d);
      path.setAttribute("stroke-width", strokeWidth);
      path.setAttribute(
        "transform",
        descriptorGroup.getAttribute("transform") ?? ""
      );
    }
  }

  /** Updates transparent rectangular targets around rendered text labels. */
  private renderTextHitPaths(
    textDescriptors: NonNullable<TechniqueLabelElement["textDescriptors"]>
  ): void {
    const group = this._containerGroupSVG;
    const descriptorGroup = this._techniqueLabelSVG;
    const labelTexts = this._labelTextsSVG;
    const groupsMissing = group === undefined || descriptorGroup === undefined;
    if (groupsMissing || labelTexts === undefined) {
      throw Error(
        "Tried to render technique label text targets before SVG elements were initialized"
      );
    }
    const uuid = this.techniqueLabelElement.technique.uuid;
    while (this._hitTextPathsSVG.length < textDescriptors.length) {
      const index = this._hitTextPathsSVG.length;
      const path = createSVGPath();
      path.setAttribute("id", `technique-label-hit-text-${uuid}-${index}`);
      path.setAttribute("fill", "transparent");
      path.setAttribute("stroke", "none");
      path.setAttribute("pointer-events", "all");
      group.appendChild(path);
      this._hitTextPathsSVG.push(path);
    }
    while (this._hitTextPathsSVG.length > textDescriptors.length) {
      const path = this._hitTextPathsSVG.pop();
      if (path !== undefined) {
        group.removeChild(path);
      }
    }

    const padding =
      this.trackController.trackElement.layoutDimensions.noteTextSize / 8;
    for (let i = 0; i < textDescriptors.length; i++) {
      const box = labelTexts[i].getBBox();
      const x = box.x - padding;
      const y = box.y - padding;
      const width = box.width + padding * 2;
      const height = box.height + padding * 2;
      const path = this._hitTextPathsSVG[i];
      path.setAttribute(
        "d",
        `M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`
      );
      path.setAttribute(
        "transform",
        descriptorGroup.getAttribute("transform") ?? ""
      );
    }
  }

  /**
   * Unrender all technique label element's DOM element
   */
  public unrender(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    if (this._techniqueLabelSVG === undefined) {
      return;
    }

    if (this._labelPathsSVG !== undefined) {
      for (const pathElement of this._labelPathsSVG) {
        this._techniqueLabelSVG.removeChild(pathElement);
      }
      this._labelPathsSVG = undefined;
    }

    if (this._labelTextsSVG !== undefined) {
      for (const textElement of this._labelTextsSVG) {
        this._techniqueLabelSVG.removeChild(textElement);
      }
      this._labelTextsSVG = undefined;
    }

    for (const path of this._hitPathsSVG) {
      this._containerGroupSVG.removeChild(path);
    }
    this._hitPathsSVG = [];
    for (const path of this._hitTextPathsSVG) {
      this._containerGroupSVG.removeChild(path);
    }
    this._hitTextPathsSVG = [];

    this._containerGroupSVG.removeChild(this._techniqueLabelSVG);
    this._techniqueLabelSVG = undefined;
  }
}
