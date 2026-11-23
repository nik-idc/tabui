import { TrackController } from "../../controller";
import { createSVGG, createSVGRect, createSVGText } from "../../../shared";
import { ElementRenderer } from "../element-renderer";
import { GuitarTuningElement } from "../../controller/element/track/guitar-tuning-element";
import type { ResolvedAssetConfig } from "../../../assets";

/** Renders and handles interaction for a guitar tuning element. */
export class SVGGuitarTuningRenderer implements ElementRenderer {
  readonly trackController: TrackController;
  /** Current tuning element supplied by the retained renderer. */
  private _element: GuitarTuningElement;
  /** SVG group retained between render passes. */
  private _group?: SVGGElement;
  /** Click listener attached to the retained SVG group. */
  private _listener?: EventListener;

  constructor(
    trackController: TrackController,
    element: GuitarTuningElement,
    _assetsPath: ResolvedAssetConfig
  ) {
    this.trackController = trackController;
    this._element = element;
  }

  public ensureContainerGroup(): SVGGElement {
    this._group ??= createSVGG();
    this._group.setAttribute("class", "tu-tuning");
    return this._group;
  }

  public detachContainerGroup(): void {
    if (this._listener !== undefined) {
      this._group?.removeEventListener("click", this._listener);
      this._listener = undefined;
    }
    this._group?.remove();
  }

  public updateElementReference(element: GuitarTuningElement): void {
    this._element = element;
  }

  public attachMouseEvent(eventHandler: (event: MouseEvent) => void): void {
    const group = this.ensureContainerGroup();
    this._listener = (event: Event) => eventHandler(event as MouseEvent);
    group.addEventListener("click", this._listener);
  }

  public detachMouseEvent<K extends keyof SVGElementEventMap>(
    eventType: K
  ): void {
    if (eventType !== "click" || this._listener === undefined) {
      return;
    }

    this._group?.removeEventListener(eventType, this._listener);
    this._listener = undefined;
  }

  public render(): void {
    const group = this.ensureContainerGroup();
    group.replaceChildren();
    const rect = this._element.boundingBox;
    const texts = this._element.texts;
    if (texts.length === 0 || this._element.textYs.length === 0) {
      return;
    }
    const fontSize =
      this.trackController.trackElement.layoutDimensions.noteTextSize;
    for (let i = 0; i < texts.length; i++) {
      const text = createSVGText();
      text.setAttribute("x", `${rect.x}`);
      text.setAttribute("y", `${this._element.textYs[i]}`);
      text.setAttribute("font-size", `${fontSize}px`);
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("pointer-events", "none");
      text.textContent = texts[i];
      group.appendChild(text);
    }
    const hitArea = createSVGRect();
    const top = this._element.textYs[0] - fontSize / 2;
    const bottom =
      this._element.textYs[this._element.textYs.length - 1] + fontSize / 2;
    hitArea.classList.add("tu-tuning-hit-area");
    hitArea.setAttribute("x", `${rect.x}`);
    hitArea.setAttribute("y", `${top}`);
    hitArea.setAttribute("width", `${rect.width}`);
    hitArea.setAttribute("height", `${bottom - top}`);
    hitArea.setAttribute("fill", "transparent");
    hitArea.setAttribute("pointer-events", "all");
    group.appendChild(hitArea);
  }

  public unrender(): void {
    this._group?.replaceChildren();
  }
}
