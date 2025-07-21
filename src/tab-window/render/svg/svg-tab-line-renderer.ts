import {
  createSVGG,
  createSVGImage,
  createSVGLine,
  createSVGRect,
  createSVGText,
} from "../../../misc/svg-creators";
import { DURATION_TO_NAME } from "../../../models/note-duration";
import { BarElement } from "../../elements/bar-element";
import { BeatElement } from "../../elements/beat-element";
import { EffectLabelElement } from "../../elements/effects/effect-label-element";
import { TabLineElement } from "../../elements/tab-line-element";
import { Point } from "../../shapes/point";
import { TabWindow } from "../../tab-window";
import { SVGBarRenderer } from "./svg-bar-renderer";
import { SVGBeatRenderer } from "./svg-beat-renderer";
import { SVGEffectLabelRenderer } from "./svg-effect-label-renderer";
import { SVGNoteRenderer } from "./svg-note-renderer";

/**
 * Class for rendering a bar element using SVG
 */
export class SVGTabLineRenderer {
  private _tabWindow: TabWindow;
  private _tabLineElement: TabLineElement;
  private _assetsPath: string;
  private _svgRoot: SVGSVGElement;

  private _renderedBarElements: Map<number, SVGBarRenderer>;

  /**
   * Class for rendering a beat element using SVG
   * @param tabWindow Tab window
   * @param tabLineElement Tab line element
   * @param assetsPath Path to assets
   * @param svgRoot SVG root element
   */
  constructor(
    tabWindow: TabWindow,
    tabLineElement: TabLineElement,
    assetsPath: string,
    svgRoot: SVGSVGElement
  ) {
    this._tabWindow = tabWindow;
    this._tabLineElement = tabLineElement;
    this._assetsPath = assetsPath;
    this._svgRoot = svgRoot;

    this._renderedBarElements = new Map();
  }

  /**
   * Render tab line element
   */
  public renderTabLine(): void {
    const tleOffset = new Point(0, this._tabLineElement.rect.y);

    // Check if there are any bar elements to remove
    const curBarElementUUIDs = new Set(
      this._tabLineElement.barElements.map((b) => b.bar.uuid)
    );
    for (const [uuid, renderer] of this._renderedBarElements) {
      if (!curBarElementUUIDs.has(uuid)) {
        renderer.unrender();
        this._renderedBarElements.delete(uuid);
      }
    }

    // Add & render new bar elements AND re-render existing bar elements
    for (const barElement of this._tabLineElement.barElements) {
      const renderedBar = this._renderedBarElements.get(barElement.bar.uuid);
      if (renderedBar === undefined) {
        const renderer = new SVGBarRenderer(
          this._tabWindow,
          barElement,
          tleOffset,
          this._assetsPath,
          this._svgRoot
        );
        renderer.renderBarElement();
        this._renderedBarElements.set(barElement.bar.uuid, renderer);
      } else {
        renderedBar.renderBarElement();
      }
    }
  }

  /**
   * Unrender all tab line element's DOM elements
   */
  public unrender(): void {
    for (const [uuid, renderer] of this._renderedBarElements) {
      renderer.unrender();
      this._renderedBarElements.delete(uuid);
    }
  }

  public get barRenderers(): SVGBarRenderer[] {
    return this._renderedBarElements.values().toArray();
  }
}
