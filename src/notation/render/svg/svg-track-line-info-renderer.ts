import {
  BarElement,
  TabLayoutDimensions,
  TrackController,
} from "@/notation/controller";
import { createSVGG, createSVGImage, createSVGText } from "@/shared";
import { ElementRenderer } from "../element-renderer";
import { SVGTechniqueLabelRenderer } from "./svg-technique-label-renderer";
import { TrackLineInfoElement } from "@/notation/controller/element/track-line-info-element";

type TempoSVG = {
  image: SVGImageElement;
  text: SVGTextElement;
};

/**
 * Class for rendering a track line info element using SVG
 */
export class SVGTrackLineInfoRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Tech gap line element */
  readonly trackLineInfoElement: TrackLineInfoElement;

  /** Path to any assets */
  private _assetsPath: string;
  /** Parent SVG group element */
  private _parentElement: SVGGElement;
  /** Map of tempo svg text element */
  private _temposSVG: Map<BarElement, TempoSVG>;

  /** Container SVG group */
  private _groupSVG?: SVGGElement;

  /**
   * Class for rendering a tech gap line element using SVG
   * @param trackController Track controller
   * @param trackLineInfoElement Tech gap line element
   * @param assetsPath Path to assets
   * @param parentElement SVG parent element
   */
  constructor(
    trackController: TrackController,
    trackLineInfoElement: TrackLineInfoElement,
    assetsPath: string,
    parentElement: SVGGElement
  ) {
    this.trackController = trackController;
    this.trackLineInfoElement = trackLineInfoElement;

    this._assetsPath = assetsPath;
    this._parentElement = parentElement;

    this._temposSVG = new Map();
  }

  /**
   * Renders the group element which will contain all the
   * data about the technique gap
   */
  private renderGroup(): void {
    if (this._groupSVG !== undefined) {
      return;
    }

    const gapLineUUID = this.trackLineInfoElement.uuid;
    this._groupSVG = createSVGG();
    this._groupSVG.setAttribute("id", `tech-gap-${gapLineUUID}`);
    this._parentElement.appendChild(this._groupSVG);
  }

  /**
   * Render svg tempo text info of a specific bar
   * @param barElement Bar element whose tempo to render
   */
  private renderTempoText(barElement: BarElement): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render bar sig when SVG group undefined");
    }

    const textRect = this.trackLineInfoElement.barTempoRectsMap.get(barElement);
    if (textRect === undefined) {
      return;
    }

    let renderedTempo = this._temposSVG.get(barElement);
    if (renderedTempo === undefined) {
      renderedTempo = { image: createSVGImage(), text: createSVGText() };
      this._temposSVG.set(barElement, renderedTempo);

      // Set id
      const barUUID = barElement.bar.uuid;
      renderedTempo.image.setAttribute("id", `tempo-img-${barUUID}`);
      // renderedTempo.image.setAttribute("preserveAspectRatio", "none");
      renderedTempo.text.setAttribute("id", `tempo-text-${barUUID}`);

      // Add element to root SVG element
      this._groupSVG.appendChild(renderedTempo.image);
      this._groupSVG.appendChild(renderedTempo.text);
    }

    const tempoRect = this.trackLineInfoElement.getBarTempoRect(barElement);
    const tempoTextCoords =
      this.trackLineInfoElement.getBarTempoTextCoords(barElement);
    const tempoText = this.trackLineInfoElement.getBarTempoText(barElement);
    if (
      tempoRect === undefined ||
      tempoTextCoords === undefined ||
      tempoText === undefined
    ) {
      throw Error("Bar tempo elements undefined");
    }

    const href = `${this._assetsPath}/img/notes/4.svg`;
    renderedTempo.image.setAttribute("x", `${tempoRect.x}`);
    renderedTempo.image.setAttribute("y", `${tempoRect.y}`);
    renderedTempo.image.setAttribute("width", `${tempoRect.width}`);
    renderedTempo.image.setAttribute("height", `${tempoRect.height}`);
    renderedTempo.image.setAttribute("href", href);

    renderedTempo.text.setAttribute("x", `${tempoTextCoords.x}`);
    renderedTempo.text.setAttribute("y", `${tempoTextCoords.y}`);
    renderedTempo.text.textContent = tempoText;
  }

  /**
   * Unrender svg tempo text info of a specific bar
   * @param barElement Bar element whose tempo to unrender
   */
  private unrenderTempoText(barElement: BarElement): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render bar sig when SVG group undefined");
    }

    let renderedTempo = this._temposSVG.get(barElement);
    if (renderedTempo === undefined) {
      return;
    }

    this._groupSVG.removeChild(renderedTempo.image);
    this._groupSVG.removeChild(renderedTempo.text);
    this._temposSVG.delete(barElement);
  }

  /**
   * Renders all tempo texts
   */
  private renderTempoTexts(): void {
    // Check if there are any staff element to remove
    const curBarElements = new Set(
      this.trackLineInfoElement.barTempoRectsMap.keys()
    );
    for (const [barElement, _] of this._temposSVG) {
      if (!curBarElements.has(barElement)) {
        this.unrenderTempoText(barElement);
      }
    }

    // Add & render new staff element AND re-render existing staff element
    for (const barElement of curBarElements) {
      this.renderTempoText(barElement);
    }
  }

  /**
   * Unrenders all tempo texts
   */
  private unrenderTempoTexts(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render bar sig when SVG group undefined");
    }

    for (const [barElement, _] of this.trackLineInfoElement.barTempoRectsMap) {
      this.unrenderTempoText(barElement);
    }

    this._temposSVG.clear();
  }

  /**
   * Renders the technique gap line element
   */
  public render(): void {
    this.renderGroup();
    this.renderTempoTexts();
  }

  /**
   * Unenders the technique gap line element
   */
  public unrender(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender note elem when SVG group undefined");
    }

    this.unrenderTempoTexts();

    this._parentElement.removeChild(this._groupSVG);
    this._groupSVG = undefined;
  }
}
