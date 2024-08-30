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
  private _barElementsLineId: number;
  private _barElementId: number;
  private _chordElementId: number;

  /**
   * Class that contains all necessary information
   * about a selection element
   * @param _tabWindow Tab window
   * @param _barId Bar id
   * @param _chordId Chord id
   */
  constructor(
    private _tabWindow: TabWindow,
    private _barId: number,
    private _chordId: number
  ) {
    this.calcElementIds();
  }

  /**
   * Calculates UI elements' id's
   */
  public calcElementIds(): void {
    // Calculate tab line and bar elements' id's
    let barElementConsecutiveIndex = 0;
    let barElementIndex = 0;
    let barElementsLineIndex = 0;
    let barElementsLine = this._tabWindow.barElementLines[barElementsLineIndex];
    while (barElementsLineIndex !== this._tabWindow.barElementLines.length) {
      barElementsLine = this._tabWindow.barElementLines[barElementsLineIndex];
      if (barElementConsecutiveIndex === this._barId) {
        this._barElementsLineId = barElementsLineIndex;
        this._barElementId = barElementIndex;
        break;
      }

      barElementConsecutiveIndex++;
      barElementIndex++;

      if (barElementIndex === barElementsLine.length) {
        // Reset in-tab-line bar element index and increase tab line element index
        barElementsLineIndex++;
        barElementIndex = 0;
      }
    }

    this._chordElementId = this._chordId;
  }

  /**
   * Selected chord
   */
  public get chord(): Chord {
    return this._tabWindow.tab.bars[this._barId].chords[this._chordId];
  }

  /**
   * Selected bar
   */
  public get bar(): Bar {
    return this._tabWindow.tab.bars[this._barId];
  }

  /**
   * Selected tab
   */
  public get tab(): Tab {
    return this._tabWindow.tab;
  }

  /**
   * Selected chord element
   */
  public get chordElementId(): number {
    return this._chordElementId;
  }

  /**
   * Selected bar element
   */
  public get barElementId(): number {
    return this._barElementId;
  }

  /**
   * Selected tab line element
   */
  public get barElementsLineId(): number {
    return this._barElementsLineId;
  }

  /**
   * Selected chord element
   */
  public get chordElement(): ChordElement {
    return this.barElement.chordElements[this._chordElementId];
  }

  /**
   * Selected bar element
   */
  public get barElement(): BarElement {
    return this.barElementsLine[this._barElementId];
  }

  /**
   * Selected bar element
   */
  public get barElementsLine(): BarElement[] {
    return this._tabWindow.barElementLines[this._barElementsLineId];
  }

  /**
   * Selected tab window element
   */
  public get tabWindow(): TabWindow {
    return this._tabWindow;
  }
}
