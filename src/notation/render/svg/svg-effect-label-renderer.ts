import { TabController, EffectLabelElement } from "@/notation/element";
import { Point, createSVGG } from "@/shared";
import { ElementRenderer } from "../element-renderer";

/**
 * Class for rendering an effect label using SVG
 */
export class SVGEffectLabelRenderer implements ElementRenderer {
  private _tabWindow: TabController;
  private _effectLabelElement: EffectLabelElement;
  private _beatOffset: Point;
  private _assetsPath: string;
  private _parentElement: SVGGElement;

  private _groupSVG?: SVGGElement;
  private _effectLabelSVG?: SVGGElement;

  /**
   * Class for rendering an effect label using SVG
   * @param tabController Tab window
   * @param effectLabelElement Effect label element
   * @param beatOffset Global offset of the beat element
   * @param assetsPath Path to assets
   * @param parentElement SVG parent element (a beat element in this case)
   */
  constructor(
    tabController: TabController,
    effectLabelElement: EffectLabelElement,
    beatOffset: Point,
    assetsPath: string,
    parentElement: SVGGElement
  ) {
    this._tabWindow = tabController;
    this._effectLabelElement = effectLabelElement;
    this._beatOffset = beatOffset;
    this._assetsPath = assetsPath;
    this._parentElement = parentElement;
  }

  /**
   * Renders the group element which will contain all the
   * data about the effect label
   */
  private renderGroup(): void {
    if (this._groupSVG !== undefined) {
      return;
    }

    const noteUUID = this._effectLabelElement.effect.uuid;
    this._groupSVG = createSVGG();
    this._groupSVG.setAttribute("id", `effect-label-${noteUUID}`);
    this._parentElement.appendChild(this._groupSVG);
  }

  /**
   * Render an effect label
   * @param beatOffset Global offset of the beat
   * @param this._effectLabelElement Effect label element to render
   */
  public render(): void {
    this.renderGroup();

    if (this._groupSVG === undefined) {
      throw Error("Tried to render effect label when SVG group undefined");
    }

    if (this._effectLabelElement.fullHTML === undefined) {
      throw Error("Effect label render error: effect HTML undefined");
    }

    const effectUUID = this._effectLabelElement.effect.uuid;
    if (this._effectLabelSVG === undefined) {
      this._effectLabelSVG = createSVGG();

      // Set id
      this._effectLabelSVG.setAttribute("id", `effect-label-${effectUUID}`);

      // Add element to root SVG element
      this._groupSVG.appendChild(this._effectLabelSVG);
    }

    const transform = `translate(${this._beatOffset.x}, ${this._beatOffset.y})`;
    this._effectLabelSVG.setAttribute("transform", transform);
    this._effectLabelSVG.innerHTML = `${this._effectLabelElement.fullHTML}`;
  }

  /**
   * Unrender all effect label element's DOM elements
   */
  public unrender(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender effect label when SVG group undefined");
    }

    if (this._effectLabelSVG === undefined) {
      throw Error("Tried to unrender effect label when label SVG undefined");
    }

    this._parentElement.removeChild(this._groupSVG);
    this._groupSVG = undefined;
  }
}
