import {
  createSVGCircle,
  createSVGLine,
  createSVGPath,
} from "../../../misc/svg-creators";

export class PrebendSelectorRenderer {
  private _svg: SVGSVGElement;
  private _isDragging: boolean = false;
  private _bendPath: SVGPathElement | undefined;
  private _bendCircle: SVGCircleElement | undefined;

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
    this._bendPath.setAttribute("d", `M 0 150 L 400 150`);
    this._bendPath.setAttribute("stroke", "black");
    this._bendPath.setAttribute("stroke-width", "2");
    this._bendPath.setAttribute("fill", "none");
    this._svg.appendChild(this._bendPath);

    // Draw draggable circle
    this._bendCircle = createSVGCircle();
    this._bendCircle.setAttribute("cx", "0");
    this._bendCircle.setAttribute("cy", "150");
    this._bendCircle.setAttribute("r", "8");
    this._bendCircle.setAttribute("fill", "black");
    this._bendCircle.style.cursor = "pointer";
    this._svg.appendChild(this._bendCircle);

    this._bendCircle.addEventListener(
      "mousedown",
      this.onCircleMouseDown.bind(this)
    );
  }

  public unrender(): void {
    this._svg.innerHTML = "";
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
      this._bendPath === undefined
    )
      return;

    const pt = this._svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const svgP = pt.matrixTransform(this._svg.getScreenCTM()?.inverse());

    const height = 300;
    const yStep = height / 12;

    let snappedY = Math.round(svgP.y / yStep) * yStep;
    snappedY = Math.max(0, Math.min(height, snappedY));

    this._bendCircle.setAttribute("cy", snappedY.toString());

    const d = `M 0 ${snappedY} L 400 ${snappedY}`;
    this._bendPath.setAttribute("d", d);
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
