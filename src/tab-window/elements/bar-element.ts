import { Bar } from "./../../models/bar";
import { Rect } from "../shapes/rect";
import { ChordElement } from "./chord-element";
import { TabWindow } from "../tab-window";
import { Point } from "../shapes/point";
import { Chord } from "./../../models/chord";
import { TabWindowDim } from "../tab-window-dim";

/**
 * Class that handles drawing chord element in the tab
 */
export class BarElement {
  /**
   * Tab window dimensions
   */
  readonly dim: TabWindowDim;
  /**
   * This bar's chord elements
   */
  readonly chordElements: ChordElement[];
  /**
   * If signature is to be shown in the bar
   */
  readonly showSignature: boolean;
  /**
   * If tempo is to be shown in the bar
   */
  readonly showTempo: boolean;
  /**
   * Tempo rectangle
   */
  readonly tempoRect: Rect;
  /**
   * Time signature rectangle
   */
  readonly timeSigRect: Rect;
  /**
   * Bar element rectangle
   */
  readonly rect: Rect;
  /**
   * The bar
   */
  readonly bar: Bar;

  constructor(
    dim: TabWindowDim,
    barCoords: Point,
    bar: Bar,
    showSignature: boolean,
    showTempo: boolean
  ) {
    this.dim = dim;
    this.chordElements = [];
    this.showSignature = showSignature;
    this.showTempo = showTempo;
    this.tempoRect = new Rect();
    this.timeSigRect = new Rect();
    this.rect = new Rect(barCoords.x, barCoords.y);
    this.bar = bar;

    this.calc();
  }

  /**
   * Calculates this bar element
   */
  calc(): void {
    // Set signature rect and coords
    this.timeSigRect.x = this.rect.x;
    this.timeSigRect.y = this.rect.y + this.dim.durationsHeight;
    if (this.showSignature) {
      this.timeSigRect.width = this.dim.minInfoWidth;
      this.timeSigRect.height = this.dim.barHeight;
    }

    // Set tempo coords
    this.tempoRect.x = this.rect.x;
    this.tempoRect.y = this.rect.y;
    if (this.showTempo) {
      this.tempoRect.width = this.dim.minInfoWidth;
      this.tempoRect.height = this.dim.durationsHeight;
    }

    // Calculate chords
    let chordsWidth = 0;
    const chordCoords = new Point(
      this.rect.x + this.timeSigRect.width,
      this.rect.y
    );
    for (let chord of this.bar.chords) {
      const chordElement = new ChordElement(this.dim, chordCoords, chord);
      this.chordElements.push(chordElement);

      chordCoords.x += chordElement.rect.width;
      chordsWidth += chordElement.rect.width;
    }

    // Set main rectangle
    this.rect.width = this.timeSigRect.width + chordsWidth;
    this.rect.height = this.dim.lineHeight;
  }

  /**
   * Checks if it's possible to scale down without hurting readability
   * @param scale Scale factor
   * @returns True if can be scaled down, false otherwise
   */
  public canBeScaledDown(scale: number): boolean {
    for (let chordElement of this.chordElements) {
      if (!chordElement.canBeScaledDown(scale)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Scale bar horizontally
   * @param scale Scale factor
   * @returns True if scaled, false if no more room to scale
   */
  public scaleBarHorBy(scale: number): boolean {
    if (scale <= 0) {
      throw new Error(`${scale} is an invalid scale: scale must be positive`);
    }

    // Check if can scale down
    if (scale > 0 && scale < 1 && !this.canBeScaledDown(scale)) {
      return false;
    }

    // Scale chords
    for (let chordElement of this.chordElements) {
      chordElement.scaleChordHorBy(scale);
    }

    // Scale rectangles
    this.timeSigRect.width *= scale;
    this.tempoRect.width *= scale;
    this.rect.width *= scale;

    // Scale coords (except bar start x)
    this.timeSigRect.x *= scale;
    this.tempoRect.x *= scale;
    this.rect.x *= scale;

    return true;
  }

  /**
   * Translate bar
   * @param dx Horizontal distance
   * @param dy Vertical distance
   */
  translateBy(dx: number, dy: number) {
    // Translate bar rectangles
    this.timeSigRect.x += dx;
    this.timeSigRect.y += dy;
    this.tempoRect.x += dx;
    this.tempoRect.y += dy;
    this.rect.x += dx;
    this.rect.y += dy;

    // Translate chord elements
    for (let chordElement of this.chordElements) {
      chordElement.translateBy(dx, dy);
    }
  }

  /**
   * Insert empty chord
   * @param index Insertion index
   */
  insertEmptyChord(index: number): void {
    this.bar.insertEmptyChord(index);
  }

  /**
   * Prepend empty chord
   */
  prependChord(): void {
    this.bar.prependChord();
  }

  /**
   * Append empty chord
   */
  appendChord(): void {
    this.bar.appendChord();
  }

  /**
   * Remove chord at index
   * @param index Removal index
   */
  removeChord(index: number): void {
    this.bar.removeChord(index);
  }

  /**
   * Change chord's duration
   * @param chord Chord
   * @param duration New duration
   */
  changeChordDuration(chord: Chord, duration: number): void {
    this.bar.changeChordDuration(chord, duration);
  }

  /**
   * Change bar's beats value
   * @param beats New beats value
   */
  changeBarBeats(beats: number): void {
    this.bar.beats = beats;
  }

  /**
   * Change bar duration
   * @param duration New bar duration
   */
  changeBarDuration(duration: number): void {
    this.bar.duration = duration;
  }

  /**
   * Change bar tempo
   * @param tempo New tempo
   */
  changeTempo(tempo: number): void {
    this.bar.tempo = tempo;
  }

  /**
   * True if durations fit according to signature values
   */
  durationsFit(): boolean {
    return this.bar.durationsFit;
  }
}
