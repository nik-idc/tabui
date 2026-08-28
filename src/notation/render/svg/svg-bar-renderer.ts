import { BarElement, NotationElement, TrackController } from "../../controller";
import {
  createSVGG,
  createSVGLine,
  createSVGPath,
  createSVGText,
} from "../../../shared";
import type { Rect } from "../../../shared";
import { SVGBeatRenderer } from "./svg-beat-renderer";
import { ElementRenderer } from "../element-renderer";
import type { ResolvedAssetConfig } from "../../../config/asset-url-resolver";

// WARNING: Mixes responsibilities of Element and Renderer layers.
// But no obvious solution is currently known. The path for a repeat sign is fairly complex.
// A potential solution is a custom "ComplexShape" class which contains any number of shapes:
// ```ts
// class ComplexShape {
//   public circles: Circle[] = [];
//   public rects: Rect[] = [];
//   public lines: Line[] = [];
// }
// ```
// and then the BarElement owns something like `BarElement.repeatSign: ComplexShape`.
// But this is just a suggestion
function repeatPath(rect: Rect, start: boolean): string {
  const thickBarWidth = Math.max(1, rect.width * 0.2);
  const thinBarWidth = Math.max(0.5, rect.width * 0.1);
  const radius = Math.max(1, rect.width * 0.16);
  const firstBar = start ? 0 : 0.8;
  const secondBar = start ? 0.35 : 0.45;
  const dot = start ? 0.8 : 0.2;
  const bar = (position: number, width: number): string =>
    `M ${rect.x + rect.width * position} ${rect.y} ` +
    `h ${width} v ${rect.height} h -${width} Z`;
  const circle = (position: number, y: number): string => {
    const cx = rect.x + rect.width * position;
    const cy = rect.y + rect.height * y;
    return `M ${cx - radius} ${cy} a ${radius} ${radius} 0 1 0 ${
      radius * 2
    } 0 a ${radius} ${radius} 0 1 0 -${radius * 2} 0`;
  };

  return `${bar(firstBar, thickBarWidth)} ${bar(
    secondBar,
    thinBarWidth
  )} ${circle(dot, 0.38)} ${circle(dot, 0.62)}`;
}

/**
 * Class for rendering a bar element using SVG
 */
export class SVGBarRenderer implements ElementRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Bar element */
  barElement: BarElement;
  /** Assets path */
  readonly assetsPath: ResolvedAssetConfig;

  /** Container SVG group */
  private _containerGroupSVG?: SVGGElement;
  /** Array of bar staffs as SVG line elements */
  private _staffLinesSVG?: SVGLineElement[];
  /** Array of bar border lines as SVG line elements */
  private _borderLinesSVG?: SVGLineElement[];
  /** Bar repeat sign SVG paths */
  private _repeatStartSVG?: SVGPathElement;
  private _repeatEndSVG?: SVGPathElement;
  /** Repeat count SVG text */
  private _repeatCountSVG?: SVGTextElement;
  /** Array of bar time signature text elements (beats count + duration) */
  private _timeSigTextsSVG?: SVGTextElement[];

  /**
   * Class for rendering a beat element using SVG
   * @param trackController Track controller
   * @param barElement Bar element
   * @param assetsPath Assets paths
   */
  constructor(
    trackController: TrackController,
    barElement: BarElement,
    assetsPath: ResolvedAssetConfig
  ) {
    this.trackController = trackController;
    this.barElement = barElement;
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

    const barUUID = this.barElement.bar.uuid;
    this._containerGroupSVG = createSVGG();
    this._containerGroupSVG.setAttribute("id", `bar-${barUUID}`);

    return this._containerGroupSVG;
  }

  public detachContainerGroup(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    this._containerGroupSVG.parentNode?.removeChild(this._containerGroupSVG);
  }

  public updateElementReference(element: BarElement): void {
    this.barElement = element;
  }

  /**
   * Renders the group element which will contain all the
   * data about the bar
   */
  private renderGroup(): void {
    this.ensureContainerGroup();
  }

  /**
   * Render bar staff lines
   */
  private renderBarStaffLines(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render bar staff when SVG group undefined");
    }

    const barUUID = this.barElement.bar.uuid;
    if (this._staffLinesSVG === undefined) {
      this._staffLinesSVG = [];
      for (let i = 0; i < this.barElement.staffLines.length; i++) {
        this._staffLinesSVG.push(createSVGLine());

        // Set id
        const id = `bar-staff-${barUUID}-${i}`;
        this._staffLinesSVG[i].setAttribute("id", id);

        // Add element to root SVG element
        this._containerGroupSVG.appendChild(this._staffLinesSVG[i]);
      }
    }

    const strokeColor = this.barElement.bar.checkDurationsFit()
      ? "var(--tu-notation-ink)"
      : "var(--tu-notation-danger)";
    for (let i = 0; i < this.barElement.staffLines.length; i++) {
      const local = this.barElement.staffLines[i];
      this._staffLinesSVG[i].setAttribute("x1", `${local.x1}`);
      this._staffLinesSVG[i].setAttribute("y1", `${local.y}`);
      this._staffLinesSVG[i].setAttribute("x2", `${local.x2}`);
      this._staffLinesSVG[i].setAttribute("y2", `${local.y}`);
      this._staffLinesSVG[i].setAttribute("stroke", strokeColor);
    }
  }

  /**
   * Unrender all bar staff lines
   */
  private unrenderBarStaffLines(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to unrender bar staff when SVG group undefined");
    }

    if (this._staffLinesSVG === undefined) {
      return;
    }

    for (let i = 0; i < this.barElement.staffLines.length; i++) {
      this._containerGroupSVG.removeChild(this._staffLinesSVG[i]);
    }
    this._staffLinesSVG = undefined;
  }

  /**
   * Render bar border lines (left and right)
   */
  private renderBarBorderLines(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render bar borders when SVG group undefined");
    }

    const barUUID = this.barElement.bar.uuid;
    if (this._borderLinesSVG === undefined) {
      this._borderLinesSVG = [createSVGLine(), createSVGLine()];

      // Set only-set-once attributes
      this._borderLinesSVG[0].setAttribute("stroke", "var(--tu-notation-ink)");
      this._borderLinesSVG[1].setAttribute("stroke", "var(--tu-notation-ink)");

      // Set id
      this._borderLinesSVG[0].setAttribute("id", `bar-border-${barUUID}-0`);
      this._borderLinesSVG[1].setAttribute("id", `bar-border-${barUUID}-1`);

      // Add element to root SVG element
      this._containerGroupSVG.appendChild(this._borderLinesSVG[0]);
      this._containerGroupSVG.appendChild(this._borderLinesSVG[1]);
    }

    const leftLocal = this.barElement.barLeftBorderLine;
    this._borderLinesSVG[0].setAttribute("x1", `${leftLocal.x}`);
    this._borderLinesSVG[0].setAttribute("y1", `${leftLocal.y1}`);
    this._borderLinesSVG[0].setAttribute("x2", `${leftLocal.x}`);
    this._borderLinesSVG[0].setAttribute("y2", `${leftLocal.y2}`);

    const rightLocal = this.barElement.barRightBorderLine;
    this._borderLinesSVG[1].setAttribute("x1", `${rightLocal.x}`);
    this._borderLinesSVG[1].setAttribute("y1", `${rightLocal.y1}`);
    this._borderLinesSVG[1].setAttribute("x2", `${rightLocal.x}`);
    this._borderLinesSVG[1].setAttribute("y2", `${rightLocal.y2}`);
  }

  /**
   * Unrender all bar border lines
   */
  private unrenderBarBorderLines(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to unrender bar borders when SVG group undefined");
    }

    if (this._borderLinesSVG === undefined) {
      return;
    }

    this._containerGroupSVG.removeChild(this._borderLinesSVG[0]);
    this._containerGroupSVG.removeChild(this._borderLinesSVG[1]);
    this._borderLinesSVG = undefined;
  }

  /**
   * Render bar time signature info
   */
  private renderBarSig(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render bar sig when SVG group undefined");
    }

    if (
      this.barElement.timeSigBeatsTextCoords === undefined ||
      this.barElement.timeSigDurationTextCoords === undefined
    ) {
      this.unrenderBarSig();
      return;
    }

    const barUUID = this.barElement.bar.uuid;
    if (this._timeSigTextsSVG === undefined) {
      this._timeSigTextsSVG = [createSVGText(), createSVGText()];

      // Set only-set-once attributes
      const fontSize = `${this.trackController.layoutDimensions.TIME_SIG_TEXT_SIZE}`;
      this._timeSigTextsSVG[0].setAttribute("text-anchor", "start");
      this._timeSigTextsSVG[0].setAttribute("dominant-baseline", "hanging");
      this._timeSigTextsSVG[0].setAttribute("font-size", fontSize);
      this._timeSigTextsSVG[1].setAttribute("text-anchor", "start");
      this._timeSigTextsSVG[1].setAttribute("dominant-baseline", "hanging");
      this._timeSigTextsSVG[1].setAttribute("font-size", fontSize);

      // Set id
      this._timeSigTextsSVG[0].setAttribute("id", `bar-sig-${barUUID}-0`);
      this._timeSigTextsSVG[1].setAttribute("id", `bar-sig-${barUUID}-1`);

      // Add element to root SVG element
      this._containerGroupSVG.appendChild(this._timeSigTextsSVG[0]);
      this._containerGroupSVG.appendChild(this._timeSigTextsSVG[1]);
    }

    const beatsX = `${this.barElement.timeSigBeatsTextCoords.x}`;
    const beatsY = `${this.barElement.timeSigBeatsTextCoords.y}`;
    this._timeSigTextsSVG[0].setAttribute("x", beatsX);
    this._timeSigTextsSVG[0].setAttribute("y", beatsY);
    this._timeSigTextsSVG[0].textContent = `${this.barElement.bar.masterBar.beatsCount}`;

    const measureX = `${this.barElement.timeSigDurationTextCoords.x}`;
    const measureY = `${this.barElement.timeSigDurationTextCoords.y}`;
    this._timeSigTextsSVG[1].setAttribute("x", measureX);
    this._timeSigTextsSVG[1].setAttribute("y", measureY);
    this._timeSigTextsSVG[1].textContent = `${
      1 / this.barElement.bar.masterBar.duration
    }`;
  }

  /**
   * Unrender all bar sig info
   */
  private unrenderBarSig(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to unrender bar sig when SVG group undefined");
    }

    if (this._timeSigTextsSVG === undefined) {
      return;
    }

    this._containerGroupSVG.removeChild(this._timeSigTextsSVG[0]);
    this._containerGroupSVG.removeChild(this._timeSigTextsSVG[1]);
    this._timeSigTextsSVG = undefined;
  }

  /**
   * Renders repeat signs (if there any to render)
   */
  private renderRepeats(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render bar repeats when SVG group undefined");
    }

    this.unrenderRepeats();

    const repStartLineLocal = this.barElement.repeatStartRect;
    const repEndLineLocal = this.barElement.repeatEndRect;
    if (repStartLineLocal === undefined && repEndLineLocal === undefined) {
      return;
    }

    const barUUID = this.barElement.bar.uuid;
    if (
      this._repeatStartSVG === undefined &&
      this.barElement.repeatStartRect !== undefined
    ) {
      this._repeatStartSVG = createSVGPath();
      this._repeatStartSVG.setAttribute("id", `bar-rep-start-${barUUID}`);
      this._repeatStartSVG.setAttribute("fill", "var(--tu-notation-ink)");

      this._containerGroupSVG.appendChild(this._repeatStartSVG);
    }
    if (
      this._repeatEndSVG === undefined &&
      this.barElement.repeatEndRect !== undefined
    ) {
      this._repeatEndSVG = createSVGPath();
      this._repeatEndSVG.setAttribute("id", `bar-rep-end-${barUUID}`);
      this._repeatEndSVG.setAttribute("fill", "var(--tu-notation-ink)");

      this._containerGroupSVG.appendChild(this._repeatEndSVG);
    }

    const repeatCount = this.barElement.bar.masterBar.repeatCount;
    const repeatEndRectGlobal = this.barElement.repeatEndRectGlobal;
    if (repeatCount !== null && repeatEndRectGlobal !== undefined) {
      const repeatFontSize =
        this.trackController.layoutDimensions.NOTE_TEXT_SIZE;
      if (this._repeatCountSVG === undefined) {
        this._repeatCountSVG = createSVGText();
        this._repeatCountSVG.setAttribute("id", `bar-rep-count-${barUUID}`);
        this._repeatCountSVG.setAttribute("fill", "var(--tu-notation-text)");
        this._repeatCountSVG.setAttribute("font-size", `${repeatFontSize}`);
        this._containerGroupSVG.appendChild(this._repeatCountSVG);
      }

      const barGlobalCoords = this.barElement.globalCoords;
      this._repeatCountSVG.setAttribute(
        "x",
        `${repeatEndRectGlobal.x - barGlobalCoords.x + repeatEndRectGlobal.width / 2}`
      );
      this._repeatCountSVG.setAttribute(
        "y",
        `${repeatEndRectGlobal.y - barGlobalCoords.y - repeatFontSize / 2}`
      );
      this._repeatCountSVG.textContent = `x${repeatCount}`;
    }

    if (this._repeatStartSVG !== undefined && repStartLineLocal !== undefined) {
      this._repeatStartSVG.setAttribute(
        "d",
        repeatPath(repStartLineLocal, true)
      );
    }

    if (this._repeatEndSVG !== undefined && repEndLineLocal !== undefined) {
      this._repeatEndSVG.setAttribute("d", repeatPath(repEndLineLocal, false));
    }
  }

  /**
   * Unrenders repeat signs (if there any to render)
   */
  private unrenderRepeats(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to unrender bar repeats when SVG group undefined");
    }

    if (this._repeatStartSVG !== undefined) {
      this._containerGroupSVG.removeChild(this._repeatStartSVG);
      this._repeatStartSVG = undefined;
    }
    if (this._repeatEndSVG !== undefined) {
      this._containerGroupSVG.removeChild(this._repeatEndSVG);
      this._repeatEndSVG = undefined;
    }
    if (this._repeatCountSVG !== undefined) {
      this._containerGroupSVG.removeChild(this._repeatCountSVG);
      this._repeatCountSVG = undefined;
    }
  }

  /**
   * Render bar element
   */
  public render(): void {
    this.renderGroup();

    if (this._containerGroupSVG === undefined) {
      throw Error("Bar group SVG undefined after render group call");
    }

    this.renderBarStaffLines();
    this.renderBarBorderLines();
    this.renderBarSig();
    this.renderRepeats();
  }

  /**
   * Unrender all bar element's DOM element
   */
  public unrender(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    this.unrenderBarStaffLines();
    this.unrenderBarBorderLines();
    this.unrenderBarSig();
    this.unrenderRepeats();
  }

  /** Beat renderers getter */
  public get beatRenderers(): SVGBeatRenderer[] {
    return [];
  }
}
