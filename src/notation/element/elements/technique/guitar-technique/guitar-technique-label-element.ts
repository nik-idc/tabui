import {
  BendType,
  GuitarTechnique,
  GuitarTechniqueType,
  Technique,
} from "@/notation/model";
import { Rect, getPitchRatioNums, randomInt } from "@/shared";
import { BeatElement } from "../../beat-element";
import { SVGUtils } from "./guitar-technique-html";
import { TabLayoutDimensions } from "@/notation/element/tab-controller-dim";
import { TechniqueLabelElement } from "../technique-label-element";

/**
 * Class that contains a guitar technique label
 */
export class GuitarTechniqueLabelElement implements TechniqueLabelElement {
  /** Technique label element's unique identifier */
  readonly uuid: number;
  /** Technique */
  readonly technique: GuitarTechnique;
  /** Parent beat element */
  readonly beatElement: BeatElement;

  /** Outer rectangle */
  private _rect: Rect;
  /** SVG path */
  private _svgPath?: string;

  /**
   * Class that contains an technique label
   */
  constructor(technique: GuitarTechnique, beatElement: BeatElement) {
    this.uuid = randomInt();
    this.technique = technique;
    this.beatElement = beatElement;

    this._rect = new Rect();

    this.calc();
  }

  /**
   * Generates bend pitch HTML
   */
  private bendPitchHTML(): void {
    if (this.technique.bendOptions === null) {
      throw Error("Can't do bend label element - no bend options");
    }
    if (this.technique.bendOptions.bendPitch === undefined) {
      throw Error("Can't do bend label element - bend pitch null");
    }

    const nums = getPitchRatioNums(this.technique.bendOptions.bendPitch);
    const bigNumSize = TabLayoutDimensions.NOTE_TEXT_SIZE;
    const x = this._rect.x + this._rect.width - bigNumSize / 2;
    const y = this._rect.y + this._rect.height / 2 - bigNumSize / 2;

    if ([1, 2, 3].includes(nums[0]) && nums[1] === 0) {
      let text: string;
      switch (nums[0]) {
        case 1:
          text = "full";
          break;
        case 2:
          text = "2";
          break;
        case 3:
          text = "3";
          break;
        default:
          text = "full";
          break;
      }
      this._svgPath = SVGUtils.textSVGHTML(
        x,
        y,
        TabLayoutDimensions.NOTE_TEXT_SIZE,
        text
      );
      return;
    }

    this._svgPath = SVGUtils.ratioSVGHTML(
      nums[0],
      nums[1],
      nums[2],
      x,
      y,
      bigNumSize
    );
  }

  /**
   * Generates prebend pitch HTML
   */
  private prebendPitchHTML(): void {
    if (this.technique.bendOptions === null) {
      throw Error("Can't do prebend label element - no bend options");
    }
    if (this.technique.bendOptions.prebendPitch === undefined) {
      throw Error("Can't do prebend label element - prebend pitch null");
    }

    const nums = getPitchRatioNums(this.technique.bendOptions.prebendPitch);

    const bigNumSize = TabLayoutDimensions.NOTE_TEXT_SIZE;
    const x = this._rect.x + this._rect.width / 2;
    const y = this._rect.y + this._rect.height / 2 - bigNumSize / 2;
    this._svgPath = SVGUtils.ratioSVGHTML(
      nums[0],
      nums[1],
      nums[2],
      x,
      y,
      bigNumSize
    );
  }

  /**
   * Generates bend-and-release pitch HTML
   */
  private bendAndReleasePitchHTML(): void {
    if (this.technique.bendOptions === null) {
      throw Error(
        "Attempting to do bend & release label when bend options null"
      );
    }
    if (
      this.technique.bendOptions.bendPitch === undefined ||
      this.technique.bendOptions.releasePitch === undefined
    ) {
      throw Error(
        "Attempting to do bend & release label when bend/release values undefined"
      );
    }

    if (
      this.technique.bendOptions.bendPitch ===
      this.technique.bendOptions.releasePitch
    ) {
      this.bendPitchHTML();
      return;
    }

    const bigNumSize = TabLayoutDimensions.NOTE_TEXT_SIZE;
    const xBend = this._rect.x + this._rect.width - bigNumSize;
    const xRelease = xBend + bigNumSize * 1.5;
    const y =
      this._rect.y +
      this._rect.height / 2 -
      TabLayoutDimensions.NOTE_TEXT_SIZE / 2;

    const bendNums = getPitchRatioNums(this.technique.bendOptions.bendPitch);
    const bendHTML = SVGUtils.ratioSVGHTML(
      bendNums[0],
      bendNums[1],
      bendNums[2],
      xBend,
      y,
      bigNumSize
    );

    const releaseNums = getPitchRatioNums(
      this.technique.bendOptions.releasePitch
    );
    const releaseHTML = SVGUtils.ratioSVGHTML(
      releaseNums[0],
      releaseNums[1],
      releaseNums[2],
      xRelease,
      y,
      bigNumSize
    );

    this._svgPath = bendHTML + releaseHTML;
  }

  /**
   * Generates prebend-and-release pitch HTMLА
   */
  private prebendAndReleasePitchHTML(): void {
    if (this.technique.bendOptions === null) {
      throw Error(
        "Attempting to do prebend & release label when bend options null"
      );
    }
    if (
      this.technique.bendOptions.prebendPitch === undefined ||
      this.technique.bendOptions.releasePitch === undefined
    ) {
      throw Error(
        "Attempting to do prebend & release label when prebend/release values undefined"
      );
    }

    if (
      this.technique.bendOptions.prebendPitch ===
      this.technique.bendOptions.releasePitch
    ) {
      this.prebendPitchHTML();
      return;
    }

    const bigNumSize = TabLayoutDimensions.NOTE_TEXT_SIZE;
    const xPrebend = this._rect.x + this._rect.width / 2 + bigNumSize / 4;
    const xRelease = xPrebend + bigNumSize * 1.5;
    const y =
      this._rect.y +
      this._rect.height / 2 -
      TabLayoutDimensions.NOTE_TEXT_SIZE / 2;

    const prebendNums = getPitchRatioNums(
      this.technique.bendOptions.prebendPitch
    );
    const prebendHTML = SVGUtils.ratioSVGHTML(
      prebendNums[0],
      prebendNums[1],
      prebendNums[2],
      xPrebend,
      y,
      bigNumSize
    );

    const releaseNums = getPitchRatioNums(
      this.technique.bendOptions.releasePitch
    );
    const releaseHTML = SVGUtils.ratioSVGHTML(
      releaseNums[0],
      releaseNums[1],
      releaseNums[2],
      xRelease,
      y,
      bigNumSize
    );

    this._svgPath = prebendHTML + releaseHTML;
  }

  /**
   * Generates regular vibrato HTML
   */
  private vibratoHTML(): void {
    const x = this._rect.x + this._rect.width / 2 - this._rect.width / 4;
    const y = this._rect.y + this._rect.height / 2;
    const vibratoHeight = this.rect.height / 6;
    const vibratoWidth = this.rect.width / 2;
    this._svgPath = SVGUtils.horizontalSquigglySVGHTML(
      x,
      y,
      vibratoHeight,
      vibratoWidth
    );
  }

  /**
   * Generates Palm Mute HTML
   */
  private palmMuteHTML(): void {
    const x =
      this._rect.x + this._rect.width / 2 - TabLayoutDimensions.NOTE_TEXT_SIZE;
    const y = this._rect.y + this._rect.height / 2;
    this._svgPath = SVGUtils.textSVGHTML(
      x,
      y,
      TabLayoutDimensions.NOTE_TEXT_SIZE,
      "P.M."
    );
  }

  /**
   * Figures out which bend type label to generate
   */
  private calcBendLabel(): void {
    if (this.technique.bendOptions === null) {
      throw Error(
        "Attempting to do prebend & release label when bend options null"
      );
    }

    switch (this.technique.bendOptions.type) {
      case BendType.Bend:
        this.bendPitchHTML();
        break;
      case BendType.Prebend:
        this.prebendPitchHTML();
        break;
      case BendType.BendAndRelease:
        this.bendAndReleasePitchHTML();
        break;
      case BendType.PrebendAndRelease:
        this.prebendAndReleasePitchHTML();
        break;
      default:
        break;
    }
  }

  /**
   * Calc technique label element
   */
  public calc(): void {
    this._rect = new Rect(
      this.beatElement.rect.x,
      this.beatElement.rect.y,
      this.beatElement.techniqueLabelsRect.width,
      this.beatElement.techniqueLabelsRect.height
    );

    switch (this.technique.type) {
      case GuitarTechniqueType.Bend:
        this.calcBendLabel();
        break;
      case GuitarTechniqueType.Vibrato:
        this.vibratoHTML();
        break;
      case GuitarTechniqueType.PalmMute:
        this.palmMuteHTML();
        break;
      default:
        break;
    }
  }

  /**
   * Scales the label horizontally
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number): void {
    this._rect.x *= scale;
    this._rect.width *= scale;

    this.calc();
  }

  /**
   * Outer rectangle
   */
  public get rect(): Rect {
    return this._rect;
  }

  /**
   * SVG path (full path HTML including styling, i.e. transparent/non-transparent)
   */
  public get svgPath(): string | undefined {
    return this._svgPath;
  }
}
