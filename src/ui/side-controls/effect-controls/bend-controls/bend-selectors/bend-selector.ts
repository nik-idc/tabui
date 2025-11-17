import {
  createSVGLine,
  createSVGText,
  createSVGPath,
  createSVGCircle,
} from "@/shared";
import { BendData, Selector } from "./selector";
import { BendSelectorManagerOptions } from "./bend-selector-manager-bendOptions";
import { GuitarTechnique, GuitarTechniqueType } from "@/notation";

export class BendSelector implements Selector {
  readonly bendGraphSVG: SVGSVGElement;
  readonly bendPath: SVGPathElement;
  readonly bendManagerOptions: BendSelectorManagerOptions;

  private _bendCircle: SVGCircleElement;
  private _isDragging: boolean;

  constructor(
    bendGraphSVG: SVGSVGElement,
    bendManagerOptions: BendSelectorManagerOptions
  ) {
    this.bendGraphSVG = bendGraphSVG;
    this.bendPath = createSVGPath();
    this.bendManagerOptions = bendManagerOptions;

    this._isDragging = false;
    this._bendCircle = createSVGCircle();
  }

  // Rename to init, since this is only
  // called once to initialize the grid & circles
  public init(): void {
    // Draw bend path (300 is arbitrary)
    this.updatePath(
      300 + this.bendManagerOptions.gridOffset,
      this.bendManagerOptions.height / 2
    );
    this.bendPath.setAttribute("stroke", "black");
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
    this._bendCircle.setAttribute("fill", "black");
    this._bendCircle.style.cursor = "pointer";
    this.bendGraphSVG.appendChild(this._bendCircle);

    this._bendCircle.addEventListener(
      "mousedown",
      this.onCircleMouseDown.bind(this)
    );
  }

  public dispose(): void {
    this.bendGraphSVG.innerHTML = "";
  }

  public getBendTechnique(): GuitarTechnique {
    const pitchUnitHeight =
      this.bendManagerOptions.height / this.bendManagerOptions.rowsCount;
    const y = Number(this._bendCircle.getAttribute("cy"));
    const pitch = (this.bendManagerOptions.height - y) / (pitchUnitHeight * 4);

    return new GuitarTechnique(GuitarTechniqueType.Bend, { bendPitch: pitch });
  }

  private onCircleMouseDown(event: MouseEvent) {
    this._isDragging = true;
    document.addEventListener("mousemove", this.onDocumentMouseMove.bind(this));
    document.addEventListener("mouseup", this.onDocumentMouseUp.bind(this));
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
    document.removeEventListener(
      "mousemove",
      this.onDocumentMouseMove.bind(this)
    );
    document.removeEventListener("mouseup", this.onDocumentMouseUp.bind(this));
  }
}
