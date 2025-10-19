import {
  createSVGCircle,
  createSVGLine,
  createSVGPath,
  createSVGText,
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
    const width = 420;
    const height = 300;
    const xOffset = 20;
    this._svg.innerHTML = ""; // Clear previous drawings

    // Draw grid
    for (let i = 0; i <= 12; i++) {
      const y = (i / 12) * height;
      const line = createSVGLine();
      line.setAttribute("x1", xOffset.toString());
      line.setAttribute("y1", y.toString());
      line.setAttribute("x2", width.toString());
      line.setAttribute("y2", y.toString());
      line.setAttribute("stroke", "#ccc");
      this._svg.appendChild(line);

      const pitch = Math.round((height - y) / (height / 12));
      const text = createSVGText();
      text.setAttribute("x", "0");
      let yPos = y + 5;
      if (pitch === 0) {
        yPos -= 5;
      }
      if (pitch === 12) {
        yPos += 5;
      }
      text.setAttribute("y", yPos.toString());
      text.classList.add("pitch-label");
      text.setAttribute("font-size", "12px");

      const label = this.getPitchLabel(pitch);
      text.textContent = label;
      this._svg.appendChild(text);
    }
    for (let i = 0; i <= 12; i++) {
      const x = xOffset + (i / 12) * (width - xOffset);
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
    this._bendPath.setAttribute("d", `M ${xOffset} 150 L ${width} 150`);
    this._bendPath.setAttribute("stroke", "black");
    this._bendPath.setAttribute("stroke-width", "2");
    this._bendPath.setAttribute("fill", "none");
    this._svg.appendChild(this._bendPath);

    // Draw draggable circle
    this._bendCircle = createSVGCircle();
    this._bendCircle.setAttribute("cx", xOffset.toString());
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

  private getPitchLabel(pitch: number): string {
    const labels: { [key: number]: string } = {
      0: "0",
      2: "½",
      4: "Full",
      6: "1 ½",
      8: "2",
      10: "2 ½",
      12: "3",
    };
    return labels[pitch] || "";
  }

  public getValues(): { pitch: number } {
    if (!this._bendCircle) {
      return { pitch: 0 };
    }
    const height = 300;
    const pitchUnitHeight = height / 12;
    const y = Number(this._bendCircle.getAttribute("cy"));
    const pitch = (height - y) / (pitchUnitHeight * 4);
    return { pitch };
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

    const d = `M 20 ${snappedY} L 420 ${snappedY}`;
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
