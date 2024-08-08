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
      this.dim.tabLineHeight
    );
  }

  /**
   * Determines if bar element fits into this tab line element
   * @param barElement Bar element to fit
   * @returns True if fits, false otherwise
   */
  public barElementFits(barElement: BarElement): boolean {
    const lastBar = this.barElements[this.barElements.length - 1];
    const rightMostCornerX = lastBar ? lastBar.rect.rightTop.x : 0;
    if (rightMostCornerX + barElement.rect.width <= this.dim.width) {
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
      ? lastBarElement.rect.rightTop
      : this.rect.leftTop;
    const showSignature = lastBarElement
      ? lastBarElement.bar.signature !== bar.signature
      : true;
    const showTempo = lastBarElement
      ? lastBarElement.bar.tempo !== bar.tempo
      : true;
    const barElement = new BarElement(
      this.dim,
      barCoords,
      bar,
      showSignature,
      showTempo
    );

    // // If does not fit initially keep scaling the bar down until it fits
    // let scale = 0.9;
    // while (!this.barElementFits(barElement)) {
    //   const scaled = barElement.scaleBarHorBy(scale);
    //   // The bar will not be scaled if scaling it down makes it too small
    //   if (!scaled) {
    //     return false;
    //   }
    // }

    // if (lastBarElement) {
    //   // barElement.translateBy(lastBarElement.rect.width, 0);
    //   barElement.setCoords(lastBarElement.rect.rightTop);
    // }

    if (this.barElementFits(barElement)) {
      this.barElements.push(barElement);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Fills empty space after last bar (if such exists)
   */
  public justifyBars(): void {
    // Calc width of empty space
    const gapWidth =
      this.rect.rightTop.x -
      this.barElements[this.barElements.length - 1].rect.rightTop.x;

    if (gapWidth === 0) {
      return;
    }

    // Calc sum width of all bar elements
    let sumWidth = 0;
    for (const barElement of this.barElements) {
      sumWidth += barElement.rect.width;
    }

    // Go through each bar element and increase their
    // width according to how their current width relates
    // to the width of the empty space
    const scale = this.rect.width / sumWidth;
    for (const barElement of this.barElements) {
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
