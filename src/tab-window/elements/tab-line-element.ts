import { Bar } from "../../models/bar";
import { Point } from "../shapes/point";
import { Rect } from "../shapes/rect";
import { TabWindowDim } from "../tab-window-dim";
import { BarElement } from "./bar-element";
import { SelectionElement } from "./selection-element";

export class TabLineElement {
  readonly dim: TabWindowDim;
  readonly rect: Rect;
  readonly barElements: BarElement[];
  private _selectionElements: SelectionElement[];
  private _selectionRect: Rect | undefined;

  constructor(dim: TabWindowDim, coords: Point) {
    this.dim = dim;
    this.rect = new Rect(coords.x, coords.y, 0, dim.tabLineHeight);
    this.barElements = [];
  }

  public justifyElements(): void {
    // Calc width of empty space
    const gapWidth =
      this.dim.width -
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
    const scale = this.dim.width / sumWidth;
    for (const barElement of this.barElements) {
      barElement.scaleBarHorBy(scale);
    }
  }

  public barElementFits(barElement: BarElement): boolean {
    return this.rect.rightTop.x + barElement.rect.width <= this.dim.width;
  }

  public addBarElement(barElement: BarElement): void {
    if (!this.barElementFits(barElement)) {
      throw Error("Attepmted to insert bar element that doesn't fit");
    }

    barElement.rect.x = this.rect.rightTop.x;
    barElement.rect.y = this.rect.y;
    barElement.calc();
    this.rect.width += barElement.rect.width;
    this.barElements.push(barElement);
  }

  public removeBarElement(barElementId: number): void {
    const barElement = this.barElements[barElementId];

    barElement.rect.x = 0;
    barElement.rect.y = 0;
    this.rect.width -= barElement.rect.width;
    this.barElements.splice(barElementId, 1);
  }

  public calcSelectionRects(): void {}

  public getFitToScale(): number {
    return this.rect.width / this.dim.width;
  }
}
