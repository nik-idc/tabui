import { DURATION_TO_FLAG_COUNT } from "../../model";
import {
  NotationElement,
  TabBeatRhythmElement,
  TrackController,
} from "../../controller";
import { createSVGCircle, createSVGG, createSVGLine } from "../../../shared";
import { ElementRenderer } from "../element-renderer";
import type { ResolvedAssetConfig } from "../../../config/asset-url-resolver";

export class SVGTabBeatRhythmRenderer implements ElementRenderer {
  readonly trackController: TrackController;
  beatRhythmElement: TabBeatRhythmElement;
  readonly assetsPath: ResolvedAssetConfig;

  private _containerGroupSVG?: SVGGElement;
  private _durationStemSVG?: SVGLineElement;
  private _durationFlagsSVG?: SVGLineElement[];
  private _dot1CircleSVG?: SVGCircleElement;
  private _dot2CircleSVG?: SVGCircleElement;

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
    this._containerGroupSVG?.parentNode?.removeChild(this._containerGroupSVG);
  }

  public updateElementReference(element: TabBeatRhythmElement): void {
    this.beatRhythmElement = element;
  }

  private renderDurationStem(): void {
    const group = this.ensureContainerGroup();
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

    this._containerGroupSVG?.removeChild(this._durationStemSVG);
    this._durationStemSVG = undefined;
  }

  private renderDurationFlag(flagIndex: number): void {
    const group = this.ensureContainerGroup();
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

  private renderDotCircle(dot1: boolean): void {
    const group = this.ensureContainerGroup();
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

  public render(): void {
    this.ensureContainerGroup();
    this.renderDurationStem();
    this.renderDurationFlags();

    this.unrenderDotCircle(true);
    this.unrenderDotCircle(false);
    if (this.beatRhythmElement.beat.dots > 0) {
      this.renderDotCircle(true);
      if (this.beatRhythmElement.beat.dots === 2) {
        this.renderDotCircle(false);
      }
    }
  }

  public unrender(): void {
    this.unrenderDurationStem();
    this.unrenderDurationFlags();
    this.unrenderDotCircle(true);
    this.unrenderDotCircle(false);
  }
}
