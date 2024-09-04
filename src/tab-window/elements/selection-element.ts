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
   * @param _tabWindow Tab window
   * @param _barId Bar id
   * @param _chordId Chord id
   */
  constructor(
    private _tabWindow: TabWindow,
    private _barId: number,
    private _chordId: number
  ) {}

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
    return this._chordId;
  }

  /**
   * Selected bar element
   */
  public get barElementId(): number {
    return this._barId;
  }

  /**
   * Selected tab line element
   */
  public get barElementsLineId(): number {
    return Math.floor(
      this._tabWindow.barElements[this._barId].rect.y /
        this._tabWindow.dim.tabLineHeight
    );
  }

  /**
   * Selected chord element
   */
  public get chordElement(): ChordElement {
    return this.barElement.chordElements[this._chordId];
  }

  /**
   * Selected bar element
   */
  public get barElement(): BarElement {
    return this.tabWindow.barElements[this._barId];
  }

  /**
   * Selected bar element
   */
  public get barElementsLine(): BarElement[] {
    return this._tabWindow.barElementLines[this.barElementsLineId];
  }

  /**
   * Selected tab window element
   */
  public get tabWindow(): TabWindow {
    return this._tabWindow;
  }
}
