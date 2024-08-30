import { Bar } from "./../../models/bar";
import { Rect } from "../shapes/rect";
import { ChordElement } from "./chord-element";
import { TabWindow } from "../tab-window";
import { Point } from "../shapes/point";
import { Chord } from "./../../models/chord";
import { TabWindowDim } from "../tab-window-dim";
import { NoteDuration } from "../../models/note-duration";

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
  public chordElements: ChordElement[];
  /**
   * If signature is to be shown in the bar
   */
  public showSignature: boolean;
  /**
   * If tempo is to be shown in the bar
   */
  public showTempo: boolean;
  /**
   * Tempo rectangle
   */
  public tempoRect: Rect;
  /**
   * Time signature rectangle
   */
  public timeSigRect: Rect;
  /**
   * Bar element rectangle
   */
  public rect: Rect;
  /**
   * Bar element's lines
   */
  public lines: Point[][];
  /**
   * The bar
   */
  readonly bar: Bar;

  /**
   * Class that handles drawing chord element in the tab
   * @param dim Tab window dimensions
   * @param barCoords Bar element coords
   * @param bar Bar
   * @param showSignature Whether to show signature
   * @param showTempo Whether to show tempo
   */
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
    this.lines = new Array<Array<Point>>();
    this.bar = bar;

    this.calc();
  }

  /**
   * Calculates this bar element
   */
  calc(): void {
    // Tempo rectangle
    const tempoRectWidth = this.showTempo ? this.dim.tempoRectWidth : 0;
    this.tempoRect.x = this.rect.x;
    this.tempoRect.y = this.rect.y;
    this.tempoRect.width = tempoRectWidth;
    this.tempoRect.height = this.dim.tempoRectHeight;

    // Time signature rectangle
    const timeSigWidth = this.showSignature ? this.dim.timeSigRectWidth : 0;
    this.timeSigRect.x = this.rect.x;
    this.timeSigRect.y =
      this.tempoRect.leftBottom.y +
      this.dim.durationsHeight +
      this.dim.noteRectHeight / 2;
    this.timeSigRect.width = timeSigWidth;
    this.timeSigRect.height = this.dim.timeSigRectHeight;

    // Calculate chords
    this.chordElements = [];
    let chordsWidth = 0;
    const startX = this.showSignature
      ? this.timeSigRect.rightTop.x
      : this.rect.x;
    const chordCoords = new Point(startX, this.rect.y + this.tempoRect.height);
    for (let chord of this.bar.chords) {
      const chordElement = new ChordElement(this.dim, chordCoords, chord);
      this.chordElements.push(chordElement);

      chordCoords.x += chordElement.rect.width;
      chordsWidth += chordElement.rect.width;
    }

    // Set main rectangle
    this.rect.width = this.showSignature
      ? this.timeSigRect.width + chordsWidth
      : chordsWidth;
    this.rect.height = this.dim.tabLineHeight;

    // Make lines
    this.lines = [];
    let y = this.timeSigRect.y;
    for (let i = 0; i < this.bar.guitar.stringsCount; i++) {
      this.lines.push([
        new Point(this.rect.x, y),
        new Point(this.rect.rightTop.x, y),
      ]);

      y += this.dim.noteRectHeight;
    }
  }

  /**
   * Scale bar horizontally
   * @param scale Scale factor
   * @returns True if scaled, false if no more room to scale
   */
  public scaleBarHorBy(scale: number): boolean {
    // Check if can scale down
    if (scale <= 0 || (scale > 0 && scale < 1)) {
      throw new Error(
        `${scale} is an invalid scale: scale must be positive AND >= 1`
      );
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
    for (const line of this.lines) {
      line[0].x *= scale;
      line[1].x *= scale;
    }

    return true;
  }

  /**
   * Translate bar
   * @param dx Horizontal distance
   * @param dy Vertical distance
   */
  public translateBy(dx: number, dy: number): void {
    // Translate bar rectangles
    this.timeSigRect.x += dx;
    this.timeSigRect.y += dy;
    this.tempoRect.x += dx;
    this.tempoRect.y += dy;
    this.rect.x += dx;
    this.rect.y += dy;
    for (const line of this.lines) {
      line[0].x += dx;
      line[0].y += dy;
      line[1].x += dx;
      line[1].y += dy;
    }

    // Translate chord elements
    for (let chordElement of this.chordElements) {
      chordElement.translateBy(dx, dy);
    }
  }

  /**
   * Puts the whole bar element at specified coords
   * @param coords Coords
   */
  public setCoords(coords: Point): void {
    this.rect.x = coords.x;
    this.rect.y = coords.y;

    this.calc();
  }

  /**
   * Insert empty chord
   * @param index Insertion index
   */
  insertEmptyChord(index: number): void {
    this.bar.insertEmptyChord(index);

    this.calc();
  }

  /**
   * Prepend empty chord
   */
  prependChord(): void {
    this.bar.prependChord();

    this.calc();
  }

  /**
   * Append empty chord
   */
  appendChord(): void {
    this.bar.appendChord();

    this.calc();
  }

  /**
   * Remove chord at index
   * @param index Removal index
   */
  removeChord(index: number): void {
    this.bar.removeChord(index);

    this.calc();
  }

  /**
   * Change chord's duration
   * @param chord Chord
   * @param duration New duration
   */
  changeChordDuration(chord: Chord, duration: number): void {
    this.bar.changeChordDuration(chord, duration);

    this.calc();
  }

  /**
   * Change bar's beats value
   * @param beats New beats value
   * @param prevBar Bar preceding this element's bar
   */
  changeBarBeats(beats: number, prevBar?: Bar): void {
    this.bar.beats = beats;

    if (prevBar) {
      this.showSignature = this.bar.beats !== prevBar.beats;
    } else {
      this.showSignature = true;
    }

    this.calc();
  }

  /**
   * Change bar duration
   * @param duration New bar duration
   * @param prevBar Bar preceding this element's bar
   */
  changeBarDuration(duration: NoteDuration, prevBar?: Bar): void {
    this.bar.duration = duration;

    if (prevBar) {
      this.showSignature = this.bar.duration !== prevBar.duration;
    } else {
      this.showSignature = true;
    }

    this.calc();
  }

  /**
   * Change bar tempo
   * @param tempo New tempo
   * @param prevBar Bar preceding this element's bar
   */
  changeTempo(tempo: number, prevBar?: Bar): void {
    this.bar.tempo = tempo;

    if (prevBar) {
      this.showTempo = this.bar.tempo !== prevBar.tempo;
    } else {
      this.showTempo = true;
    }
  }

  /**
   * True if durations fit according to signature values
   */
  durationsFit(): boolean {
    return this.bar.durationsFit;
  }

  /**
   * Time signature beats rectangle
   */
  get beatsRect(): Rect {
    return new Rect(
      this.timeSigRect.x,
      this.timeSigRect.y,
      this.timeSigRect.width,
      this.timeSigRect.height / 2
    );
  }

  /**
   * Time signature beats text coords
   */
  get beatsTextCoords(): Point {
    return new Point(
      this.timeSigRect.x + this.timeSigRect.width / 2,
      this.timeSigRect.y + this.timeSigRect.height / 3
    );
  }

  /**
   * Time signature measure text rectangle
   */
  get measureRect(): Rect {
    return new Rect(
      this.timeSigRect.x,
      this.timeSigRect.y + this.timeSigRect.height / 2,
      this.timeSigRect.width,
      this.timeSigRect.height / 2
    );
  }

  /**
   * Time signature measure text coords
   */
  get measureTextCoords(): Point {
    return new Point(
      this.timeSigRect.x + this.timeSigRect.width / 2,
      this.beatsRect.leftBottom.y + this.timeSigRect.height / 3
    );
  }

  /**
   * Tempo image coords
   */
  get tempoImageRect(): Rect {
    return new Rect(
      this.tempoRect.x,
      this.tempoRect.y + this.dim.tempoTextSize / 4,
      this.dim.tempoTextSize,
      this.dim.tempoTextSize
    );
  }

  /**
   * Tempo text coords
   */
  get tempoTextCoords(): Point {
    return new Point(
      this.tempoRect.x + this.dim.tempoTextSize,
      this.tempoRect.y + this.dim.tempoTextSize
    );
  }

  /**
   * Bar left border line (array of 2 points)
   */
  get barLeftBorderLine(): Point[] {
    return [
      new Point(this.rect.x, this.beatsRect.y),
      new Point(this.rect.x, this.measureRect.leftBottom.y),
    ];
  }

  /**
   * Bar right border line (array of 2 points)
   */
  get barRightBorderLine(): Point[] {
    return [
      new Point(this.rect.rightTop.x, this.beatsRect.y),
      new Point(this.rect.rightTop.x, this.measureRect.leftBottom.y),
    ];
  }
}
