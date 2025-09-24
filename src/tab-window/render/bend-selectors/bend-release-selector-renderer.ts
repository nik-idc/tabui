import {
  createSVGCircle,
  createSVGLine,
  createSVGPath,
} from "../../../misc/svg-creators";

export class BendReleaseSelectorRenderer {
  private _svg: SVGSVGElement;
  private _isDragging: boolean = false;
  private _draggedCircle: "peak" | "release" | null = null;
  private _bendPath: SVGPathElement | undefined;
  private _peakCircle: SVGCircleElement | undefined;
  private _releaseCircle: SVGCircleElement | undefined;

  constructor(svg: SVGSVGElement) {
    this._svg = svg;
  }

  public render(): void {
    const width = 400;
    const height = 300;
    this._svg.innerHTML = ""; // Clear previous drawings

    // Draw grid
    for (let i = 0; i <= 12; i++) {
      const y = (i / 12) * height;
      const line = createSVGLine();
      line.setAttribute("x1", "0");
      line.setAttribute("y1", y.toString());
      line.setAttribute("x2", width.toString());
      line.setAttribute("y2", y.toString());
      line.setAttribute("stroke", "#ccc");
      this._svg.appendChild(line);
    }
    for (let i = 0; i <= 12; i++) {
      const x = (i / 12) * width;
      const line = createSVGLine();
      line.setAttribute("x1", x.toString());
      line.setAttribute("y1", "0");
      line.setAttribute("x2", x.toString());
      line.setAttribute("y2", height.toString());
      line.setAttribute("stroke", "#ccc");
      this._svg.appendChild(line);
    }

    // Draw bend path
    this._bendPath = createSVGPath();
    this.updatePath(200, 150, 300, 225);
    this._bendPath.setAttribute("stroke", "black");
    this._bendPath.setAttribute("stroke-width", "2");
    this._bendPath.setAttribute("fill", "none");
    this._svg.appendChild(this._bendPath);

    // Draw draggable circles
    this._peakCircle = createSVGCircle();
    this._peakCircle.setAttribute("cx", "200");
    this._peakCircle.setAttribute("cy", "150");
    this._peakCircle.setAttribute("r", "8");
    this._peakCircle.setAttribute("fill", "black");
    this._peakCircle.style.cursor = "pointer";
    this._svg.appendChild(this._peakCircle);

    this._releaseCircle = createSVGCircle();
    this._releaseCircle.setAttribute("cx", "300");
    this._releaseCircle.setAttribute("cy", "225");
    this._releaseCircle.setAttribute("r", "8");
    this._releaseCircle.setAttribute("fill", "black");
    this._releaseCircle.style.cursor = "pointer";
    this._svg.appendChild(this._releaseCircle);

    this._peakCircle.addEventListener("mousedown", () =>
      this.onCircleMouseDown("peak")
    );
    this._releaseCircle.addEventListener("mousedown", () =>
      this.onCircleMouseDown("release")
    );
  }

  public unrender(): void {
    this._svg.innerHTML = "";
  }

  private onCircleMouseDown(circle: "peak" | "release") {
    this._isDragging = true;
    this._draggedCircle = circle;
    document.addEventListener("mousemove", this.onDocumentMouseMove.bind(this));
    document.addEventListener("mouseup", this.onDocumentMouseUp.bind(this));
  }

  private onDocumentMouseMove(event: MouseEvent) {
    if (this._isDragging === false) return;

    const pt = this._svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const svgP = pt.matrixTransform(this._svg.getScreenCTM()?.inverse());

    const width = 400;
    const height = 300;
    const xStep = width / 12;
    const yStep = height / 12;

    let snappedX = Math.round(svgP.x / xStep) * xStep;
    let snappedY = Math.round(svgP.y / yStep) * yStep;

    snappedX = Math.max(0, Math.min(width, snappedX));
    snappedY = Math.max(0, Math.min(height, snappedY));

    let peakX = Number(this._peakCircle?.getAttribute("cx"));
    let peakY = Number(this._peakCircle?.getAttribute("cy"));
    let releaseX = Number(this._releaseCircle?.getAttribute("cx"));
    let releaseY = Number(this._releaseCircle?.getAttribute("cy"));

    if (
      this._draggedCircle === "peak" &&
      this._peakCircle &&
      this._releaseCircle
    ) {
      peakX = snappedX;
      peakY = snappedY;
      this._peakCircle.setAttribute("cx", peakX.toString());
      this._peakCircle.setAttribute("cy", peakY.toString());

      if (releaseY <= peakY) {
        releaseY = peakY + yStep;
        this._releaseCircle.setAttribute("cy", releaseY.toString());
      }
      if (releaseX < peakX + xStep) {
        releaseX = peakX + xStep;
        this._releaseCircle.setAttribute("cx", releaseX.toString());
      }
    } else if (
      this._draggedCircle === "release" &&
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
      this._releaseCircle.setAttribute("cx", releaseX.toString());
      this._releaseCircle.setAttribute("cy", releaseY.toString());
    }

    this.updatePath(peakX, peakY, releaseX, releaseY);
  }

  private updatePath(
    peakX: number,
    peakY: number,
    releaseX: number,
    releaseY: number
  ) {
    if (this._bendPath === undefined) return;
    const height = 300;
    const d = `M 0 ${height} Q ${peakX} ${height}, ${peakX} ${peakY} Q ${releaseX} ${peakY}, ${releaseX} ${releaseY}`;
    this._bendPath.setAttribute("d", d);
  }

  private onDocumentMouseUp(event: MouseEvent) {
    this._isDragging = false;
    this._draggedCircle = null;
    document.removeEventListener(
      "mousemove",
      this.onDocumentMouseMove.bind(this)
    );
    document.removeEventListener("mouseup", this.onDocumentMouseUp.bind(this));
  }
}
