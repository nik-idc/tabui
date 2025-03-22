import { Bar } from "../../models/bar";
import { Beat } from "../../models/beat";
import { Tab } from "../../models/tab";
import { TabWindow } from "../tab-window";
import { BarElement } from "./bar-element";
import { BeatElement } from "./beat-element";

/**
 * Class that contains all necessary information
 * about a selection element
 */
export class SelectionElement {
  /**
   * Class that contains all necessary information
   * about a selection element
   * @param tabLineElementId Id of the tab line of bar elements
   * @param barElementId Bar element id
   * @param beatElementId Beat element id (inside the bar)
   * @param beatElementSeqId Beat element id (among all beat elements)
   */
  constructor(
    readonly tabLineElementId: number,
    readonly barElementId: number,
    readonly beatElementId: number,
    readonly beatElementSeqId: number
  ) {}

  /**
   *
   * @returns
   */
  public ids(): number[] {
    return [this.tabLineElementId, this.barElementId, this.beatElementId];
  }
}
