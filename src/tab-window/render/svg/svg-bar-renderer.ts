import {
  createSVGG,
  createSVGImage,
  createSVGLine,
  createSVGRect,
  createSVGText,
} from "../../../misc/svg-creators";
import { BarRepeatStatus } from "../../../models/bar";
import { DURATION_TO_NAME } from "../../../models/note-duration";
import { BarElement } from "../../elements/bar-element";
import { BeatElement } from "../../elements/beat-element";
import { EffectLabelElement } from "../../elements/effects/effect-label-element";
import { TupletElement } from "../../elements/tuplet-element";
import { Point } from "../../shapes/point";
import { TabWindow } from "../../tab-window";
import { SVGBeatRenderer } from "./svg-beat-renderer";
import { SVGEffectLabelRenderer } from "./svg-effect-label-renderer";
import { SVGNoteRenderer } from "./svg-note-renderer";
import { SVGTupletRenderer } from "./tuplet/svg-tuplet-renderer";
import { SVGTupletSegmentRenderer } from "./tuplet/svg-tuplet-segment-renderer";

type BeamSegmentSVG = {
  longSVG: SVGImageElement;
  shortSVG?: SVGImageElement;
};

/**
 * Class for rendering a bar element using SVG
 */
export class SVGBarRenderer {
  private _tabWindow: TabWindow;
  private _barElement: BarElement;
  private _tleOffset: Point;
  private _assetsPath: string;
  private _parentElement: SVGGElement;

  private _renderedBeatElements: Map<number, SVGBeatRenderer>;
  private _renderedTupletElements: Map<number, SVGTupletRenderer>;

  private _groupSVG?: SVGGElement;
  private _barStaffLinesSVG?: SVGLineElement[];
  private _barBorderLinesSVG?: SVGLineElement[];
  private _barRepeatSign?: SVGImageElement;
  private _barSigSVG?: SVGTextElement[];
  private _barTempoImageSVG?: SVGImageElement;
  private _barTempoTextSVG?: SVGTextElement;
  private _barBeamsSegmentsSVG?: BeamSegmentSVG[];
  private _barSelectionStartGapRect?: SVGRectElement;
  private _barSelectionEndGapRect?: SVGRectElement;

  /**
   * Class for rendering a beat element using SVG
   * @param tabWindow Tab window
   * @param barElement Bar element
   * @param tleOffset Global offset of the tab line element
   * @param assetsPath Path to assets
   * @param parentElement SVG parent element (a tab line element in this case)
   */
  constructor(
    tabWindow: TabWindow,
    barElement: BarElement,
    tleOffset: Point,
    assetsPath: string,
    parentElement: SVGGElement
  ) {
    this._tabWindow = tabWindow;
    this._barElement = barElement;
    this._tleOffset = tleOffset;
    this._assetsPath = assetsPath;
    this._parentElement = parentElement;

    this._renderedBeatElements = new Map();
    this._renderedTupletElements = new Map();
  }

  /**
   * Renders the group element which will contain all the
   * data about the bar
   */
  private renderGroup(): void {
    if (this._groupSVG !== undefined) {
      return;
    }

    const beatUUID = this._barElement.bar.uuid;
    this._groupSVG = createSVGG();
    this._groupSVG.setAttribute("id", `bar-${beatUUID}`);
    this._parentElement.appendChild(this._groupSVG);
  }

  /**
   * Render bar staff lines
   * @param barOffset Global offset of the bar
   */
  private renderBarStaffLines(barOffset: Point): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render bar staff when SVG group undefined");
    }

    const barUUID = this._barElement.bar.uuid;
    if (this._barStaffLinesSVG === undefined) {
      this._barStaffLinesSVG = [];
      for (let i = 0; i < this._barElement.staffLines.length; i++) {
        this._barStaffLinesSVG.push(createSVGLine());

        // Set id
        const id = `bar-staff-${barUUID}-${i}`;
        this._barStaffLinesSVG[i].setAttribute("id", id);

        // Add element to root SVG element
        this._groupSVG.appendChild(this._barStaffLinesSVG[i]);
      }
    }

    const strokeColor = this._barElement.durationsFit ? "black" : "red";
    for (let i = 0; i < this._barElement.staffLines.length; i++) {
      const line = this._barElement.staffLines[i];

      const x1 = `${barOffset.x + line[0].x}`;
      const y1 = `${barOffset.y + line[0].y}`;
      const x2 = `${barOffset.x + line[1].x}`;
      const y2 = `${barOffset.y + line[1].y}`;
      this._barStaffLinesSVG[i].setAttribute("x1", x1);
      this._barStaffLinesSVG[i].setAttribute("y1", y1);
      this._barStaffLinesSVG[i].setAttribute("x2", x2);
      this._barStaffLinesSVG[i].setAttribute("y2", y2);
      this._barStaffLinesSVG[i].setAttribute("stroke", strokeColor);
    }
  }

  /**
   * Unrender all bar staff lines
   */
  private unrenderBarStaffLines(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender bar staff when SVG group undefined");
    }

    if (this._barStaffLinesSVG === undefined) {
      return;
    }

    for (let i = 0; i < this._barElement.staffLines.length; i++) {
      this._groupSVG.removeChild(this._barStaffLinesSVG[i]);
    }
    this._barStaffLinesSVG = undefined;
  }

  /**
   * Render bar border lines (left and right)
   * @param barOffset Global offset of the bar
   */
  private renderBarBorderLines(barOffset: Point): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render bar borders when SVG group undefined");
    }

    const barUUID = this._barElement.bar.uuid;
    if (this._barBorderLinesSVG === undefined) {
      this._barBorderLinesSVG = [createSVGLine(), createSVGLine()];

      // Set only-set-once attributes
      this._barBorderLinesSVG[0].setAttribute("stroke", "black");
      this._barBorderLinesSVG[1].setAttribute("stroke", "black");

      // Set id
      this._barBorderLinesSVG[0].setAttribute("id", `bar-border-${barUUID}-0`);
      this._barBorderLinesSVG[1].setAttribute("id", `bar-border-${barUUID}-1`);

      // Add elements to root SVG element
      this._groupSVG.appendChild(this._barBorderLinesSVG[0]);
      this._groupSVG.appendChild(this._barBorderLinesSVG[1]);
    }

    const leftX1 = `${barOffset.x + this._barElement.barLeftBorderLine[0].x}`;
    const leftY1 = `${barOffset.y + this._barElement.barLeftBorderLine[0].y}`;
    const leftX2 = `${barOffset.x + this._barElement.barLeftBorderLine[1].x}`;
    const leftY2 = `${barOffset.y + this._barElement.barLeftBorderLine[1].y}`;
    this._barBorderLinesSVG[0].setAttribute("x1", leftX1);
    this._barBorderLinesSVG[0].setAttribute("y1", leftY1);
    this._barBorderLinesSVG[0].setAttribute("x2", leftX2);
    this._barBorderLinesSVG[0].setAttribute("y2", leftY2);

    const rightX1 = `${barOffset.x + this._barElement.barRightBorderLine[0].x}`;
    const rightY1 = `${barOffset.y + this._barElement.barRightBorderLine[0].y}`;
    const rightX2 = `${barOffset.x + this._barElement.barRightBorderLine[1].x}`;
    const rightY2 = `${barOffset.y + this._barElement.barRightBorderLine[1].y}`;
    this._barBorderLinesSVG[1].setAttribute("x1", rightX1);
    this._barBorderLinesSVG[1].setAttribute("y1", rightY1);
    this._barBorderLinesSVG[1].setAttribute("x2", rightX2);
    this._barBorderLinesSVG[1].setAttribute("y2", rightY2);
  }

  /**
   * Unrender all bar border lines
   */
  private unrenderBarBorderLines(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender bar borders when SVG group undefined");
    }

    if (this._barBorderLinesSVG === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._barBorderLinesSVG[0]);
    this._groupSVG.removeChild(this._barBorderLinesSVG[1]);
    this._barBorderLinesSVG = undefined;
  }

  /**
   * Render bar's repeat sign
   * @param barOffset Global offset of the bar
   */
  private renderBarRepeat(barOffset: Point): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render bar sig when SVG group undefined");
    }

    if (this._barElement.bar.repeatStatus === BarRepeatStatus.None) {
      return;
    }

    const barUUID = this._barElement.bar.uuid;
    if (this._barRepeatSign === undefined) {
      this._barRepeatSign = createSVGImage();

      // Set id
      this._barRepeatSign.setAttribute("id", `bar-repeat-${barUUID}`);
      this._barRepeatSign.setAttribute("preserveAspectRatio", "none");

      // Add elements to root SVG element
      this._groupSVG.appendChild(this._barRepeatSign);
    }

    // Holy shit this is scuffed. Refactor is unconditional
    let x: string;
    if (this._barElement.bar.repeatStatus === BarRepeatStatus.Start) {
      x = `${barOffset.x + this._barElement.repeatRect.x}`;
    } else {
      x = `${
        barOffset.x +
        this._barElement.repeatRect.right -
        this._barElement.dim.repeatSignWidth
      }`;
    }
    const y = `${barOffset.y + this._barElement.repeatRect.y}`;
    // const width = `${this._barElement.repeatRect.width}`;
    const width = `${this._barElement.dim.repeatSignWidth}`;
    const height = `${this._barElement.repeatRect.height}`;
    const href =
      this._barElement.bar.repeatStatus === BarRepeatStatus.Start
        ? `${this._assetsPath}/img/ui/repeat-start-applied_.svg`
        : `${this._assetsPath}/img/ui/repeat-end-applied_.svg`;
    this._barRepeatSign.setAttribute("x", x);
    this._barRepeatSign.setAttribute("y", y);
    this._barRepeatSign.setAttribute("width", width);
    this._barRepeatSign.setAttribute("height", height);
    this._barRepeatSign.setAttribute("href", href);
  }

  /**
   * Unrender all bar repeat sign
   */
  private unrenderBarRepeat(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender bar sig when SVG group undefined");
    }

    if (this._barRepeatSign === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._barRepeatSign);
    this._barRepeatSign = undefined;
  }

  /**
   * Render bar time signature info
   * @param barOffset Global offset of the bar
   */
  private renderBarSig(barOffset: Point): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render bar sig when SVG group undefined");
    }

    if (!this._barElement.showSignature) {
      return;
    }

    const barUUID = this._barElement.bar.uuid;
    if (this._barSigSVG === undefined) {
      this._barSigSVG = [createSVGText(), createSVGText()];

      // Set only-set-once attributes
      const fontSize = `${this._tabWindow.dim.timeSigTextSize}`;
      this._barSigSVG[0].setAttribute("text-anchor", "middle");
      this._barSigSVG[0].setAttribute("font-size", fontSize);
      this._barSigSVG[1].setAttribute("text-anchor", "middle");
      this._barSigSVG[1].setAttribute("font-size", fontSize);

      // Set id
      this._barSigSVG[0].setAttribute("id", `bar-sig-${barUUID}-0`);
      this._barSigSVG[1].setAttribute("id", `bar-sig-${barUUID}-1`);

      // Add elements to root SVG element
      this._groupSVG.appendChild(this._barSigSVG[0]);
      this._groupSVG.appendChild(this._barSigSVG[1]);
    }

    const topX = `${barOffset.x + this._barElement.beatsTextCoords.x}`;
    const topY = `${barOffset.y + this._barElement.beatsTextCoords.y}`;
    this._barSigSVG[0].setAttribute("x", topX);
    this._barSigSVG[0].setAttribute("y", topY);
    this._barSigSVG[0].textContent = `${this._barElement.bar.beatsCount}`;

    const bottomX = `${barOffset.x + this._barElement.measureTextCoords.x}`;
    const bottomY = `${barOffset.y + this._barElement.measureTextCoords.y}`;
    this._barSigSVG[1].setAttribute("x", bottomX);
    this._barSigSVG[1].setAttribute("y", bottomY);
    this._barSigSVG[1].textContent = `${1 / this._barElement.bar.duration}`;
  }

  /**
   * Unrender all bar sig info
   */
  private unrenderBarSig(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender bar sig when SVG group undefined");
    }

    if (this._barSigSVG === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._barSigSVG[0]);
    this._groupSVG.removeChild(this._barSigSVG[1]);
    this._barSigSVG = undefined;
  }

  /**
   * Render bar tempo image
   * @param barOffset Global offset of the bar
   */
  private renderBarTempoImage(barOffset: Point): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render bar tempo img when SVG group undefined");
    }

    if (!this._barElement.showTempo) {
      return;
    }

    const barUUID = this._barElement.bar.uuid;
    if (this._barTempoImageSVG === undefined) {
      this._barTempoImageSVG = createSVGImage();

      // Set only-set-once attributes
      const href = `${this._assetsPath}/img/notes/4.svg`;
      this._barTempoImageSVG.setAttribute("href", href);

      // Set id
      this._barTempoImageSVG.setAttribute("id", `bar-tempo-${barUUID}-image`);

      // Add elements to root SVG element
      this._groupSVG.appendChild(this._barTempoImageSVG);
    }

    const imageX = `${barOffset.x + this._barElement.tempoImageRect.x}`;
    const imageY = `${barOffset.y + this._barElement.tempoImageRect.y}`;
    const imageWidth = `${this._barElement.tempoImageRect.width}`;
    const imageHeight = `${this._barElement.tempoImageRect.height}`;
    this._barTempoImageSVG.setAttribute("x", imageX);
    this._barTempoImageSVG.setAttribute("y", imageY);
    this._barTempoImageSVG.setAttribute("width", imageWidth);
    this._barTempoImageSVG.setAttribute("height", imageHeight);
  }

  /**
   * Unrender bar tempo image
   */
  private unrenderBarTempoImage(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender bar tempo img when SVG group undefined");
    }

    if (this._barTempoImageSVG === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._barTempoImageSVG);
    this._barTempoImageSVG = undefined;
  }

  /**
   * Render bar tempo text
   * @param barOffset Global offset of the bar
   */
  private renderBarTempoText(barOffset: Point): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render bar tempo text when SVG group undefined");
    }

    if (!this._barElement.showTempo) {
      return;
    }

    const barUUID = this._barElement.bar.uuid;
    if (this._barTempoTextSVG === undefined) {
      this._barTempoTextSVG = createSVGText();

      // Set only-set-once attributes
      const fontSize = `${this._tabWindow.dim.tempoTextSize}`;
      this._barTempoTextSVG.setAttribute("text-anchor", "start");
      this._barTempoTextSVG.setAttribute("font-size", fontSize);

      // Set id
      this._barTempoTextSVG.setAttribute("id", `bar-tempo-${barUUID}-text`);

      // Add elements to root SVG element
      this._groupSVG.appendChild(this._barTempoTextSVG);
    }

    const textX = `${barOffset.x + this._barElement.tempoTextCoords.x}`;
    const textY = `${barOffset.y + this._barElement.tempoTextCoords.y}`;
    this._barTempoTextSVG.setAttribute("x", textX);
    this._barTempoTextSVG.setAttribute("y", textY);
    this._barTempoTextSVG.textContent = `= ${this._barElement.bar.tempo}`;
  }

  /**
   * Unrender bar tempo image
   */
  private unrenderBarTempoText(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender bar tempo text when SVG group undefined");
    }

    if (this._barTempoTextSVG === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._barTempoTextSVG);
    this._barTempoTextSVG = undefined;
  }

  /**
   * Render bar tempo image
   * @param barOffset Global offset of the bar
   */
  private renderBarBeamSegments(barOffset: Point): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render bar tempo img when SVG group undefined");
    }

    // TODO: Structure beam segment rendering the same way
    // other child element renders work (i.e. bar's beats rendering).
    // But for now this will do
    this.unrenderBarBeamSegments();

    if (this._barElement.beamSegments.length === 0) {
      return;
    }

    const barUUID = this._barElement.bar.uuid;
    if (this._barBeamsSegmentsSVG === undefined) {
      this._barBeamsSegmentsSVG = [];
      for (let i = 0; i < this._barElement.beamSegments.length; i++) {
        const curBeamSegment = this._barElement.beamSegments[i];
        const curBeamSegmentLongSVG = createSVGImage();

        // Set id
        curBeamSegmentLongSVG.setAttribute(
          "id",
          `bar-beam-${i}-${barUUID}-long`
        );
        curBeamSegmentLongSVG.setAttribute("preserveAspectRatio", "none");

        // Add elements to root SVG element
        // this._barBeamsSegmentsSVG.push(curBeamSegmentLongSVG);
        this._groupSVG.appendChild(curBeamSegmentLongSVG);

        if (curBeamSegment.shortRect === undefined) {
          this._barBeamsSegmentsSVG.push({ longSVG: curBeamSegmentLongSVG });
          continue;
        }

        const curBeamSegmentShortSVG = createSVGImage();

        // Set id
        curBeamSegmentShortSVG.setAttribute(
          "id",
          `bar-beam-${i}-${barUUID}-short`
        );
        curBeamSegmentShortSVG.setAttribute("preserveAspectRatio", "none");

        // Add elements to root SVG element
        this._barBeamsSegmentsSVG.push({
          longSVG: curBeamSegmentLongSVG,
          shortSVG: curBeamSegmentShortSVG,
        });
        this._groupSVG.appendChild(curBeamSegmentShortSVG);
      }
    }

    for (let i = 0; i < this._barBeamsSegmentsSVG.length; i++) {
      const curBeamSegment = this._barElement.beamSegments[i];
      const curBeamSegmentSVG = this._barBeamsSegmentsSVG[i];

      const longBeamX = `${barOffset.x + curBeamSegment.longRect.x}`;
      const longBeamY = `${barOffset.y + curBeamSegment.longRect.y}`;
      const longBeamWidth = `${curBeamSegment.longRect.width}`;
      const longBeamHeight = `${curBeamSegment.longRect.height}`;
      // let href = `${this._assetsPath}/img/notes/8-beam.svg`;
      let longHref;
      if (curBeamSegment.shortRect === undefined) {
        longHref = `${this._assetsPath}/img/notes/${
          1 / curBeamSegment.curBeatElement.beat.duration
        }-beam.svg`;
      } else {
        longHref = `${this._assetsPath}/img/notes/${
          1 / curBeamSegment.nextBeatElement.beat.duration
        }-beam.svg`;
      }
      curBeamSegmentSVG.longSVG.setAttribute("x", longBeamX);
      curBeamSegmentSVG.longSVG.setAttribute("y", longBeamY);
      curBeamSegmentSVG.longSVG.setAttribute("width", longBeamWidth);
      curBeamSegmentSVG.longSVG.setAttribute("height", longBeamHeight);
      curBeamSegmentSVG.longSVG.setAttribute("href", longHref);

      if (
        curBeamSegment.shortRect === undefined ||
        curBeamSegmentSVG.shortSVG === undefined
      ) {
        continue;
      }

      const shortBeamX = `${barOffset.x + curBeamSegment.shortRect.x}`;
      const shortBeamY = `${barOffset.y + curBeamSegment.shortRect.y}`;
      const shortBeamWidth = `${curBeamSegment.shortRect.width}`;
      const shortBeamHeight = `${curBeamSegment.shortRect.height}`;
      const shortHref = `${this._assetsPath}/img/notes/${
        1 / curBeamSegment.curBeatElement.beat.duration
      }-beam.svg`;
      curBeamSegmentSVG.shortSVG.setAttribute("x", shortBeamX);
      curBeamSegmentSVG.shortSVG.setAttribute("y", shortBeamY);
      curBeamSegmentSVG.shortSVG.setAttribute("width", shortBeamWidth);
      curBeamSegmentSVG.shortSVG.setAttribute("height", shortBeamHeight);
      curBeamSegmentSVG.shortSVG.setAttribute("href", shortHref);
    }
  }

  /**
   * Unrender bar tempo image
   */
  private unrenderBarBeamSegments(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender bar tempo img when SVG group undefined");
    }

    if (this._barBeamsSegmentsSVG === undefined) {
      return;
    }

    for (let i = 0; i < this._barBeamsSegmentsSVG.length; i++) {
      const longSVG = this._barBeamsSegmentsSVG[i].longSVG;
      const shortSVG = this._barBeamsSegmentsSVG[i].shortSVG;
      this._groupSVG.removeChild(longSVG);
      if (shortSVG === undefined) {
        continue;
      }
      this._groupSVG.removeChild(shortSVG);
    }

    this._barBeamsSegmentsSVG = undefined;
  }

  private renderTuplets(
    barOffset: Point
  ): (SVGTupletRenderer | SVGTupletSegmentRenderer)[] {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render tuplets when SVG group undefined");
    }

    const activeRenderers: (SVGTupletRenderer | SVGTupletSegmentRenderer)[] =
      [];

    // Check if there are any beat elements to remove
    const curTupletGroupUUIDs = new Set(
      this._barElement.tupletElements.map((b) => b.tupletGroup.uuid)
    );
    for (const [uuid, renderer] of this._renderedTupletElements) {
      if (!curTupletGroupUUIDs.has(uuid)) {
        renderer.unrender();
        this._renderedTupletElements.delete(uuid);
      }
    }

    // Add & render new beat elements AND re-render existing beats
    for (const tupletElement of this._barElement.tupletElements) {
      const renderedTuplet = this._renderedTupletElements.get(
        tupletElement.tupletGroup.uuid
      );
      if (renderedTuplet === undefined) {
        const renderer = new SVGTupletRenderer(
          this._tabWindow,
          tupletElement,
          barOffset,
          this._assetsPath,
          this._groupSVG
        );
        activeRenderers.push(renderer);
        activeRenderers.push(...renderer.render());
        this._renderedTupletElements.set(
          tupletElement.tupletGroup.uuid,
          renderer
        );
      } else {
        activeRenderers.push(renderedTuplet);
        activeRenderers.push(...renderedTuplet.render(barOffset));
      }
    }
    return activeRenderers;
  }

  private unrenderTuplets(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender tuplets when SVG group undefined");
    }

    for (const [uuid, renderer] of this._renderedTupletElements) {
      renderer.unrender();
      this._renderedTupletElements.delete(uuid);
    }
  }

  private renderSelectionStartGap(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render selection gap when SVG group undefined");
    }

    const barUUID = this._barElement.bar.uuid;
    if (this._barSelectionStartGapRect === undefined) {
      this._barSelectionStartGapRect = createSVGRect();

      // Set only-set-once attributes
      this._barSelectionStartGapRect.setAttribute("fill", "gray");
      this._barSelectionStartGapRect.setAttribute("fill-opacity", "0.25");
      this._barSelectionStartGapRect.setAttribute("pointer-events", "none");

      // Set id
      this._barSelectionStartGapRect.setAttribute(
        "id",
        `bar-sel-gap-${barUUID}`
      );

      // Add element to group SVG element
      this._groupSVG.appendChild(this._barSelectionStartGapRect);
    }

    const x = `${this._tleOffset.x + this._barElement.rect.x}`;
    const y = `${this._tleOffset.y + this._barElement.rect.y}`;
    const width = `${this._barElement.beatElements[0].rect.x}`;
    const height = `${this._barElement.beatElements[0].rect.height}`;
    this._barSelectionStartGapRect.setAttribute("x", x);
    this._barSelectionStartGapRect.setAttribute("y", y);
    this._barSelectionStartGapRect.setAttribute("width", width);
    this._barSelectionStartGapRect.setAttribute("height", height);
  }

  private unrenderSelectionStartGap(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender selection gap when SVG group undefined");
    }

    if (this._barSelectionStartGapRect === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._barSelectionStartGapRect);
    this._barSelectionStartGapRect = undefined;
  }

  private renderSelectionEndGap(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render selection gap when SVG group undefined");
    }

    const barUUID = this._barElement.bar.uuid;
    if (this._barSelectionEndGapRect === undefined) {
      this._barSelectionEndGapRect = createSVGRect();

      // Set only-set-once attributes
      this._barSelectionEndGapRect.setAttribute("fill", "gray");
      this._barSelectionEndGapRect.setAttribute("fill-opacity", "0.25");
      this._barSelectionEndGapRect.setAttribute("pointer-events", "none");

      // Set id
      this._barSelectionEndGapRect.setAttribute("id", `bar-sel-gap-${barUUID}`);

      // Add element to group SVG element
      this._groupSVG.appendChild(this._barSelectionEndGapRect);
    }

    const x = `${
      this._tleOffset.x +
      this._barElement.rect.x +
      this._barElement.repeatRect.x
    }`;
    const y = `${this._tleOffset.y + this._barElement.rect.y}`;
    const width = `${this._barElement.repeatRect.width}`;
    const height = `${this._barElement.beatElements[0].rect.height}`;
    this._barSelectionEndGapRect.setAttribute("x", x);
    this._barSelectionEndGapRect.setAttribute("y", y);
    this._barSelectionEndGapRect.setAttribute("width", width);
    this._barSelectionEndGapRect.setAttribute("height", height);
  }

  private unrenderSelectionEndGap(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender selection gap when SVG group undefined");
    }

    if (this._barSelectionEndGapRect === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._barSelectionEndGapRect);
    this._barSelectionEndGapRect = undefined;
  }

  /**
   * Render bar element
   * @param newTLEOffset New optinal tab line element offset
   */
  public renderBarElement(
    newTLEOffset?: Point
  ): (SVGBeatRenderer | SVGNoteRenderer)[] {
    this.renderGroup();

    if (this._groupSVG === undefined) {
      throw Error("Bar group SVG undefined after render group call");
    }

    // Calc offset for every element inside this bar
    if (newTLEOffset !== undefined) {
      this._tleOffset = new Point(newTLEOffset.x, newTLEOffset.y);
    }
    const barOffset = new Point(this._barElement.rect.x, this._tleOffset.y);

    // Render bar stuff
    this.renderBarStaffLines(barOffset);
    this.renderBarBorderLines(barOffset);
    if (this._barElement.showSignature) {
      this.renderBarSig(barOffset);
    } else {
      this.unrenderBarSig();
    }
    if (this._barElement.bar.repeatStatus !== BarRepeatStatus.None) {
      this.renderBarRepeat(barOffset);
    } else {
      this.unrenderBarRepeat();
    }
    this.renderBarTempoImage(barOffset);
    this.renderBarTempoText(barOffset);
    this.renderBarBeamSegments(barOffset);
    this.renderTuplets(barOffset);

    const activeRenderers: (SVGBeatRenderer | SVGNoteRenderer)[] = [];

    // Time sig and/or repeat start => render gap at the start
    if (
      this._barElement.beatElements.length !== 0 &&
      this._barElement.beatElements[0].rect.x !== 0 &&
      this._barElement.beatElements[0].selected
    ) {
      this.renderSelectionStartGap();
    } else {
      this.unrenderSelectionStartGap();
    }

    // Time sig and/or repeat start => render gap at the start
    if (
      this._barElement.bar.repeatStatus === BarRepeatStatus.End &&
      this._barElement.beatElements[this._barElement.beatElements.length - 1]
        .selected
    ) {
      this.renderSelectionEndGap();
    } else {
      this.unrenderSelectionEndGap();
    }

    // Check if there are any beat elements to remove
    const curBeatElementUUIDs = new Set(
      this._barElement.beatElements.map((b) => b.beat.uuid)
    );
    for (const [uuid, renderer] of this._renderedBeatElements) {
      if (!curBeatElementUUIDs.has(uuid)) {
        renderer.unrender();
        this._renderedBeatElements.delete(uuid);
      }
    }

    // Add & render new beat elements AND re-render existing beats
    for (const beatElement of this._barElement.beatElements) {
      const renderedBeat = this._renderedBeatElements.get(
        beatElement.beat.uuid
      );
      if (renderedBeat === undefined) {
        const renderer = new SVGBeatRenderer(
          this._tabWindow,
          beatElement,
          barOffset,
          this._assetsPath,
          this._groupSVG
        );
        activeRenderers.push(renderer);
        activeRenderers.push(...renderer.renderBeatElement());
        this._renderedBeatElements.set(beatElement.beat.uuid, renderer);
      } else {
        activeRenderers.push(renderedBeat);
        activeRenderers.push(...renderedBeat.renderBeatElement(barOffset));
      }
    }
    return activeRenderers;
  }

  /**
   * Unrender all bar element's DOM elements
   */
  public unrender(): void {
    for (const [uuid, renderer] of this._renderedBeatElements) {
      renderer.unrender();
      this._renderedBeatElements.delete(uuid);
    }

    this.unrenderBarStaffLines();
    this.unrenderBarBorderLines();
    this.unrenderBarSig();
    this.unrenderBarTempoImage();
    this.unrenderBarTempoText();
    this.unrenderBarBeamSegments();
    this.unrenderTuplets();
  }

  public get beatRenderers(): SVGBeatRenderer[] {
    return this._renderedBeatElements.values().toArray();
  }
}
