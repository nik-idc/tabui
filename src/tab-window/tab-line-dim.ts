import { Guitar } from "./../models/guitar";
import { Tab } from "./../models/tab";

/**
 * Class that contains all the needed dim info of tab lines
 */
export class TabLineDim {
  /**
   * Min size of a note
   */
  readonly noteMinSize: number;
  /**
   * Width of note duration object above the main notes
   */
  readonly durationWidth: number;
  /**
   * Height of note duration object above the main notes
   */
  readonly durationHeight: number;
  /**
   * Number of bars per tab line
   */
  readonly barsPerLine: number;
  /**
   * X-offset of the tab line
   */
  readonly xOffset: number;
  /**
   * Y-offset of the tab line
   */
  readonly yOffset: number;
  /**
   * Width of a single bar
   */
  readonly barWidth: number;
  /**
   * Height of a single bar
   */
  readonly barHeight: number;
  /**
   * Height of the durations line
   */
  readonly durationsLineHeight: number;
  /**
   * With of the entire tab line
   */
  readonly tabLineWidth: number;
  /**
   * Height of the entire tab line
   */
  readonly tabLineHeight: number;
  /**
   * Width of one svg line in a tab line
   */
  readonly svgLineWidth: number;
  /**
   * Height of one svg line in a tab line
   */
  readonly svgLineHeight: number;

  constructor(
    guitar: Guitar,
    noteMinSize: number,
    barsPerLine: number,
    xOffset: number,
    yOffset: number
  ) {
    this.noteMinSize = noteMinSize;
    this.durationWidth = this.noteMinSize;
    this.durationHeight = this.noteMinSize;
    this.barsPerLine = barsPerLine;
    this.xOffset = xOffset;
    this.yOffset = yOffset;
    // Min note is 1/32, standard bar width is a full 4/4 bar of 1/32 notes
    // plus prepend/append rectangles on both left and right of the bar
    this.barWidth = this.noteMinSize + 32 * this.noteMinSize + this.noteMinSize;
    this.barHeight = this.noteMinSize * (guitar.stringsCount - 1);
    this.durationsLineHeight = this.barHeight / 2;
    this.tabLineWidth = this.barWidth * this.barsPerLine;
    this.tabLineHeight = this.barHeight + this.durationsLineHeight;
    this.svgLineWidth = this.xOffset + this.tabLineWidth + this.xOffset;
    this.svgLineHeight = this.yOffset + this.tabLineHeight + this.yOffset;
  }
}
