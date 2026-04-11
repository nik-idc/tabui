import { StaffLineElement, TrackController } from "@/notation/controller";
import { createSVGG, Point } from "@/shared";
import { SVGBarRenderer } from "./svg-bar-renderer";
import { SVGBeatRenderer } from "./svg-beat-renderer";
import { ElementRenderer } from "../element-renderer";
import { SVGNoteRenderer } from "./svg-note-renderer";
import { NotationStyleLineElement } from "@/notation/controller/element/staff/notation-style-line-element";
import { SVGTechGapRenderer } from "./svg-tech-gap-renderer";
import type { ResolvedAssetConfig } from "@/config/asset-url-resolver";

/**
 * Class for rendering a notation style line element using SVG
 */
export class SVGStyleLineRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Style line element */
  styleLineElement: NotationStyleLineElement;
  /** Path to any assets */
  readonly assetsPath: ResolvedAssetConfig;

  /** Rendered tech gap element */
  private _renderedTechGap?: SVGTechGapRenderer;

  /** Parent SVG group element */
  private _containerGroupSVG?: SVGGElement;

  /**
   * Class for rendering a staff line element using SVG
   * @param trackController Track controller
   * @param styleLineElement Style line element
   * @param assetsPath Path to assets
   */
  constructor(
    trackController: TrackController,
    styleLineElement: NotationStyleLineElement,
    assetsPath: ResolvedAssetConfig
  ) {
    this.trackController = trackController;
    this.styleLineElement = styleLineElement;

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

    const styleLineUUID = this.styleLineElement.uuid;
    this._containerGroupSVG = createSVGG();
    this._containerGroupSVG.setAttribute("id", `style-line-${styleLineUUID}`);

    return this._containerGroupSVG;
  }

  public detachContainerGroup(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    this._containerGroupSVG.parentNode?.removeChild(this._containerGroupSVG);
  }

  /**
   * Renders the group element which will contain all the
   * data about the style line element
   */
  private renderGroup(): void {
    this.ensureContainerGroup();
  }

  /**
   * Render staff line element
   */
  public render(): void {
    this.renderGroup();

    if (this._containerGroupSVG === undefined) {
      throw Error("Bar group SVG undefined after render group call");
    }
  }

  /**
   * Unrender all staff line element's DOM element
   */
  public unrender(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }
  }
}
