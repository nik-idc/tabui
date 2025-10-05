import { randomInt } from "../../misc/random-int";
import { TupletGroup } from "../../models/tuplet-group";
import { Point } from "../shapes/point";
import { Rect } from "../shapes/rect";
import { TabWindowDim } from "../tab-window-dim";
import { BeatElement } from "./beat-element";

export class TupletElement {
  /**
   * UUID of the tuplet element
   */
  readonly uuid: number;
  /**
   * Tab window dimensions
   */
  readonly dim: TabWindowDim;
  /**
   * Tuplet group this element represents
   */
  readonly tupletGroup: TupletGroup;
  /**
   * Array of beat elements included in this tuplet group
   */
  readonly beatElements: BeatElement[];
  /**
   * Tuplet element's outer rectangle
   */
  readonly rect: Rect;

  constructor(
    dim: TabWindowDim,
    tupletGroup: TupletGroup,
    beatElements: BeatElement[],
    coords: Point
  ) {
    this.uuid = randomInt();
    this.dim = dim;
    this.tupletGroup = tupletGroup;
    this.beatElements = beatElements;
    this.rect = new Rect(coords.x, coords.y, 0, 0);

    this.calc();
  }

  public calc(): void {
    // First calculate the total width of all tuplet's beats
    this.rect.height = this.dim.tupletRectHeight;
    let sumWidth = 0;
    for (const beatElement of this.beatElements) {
      sumWidth += beatElement.rect.width;
    }
    this.rect.width = sumWidth;

    // Adjust the coords and dimensions for better UI/UX
    this.rect.x += this.beatElements[0].rect.width / 2;
    this.rect.width -=
      this.beatElements[this.beatElements.length - 1].rect.width * (3 / 4);
  }

  public scaleHorBy(scale: number): void {
    this.rect.x *= scale;
    this.rect.width *= scale;
  }
}
