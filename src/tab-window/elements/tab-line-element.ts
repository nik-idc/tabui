import { Bar } from "../../models/bar";
import { Point } from "../shapes/point";
import { Rect } from "../shapes/rect";
import { TabWindowDim } from "../tab-window-dim";
import { BarElement } from "./bar-element";

/**
 * Class that handles tab line elements
 */
export class TabLineElement {
  /**
   * Tab window dimensions object
   */
  readonly dim: TabWindowDim;
  /**
   * Tab lines' bar elements
   */
  readonly barElements: BarElement[];
  /**
   * Rectangle around the element
   */
  readonly rect: Rect;

  /**
   * Class that handles tab line elements
   * @param dim Tab window dimensions
   */
  constructor(dim: TabWindowDim, coords: Point) {
    this.dim = dim;
    this.barElements = [];
    this.rect = new Rect(
      coords.x,
      coords.y,
      this.dim.width,
      this.dim.lineHeight
    );
  }

  /**
   * Determines if bar element fits into this tab line element
   * @param barElement Bar element to fit
   * @returns True if fits, false otherwise
   */
  public barElementFits(barElement: BarElement): boolean {
    if (this.rect.rightTop.x + barElement.rect.width <= this.dim.width) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Inserts bar into line
   * @param bar Bar to insert into the line
   * @returns True if inserted, false otherwise
   */
  public insertBar(bar: Bar): boolean {
    // Create bar element
    const lastBarElement = this.barElements[this.barElements.length - 1];
    const barCoords = lastBarElement
      ? lastBarElement.rect.leftTop
      : this.rect.leftTop;
    const showSignature = lastBarElement.bar.signature !== bar.signature;
    const showTempo = lastBarElement.bar.tempo !== bar.tempo;
    const barElement = new BarElement(
      this.dim,
      barCoords,
      bar,
      showSignature,
      showTempo
    );

    // Insert if fits
    let scale = 0.9;
    while (!this.barElementFits(barElement)) {
      const scaled = barElement.scaleBarHorBy(scale);
      if (!scaled) {
        return false;
      }
    }
    this.barElements.push(barElement);

    return true;
  }

  /**
   * Fills empty space after last bar (if such exists)
   */
  public justifyBars(): void {
    const gapWidth =
      this.rect.rightTop.x -
      this.barElements[this.barElements.length - 1].rect.rightTop.x;

    if (gapWidth === 0) {
      return;
    }

    let sumWidth = 0;
    for (const barElement of this.barElements) {
      sumWidth += barElement.rect.width;
    }

    for (const barElement of this.barElements) {
      const percentage = barElement.rect.width / sumWidth;
      const desiredWidth = barElement.rect.width + percentage * gapWidth;
      const scale = desiredWidth / barElement.rect.width;
      barElement.scaleBarHorBy(scale);
    }
  }

  // /**
  //  * Translates tab line element
  //  * @param dx X distance
  //  * @param dy Y distance
  //  */
  // private translateBy(dx: number, dy: number): void {}

  // /**
  //  * Scales tab line
  //  * @param scale Scale factor
  //  */
  // private scaleBy(scale: number): void {}
}
