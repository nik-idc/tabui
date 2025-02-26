import { GuitarEffect, GuitarEffectType } from "../../models/guitar-effect";
import { Point } from "../shapes/point";
import { Rect } from "../shapes/rect";
import { TabWindowDim } from "../tab-window-dim";

/**
 * Class that represents a guitar effect
 */
export class GuitarEffectElement {
  /**
   * Effect
   */
  readonly effect: GuitarEffect;
  /**
   * Rect
   */
  readonly dim: TabWindowDim;
  /**
   * Effect rect
   */
  private _rect?: Rect;
  /**
   * Image source
   */
  private _src?: string;

  private _path?: string;

  /**
   * Class that represents a guitar effect
   * @param effect Effect
   * @param rect Rect
   * @param dim Tab window dimensions
   */
  constructor(effect: GuitarEffect, rect: Rect, dim: TabWindowDim) {
    this.effect = effect;
    this._rect = rect;
    this.dim = dim;

    this.calcRect();
  }

  /**
   * Sets the rectangle
   * @param x X-coordinate
   * @param y Y-coordinate
   * @param width Rectangle width
   * @param height Rectangle height
   */
  private setRect(x: number, y: number, width: number, height: number): void {
    this._rect.x = x;
    this._rect.y = y;
    this._rect.width = width;
    this._rect.height = height;
  }

  /**
   * Calculates rectangle depending on effect type
   */
  private calcRect(): void {
    // Calc offsets & assign image paths
    switch (this.effect.effectType) {
      case GuitarEffectType.Bend:
        const x = this._rect.x + this.dim.noteTextSize / 2;
        const y = this._rect.y;
        this._path = `m ${x} ${y} C 3 0 3 -2 3 -2 m 3 0`;
        break;
      case GuitarEffectType.BendAndRelease:
        throw Error(`Guitar effect ${this.effect} not implemented yet`);
        break;
      case GuitarEffectType.Prebend:
        throw Error(`Guitar effect ${this.effect} not implemented yet`);
        break;
      case GuitarEffectType.PrebendAndRelease:
        throw Error(`Guitar effect ${this.effect} not implemented yet`);
        break;
      case GuitarEffectType.Vibrato:
        throw Error(`Guitar effect ${this.effect} not implemented yet`);
        break;
      case GuitarEffectType.SlideStart:
        throw Error(`Guitar effect ${this.effect} not implemented yet`);
        break;
      case GuitarEffectType.SlideEnd:
        this._rect = undefined;
        this._src = undefined;
        break;
      case GuitarEffectType.HammerOnStart:
        throw Error(`Guitar effect ${this.effect} not implemented yet`);
        break;
      case GuitarEffectType.HammerOnEnd:
        this._rect = undefined;
        this._src = undefined;
        break;
      case GuitarEffectType.PullOffStart:
        throw Error(`Guitar effect ${this.effect} not implemented yet`);
        break;
      case GuitarEffectType.PullOffEnd:
        this._rect = undefined;
        this._src = undefined;
        break;
      case GuitarEffectType.PinchHarmonic:
        throw Error(`Guitar effect ${this.effect} not implemented yet`);
        break;
      case GuitarEffectType.NaturalHarmonic:
        throw Error(`Guitar effect ${this.effect} not implemented yet`);
        break;
      case GuitarEffectType.PalmMute:
        throw Error(`Guitar effect ${this.effect} not implemented yet`);
        break;
    }
  }

  /**
   * Scales guitar effect element horizontally
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number): void {
    if (scale <= 0) {
      // if (scale <= 0 || (scale > 0 && scale < 1)) {
      throw Error(
        `${scale} is an invalid scale: scale must be positive AND >= 1`
      );
    }

    this.rect.x *= scale;
    this.rect.width *= scale;
  }

  /**
   * Effect rect
   */
  public get rect(): Rect {
    return this._rect;
  }

  /**
   * Image source
   */
  public get src(): string {
    return this._src;
  }
}
