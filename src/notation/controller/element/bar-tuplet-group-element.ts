import { BarTupletGroup } from "@/notation/model";
import { Rect, Point, randomInt } from "@/shared";
import { BeatElement } from "./beat-element";
import { BarElement } from "./bar-element";
import { TabLayoutDimensions } from "../tab-controller-dim";

/**
 * Class that handles geometry & visually relevant info of a bar tuplet group
 */
export class BarTupletGroupElement {
  /** UUID of the tuplet element */
  readonly uuid: number;
  /** Tuplet group this element represents */
  readonly tupletGroup: BarTupletGroup;
  /** Parent bar element */
  readonly barElement: BarElement;
  /** Array of beat element included in this tuplet group */
  readonly beatElements: BeatElement[];

  /** Tuplet element's outer rectangle */
  private _rect: Rect;

  /**
   * Class that handles geometry & visually relevant info of a bar tuplet group
   * @param tupletGroup Tuplet group
   * @param barElement Bar element
   * @param beatElements Beat element
   */
  constructor(
    tupletGroup: BarTupletGroup,
    barElement: BarElement,
    beatElements: BeatElement[]
  ) {
    this.uuid = randomInt();
    this.tupletGroup = tupletGroup;
    this.barElement = barElement;
    this.beatElements = beatElements;

    this._rect = new Rect();

    this.calc();
  }

  /**
   * Calculates the bar tuplet group element
   */
  public calc(): void {
    // This may be potentially wrong
    this._rect = new Rect(
      this.beatElements[0].rect.x,
      this.beatElements[0].rect.y,
      0,
      0
    );

    // First calculate the total width of all tuplet's beats
    this._rect.height = TabLayoutDimensions.TUPLET_RECT_HEIGHT;
    let sumWidth = 0;
    for (const beatElement of this.beatElements) {
      sumWidth += beatElement.rect.width;
    }
    this._rect.width = sumWidth;

    // Adjust the coords and dimensions for better UI/UX
    this._rect.x += this.beatElements[0].rect.width / 2;
    this._rect.width -=
      this.beatElements[this.beatElements.length - 1].rect.width * (3 / 4);
  }

  /**
   * Scales the bar tuplet group element horizontally by the factor
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number): void {
    this._rect.x *= scale;
    this._rect.width *= scale;
  }

  /** Tuplet element's outer rectangle */
  public get rect(): Rect {
    return this._rect;
  }
}
