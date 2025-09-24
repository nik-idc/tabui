import { Bar } from "../../models/bar";
import { Point } from "../shapes/point";
import { Rect } from "../shapes/rect";
import { TabWindowDim } from "../tab-window-dim";
import { BarElement } from "./bar-element";
import { SelectionElement } from "./selection-element";
import { tabEvent, TabEventArgs, TabEventType } from "../../events/tab-event";
import { Tab } from "../../models/tab";
import { GuitarEffectType } from "../../models/guitar-effect/guitar-effect-type";
import { GuitarEffectOptions } from "../../models/guitar-effect/guitar-effect-options";
import { EFFECT_TYPE_TO_LABEL } from "./effects/guitar-effect-element-lists";
import { randomInt } from "../../misc/random-int";

/**
 * Class that handles a tab line element
 */
export class TabLineElement {
  /**
   * Unique identifier for the line element
   */
  readonly uuid: number;
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
  public rect: Rect;
  /**
   * Effects encapsulating rectangle (horizontal, as wide as 'rect')
   */
  public effectLabelsRect: Rect;
  /**
   * Bar elements on this line
   */
  public barElements: BarElement[];

  /**
   * Class that handles a tab line element
   * @param tab Tab
   * @param dim Tab window dimensions
   * @param coords Tab line coordinates
   */
  constructor(tab: Tab, dim: TabWindowDim, coords: Point) {
    this.uuid = randomInt();
    this.tab = tab;
    this.dim = dim;
    this.rect = new Rect(coords.x, coords.y, 0, dim.tabLineMinHeight);
    this.effectLabelsRect = new Rect(coords.x, coords.y, 0, 0);
    this.barElements = [];
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
    let sumWidth =
      this.barElements[this.barElements.length - 1].rect.rightTop.x;

    // Go through each bar element and increase their
    // width according to how their current width relates
    // to the width of the empty space
    // const scale = this.dim.width / this.rect.width;
    const scale = this.dim.width / sumWidth;
    this.effectLabelsRect.width *= scale;
    for (const barElement of this.barElements) {
      barElement.scaleHorBy(scale);
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
   * Attempts to add a bar to the line
   * @param bar Bar to add
   * @param barElement Bar element for the bar
   * @param prevBar Previous bar
   * @returns True if added succesfully, false otherwise
   */
  public addBar(bar: Bar, barElement: BarElement, prevBar?: Bar): boolean {
    if (!this.barElementFits(barElement)) {
      this.justifyElements();
      this.calcEffectGap();
      return false;
    }

    this.barElements.push(barElement);
    this.changeWidth(barElement.rect.width);
    return true;
  }

  public calcEffectGap(): void {
    // Reset effect label gap height to 0
    this.effectLabelsRect.height = 0;
    this.rect.height = this.dim.tabLineMinHeight;

    // Figure out the tallest bar
    let tallestBar = 0;
    for (const barElement of this.barElements) {
      barElement.calcEffectGap();
      if (barElement.rect.height > tallestBar) {
        tallestBar = barElement.rect.height;
      }
    }

    // Figure out & apply new gap height
    const gapHeight = tallestBar - this.rect.height;
    this.rect.height += gapHeight;
    this.effectLabelsRect.height = gapHeight;

    for (const barElement of this.barElements) {
      barElement.setEffectGap(gapHeight);
    }
  }

  public calc(): void {
    let horizontalBarOffset = 0;

    let barTabIndex = this.tab.bars.indexOf(this.barElements[0].bar);
    for (let i = 0; i < this.barElements.length; i++, barTabIndex++) {
      const barElement = this.barElements[i];
      const prevBar =
        barTabIndex > 0 ? this.tab.bars[barTabIndex - 1] : undefined;

      barElement.update(prevBar, horizontalBarOffset);

      horizontalBarOffset += barElement.rect.width;
    }

    this.calcEffectGap();
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

  public applyEffectSingle(
    barElementId: number,
    beatElementId: number,
    stringNum: number,
    effectType: GuitarEffectType,
    effectOptions?: GuitarEffectOptions
  ): boolean {
    const beatElement =
      this.barElements[barElementId].beatElements[beatElementId];
    let beatId = 0;
    const barId = this.tab.bars.findIndex((bar) => {
      return bar.beats.some((beat, index) => {
        beatId = index;
        return beat === beatElement.beat;
      });
    });

    // Apply effect to selected element
    const applyRes = this.tab.applyEffectToNote(
      barId,
      beatId,
      stringNum,
      effectType,
      effectOptions
    );

    if (!applyRes) {
      return false;
    }

    return true;
  }

  public removeEffectSingle(
    barElementId: number,
    beatElementId: number,
    stringNum: number,
    effectIndex: number
  ): void {
    const beatElement =
      this.barElements[barElementId].beatElements[beatElementId];
    let beatId = 0;
    const barId = this.tab.bars.findIndex((bar) => {
      return bar.beats.some((beat, index) => {
        beatId = index;
        return beat === beatElement.beat;
      });
    });

    this.tab.removeEffectFromNote(barId, beatId, stringNum, effectIndex);
  }

  public getFitToScale(): number {
    return this.rect.width / this.dim.width;
  }

  public findBarElementByUUID(barUUID: number): BarElement | undefined {
    return this.barElements.find((be) => be.bar.uuid === barUUID);
  }
}
