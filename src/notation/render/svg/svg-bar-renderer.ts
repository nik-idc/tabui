import {
  BarElement,
  EditorLayoutDimensions,
  TrackController,
} from "@/notation/controller";
import { resolveAssetUrl } from "@/config/asset-url-resolver";
import { BarRepeatStatus } from "@/notation/model";
import {
  createSVGG,
  createSVGLine,
  createSVGImage,
  createSVGText,
} from "@/shared";
import { SVGBeatRenderer } from "./svg-beat-renderer";
import { ElementRenderer } from "../element-renderer";
import type { ResolvedAssetConfig } from "@/config/asset-url-resolver";

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
  /** Bar repeat sign SVG image */
  private _repeatStartSVG?: SVGImageElement;
  /** Bar repeat sign SVG image */
  private _repeatEndSVG?: SVGImageElement;
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
      const lineGlobal = this.barElement.staffLinesGlobal[i];
      this._staffLinesSVG[i].setAttribute("x1", `${lineGlobal.x1}`);
      this._staffLinesSVG[i].setAttribute("y1", `${lineGlobal.y}`);
      this._staffLinesSVG[i].setAttribute("x2", `${lineGlobal.x2}`);
      this._staffLinesSVG[i].setAttribute("y2", `${lineGlobal.y}`);
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

    const leftGlobal = this.barElement.barLeftBorderLineGlobal;
    this._borderLinesSVG[0].setAttribute("x1", `${leftGlobal.x}`);
    this._borderLinesSVG[0].setAttribute("y1", `${leftGlobal.y1}`);
    this._borderLinesSVG[0].setAttribute("x2", `${leftGlobal.x}`);
    this._borderLinesSVG[0].setAttribute("y2", `${leftGlobal.y2}`);

    const rightGlobal = this.barElement.barRightBorderLineGlobal;
    this._borderLinesSVG[1].setAttribute("x1", `${rightGlobal.x}`);
    this._borderLinesSVG[1].setAttribute("y1", `${rightGlobal.y1}`);
    this._borderLinesSVG[1].setAttribute("x2", `${rightGlobal.x}`);
    this._borderLinesSVG[1].setAttribute("y2", `${rightGlobal.y2}`);
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
      this.barElement.timeSigBeatsTextCoordsGlobal === undefined ||
      this.barElement.timeSigDurationTextCoordsGlobal === undefined
    ) {
      this.unrenderBarSig();
      return;
    }

    const barUUID = this.barElement.bar.uuid;
    if (this._timeSigTextsSVG === undefined) {
      this._timeSigTextsSVG = [createSVGText(), createSVGText()];

      // Set only-set-once attributes
      const fontSize = `${EditorLayoutDimensions.TIME_SIG_TEXT_SIZE}`;
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

    const beatsX = `${this.barElement.timeSigBeatsTextCoordsGlobal.x}`;
    const beatsY = `${this.barElement.timeSigBeatsTextCoordsGlobal.y}`;
    this._timeSigTextsSVG[0].setAttribute("x", beatsX);
    this._timeSigTextsSVG[0].setAttribute("y", beatsY);
    this._timeSigTextsSVG[0].textContent = `${this.barElement.bar.masterBar.beatsCount}`;

    const measureX = `${this.barElement.timeSigDurationTextCoordsGlobal.x}`;
    const measureY = `${this.barElement.timeSigDurationTextCoordsGlobal.y}`;
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

    const repStartGlobal = this.barElement.repeatStartRectGlobal;
    const repEndGlobal = this.barElement.repeatEndRectGlobal;
    if (repStartGlobal === undefined && repEndGlobal === undefined) {
      return;
    }

    const barUUID = this.barElement.bar.uuid;
    if (
      this._repeatStartSVG === undefined &&
      this.barElement.repeatStartRectGlobal !== undefined
    ) {
      // Set only-set-once attributes
      this._repeatStartSVG = createSVGImage();

      const href = resolveAssetUrl(
        this.assetsPath,
        "img/ui/repeat-start-applied_.svg"
      );
      this._repeatStartSVG.setAttribute("href", href);
      this._repeatStartSVG.setAttribute("id", `bar-rep-start-${barUUID}`);

      this._containerGroupSVG.appendChild(this._repeatStartSVG);
    }
    if (
      this._repeatEndSVG === undefined &&
      this.barElement.repeatEndRectGlobal !== undefined
    ) {
      this._repeatEndSVG = createSVGImage();

      const href = resolveAssetUrl(
        this.assetsPath,
        "img/ui/repeat-end-applied_.svg"
      );
      this._repeatEndSVG.setAttribute("href", href);
      this._repeatEndSVG.setAttribute("id", `bar-rep-end-${barUUID}`);

      this._containerGroupSVG.appendChild(this._repeatEndSVG);
    }

    if (this._repeatStartSVG !== undefined && repStartGlobal !== undefined) {
      const x = `${repStartGlobal.x}`;
      const y = `${repStartGlobal.y}`;
      const width = `${repStartGlobal.width}`;
      const height = `${repStartGlobal.height}`;
      this._repeatStartSVG.setAttribute("x", x);
      this._repeatStartSVG.setAttribute("y", y);
      this._repeatStartSVG.setAttribute("width", width);
      this._repeatStartSVG.setAttribute("height", height);
    }

    if (this._repeatEndSVG !== undefined && repEndGlobal !== undefined) {
      const x = `${repEndGlobal.x}`;
      const y = `${repEndGlobal.y}`;
      const width = `${repEndGlobal.width}`;
      const height = `${repEndGlobal.height}`;
      this._repeatEndSVG.setAttribute("x", x);
      this._repeatEndSVG.setAttribute("y", y);
      this._repeatEndSVG.setAttribute("width", width);
      this._repeatEndSVG.setAttribute("height", height);
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
