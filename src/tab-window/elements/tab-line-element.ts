import { Bar } from "../../models/bar";
import { Point } from "../shapes/point";
import { Rect } from "../shapes/rect";
import { TabWindowDim } from "../tab-window-dim";
import { BarElement } from "./bar-element";
import { SelectionElement } from "./selection-element";
import { tabEvent, TabEventArgs, TabEventType } from "../../events/tab-event";
import { Tab } from "../../models/tab";

/**
 * Class that handles a tab line element
 */
export class TabLineElement {
  /**
   * Tab
   */
  readonly tab: Tab;
  /**
   * Tab window dimensions
   */
  readonly dim: TabWindowDim;
  /**
   * Line encapsulating rectangle
   */
  readonly rect: Rect;
  /**
   * Effects encapsulating rectangle (horizontal, as wide as 'rect')
   */
  readonly effectLabelsRect: Rect;
  /**
   * Bar elements on this line
   */
  readonly barElements: BarElement[];

  /**
   * Class that handles a tab line element
   * @param tab Tab
   * @param dim Tab window dimensions
   * @param coords Tab line coordinates
   */
  constructor(tab: Tab, dim: TabWindowDim, coords: Point) {
    this.tab = tab;
    this.dim = dim;
    this.rect = new Rect(coords.x, coords.y, 0, dim.tabLineMinHeight);
    this.effectLabelsRect = new Rect(coords.x, coords.y, 0, 0);
    this.barElements = [];

    tabEvent.on(TabEventType.EffectLabelAdded, (args) =>
      this.onEffectLabelAdded(args)
    );
  }

  /**
   * Fires when an effect label has been added
   * @param args Event args
   */
  private onEffectLabelAdded(
    args: TabEventArgs[TabEventType.EffectLabelAdded]
  ): void {
    const addedOnThisLine = this.barElements.some((be) => {
      return be.bar.uuid === args.beatUUID;
    });
    if (!addedOnThisLine) {
      return;
    }

    // Do nothing if the total height of the label line didn't increase
    if (args.totalLabelsHeight <= this.effectLabelsRect.height) {
      return;
    }

    this.changeHeight(args.newLabelHeight);

    // Since the height of the line changed this line
    // and all lines below it need to have their 'y' adjusted
    tabEvent.emit(TabEventType.LineMovementTriggered, {
      beatUUID: args.beatUUID,
      distance: args.newLabelHeight,
    });
  }

  /**
   * Justifies elements by scaling all their widths
   */
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

  /**
   * True if the bar element fits in this line, false otherwise
   * @param barElement Bar element whose fitness to test
   * @returns True if the bar element fits in this line, false otherwise
   */
  public barElementFits(barElement: BarElement): boolean {
    return this.rect.rightTop.x + barElement.rect.width <= this.dim.width;
  }

  /**
   * Changes the width of the encapsulating and effects rectangles
   * @param dWidth Width by which to change
   */
  private changeWidth(dWidth: number): void {
    this.rect.width += dWidth;
    this.effectLabelsRect.width += dWidth;
  }

  /**
   * Changes the height of the encapsulating and effects rectangles
   * @param dHeight Height by which to change
   */
  private changeHeight(dHeight: number): void {
    this.rect.height += dHeight;
    this.effectLabelsRect.height += dHeight;

    for (const barElement of this.barElements) {
      barElement.changeHeight(dHeight);
    }
  }

  /**
   * Attempts to add a bar to the line
   * @param bar Bar to add
   * @param prevBar Previous bar
   * @returns True if added succesfully, false otherwise
   */
  public addBar(bar: Bar, prevBar?: Bar): boolean {
    const barElement = BarElement.createBarElement(this.dim, bar, prevBar);

    if (!this.barElementFits(barElement)) {
      return false;
    }

    barElement.rect.x = this.rect.rightTop.x;
    barElement.rect.y = 0;
    barElement.calc();
    this.barElements.push(barElement);

    this.changeWidth(barElement.rect.width);

    return true;
  }

  /**
   * Removes bar element
   * @param barElementId Index of the bar element in this line
   */
  public removeBarElement(barElementId: number): void {
    const barElement = this.barElements[barElementId];

    barElement.rect.x = 0;
    barElement.rect.y = 0;
    this.barElements.splice(barElementId, 1);

    this.changeWidth(-barElement.rect.width);
  }

  public getFitToScale(): number {
    return this.rect.width / this.dim.width;
  }
}
