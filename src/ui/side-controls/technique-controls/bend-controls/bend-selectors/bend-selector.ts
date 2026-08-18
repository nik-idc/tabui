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

export class BendSelector implements Selector {
  readonly bendGraphSVG: SVGSVGElement;
  readonly bendPath: SVGPathElement;
  readonly bendManagerOptions: BendSelectorManagerOptions;

  private _bendCircle: SVGCircleElement;
  private _isDragging: boolean;
  private _boundOnCircleMouseDown: (event: MouseEvent) => void;
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
    this._bendCircle = createSVGCircle();
    this._boundOnCircleMouseDown = this.onCircleMouseDown.bind(this);
    this._boundOnDocumentMouseMove = this.onDocumentMouseMove.bind(this);
    this._boundOnDocumentMouseUp = this.onDocumentMouseUp.bind(this);
  }

  // Rename to init, since this is only
  // called once to initialize the grid & circles
  public init(): void {
    // Draw bend path (300 is arbitrary)
    this.updatePath(
      300 + this.bendManagerOptions.gridOffset,
      this.bendManagerOptions.height / 2
    );
    this.bendPath.setAttribute("stroke", "var(--tu-bend-curve)");
    this.bendPath.setAttribute("stroke-width", "2");
    this.bendPath.setAttribute("fill", "none");
    this.bendGraphSVG.appendChild(this.bendPath);

    // Draw draggable circle
    const cx = `${300 + this.bendManagerOptions.gridOffset}`;
    this._bendCircle.setAttribute("cx", cx);
    this._bendCircle.setAttribute(
      "cy",
      `${this.bendManagerOptions.height / 2}`
    );
    this._bendCircle.setAttribute("r", "8");
    this._bendCircle.setAttribute("fill", "var(--tu-bend-handle)");
    this._bendCircle.style.cursor = "pointer";
    this.bendGraphSVG.appendChild(this._bendCircle);

    this._bendCircle.addEventListener(
      "mousedown",
      this._boundOnCircleMouseDown
    );
  }

  public dispose(): void {
    this._bendCircle.removeEventListener(
      "mousedown",
      this._boundOnCircleMouseDown
    );
    this.removeDocumentDragListeners();
    this.bendGraphSVG.innerHTML = "";
  }

  public getBendTechnique(): BendOptionsData {
    const pitchUnitHeight =
      this.bendManagerOptions.height / this.bendManagerOptions.rowsCount;
    const y = Number(this._bendCircle.getAttribute("cy"));
    const pitch = (this.bendManagerOptions.height - y) / (pitchUnitHeight * 4);

    return {
      type: BendType.Bend,
      bendPitch: pitch,
      bendDuration: 1,
    };
  }

  private onCircleMouseDown(event: MouseEvent) {
    this._isDragging = true;
    document.addEventListener("mousemove", this._boundOnDocumentMouseMove);
    document.addEventListener("mouseup", this._boundOnDocumentMouseUp);
  }

  private removeDocumentDragListeners(): void {
    document.removeEventListener("mousemove", this._boundOnDocumentMouseMove);
    document.removeEventListener("mouseup", this._boundOnDocumentMouseUp);
  }

  private onDocumentMouseMove(event: MouseEvent) {
    if (
      this._isDragging === false ||
      this._bendCircle === undefined ||
      this.bendPath === undefined
    ) {
      return;
    }

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

    this._bendCircle.setAttribute("cx", `${snappedX}`);
    this._bendCircle.setAttribute("cy", `${snappedY}`);

    this.updatePath(snappedX, snappedY);
  }

  private updatePath(x: number, y: number) {
    if (this.bendPath === undefined) {
      return;
    }

    const d =
      `M ${this.bendManagerOptions.gridOffset} ${this.bendManagerOptions.height} ` +
      `Q ${x} ${this.bendManagerOptions.height}, ${x} ${y} ` +
      `L ${this.bendManagerOptions.width} ${y}`;
    this.bendPath.setAttribute("d", d);
  }

  private onDocumentMouseUp(event: MouseEvent) {
    this._isDragging = false;
    this.removeDocumentDragListeners();
  }
}
