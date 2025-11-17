import { TabController, GuitarTechniqueElement } from "@/notation/element";
import { Point, createSVGG, createSVGRect } from "@/shared";
import { ElementRenderer } from "../element-renderer";

/**
 * Class for rendering a guitar technique element using SVG
 */
export class SVGTechniqueRenderer implements ElementRenderer {
  private _tabWindow: TabController;
  private _techniqueElement: GuitarTechniqueElement;
  private _noteOffset: Point;
  private _assetsPath: string;
  private _parentElement: SVGGElement;

  private _groupSVG?: SVGGElement;
  private _techniqueRectSVG?: SVGRectElement;
  private _techniqueHTMLSVG?: SVGGElement;

  /**
   * Class for rendering a guitar technique element using SVG
   * @param tabController Tab window
   * @param techniqueElement Guitar technique element
   * @param noteOffset Global offset of the beat notes element
   * @param assetsPath Path to assets
   * @param parentElement SVG parent element (a note element in this case)
   */
  constructor(
    tabController: TabController,
    techniqueElement: GuitarTechniqueElement,
    noteOffset: Point,
    assetsPath: string,
    parentElement: SVGGElement
  ) {
    this._tabWindow = tabController;
    this._techniqueElement = techniqueElement;
    this._noteOffset = noteOffset;
    this._assetsPath = assetsPath;
    this._parentElement = parentElement;
  }

  /**
   * Renders the group element which will contain all the
   * data about the technique
   */
  private renderGroup(): void {
    if (this._groupSVG !== undefined) {
      return;
    }

    const noteUUID = this._techniqueElement.technique.uuid;
    this._groupSVG = createSVGG();
    this._groupSVG.setAttribute("id", `technique-${noteUUID}`);
    this._parentElement.appendChild(this._groupSVG);
  }

  /**
   * Render technique's outer rect
   */
  private renderTechniqueRect(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render technique rect when SVG group undefined");
    }

    if (this._techniqueElement.rect === undefined) {
      throw Error("Tried to render technique rect with undefined rect");
    }

    const techniqueUUID = this._techniqueElement.technique.uuid;
    if (this._techniqueRectSVG === undefined) {
      this._techniqueRectSVG = createSVGRect();
      // Set only-set-once attributes
      this._techniqueRectSVG.setAttribute("fill", "white");
      this._techniqueRectSVG.setAttribute("stroke-opacity", "0");

      // Set id
      this._techniqueRectSVG.setAttribute("id", `technique-rect-${techniqueUUID}`);

      // Add element to root SVG element
      this._groupSVG.appendChild(this._techniqueRectSVG);
    }

    const x = `${this._noteOffset.x + this._techniqueElement.rect.x}`;
    const y = `${this._noteOffset.y + this._techniqueElement.rect.y}`;
    const width = `${this._techniqueElement.rect.width}`;
    const height = `${this._techniqueElement.rect.height}`;
    this._techniqueRectSVG.setAttribute("x", x);
    this._techniqueRectSVG.setAttribute("y", y);
    this._techniqueRectSVG.setAttribute("width", width);
    this._techniqueRectSVG.setAttribute("height", height);
  }

  /**
   * Unrenders technique rect
   */
  private unrenderTechniqueRect(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender technique rect when SVG group undefined");
    }

    if (this._techniqueRectSVG === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._techniqueRectSVG);
    this._techniqueRectSVG = undefined;
  }

  /**
   * Render technique's raw SVG
   */
  private renderTechniqueHTML(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render technique HTML when SVG group undefined");
    }

    if (this._techniqueElement.fullHTML === undefined) {
      throw Error("Tried to render technique HTML with undefined HTML");
    }

    const techniqueUUID = this._techniqueElement.technique.uuid;
    if (this._techniqueHTMLSVG === undefined) {
      this._techniqueHTMLSVG = createSVGG();

      // Set id
      this._techniqueHTMLSVG.setAttribute("id", `technique-html-${techniqueUUID}`);

      // Add element to root SVG element
      this._groupSVG.appendChild(this._techniqueHTMLSVG);
    }

    const transform = `translate(${this._noteOffset.x}, ${this._noteOffset.y})`;
    this._techniqueHTMLSVG.setAttribute("transform", transform);
    this._techniqueHTMLSVG.innerHTML = this._techniqueElement.fullHTML; // May lead to performance issues
  }

  /**
   * Unrender technique's custom HTML (like bend curves, palm mute text etc)
   */
  private unrenderTechniqueHTML(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender technique HTML when SVG group undefined");
    }

    if (this._techniqueHTMLSVG === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._techniqueHTMLSVG);
    this._techniqueHTMLSVG = undefined;
  }

  /**
   * Render a note's technique
   */
  public render(newNoteOffset?: Point): void {
    if (newNoteOffset !== undefined) {
      this._noteOffset = newNoteOffset;
    }

    this.renderGroup();

    // The reason for 2 ifs: bends DO NOT have a rect, but DO have full HTML

    // Render technique rect if necessary, remove it otherwise
    if (this._techniqueElement.rect !== undefined) {
      this.renderTechniqueRect();
    } else {
      this.unrenderTechniqueRect();
    }

    // Render technique custom HTML if necessary, remove it otherwise
    if (this._techniqueElement.fullHTML !== undefined) {
      this.renderTechniqueHTML();
    } else {
      this.unrenderTechniqueHTML();
    }
  }

  /**
   * Unrender all technique element's DOM elements
   */
  public unrender(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender technique when SVG group undefined");
    }

    this.unrenderTechniqueRect();
    this.unrenderTechniqueHTML();

    this._parentElement.removeChild(this._groupSVG);
    this._groupSVG = undefined;
  }
}
