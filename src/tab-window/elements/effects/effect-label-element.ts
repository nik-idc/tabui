import { GuitarEffect } from "../../../models/guitar-effect/guitar-effect";
import { EFFECT_TYPE_TO_SCOPE } from "../../../models/guitar-effect/guitar-effect-lists";
import { GuitarEffectScope } from "../../../models/guitar-effect/guitar-effect-scope";
import { GuitarEffectType } from "../../../models/guitar-effect/guitar-effect-type";
import { Point } from "../../shapes/point";
import { Rect } from "../../shapes/rect";
import { TabWindowDim } from "../../tab-window-dim";

/**
 * Class that contains an effect label
 */
export class EffectLabelElement {
  readonly dim: TabWindowDim;
  private _rect: Rect;
  readonly effect: GuitarEffect;
  /**
   * SVG path (full path HTML including styling,
   * i.e. transparent/non-transparent)
   */
  private _fullHTML?: string;

  constructor(dim: TabWindowDim, rect: Rect, effect: GuitarEffect) {
    this.dim = dim;
    this._rect = new Rect(rect.x, rect.y, rect.width, rect.height);
    this.effect = effect;

    this.calc();
  }

  private getPitchRatioNums(pitch: number): number[] {
    const wholePart = Math.floor(pitch);
    const remainder = pitch - wholePart;
    let topNum = (remainder * 100) / 25;
    let bottomNum = 4;

    if (topNum % 2 === 0 && bottomNum % 2 === 0) {
      topNum /= 2;
      bottomNum /= 2;
    }

    return [wholePart, topNum, bottomNum];
  }

  private ratioHTML(
    wholePart: number,
    topNum: number,
    bottomNum: number,
    x: number,
    y: number,
    bigNumSize: number
  ): string {
    const numSize = bigNumSize / 2;

    let wholePartX = 0;
    let wholePartY = 0;
    let wholePartHTML: string;
    if (wholePart !== 0) {
      // wholePartX = this._rect.x + this._rect.width - numSize;
      wholePartX = x;
      // wholePartY = this._rect.y + numSize / 2;
      wholePartY = y;
      wholePartHTML = `<text x="${wholePartX}"
                             y="${wholePartY}"
                             font-size="${bigNumSize}"
                             text-anchor="start"
                             dominant-baseline="hanging"
                             fill="black">
                              ${wholePart}
                        </text>`;
    }

    const topNumX =
      wholePartX === 0 ? x + bigNumSize / 2 : wholePartX + bigNumSize / 2;
    // const topNumY = this._rect.y;
    const topNumY = y;
    const bottomNumX = topNumX + numSize;
    // const bottomNumY = this._rect.y + this.dim.effectLabelHeight / 2;
    const bottomNumY = y + bigNumSize / 2;
    const lineX1 = topNumX;
    // const lineY1 = bottomNumY + numSize / 2;
    const lineY1 = y + bigNumSize;
    const lineX2 = bottomNumX + numSize / 2;
    // const lineY2 = topNumY;
    const lineY2 = y;

    const ratioHTML = `<text x="${topNumX}"
                             y="${topNumY}"
                             font-size="${numSize}"
                             text-anchor="start"
                             dominant-baseline="hanging"
                             fill="black">
                               ${topNum}
                       </text>
                       <line x1="${lineX1}"
                             y1="${lineY1}"
                             x2="${lineX2}"
                             y2="${lineY2}"
                             stroke="black"/>
                       <text x="${bottomNumX}"
                             y="${bottomNumY}"
                             font-size="${numSize}"
                             text-anchor="start"
                             dominant-baseline="hanging"
                             fill="black">
                               ${bottomNum}
                       </text>`;

    return wholePartHTML + ratioHTML;
  }

  private bendPitchHTML(): void {
    const nums = this.getPitchRatioNums(this.effect.options.bendPitch);

    const bigNumSize = this.dim.noteTextSize;
    const x = this._rect.x + this._rect.width - bigNumSize / 2;
    const y = this._rect.y + this._rect.height / 2 - bigNumSize / 2;
    this._fullHTML = this.ratioHTML(
      nums[0],
      nums[1],
      nums[2],
      x,
      y,
      bigNumSize
    );
  }

  private prebendPitchHTML(): void {
    const nums = this.getPitchRatioNums(this.effect.options.prebendPitch);

    const bigNumSize = this.dim.noteTextSize;
    const x = this._rect.x + this._rect.width / 2;
    const y = this._rect.y + this._rect.height / 2 - bigNumSize / 2;
    this._fullHTML = this.ratioHTML(
      nums[0],
      nums[1],
      nums[2],
      x,
      y,
      bigNumSize
    );
  }

  private bendAndReleasePitchHTML(): void {
    if (
      this.effect.options.bendPitch === this.effect.options.bendReleasePitch
    ) {
      this.bendPitchHTML();
      return;
    }

    const bigNumSize = this.dim.noteTextSize;
    const xBend = this._rect.x + this._rect.width - bigNumSize;
    const xRelease = xBend + bigNumSize * 1.5;
    const y = this._rect.y + this._rect.height / 2 - this.dim.noteTextSize / 2;

    const bendNums = this.getPitchRatioNums(this.effect.options.bendPitch);
    const bendHTML = this.ratioHTML(
      bendNums[0],
      bendNums[1],
      bendNums[2],
      xBend,
      y,
      bigNumSize
    );

    const releaseNums = this.getPitchRatioNums(
      this.effect.options.bendReleasePitch
    );
    const releaseHTML = this.ratioHTML(
      releaseNums[0],
      releaseNums[1],
      releaseNums[2],
      xRelease,
      y,
      bigNumSize
    );

    this._fullHTML = bendHTML + releaseHTML;
  }

  private prebendAndReleasePitchHTML(): void {
    if (
      this.effect.options.prebendPitch === this.effect.options.bendReleasePitch
    ) {
      this.prebendPitchHTML();
      return;
    }

    const bigNumSize = this.dim.noteTextSize;
    const xPrebend = this._rect.x + this._rect.width / 2 + bigNumSize / 4;
    const xRelease = xPrebend + bigNumSize * 1.5;
    const y = this._rect.y + this._rect.height / 2 - this.dim.noteTextSize / 2;

    const prebendNums = this.getPitchRatioNums(
      this.effect.options.prebendPitch
    );
    const prebendHTML = this.ratioHTML(
      prebendNums[0],
      prebendNums[1],
      prebendNums[2],
      xPrebend,
      y,
      bigNumSize
    );

    const releaseNums = this.getPitchRatioNums(
      this.effect.options.bendReleasePitch
    );
    const releaseHTML = this.ratioHTML(
      releaseNums[0],
      releaseNums[1],
      releaseNums[2],
      xRelease,
      y,
      bigNumSize
    );

    this._fullHTML = prebendHTML + releaseHTML;
  }

  private vibratoHTML(): void {
    const x = this._rect.x + this._rect.width / 2 - this._rect.width / 4;
    const y = this._rect.y + this._rect.height / 2;
    const vibratoHeight = this.rect.height / 6;
    const vibratoWidth = this.rect.width / 2;
    const edgeWidth = vibratoWidth / 8;
    this._fullHTML =
      '<path d="' +
      `M ${x} ${y + vibratoHeight} ` +
      `l ${edgeWidth} ${-vibratoHeight} ` +
      `l ${edgeWidth} ${vibratoHeight} ` +
      `l ${edgeWidth} ${-vibratoHeight} ` +
      `l ${edgeWidth} ${vibratoHeight} ` +
      `l ${edgeWidth} ${-vibratoHeight} ` +
      `l ${edgeWidth} ${vibratoHeight} ` +
      `l ${edgeWidth} ${-vibratoHeight} ` +
      `l ${edgeWidth} ${vibratoHeight}` +
      '" stroke="black" fill="transparent"/>';
  }

  private palmMuteHTML(): void {
    const x = this._rect.x + this._rect.width / 2 - this.dim.noteTextSize;
    const y = this._rect.y + this._rect.height / 2;
    this._fullHTML = `<text x="${x}"
                              y="${y}"
                              font-size="${this.dim.noteTextSize}"
                              text-anchor="start"
                              dominant-baseline="hanging">
                                P.M.
                        </text>`;
  }

  public calc(): void {
    switch (this.effect.effectType) {
      case GuitarEffectType.Bend:
        this.bendPitchHTML();
        break;
      case GuitarEffectType.Prebend:
        this.prebendPitchHTML();
        break;
      case GuitarEffectType.BendAndRelease:
        this.bendAndReleasePitchHTML();
        break;
      case GuitarEffectType.PrebendAndRelease:
        this.prebendAndReleasePitchHTML();
        break;
      case GuitarEffectType.Vibrato:
        this.vibratoHTML();
        break;
      case GuitarEffectType.PalmMute:
        this.palmMuteHTML();
        break;
      default:
        break;
    }
  }

  public get rect(): Rect {
    return this._rect;
  }

  public get fullHTML(): string {
    return this._fullHTML;
  }
}
