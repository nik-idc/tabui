import { getPitchRatioNums } from "../../../misc/ratio-nums";
import { GuitarEffect } from "../../../models/guitar-effect/guitar-effect";
import { EFFECT_TYPE_TO_SCOPE } from "../../../models/guitar-effect/guitar-effect-lists";
import { GuitarEffectScope } from "../../../models/guitar-effect/guitar-effect-scope";
import { GuitarEffectType } from "../../../models/guitar-effect/guitar-effect-type";
import { Point } from "../../shapes/point";
import { Rect } from "../../shapes/rect";
import { TabWindowDim } from "../../tab-window-dim";
import { SVGUtils } from "./effects-html";

/**
 * Class that contains an effect label
 */
export class EffectLabelElement {
  /**
   * Tab window dimensions
   */
  readonly dim: TabWindowDim;
  /**
   * Outer rectangle
   */
  private _rect: Rect;
  /**
   * Effect
   */
  readonly effect: GuitarEffect;
  /**
   * SVG path (full path HTML including styling,
   * i.e. transparent/non-transparent)
   */
  private _fullHTML?: string;
  /**
   * Effects HTML generator
   */
  private _svgUtils: SVGUtils;

  /**
   * Class that contains an effect label
   * @param dim Tab window dimensions
   * @param rect Outer rectangle
   * @param effect Effect
   */
  constructor(dim: TabWindowDim, rect: Rect, effect: GuitarEffect) {
    this.dim = dim;
    this._rect = new Rect(rect.x, rect.y, rect.width, rect.height);
    this.effect = effect;
    this._svgUtils = new SVGUtils();

    this.calc();
  }

  /**
   * Generates bend pitch HTML
   */
  private bendPitchHTML(): void {
    const nums = getPitchRatioNums(this.effect.options.bendPitch);
    const bigNumSize = this.dim.noteTextSize;
    const x = this._rect.x + this._rect.width - bigNumSize / 2;
    const y = this._rect.y + this._rect.height / 2 - bigNumSize / 2;

    if (nums[0] === 1 && nums[1] === 0) {
      this._fullHTML = this._svgUtils.textSVGHTML(
        x,
        y,
        this.dim.noteTextSize,
        "full"
      );
      return;
    }

    this._fullHTML = this._svgUtils.ratioSVGHTML(
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
    const nums = getPitchRatioNums(this.effect.options.prebendPitch);

    const bigNumSize = this.dim.noteTextSize;
    const x = this._rect.x + this._rect.width / 2;
    const y = this._rect.y + this._rect.height / 2 - bigNumSize / 2;
    this._fullHTML = this._svgUtils.ratioSVGHTML(
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

    const bendNums = getPitchRatioNums(this.effect.options.bendPitch);
    const bendHTML = this._svgUtils.ratioSVGHTML(
      bendNums[0],
      bendNums[1],
      bendNums[2],
      xBend,
      y,
      bigNumSize
    );

    const releaseNums = getPitchRatioNums(this.effect.options.bendReleasePitch);
    const releaseHTML = this._svgUtils.ratioSVGHTML(
      releaseNums[0],
      releaseNums[1],
      releaseNums[2],
      xRelease,
      y,
      bigNumSize
    );

    this._fullHTML = bendHTML + releaseHTML;
  }

  /**
   * Generates prebend-and-release pitch HTMLА
   */
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

    const prebendNums = getPitchRatioNums(this.effect.options.prebendPitch);
    const prebendHTML = this._svgUtils.ratioSVGHTML(
      prebendNums[0],
      prebendNums[1],
      prebendNums[2],
      xPrebend,
      y,
      bigNumSize
    );

    const releaseNums = getPitchRatioNums(this.effect.options.bendReleasePitch);
    const releaseHTML = this._svgUtils.ratioSVGHTML(
      releaseNums[0],
      releaseNums[1],
      releaseNums[2],
      xRelease,
      y,
      bigNumSize
    );

    this._fullHTML = prebendHTML + releaseHTML;
  }

  /**
   * Generates regular vibrato HTML
   */
  private vibratoHTML(): void {
    const x = this._rect.x + this._rect.width / 2 - this._rect.width / 4;
    const y = this._rect.y + this._rect.height / 2;
    const vibratoHeight = this.rect.height / 6;
    const vibratoWidth = this.rect.width / 2;
    this._fullHTML = this._svgUtils.horizontalSquigglySVGHTML(
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
    const x = this._rect.x + this._rect.width / 2 - this.dim.noteTextSize;
    const y = this._rect.y + this._rect.height / 2;
    this._fullHTML = this._svgUtils.textSVGHTML(
      x,
      y,
      this.dim.noteTextSize,
      "P.M."
    );
  }

  /**
   * Calc effect label element
   */
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

  /**
   * Outer rectangle
   */
  public get rect(): Rect {
    return this._rect;
  }

  /**
   * SVG path (full path HTML including styling, i.e. transparent/non-transparent)
   */
  public get fullHTML(): string {
    return this._fullHTML;
  }
}
