import { BendOptionsData, BendType } from "../../../../../notation/model";
import { createSVGCircle, createSVGPath, Point } from "../../../../../shared";
import { BendSelectorManagerOptions } from "./bend-selector-manager-options";
import { Selector } from "./selector";

type ControlPoint = {
  name: "bend" | "prebend" | "hold" | "release" | "start";
  x: number;
  y: number;
  movableX: boolean;
  circle: SVGCircleElement;
  onMouseDown: (event: MouseEvent) => void;
};

type BendPathPoints = {
  bend?: Point;
  prebend?: Point;
  hold?: Point;
  release?: Point;
  start?: Point;
};

function buildStandardBendPath(
  points: BendPathPoints,
  options: BendSelectorManagerOptions
): string {
  const bend = points.bend;
  if (bend === undefined) {
    throw Error("Missing 'bend' control point for bend path");
  }
  const startY = points.start?.y ?? options.height;
  return (
    `M ${options.gridOffset} ${startY} ` +
    `Q ${bend.x} ${startY}, ${bend.x} ${bend.y} ` +
    `L ${options.width} ${bend.y}`
  );
}

function buildBendReleasePath(
  points: BendPathPoints,
  options: BendSelectorManagerOptions
): string {
  const bend = points.bend;
  const release = points.release;
  if (bend === undefined) {
    throw Error("Missing 'bend' control point for bend path");
  }
  if (release === undefined) {
    throw Error("Missing 'release' control point for bend path");
  }
  const startY = points.start?.y ?? options.height;
  return (
    `M ${options.gridOffset} ${startY} ` +
    `Q ${bend.x} ${startY}, ${bend.x} ${bend.y} ` +
    `Q ${release.x} ${bend.y}, ${release.x} ${release.y}`
  );
}

function buildHorizontalPath(
  points: BendPathPoints,
  pointName: "hold" | "prebend",
  options: BendSelectorManagerOptions
): string {
  const point = points[pointName];
  if (point === undefined) {
    throw Error(`Missing '${pointName}' control point for bend path`);
  }
  return (
    `M ${options.gridOffset} ${point.y} ` + `L ${options.width} ${point.y}`
  );
}

function buildReleasePath(
  points: BendPathPoints,
  startName: "prebend" | "start",
  options: BendSelectorManagerOptions
): string {
  const start = points[startName];
  const release = points.release;
  if (start === undefined) {
    throw Error(`Missing '${startName}' control point for bend path`);
  }
  if (release === undefined) {
    throw Error("Missing 'release' control point for bend path");
  }
  return (
    `M ${options.gridOffset} ${start.y} ` +
    `L ${release.x / 2} ${start.y} ` +
    `Q ${release.x} ${start.y}, ${release.x} ${release.y} ` +
    `L ${options.width} ${release.y}`
  );
}

function buildPrebendReleasePath(
  points: BendPathPoints,
  options: BendSelectorManagerOptions
): string {
  return buildReleasePath(points, "prebend", options);
}

function buildStandaloneReleasePath(
  points: BendPathPoints,
  options: BendSelectorManagerOptions
): string {
  return buildReleasePath(points, "start", options);
}

function buildPrebendBendPath(
  points: BendPathPoints,
  options: BendSelectorManagerOptions
): string {
  const prebend = points.prebend;
  const bend = points.bend;
  if (prebend === undefined) {
    throw Error("Missing 'prebend' control point for bend path");
  }
  if (bend === undefined) {
    throw Error("Missing 'bend' control point for bend path");
  }
  return (
    `M ${options.gridOffset} ${prebend.y} ` +
    `L ${bend.x / 2} ${prebend.y} ` +
    `Q ${bend.x} ${prebend.y}, ${bend.x} ${bend.y} ` +
    `L ${options.width} ${bend.y}`
  );
}

export function buildBendPath(
  type: BendType,
  points: BendPathPoints,
  options: BendSelectorManagerOptions
): string {
  switch (type) {
    case BendType.Bend:
      return buildStandardBendPath(points, options);
    case BendType.BendAndRelease:
      return buildBendReleasePath(points, options);
    case BendType.Hold:
      return buildHorizontalPath(points, "hold", options);
    case BendType.Prebend:
      return buildHorizontalPath(points, "prebend", options);
    case BendType.PrebendAndRelease:
      return buildPrebendReleasePath(points, options);
    case BendType.PrebendBend:
      return buildPrebendBendPath(points, options);
    case BendType.Release:
      return buildStandaloneReleasePath(points, options);
  }
}

/** Graph selector shared by all bend shapes. */
export class BendCurveSelector implements Selector {
  readonly bendPath = createSVGPath();
  private _points: ControlPoint[] = [];
  private _draggedPoint?: ControlPoint;
  private _boundMouseMove: (event: MouseEvent) => void;
  private _boundMouseUp: () => void;

  constructor(
    readonly bendGraphSVG: SVGSVGElement,
    readonly bendManagerOptions: BendSelectorManagerOptions,
    private _bendOptions: BendOptionsData,
    private _continuationPitch?: number
  ) {
    this._boundMouseMove = this.onMouseMove.bind(this);
    this._boundMouseUp = this.onMouseUp.bind(this);
  }

  private addPoint(
    name: ControlPoint["name"],
    duration: number,
    pitch: number,
    movableX: boolean,
    draggable: boolean = true
  ): void {
    const circle = createSVGCircle();
    const point: ControlPoint = {
      name,
      x: this.durationToX(duration),
      y: this.pitchToY(pitch),
      movableX,
      circle,
      onMouseDown: () => this.onMouseDown(point),
    };
    circle.setAttribute("cx", `${point.x}`);
    circle.setAttribute("cy", `${point.y}`);
    circle.setAttribute("r", "8");
    circle.setAttribute("fill", "var(--tu-bend-handle)");
    if (draggable) {
      circle.style.cursor = "pointer";
      circle.addEventListener("mousedown", point.onMouseDown);
    }
    this._points.push(point);
    this.bendGraphSVG.appendChild(circle);
  }

  private initStandardBend(duration: number, continuationPitch?: number): void {
    if (continuationPitch !== undefined) {
      this.addPoint("start", 0, continuationPitch, false, false);
    }
    const bendPitch = Math.max(
      this._bendOptions.bendPitch ?? 1,
      continuationPitch ?? 0
    );
    this.addPoint("bend", duration, bendPitch, true);
  }

  private initBendAndRelease(duration: number): void {
    this.initStandardBend(duration, this._continuationPitch);
    this.addPoint(
      "release",
      Math.min(1, duration + 0.25),
      this._bendOptions.releasePitch ?? 0,
      true
    );
  }

  private initHold(): void {
    const pitch = this._continuationPitch ?? this._bendOptions.holdPitch ?? 1;
    this.addPoint("hold", 0, pitch, false, false);
  }

  private initPrebend(): void {
    const pitch = this._bendOptions.prebendPitch ?? 1;
    this.addPoint("prebend", 0, pitch, false);
  }

  private initPrebendAndRelease(duration: number): void {
    this.initPrebend();
    this.addPoint(
      "release",
      duration,
      this._bendOptions.releasePitch ?? 0,
      true
    );
  }

  private initPrebendBend(duration: number): void {
    this.addPoint("prebend", 0, this._bendOptions.prebendPitch ?? 0.5, false);
    this.initStandardBend(duration);
  }

  private initRelease(duration: number): void {
    this.addPoint("start", 0, this._continuationPitch ?? 1, false, false);
    this.addPoint(
      "release",
      duration,
      this._bendOptions.releasePitch ?? 0,
      true
    );
  }

  private onMouseDown(point: ControlPoint): void {
    this._draggedPoint = point;
    document.addEventListener("mousemove", this._boundMouseMove);
    document.addEventListener("mouseup", this._boundMouseUp);
  }

  private onMouseMove(event: MouseEvent): void {
    if (this._draggedPoint === undefined) {
      return;
    }
    const svgPoint = this.bendGraphSVG.createSVGPoint();
    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;
    const transformed = svgPoint.matrixTransform(
      this.bendGraphSVG.getScreenCTM()?.inverse()
    );
    const xStep = this.width / this.bendManagerOptions.colsCount;
    const yStep =
      this.bendManagerOptions.height / this.bendManagerOptions.rowsCount;
    if (this._draggedPoint.movableX) {
      this._draggedPoint.x = Math.max(
        this.bendManagerOptions.gridOffset + xStep,
        Math.min(
          this.bendManagerOptions.width,
          this.bendManagerOptions.gridOffset +
            Math.round(
              (transformed.x - this.bendManagerOptions.gridOffset) / xStep
            ) *
              xStep
        )
      );
    }
    this._draggedPoint.y = Math.max(
      0,
      Math.min(
        this.bendManagerOptions.height,
        Math.round(transformed.y / yStep) * yStep
      )
    );
    this.constrainPoints(xStep, yStep);
    this.syncCircles();
    this.updatePath();
  }

  private constrainPoints(xStep: number, yStep: number): void {
    const bend = this.getPoint("bend");
    const prebend = this.getPoint("prebend");
    const release = this.getPoint("release");
    const start = this.getPoint("start");
    if (release !== undefined) {
      const source = bend ?? prebend ?? this.getPoint("start");
      if (source !== undefined) {
        release.x = Math.max(release.x, source.x + xStep);
        release.x = Math.min(release.x, this.bendManagerOptions.width);
        release.y = Math.max(
          release.y,
          Math.min(source.y + yStep, this.bendManagerOptions.height)
        );
      }
    }
    if (
      bend !== undefined &&
      start !== undefined &&
      (this._bendOptions.type === BendType.Bend ||
        this._bendOptions.type === BendType.BendAndRelease)
    ) {
      bend.y = Math.min(bend.y, start.y);
    }
    if (
      this._bendOptions.type === BendType.PrebendBend &&
      bend !== undefined &&
      prebend !== undefined
    ) {
      bend.y = Math.min(bend.y, Math.max(0, prebend.y - yStep));
    }
  }

  private syncCircles(): void {
    for (const point of this._points) {
      point.circle.setAttribute("cx", `${point.x}`);
      point.circle.setAttribute("cy", `${point.y}`);
    }
  }

  private updatePath(): void {
    const points: BendPathPoints = {};
    for (const point of this._points) {
      points[point.name] = new Point(point.x, point.y);
    }
    this.bendPath.setAttribute(
      "d",
      buildBendPath(this._bendOptions.type, points, this.bendManagerOptions)
    );
  }

  public getBendTechnique(): BendOptionsData {
    switch (this._bendOptions.type) {
      case BendType.Bend:
        return this.getStandardBendTechnique();
      case BendType.BendAndRelease:
        return this.getBendAndReleaseTechnique();
      case BendType.Hold:
        return this.getHoldTechnique();
      case BendType.Prebend:
        return this.getPrebendTechnique();
      case BendType.PrebendAndRelease:
        return this.getPrebendAndReleaseTechnique();
      case BendType.PrebendBend:
        return this.getPrebendBendTechnique();
      case BendType.Release:
        return this.getReleaseTechnique();
    }
  }

  public init(): void {
    this.bendPath.setAttribute("stroke", "var(--tu-bend-curve)");
    this.bendPath.setAttribute("stroke-width", "2");
    this.bendPath.setAttribute("fill", "none");
    this.bendGraphSVG.appendChild(this.bendPath);

    const duration = this._bendOptions.bendDuration ?? 0.75;
    switch (this._bendOptions.type) {
      case BendType.Bend:
        this.initStandardBend(duration, this._continuationPitch);
        break;
      case BendType.BendAndRelease:
        this.initBendAndRelease(duration);
        break;
      case BendType.Hold:
        this.initHold();
        break;
      case BendType.Prebend:
        this.initPrebend();
        break;
      case BendType.PrebendAndRelease:
        this.initPrebendAndRelease(duration);
        break;
      case BendType.PrebendBend:
        this.initPrebendBend(duration);
        break;
      case BendType.Release:
        this.initRelease(duration);
        break;
    }
    this.updatePath();
  }

  private getStandardBendTechnique(): BendOptionsData {
    const bend = this.getRequiredPoint("bend");
    return {
      type: BendType.Bend,
      bendPitch: this.yToPitch(bend.y),
      bendDuration: this.xToDuration(bend.x),
    };
  }

  private getBendAndReleaseTechnique(): BendOptionsData {
    const bend = this.getRequiredPoint("bend");
    const release = this.getRequiredPoint("release");
    return {
      type: BendType.BendAndRelease,
      bendPitch: this.yToPitch(bend.y),
      releasePitch: this.yToPitch(release.y),
      bendDuration: this.xToDuration(bend.x),
    };
  }

  private getHoldTechnique(): BendOptionsData {
    const hold = this.getRequiredPoint("hold");
    return {
      type: BendType.Hold,
      holdPitch: this.yToPitch(hold.y),
      bendDuration: this._bendOptions.bendDuration ?? 1,
    };
  }

  private getPrebendTechnique(): BendOptionsData {
    const prebend = this.getRequiredPoint("prebend");
    return {
      type: BendType.Prebend,
      prebendPitch: this.yToPitch(prebend.y),
    };
  }

  private getPrebendAndReleaseTechnique(): BendOptionsData {
    const prebend = this.getRequiredPoint("prebend");
    const release = this.getRequiredPoint("release");
    return {
      type: BendType.PrebendAndRelease,
      prebendPitch: this.yToPitch(prebend.y),
      releasePitch: this.yToPitch(release.y),
      bendDuration: this.xToDuration(release.x),
    };
  }

  private getPrebendBendTechnique(): BendOptionsData {
    const prebend = this.getRequiredPoint("prebend");
    const bend = this.getRequiredPoint("bend");
    return {
      type: BendType.PrebendBend,
      prebendPitch: this.yToPitch(prebend.y),
      bendPitch: this.yToPitch(bend.y),
      bendDuration: this.xToDuration(bend.x),
    };
  }

  private getReleaseTechnique(): BendOptionsData {
    const release = this.getRequiredPoint("release");
    return {
      type: BendType.Release,
      releasePitch: this.yToPitch(release.y),
      bendDuration: this.xToDuration(release.x),
    };
  }

  private getRequiredPoint(name: ControlPoint["name"]): ControlPoint {
    const point = this.getPoint(name);
    if (point === undefined) {
      throw Error(`Missing '${name}' control point for bend technique`);
    }
    return point;
  }

  private getPoint(name: ControlPoint["name"]): ControlPoint | undefined {
    return this._points.find((point) => point.name === name);
  }

  private get width(): number {
    return this.bendManagerOptions.width - this.bendManagerOptions.gridOffset;
  }

  private durationToX(duration: number): number {
    return this.bendManagerOptions.gridOffset + this.width * duration;
  }

  private xToDuration(x: number): number {
    return (x - this.bendManagerOptions.gridOffset) / this.width;
  }

  private pitchToY(pitch: number): number {
    return (
      this.bendManagerOptions.height -
      pitch * (this.bendManagerOptions.height / 3)
    );
  }

  private yToPitch(y: number): number {
    return (
      (this.bendManagerOptions.height - y) /
      (this.bendManagerOptions.height / 3)
    );
  }

  private onMouseUp(): void {
    this._draggedPoint = undefined;
    this.removeDocumentListeners();
  }

  private removeDocumentListeners(): void {
    document.removeEventListener("mousemove", this._boundMouseMove);
    document.removeEventListener("mouseup", this._boundMouseUp);
  }

  public dispose(): void {
    for (const point of this._points) {
      point.circle.removeEventListener("mousedown", point.onMouseDown);
    }
    this.removeDocumentListeners();
    this._points = [];
    this.bendGraphSVG.innerHTML = "";
  }
}
