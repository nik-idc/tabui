import { createSVGG, createSVGRect } from "../../../misc/svg-creators";
import { GuitarEffectElement } from "../../elements/effects/guitar-effect-element";
import { NoteElement } from "../../elements/note-element";
import { Point } from "../../shapes/point";
import { TabWindow } from "../../tab-window";

/**
 * Class for rendering a guitar effect element using SVG
 */
export class SVGEffectRenderer {
  private _tabWindow: TabWindow;
  private _effectElement: GuitarEffectElement;
  private _noteOffset: Point;
  private _assetsPath: string;
  private _parentElement: SVGGElement;

  private _groupSVG?: SVGGElement;
  private _effectRectSVG?: SVGRectElement;
  private _effectHTMLSVG?: SVGGElement;

  /**
   * Class for rendering a guitar effect element using SVG
   * @param tabWindow Tab window
   * @param effectElement Guitar effect element
   * @param noteOffset Global offset of the beat notes element
   * @param assetsPath Path to assets
   * @param parentElement SVG parent element (a note element in this case)
   */
  constructor(
    tabWindow: TabWindow,
    effectElement: GuitarEffectElement,
    noteOffset: Point,
    assetsPath: string,
    parentElement: SVGGElement
  ) {
    this._tabWindow = tabWindow;
    this._effectElement = effectElement;
    this._noteOffset = noteOffset;
    this._assetsPath = assetsPath;
    this._parentElement = parentElement;
  }

  /**
   * Renders the group element which will contain all the
   * data about the effect
   */
  private renderGroup(): void {
    if (this._groupSVG !== undefined) {
      return;
    }

    const noteUUID = this._effectElement.effect.uuid;
    this._groupSVG = createSVGG();
    this._groupSVG.setAttribute("id", `effect-${noteUUID}`);
    this._parentElement.appendChild(this._groupSVG);
  }

  /**
   * Render effect's outer rect
   */
  private renderEffectRect(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render effect rect when SVG group undefined");
    }

    if (this._effectElement.rect === undefined) {
      throw Error("Tried to render effect rect with undefined rect");
    }

    const effectUUID = this._effectElement.effect.uuid;
    if (this._effectRectSVG === undefined) {
      this._effectRectSVG = createSVGRect();
      // Set only-set-once attributes
      this._effectRectSVG.setAttribute("fill", "white");
      this._effectRectSVG.setAttribute("stroke-opacity", "0");

      // Set id
      this._effectRectSVG.setAttribute("id", `effect-rect-${effectUUID}`);

      // Add element to root SVG element
      this._groupSVG.appendChild(this._effectRectSVG);
    }

    const x = `${this._noteOffset.x + this._effectElement.rect.x}`;
    const y = `${this._noteOffset.y + this._effectElement.rect.y}`;
    const width = `${this._effectElement.rect.width}`;
    const height = `${this._effectElement.rect.height}`;
    this._effectRectSVG.setAttribute("x", x);
    this._effectRectSVG.setAttribute("y", y);
    this._effectRectSVG.setAttribute("width", width);
    this._effectRectSVG.setAttribute("height", height);
  }

  /**
   * Unrenders effect rect
   */
  private unrenderEffectRect(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender effect rect when SVG group undefined");
    }

    if (this._effectRectSVG === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._effectRectSVG);
    this._effectRectSVG = undefined;
  }

  /**
   * Render effect's raw SVG
   */
  private renderEffectHTML(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render effect HTML when SVG group undefined");
    }

    if (this._effectElement.fullHTML === undefined) {
      throw Error("Tried to render effect HTML with undefined HTML");
    }

    const effectUUID = this._effectElement.effect.uuid;
    if (this._effectHTMLSVG === undefined) {
      this._effectHTMLSVG = createSVGG();

      // Set id
      this._effectHTMLSVG.setAttribute("id", `effect-html-${effectUUID}`);

      // Add element to root SVG element
      this._groupSVG.appendChild(this._effectHTMLSVG);
    }

    const transform = `translate(${this._noteOffset.x}, ${this._noteOffset.y})`;
    this._effectHTMLSVG.setAttribute("transform", transform);
    this._effectHTMLSVG.innerHTML = this._effectElement.fullHTML; // May lead to performance issues
  }

  /**
   * Unrender effect's custom HTML (like bend curves, palm mute text etc)
   */
  private unrenderEffectHTML(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender effect HTML when SVG group undefined");
    }

    if (this._effectHTMLSVG === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._effectHTMLSVG);
    this._effectHTMLSVG = undefined;
  }

  /**
   * Render a note's effect
   */
  public renderEffect(newNoteOffset?: Point): void {
    if (newNoteOffset !== undefined) {
      this._noteOffset = newNoteOffset;
    }

    this.renderGroup();

    // The reason for 2 ifs: bends DO NOT have a rect, but DO have full HTML

    // Render effect rect if necessary, remove it otherwise
    if (this._effectElement.rect !== undefined) {
      this.renderEffectRect();
    } else {
      this.unrenderEffectRect();
    }

    // Render effect custom HTML if necessary, remove it otherwise
    if (this._effectElement.fullHTML !== undefined) {
      this.renderEffectHTML();
    } else {
      this.unrenderEffectHTML();
    }
  }

  /**
   * Unrender all effect element's DOM elements
   */
  public unrender(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender effect when SVG group undefined");
    }

    this.unrenderEffectRect();
    this.unrenderEffectHTML();

    this._parentElement.removeChild(this._groupSVG);
    this._groupSVG = undefined;
  }
}
