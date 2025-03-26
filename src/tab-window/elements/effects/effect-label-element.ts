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

  constructor(dim: TabWindowDim, rect: Rect, effect: GuitarEffect) {
    this.dim = dim;
    this._rect = new Rect(rect.x, rect.y, rect.width, rect.height);
    this.effect = effect;
  }

  public get rect(): Rect {
    return this._rect;
  }
}
