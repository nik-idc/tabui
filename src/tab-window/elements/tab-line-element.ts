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
    this.tab = tab;
    this.dim = dim;
    this.rect = new Rect(coords.x, coords.y, 0, dim.tabLineMinHeight);
    this.effectLabelsRect = new Rect(coords.x, coords.y, 0, 0);
    this.barElements = [];

    // tabEvent.on(TabEventType.EffectLabelAdded, (args) =>
    //   this.onEffectLabelAdded(args)
    // );
  }

  // /**
  //  * Fires when an effect label has been added
  //  * @param args Event args
  //  */
  // private onEffectLabelAdded(
  //   args: TabEventArgs[TabEventType.EffectLabelAdded]
  // ): void {
  //   const addedOnThisLine = this.barElements.some((be) => {
  //     return be.bar.uuid === args.beatUUID;
  //   });
  //   if (!addedOnThisLine) {
  //     return;
  //   }

  //   // Do nothing if the total height of the label line didn't increase
  //   if (args.totalLabelsHeight <= this.effectLabelsRect.height) {
  //     return;
  //   }

  //   this.setHeight(args.newLabelHeight);
  // }

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

  // private setHeight(height: number): void {
  //   const diff = height - this.rect.height;

  //   this.rect.height += diff;
  //   this.effectLabelsRect.height += diff;

  //   for (const barElement of this.barElements) {
  //     barElement.setHeight(height);
  //   }
  // }

  public setHeight(newHeight: number): void {
    for (const barElement of this.barElements) {
      barElement.setHeight(newHeight);
    }

    const diff = newHeight - this.rect.height;
    this.rect.height += diff;
    this.effectLabelsRect.height += diff;
  }

  public insertEffectGap(gapHeight: number): void {
    for (const barElement of this.barElements) {
      barElement.insertEffectGap(gapHeight);
    }

    this.rect.height += gapHeight;
    this.effectLabelsRect.height += gapHeight;
  }

  public removeEffectGap(): void {
    for (const barElement of this.barElements) {
      barElement.removeEffectGap();
    }

    this.rect.height += this.dim.effectLabelHeight;
    this.effectLabelsRect.height += this.dim.effectLabelHeight;
  }

  /**
   * Attempts to add a bar to the line
   * @param bar Bar to add
   * @param prevBar Previous bar
   * @returns True if added succesfully, false otherwise
   */
  public addBar(bar: Bar, prevBar?: Bar): boolean {
    const barElement = BarElement.createBarElement(
      this.dim,
      bar,
      prevBar,
      this.rect.rightTop.x,
      this.effectLabelsRect.height
    );

    if (!this.barElementFits(barElement)) {
      return false;
    }

    if (barElement.rect.height > this.rect.height) {
      const gapHeight = barElement.rect.height - this.rect.height;
      this.insertEffectGap(gapHeight);
    }

    this.barElements.push(barElement);

    this.changeWidth(barElement.rect.width);

    return true;
  }

  public calc(): void {
    const bars = this.barElements.map((be) => be.bar);
    this.rect = new Rect(
      this.rect.x,
      this.rect.y,
      0,
      this.dim.tabLineMinHeight
    );
    this.effectLabelsRect = new Rect(this.rect.x, this.rect.y, 0, 0);
    this.barElements = [];

    for (let i = 0; i < bars.length; i++) {
      const prevBarIndex = this.tab.bars.findIndex(
        (bar) => bar.uuid === bars[i].uuid
      );
      const prevBar =
        prevBarIndex === 0 ? undefined : this.tab.bars[prevBarIndex - 1];
      this.addBar(bars[i], prevBar);
    }
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

    // // Calc new beat gap height and apply the gap increase across the tab line
    // const prevHeight = beatElement.rect.height;
    // beatElement.calc();
    // const newHeight = beatElement.rect.height;
    // if (newHeight !== prevHeight) {
    //   this.setHeight(this.rect.height + (newHeight - prevHeight));
    // }

    this.calc();

    return true;
  }

  private getMaxBeatHeight(): number {
    let maxHeight = 0;
    for (const barElement of this.barElements) {
      for (const beatElement of barElement.beatElements) {
        if (beatElement.rect.height > maxHeight) {
          maxHeight = beatElement.rect.height;
        }
      }
    }

    return maxHeight;
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

    // Compare max heights before and after calculating the beat element
    // If the max height of beats decreased, decrease entire tab line height

    // TODO: Explore basic recalc upon applying/removing effects
    // since when height changes we need to go trough the entire tab line
    // anyway PLUS effect application is unlikely to be done quickly in
    // succession so even if recalc is slow it probably wouldn'matter anyway

    // const prevMaxHeight = this.getMaxBeatHeight();
    // beatElement.calc();
    // const newMaxHeight = this.getMaxBeatHeight();
    // if (newMaxHeight < prevMaxHeight) {
    //   this.setHeight(this.rect.height - (prevMaxHeight - newMaxHeight));
    // }

    this.calc();
  }

  public getFitToScale(): number {
    return this.rect.width / this.dim.width;
  }
}
