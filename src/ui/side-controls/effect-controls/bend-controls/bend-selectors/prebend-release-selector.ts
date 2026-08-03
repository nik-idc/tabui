import {
  createSVGLine,
  createSVGText,
  createSVGPath,
  createSVGCircle,
} from "../../../../../shared";
import { BendData, Selector } from "./selector";
import { BendSelectorManagerOptions } from "./bend-selector-manager-options";
import {
  BendOptionsData,
  BendType,
  GuitarTechnique,
  GuitarTechniqueType,
} from "../../../../../notation";

export class PrebendReleaseSelector implements Selector {
  readonly bendGraphSVG: SVGSVGElement;
  readonly bendPath: SVGPathElement;
  readonly bendManagerOptions: BendSelectorManagerOptions;

  private _startCircle: SVGCircleElement;
  private _releaseCircle: SVGCircleElement;
  private _draggedCircle: SVGCircleElement;
  private _isDragging: boolean;
  private _boundOnStartMouseDown: () => void;
  private _boundOnReleaseMouseDown: () => void;
  private _boundOnDocumentMouseMove: (event: MouseEvent) => void;
  private _boundOnDocumentMouseUp: (event: MouseEvent) => void;

  constructor(
    bendGraphSVG: SVGSVGElement,
    bendManagerOptions: BendSelectorManagerOptions
  ) {
    this.bendGraphSVG = bendGraphSVG;
    this.bendPath = createSVGPath();
    this.bendManagerOptions = bendManagerOptions;
    this._isDragging = false;

    this._startCircle = createSVGCircle();
    this._releaseCircle = createSVGCircle();
    this._draggedCircle = createSVGCircle();
    this._boundOnStartMouseDown = () =>
      this.onCircleMouseDown(this._startCircle);
    this._boundOnReleaseMouseDown = () =>
      this.onCircleMouseDown(this._releaseCircle);
    this._boundOnDocumentMouseMove = this.onDocumentMouseMove.bind(this);
    this._boundOnDocumentMouseUp = this.onDocumentMouseUp.bind(this);
  }

  public init(): void {
    // Draw bend path
    this.updatePath(150, 200 + this.bendManagerOptions.gridOffset, 225);
    this.bendPath.setAttribute("stroke", "var(--tu-bend-curve)");
    this.bendPath.setAttribute("stroke-width", "2");
    this.bendPath.setAttribute("fill", "none");
    this.bendGraphSVG.appendChild(this.bendPath);

    // Draw draggable circles
    const startCX = `${this.bendManagerOptions.gridOffset}`;
    const startCY = `${this.bendManagerOptions.height / 2}`;
    this._startCircle.setAttribute("cx", startCX);
    this._startCircle.setAttribute("cy", startCY);
    this._startCircle.setAttribute("r", "8");
    this._startCircle.setAttribute("fill", "var(--tu-bend-handle)");
    this._startCircle.style.cursor = "pointer";
    this.bendGraphSVG.appendChild(this._startCircle);

    const releaseCX = `${200 + this.bendManagerOptions.gridOffset}`;
    const releaseCY = "225";
    this._releaseCircle.setAttribute("cx", releaseCX);
    this._releaseCircle.setAttribute("cy", releaseCY);
    this._releaseCircle.setAttribute("r", "8");
    this._releaseCircle.setAttribute("fill", "var(--tu-bend-handle)");
    this._releaseCircle.style.cursor = "pointer";
    this.bendGraphSVG.appendChild(this._releaseCircle);

    this._startCircle.addEventListener(
      "mousedown",
      this._boundOnStartMouseDown
    );
    this._releaseCircle.addEventListener(
      "mousedown",
      this._boundOnReleaseMouseDown
    );
  }

  public getBendTechnique(): BendOptionsData {
    const pitchUnitHeight =
      this.bendManagerOptions.height / this.bendManagerOptions.rowsCount;

    const startX = Number(this._startCircle.getAttribute("cx"));
    const startY = Number(this._startCircle.getAttribute("cy"));
    const releaseX = Number(this._releaseCircle.getAttribute("cx"));
    const releaseY = Number(this._releaseCircle.getAttribute("cy"));

    const startPitch =
      (this.bendManagerOptions.height - startY) / (pitchUnitHeight * 4);
    const releasePitch =
      (this.bendManagerOptions.height - releaseY) / (pitchUnitHeight * 4);

    return {
      type: BendType.PrebendAndRelease,
      prebendPitch: startPitch,
      releasePitch: releasePitch,
      bendDuration: 1,
    };
  }

  public dispose(): void {
    this._startCircle.removeEventListener(
      "mousedown",
      this._boundOnStartMouseDown
    );
    this._releaseCircle.removeEventListener(
      "mousedown",
      this._boundOnReleaseMouseDown
    );
    this.removeDocumentDragListeners();
    this.bendGraphSVG.innerHTML = "";
  }

  private onCircleMouseDown(circleElement: SVGCircleElement) {
    this._isDragging = true;
    this._draggedCircle = circleElement;
    document.addEventListener("mousemove", this._boundOnDocumentMouseMove);
    document.addEventListener("mouseup", this._boundOnDocumentMouseUp);
  }

  private removeDocumentDragListeners(): void {
    document.removeEventListener("mousemove", this._boundOnDocumentMouseMove);
    document.removeEventListener("mouseup", this._boundOnDocumentMouseUp);
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
      (this.bendManagerOptions.width - this.bendManagerOptions.gridOffset) /
      this.bendManagerOptions.colsCount;
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

    let startY = Number(this._startCircle?.getAttribute("cy"));
    let releaseX = Number(this._releaseCircle?.getAttribute("cx"));
    let releaseY = Number(this._releaseCircle?.getAttribute("cy"));

    if (
      this._draggedCircle === this._startCircle &&
      this._startCircle &&
      this._releaseCircle
    ) {
      startY = snappedY;
      this._startCircle.setAttribute("cy", startY.toString());
      if (releaseY <= startY) {
        releaseY = startY + yStep;
        this._releaseCircle.setAttribute("cy", releaseY.toString());
      }
    } else if (
      this._draggedCircle === this._releaseCircle &&
      this._releaseCircle
    ) {
      releaseX = snappedX;
      releaseY = snappedY;
      if (releaseY <= startY) {
        releaseY = startY + yStep;
      }
      if (releaseX < this.bendManagerOptions.gridOffset + xStep) {
        releaseX = this.bendManagerOptions.gridOffset + xStep;
      }
      this._releaseCircle.setAttribute("cx", releaseX.toString());
      this._releaseCircle.setAttribute("cy", releaseY.toString());
    }

    this.updatePath(startY, releaseX, releaseY);
  }

  private updatePath(startY: number, releaseX: number, releaseY: number) {
    if (this.bendPath === undefined) {
      return;
    }

    const d =
      `M ${this.bendManagerOptions.gridOffset} ${startY} ` +
      `L ${releaseX / 2} ${startY} ` +
      `Q ${releaseX} ${startY}, ${releaseX} ${releaseY} ` +
      `L ${this.bendManagerOptions.width} ${releaseY}`;
    this.bendPath.setAttribute("d", d);
  }

  private onDocumentMouseUp(event: MouseEvent) {
    this._isDragging = false;
    this._draggedCircle = this._startCircle;
    this.removeDocumentDragListeners();
  }
}
