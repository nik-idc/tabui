import {
  createSVGLine,
  createSVGText,
  createSVGPath,
  createSVGCircle,
} from "@/shared";
import { BendData, Selector } from "./selector";
import { BendSelectorManagerOptions } from "./bend-selector-manager-options";
import {
  BendOptionsData,
  BendType,
  GuitarTechnique,
  GuitarTechniqueType,
} from "@/notation";

export class BendReleaseSelector implements Selector {
  readonly bendGraphSVG: SVGSVGElement;
  readonly bendPath: SVGPathElement;
  readonly bendManagerOptions: BendSelectorManagerOptions;

  private _peakCircle: SVGCircleElement;
  private _releaseCircle: SVGCircleElement;
  private _draggedCircle: SVGCircleElement;
  private _isDragging: boolean;

  constructor(
    bendGraphSVG: SVGSVGElement,
    bendManagerOptions: BendSelectorManagerOptions
  ) {
    this.bendGraphSVG = bendGraphSVG;
    this.bendPath = createSVGPath();
    this.bendManagerOptions = bendManagerOptions;
    this._isDragging = false;

    this._peakCircle = createSVGCircle();
    this._releaseCircle = createSVGCircle();
    this._draggedCircle = createSVGCircle();
  }

  public init(): void {
    // Draw bend path
    this.updatePath(
      200 + this.bendManagerOptions.gridOffset,
      150,
      300 + this.bendManagerOptions.gridOffset,
      225
    );
    this.bendPath.setAttribute("stroke", "var(--tu-bend-curve)");
    this.bendPath.setAttribute("stroke-width", "2");
    this.bendPath.setAttribute("fill", "none");
    this.bendGraphSVG.appendChild(this.bendPath);

    // Draw draggable circles
    this._peakCircle = createSVGCircle();
    this._peakCircle.setAttribute(
      "cx",
      (200 + this.bendManagerOptions.gridOffset).toString()
    );
    this._peakCircle.setAttribute("cy", "150");
    this._peakCircle.setAttribute("r", "8");
    this._peakCircle.setAttribute("fill", "var(--tu-bend-handle)");
    this._peakCircle.style.cursor = "pointer";
    this.bendGraphSVG.appendChild(this._peakCircle);

    this._releaseCircle = createSVGCircle();
    this._releaseCircle.setAttribute(
      "cx",
      (300 + this.bendManagerOptions.gridOffset).toString()
    );
    this._releaseCircle.setAttribute("cy", "225");
    this._releaseCircle.setAttribute("r", "8");
    this._releaseCircle.setAttribute("fill", "var(--tu-bend-handle)");
    this._releaseCircle.style.cursor = "pointer";
    this.bendGraphSVG.appendChild(this._releaseCircle);

    this._peakCircle.addEventListener("mousedown", () =>
      this.onCircleMouseDown(this._peakCircle)
    );
    this._releaseCircle.addEventListener("mousedown", () =>
      this.onCircleMouseDown(this._releaseCircle)
    );
  }

  public getBendTechnique(): BendOptionsData {
    const pitchUnitHeight =
      this.bendManagerOptions.height / this.bendManagerOptions.rowsCount;

    const peakX = Number(this._peakCircle.getAttribute("cx"));
    const peakY = Number(this._peakCircle.getAttribute("cy"));
    const releaseX = Number(this._releaseCircle.getAttribute("cx"));
    const releaseY = Number(this._releaseCircle.getAttribute("cy"));

    const peakPitch =
      (this.bendManagerOptions.height - peakY) / (pitchUnitHeight * 4);
    const releasePitch =
      (this.bendManagerOptions.height - releaseY) / (pitchUnitHeight * 4);

    return {
      type: BendType.BendAndRelease,
      bendPitch: peakPitch,
      releasePitch: releasePitch,
      bendDuration: 1,
    };
  }

  public dispose(): void {
    this.bendGraphSVG.innerHTML = "";
  }

  private onCircleMouseDown(circleElement: SVGCircleElement) {
    this._isDragging = true;
    this._draggedCircle = circleElement;
    document.addEventListener("mousemove", this.onDocumentMouseMove.bind(this));
    document.addEventListener("mouseup", this.onDocumentMouseUp.bind(this));
  }

  private onDocumentMouseMove(event: MouseEvent) {
    if (this._isDragging === false) return;

    const pt = this.bendGraphSVG.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const svgP = pt.matrixTransform(
      this.bendGraphSVG.getScreenCTM()?.inverse()
    );

    const xStep =
      (this.bendManagerOptions.width - this.bendManagerOptions.gridOffset) / 12;
    const yStep =
      this.bendManagerOptions.height / this.bendManagerOptions.rowsCount;

    let snappedX =
      this.bendManagerOptions.gridOffset +
      Math.round((svgP.x - this.bendManagerOptions.gridOffset) / xStep) * xStep;
    let snappedY = Math.round(svgP.y / yStep) * yStep;

    snappedX = Math.max(
      this.bendManagerOptions.gridOffset,
      Math.min(this.bendManagerOptions.width, snappedX)
    );
    snappedY = Math.max(0, Math.min(this.bendManagerOptions.height, snappedY));

    let peakX = Number(this._peakCircle?.getAttribute("cx"));
    let peakY = Number(this._peakCircle?.getAttribute("cy"));
    let releaseX = Number(this._releaseCircle?.getAttribute("cx"));
    let releaseY = Number(this._releaseCircle?.getAttribute("cy"));

    if (
      this._draggedCircle === this._peakCircle &&
      this._peakCircle &&
      this._releaseCircle
    ) {
      peakX = snappedX;
      peakY = snappedY;
      this._peakCircle.setAttribute("cx", `${peakX}`);
      this._peakCircle.setAttribute("cy", `${peakY}`);

      if (releaseY <= peakY) {
        releaseY = peakY + yStep;
        this._releaseCircle.setAttribute("cy", `${releaseY}`);
      }
      if (releaseX < peakX + xStep) {
        releaseX = peakX + xStep;
        this._releaseCircle.setAttribute("cx", `${releaseX}`);
      }
    } else if (
      this._draggedCircle === this._releaseCircle &&
      this._releaseCircle &&
      this._peakCircle
    ) {
      releaseX = snappedX;
      releaseY = snappedY;
      if (releaseY <= peakY) {
        releaseY = peakY + yStep;
      }
      if (releaseX < peakX + xStep) {
        releaseX = peakX + xStep;
      }
      this._releaseCircle.setAttribute("cx", `${releaseX}`);
      this._releaseCircle.setAttribute("cy", `${releaseY}`);
    }

    this.updatePath(peakX, peakY, releaseX, releaseY);
  }

  private updatePath(
    peakX: number,
    peakY: number,
    releaseX: number,
    releaseY: number
  ) {
    if (this.bendPath === undefined) return;
    const d =
      `M ${this.bendManagerOptions.gridOffset} ${this.bendManagerOptions.height} ` +
      `Q ${peakX} ${this.bendManagerOptions.height}, ${peakX} ${peakY} ` +
      `Q ${releaseX} ${peakY}, ${releaseX} ${releaseY}`;
    this.bendPath.setAttribute("d", d);
  }

  private onDocumentMouseUp(event: MouseEvent) {
    this._isDragging = false;
    this._draggedCircle = this._peakCircle;
    document.removeEventListener(
      "mousemove",
      this.onDocumentMouseMove.bind(this)
    );
    document.removeEventListener("mouseup", this.onDocumentMouseUp.bind(this));
  }
}
