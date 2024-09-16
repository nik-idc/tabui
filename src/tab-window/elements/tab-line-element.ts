import { Rect } from "../shapes/rect";
import { TabWindowDim } from "../tab-window-dim";
import { BarElement } from "./bar-element";
import { SelectionElement } from "./selection-element";

export class TabLineElement {
  readonly dim: TabWindowDim;
  readonly barElements: BarElement[];
  private _selectionElements: SelectionElement[];
  private _selectionRect: Rect | undefined;

  constructor() {}

  justifyElements(): void {
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

  calcSelectionRects(): void {}
}
