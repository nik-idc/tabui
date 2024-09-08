import { Bar } from "../../models/bar";
import { Chord } from "../../models/chord";
import { Tab } from "../../models/tab";
import { TabWindow } from "../tab-window";
import { BarElement } from "./bar-element";
import { ChordElement } from "./chord-element";

/**
 * Class that contains all necessary information
 * about a selection element
 */
export class SelectionElement {
  /**
   * Class that contains all necessary information
   * about a selection element
   * @param barElementId Bar element id
   * @param chordElementId Chord element id (inside the bar)
   * @param chordElementSeqId Chord element id (among all chord elements)
   */
  constructor(
    readonly barElementId: number,
    readonly chordElementId: number,
    readonly chordElementSeqId: number
  ) {}
}
