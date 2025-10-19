import {
  createSVGCircle,
  createSVGLine,
  createSVGPath,
  createSVGText,
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
    this.updatePath(200 + xOffset, 150, 300 + xOffset, 225);
    this._bendPath.setAttribute("stroke", "black");
    this._bendPath.setAttribute("stroke-width", "2");
    this._bendPath.setAttribute("fill", "none");
    this._svg.appendChild(this._bendPath);

    // Draw draggable circles
    this._peakCircle = createSVGCircle();
    this._peakCircle.setAttribute("cx", (200 + xOffset).toString());
    this._peakCircle.setAttribute("cy", "150");
    this._peakCircle.setAttribute("r", "8");
    this._peakCircle.setAttribute("fill", "black");
    this._peakCircle.style.cursor = "pointer";
    this._svg.appendChild(this._peakCircle);

    this._releaseCircle = createSVGCircle();
    this._releaseCircle.setAttribute("cx", (300 + xOffset).toString());
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

  public getValues(): {
    peak: { position: number; pitch: number };
    release: { position: number; pitch: number };
  } {
    if (!this._peakCircle || !this._releaseCircle) {
      return {
        peak: { position: 0, pitch: 0 },
        release: { position: 0, pitch: 0 },
      };
    }
    const height = 300;
    const pitchUnitHeight = height / 12;

    const peakX = Number(this._peakCircle.getAttribute("cx"));
    const peakY = Number(this._peakCircle.getAttribute("cy"));
    const releaseX = Number(this._releaseCircle.getAttribute("cx"));
    const releaseY = Number(this._releaseCircle.getAttribute("cy"));

    const peakPitch = (height - peakY) / (pitchUnitHeight * 4);
    const releasePitch = (height - releaseY) / (pitchUnitHeight * 4);

    return {
      peak: { position: peakX, pitch: peakPitch },
      release: { position: releaseX, pitch: releasePitch },
    };
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

    const width = 420;
    const height = 300;
    const xOffset = 20;
    const xStep = (width - xOffset) / 12;
    const yStep = height / 12;

    let snappedX = xOffset + Math.round((svgP.x - xOffset) / xStep) * xStep;
    let snappedY = Math.round(svgP.y / yStep) * yStep;

    snappedX = Math.max(xOffset, Math.min(width, snappedX));
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
    const xOffset = 20;
    const d = `M ${xOffset} ${height} Q ${peakX} ${height}, ${peakX} ${peakY} Q ${releaseX} ${peakY}, ${releaseX} ${releaseY}`;
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
