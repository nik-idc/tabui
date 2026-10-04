import { DURATION_TO_FLAG_COUNT } from "../../model";
import {
  NotationElement,
  TabBeatRhythmElement,
  TrackController,
} from "../../controller";
import {
  createSVGCircle,
  createSVGG,
  createSVGLine,
  createSVGPath,
} from "../../../shared";
import { ElementRenderer } from "../element-renderer";
import type { ResolvedAssetConfig } from "../../../config/asset-url-resolver";

export class SVGTabBeatRhythmRenderer implements ElementRenderer {
  readonly trackController: TrackController;
  beatRhythmElement: TabBeatRhythmElement;
  readonly assetsPath: ResolvedAssetConfig;

  private _containerGroupSVG?: SVGGElement;
  private _durationGroupSVG?: SVGGElement;
  private _dotsGroupSVG?: SVGGElement;
  private _durationStemSVG?: SVGLineElement;
  private _durationFlagsSVG?: SVGLineElement[];
  private _dot1CircleSVG?: SVGCircleElement;
  private _dot2CircleSVG?: SVGCircleElement;
  private _durationHitTargetSVG?: SVGPathElement;
  private _dotsHitTargetSVG?: SVGPathElement;
  private _attachedEvents = new Map<string, EventListener>();

  constructor(
    trackController: TrackController,
    beatRhythmElement: TabBeatRhythmElement,
    assetsPath: ResolvedAssetConfig
  ) {
    this.trackController = trackController;
    this.beatRhythmElement = beatRhythmElement;
    this.assetsPath = assetsPath;
  }

  public ensureContainerGroup(): SVGGElement {
    if (this._containerGroupSVG !== undefined) {
      return this._containerGroupSVG;
    }

    this._containerGroupSVG = createSVGG();
    this._containerGroupSVG.setAttribute(
      "id",
      `beat-rhythm-${this.beatRhythmElement.beat.uuid}`
    );
    return this._containerGroupSVG;
  }

  public detachContainerGroup(): void {
    for (const eventType of this._attachedEvents.keys()) {
      this.detachMouseEvent(eventType as keyof SVGElementEventMap);
    }
    this._containerGroupSVG?.parentNode?.removeChild(this._containerGroupSVG);
  }

  public updateElementReference(element: TabBeatRhythmElement): void {
    this.beatRhythmElement = element;
  }

  /** Attaches a callback to duration or dot hit targets. */
  public attachMouseEvent<K extends keyof SVGElementEventMap>(
    eventType: K,
    eventHandler: (
      event: SVGElementEventMap[K],
      element: TabBeatRhythmElement,
      target: "duration" | "dots"
    ) => void
  ): void {
    const group = this.ensureContainerGroup();
    this.detachMouseEvent(eventType);
    const listener = (this.dispatchMouseEvent<K>).bind(this, eventHandler);
    group.addEventListener(eventType, listener);
    this._attachedEvents.set(eventType, listener);
  }

  /** Dispatches an event for the current beat rhythm element. */
  private dispatchMouseEvent<K extends keyof SVGElementEventMap>(
    eventHandler: (
      event: SVGElementEventMap[K],
      element: TabBeatRhythmElement,
      target: "duration" | "dots"
    ) => void,
    event: Event
  ): void {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    if (this._durationGroupSVG?.contains(target)) {
      eventHandler(
        event as SVGElementEventMap[K],
        this.beatRhythmElement,
        "duration"
      );
      return;
    }
    if (this._dotsGroupSVG?.contains(target)) {
      eventHandler(
        event as SVGElementEventMap[K],
        this.beatRhythmElement,
        "dots"
      );
    }
  }

  /** Detaches a previously supplied callback. */
  public detachMouseEvent<K extends keyof SVGElementEventMap>(
    eventType: K
  ): void {
    const listener = this._attachedEvents.get(eventType);
    if (listener === undefined) {
      return;
    }
    this._containerGroupSVG?.removeEventListener(eventType, listener);
    this._attachedEvents.delete(eventType);
  }

  /** Creates the shared stem and flag target group when needed. */
  private ensureDurationGroup(): SVGGElement {
    if (this._durationGroupSVG === undefined) {
      this._durationGroupSVG = createSVGG();
      this._durationGroupSVG.setAttribute("class", "tu-beat-duration");
      this.ensureContainerGroup().appendChild(this._durationGroupSVG);
    }
    return this._durationGroupSVG;
  }

  /** Creates the shared augmentation dot target group when needed. */
  private ensureDotsGroup(): SVGGElement {
    if (this._dotsGroupSVG === undefined) {
      this._dotsGroupSVG = createSVGG();
      this._dotsGroupSVG.setAttribute("class", "tu-beat-dots");
      this.ensureContainerGroup().appendChild(this._dotsGroupSVG);
    }
    return this._dotsGroupSVG;
  }

  private renderDurationStem(): void {
    const group = this.ensureDurationGroup();
    const stemBarLocal = this.beatRhythmElement.durationStemLineBarLocal;
    if (stemBarLocal === undefined) {
      this.unrenderDurationStem();
      return;
    }

    if (this._durationStemSVG === undefined) {
      this._durationStemSVG = createSVGLine();
      this._durationStemSVG.setAttribute(
        "id",
        `beat-rhythm-stem-${this.beatRhythmElement.beat.uuid}`
      );
      this._durationStemSVG.setAttribute("stroke", "var(--tu-notation-ink)");
      group.appendChild(this._durationStemSVG);
    }

    this._durationStemSVG.setAttribute("x1", `${stemBarLocal.x}`);
    this._durationStemSVG.setAttribute("x2", `${stemBarLocal.x}`);
    this._durationStemSVG.setAttribute("y1", `${stemBarLocal.y1}`);
    this._durationStemSVG.setAttribute("y2", `${stemBarLocal.y2}`);
  }

  private unrenderDurationStem(): void {
    if (this._durationStemSVG === undefined) {
      return;
    }

    this._durationGroupSVG?.removeChild(this._durationStemSVG);
    this._durationStemSVG = undefined;
  }

  private renderDurationFlag(flagIndex: number): void {
    const group = this.ensureDurationGroup();
    const flagLinesBarLocal = this.beatRhythmElement.durationFlagLinesBarLocal;
    if (flagLinesBarLocal === undefined) {
      return;
    }

    if (this._durationFlagsSVG === undefined) {
      this._durationFlagsSVG = [];
    }
    if (this._durationFlagsSVG[flagIndex] === undefined) {
      this._durationFlagsSVG[flagIndex] = createSVGLine();
      this._durationFlagsSVG[flagIndex].setAttribute(
        "id",
        `beat-rhythm-flag-${flagIndex}-${this.beatRhythmElement.beat.uuid}`
      );
      this._durationFlagsSVG[flagIndex].setAttribute(
        "stroke",
        "var(--tu-notation-ink)"
      );
      group.appendChild(this._durationFlagsSVG[flagIndex]);
    }

    const line = flagLinesBarLocal[flagIndex];
    this._durationFlagsSVG[flagIndex].setAttribute("x1", `${line.x1}`);
    this._durationFlagsSVG[flagIndex].setAttribute("x2", `${line.x2}`);
    this._durationFlagsSVG[flagIndex].setAttribute("y1", `${line.y}`);
    this._durationFlagsSVG[flagIndex].setAttribute("y2", `${line.y}`);
  }

  private unrenderDurationFlags(): void {
    if (this._durationFlagsSVG === undefined) {
      return;
    }

    for (const flag of this._durationFlagsSVG) {
      flag?.parentNode?.removeChild(flag);
    }
    this._durationFlagsSVG = undefined;
  }

  private renderDurationFlags(): void {
    this.unrenderDurationFlags();
    if (this.beatRhythmElement.durationFlagLines === undefined) {
      return;
    }

    const beatFlagCount =
      DURATION_TO_FLAG_COUNT[this.beatRhythmElement.beat.baseDuration];
    for (let i = 0; i < beatFlagCount; i++) {
      this.renderDurationFlag(i);
    }
  }

  /** Widens the stem and flag geometry without changing visible strokes. */
  private renderDurationHitTarget(): void {
    const stem = this.beatRhythmElement.durationStemLineBarLocal;
    const flags = this.beatRhythmElement.durationFlagLinesBarLocal;
    if (stem === undefined && (flags === undefined || flags.length === 0)) {
      this.unrenderDurationHitTarget();
      this._durationGroupSVG?.parentNode?.removeChild(this._durationGroupSVG);
      this._durationGroupSVG = undefined;
      return;
    }
    const group = this.ensureDurationGroup();
    if (this._durationHitTargetSVG === undefined) {
      this._durationHitTargetSVG = createSVGPath();
    }
    group.appendChild(this._durationHitTargetSVG);
    const parts: string[] = [];
    if (stem !== undefined) {
      parts.push(`M ${stem.x} ${stem.y1} L ${stem.x} ${stem.y2}`);
    }
    for (const flag of flags ?? []) {
      parts.push(`M ${flag.x1} ${flag.y} L ${flag.x2} ${flag.y}`);
    }
    const width = this.trackController.layoutDimensions.NOTE_TEXT_SIZE / 2;
    this._durationHitTargetSVG.setAttribute("d", parts.join(" "));
    this._durationHitTargetSVG.setAttribute("stroke", "transparent");
    this._durationHitTargetSVG.setAttribute("stroke-width", `${width}`);
    this._durationHitTargetSVG.setAttribute("stroke-linecap", "round");
    this._durationHitTargetSVG.setAttribute("stroke-linejoin", "round");
    this._durationHitTargetSVG.setAttribute("pointer-events", "stroke");
    this._durationHitTargetSVG.setAttribute("fill", "none");
  }

  /** Removes the duration's invisible target. */
  private unrenderDurationHitTarget(): void {
    this._durationHitTargetSVG?.parentNode?.removeChild(
      this._durationHitTargetSVG
    );
    this._durationHitTargetSVG = undefined;
  }

  private renderDotCircle(dot1: boolean): void {
    const group = this.ensureDotsGroup();
    let dotCircle = dot1 ? this._dot1CircleSVG : this._dot2CircleSVG;
    if (dotCircle === undefined) {
      dotCircle = createSVGCircle();
      dotCircle.setAttribute(
        "id",
        `beat-rhythm-dot-${dot1 ? 1 : 2}-${this.beatRhythmElement.beat.uuid}`
      );
      dotCircle.setAttribute("fill", "var(--tu-notation-ink)");
      group.appendChild(dotCircle);
      if (dot1) {
        this._dot1CircleSVG = dotCircle;
      } else {
        this._dot2CircleSVG = dotCircle;
      }
    }

    const circle = dot1
      ? this.beatRhythmElement.dot1CircleBarLocal
      : this.beatRhythmElement.dot2CircleBarLocal;
    if (circle === undefined) {
      throw Error("Tried to render dot circle when circle undefined");
    }
    dotCircle.setAttribute("cx", `${circle.centerX}`);
    dotCircle.setAttribute("cy", `${circle.centerY}`);
    dotCircle.setAttribute("r", `${circle.diameter / 2}`);
  }

  private unrenderDotCircle(dot1: boolean): void {
    const dotCircle = dot1 ? this._dot1CircleSVG : this._dot2CircleSVG;
    if (dotCircle === undefined) {
      return;
    }

    dotCircle.parentNode?.removeChild(dotCircle);
    if (dot1) {
      this._dot1CircleSVG = undefined;
    } else {
      this._dot2CircleSVG = undefined;
    }
  }

  /** Covers the beat's dots with padded transparent path geometry. */
  private renderDotsHitTarget(): void {
    if (this.beatRhythmElement.beat.dots === 0) {
      this.unrenderDotsHitTarget();
      this._dotsGroupSVG?.parentNode?.removeChild(this._dotsGroupSVG);
      this._dotsGroupSVG = undefined;
      return;
    }
    const group = this.ensureDotsGroup();
    if (this._dotsHitTargetSVG === undefined) {
      this._dotsHitTargetSVG = createSVGPath();
    }
    group.appendChild(this._dotsHitTargetSVG);
    const padding = this.trackController.layoutDimensions.NOTE_TEXT_SIZE / 8;
    const circles = [
      this.beatRhythmElement.dot1CircleBarLocal,
      this.beatRhythmElement.dot2CircleBarLocal,
    ];
    const paths: string[] = [];
    for (let i = 0; i < this.beatRhythmElement.beat.dots; i++) {
      const circle = circles[i];
      if (circle === undefined) {
        throw Error("Tried to render dot target when circle undefined");
      }
      const radius = circle.diameter / 2 + padding;
      paths.push(
        `M ${circle.centerX - radius} ${circle.centerY - radius} h ${radius * 2} v ${radius * 2} h -${radius * 2} Z`
      );
    }
    this._dotsHitTargetSVG.setAttribute("d", paths.join(" "));
    this._dotsHitTargetSVG.setAttribute("fill", "transparent");
    this._dotsHitTargetSVG.setAttribute("pointer-events", "fill");
  }

  /** Removes the dots' invisible target. */
  private unrenderDotsHitTarget(): void {
    this._dotsHitTargetSVG?.parentNode?.removeChild(this._dotsHitTargetSVG);
    this._dotsHitTargetSVG = undefined;
  }

  public render(): void {
    this.ensureContainerGroup();
    this.renderDurationStem();
    this.renderDurationFlags();
    this.renderDurationHitTarget();

    this.unrenderDotCircle(true);
    this.unrenderDotCircle(false);
    if (this.beatRhythmElement.beat.dots > 0) {
      this.renderDotCircle(true);
      if (this.beatRhythmElement.beat.dots === 2) {
        this.renderDotCircle(false);
      }
    }
    this.renderDotsHitTarget();
  }

  public unrender(): void {
    this.unrenderDurationStem();
    this.unrenderDurationFlags();
    this.unrenderDurationHitTarget();
    this.unrenderDotCircle(true);
    this.unrenderDotCircle(false);
    this.unrenderDotsHitTarget();
    this._durationGroupSVG?.parentNode?.removeChild(this._durationGroupSVG);
    this._dotsGroupSVG?.parentNode?.removeChild(this._dotsGroupSVG);
    this._durationGroupSVG = undefined;
    this._dotsGroupSVG = undefined;
  }
}
