import { Bar } from "./../../models/bar";
import { Rect } from "../shapes/rect";
import { ChordElement } from "./chord-element";
import { TabWindow } from "../tab-window";
import { Point } from "../shapes/point";
import { Chord } from "./../../models/chord";

export class BarElement {
  readonly tabWindow: TabWindow;
  readonly chordElements: ChordElement[];
  readonly showMeasure: boolean;
  readonly showTempo: boolean;
  readonly measureRect: Rect;
  readonly measureBeatsCoords: Point;
  readonly measureDurationCoords: Point;
  readonly tempoCoords: Point;
  readonly prependRect: Rect;
  readonly appendRect: Rect;
  readonly rect: Rect;
  readonly bar: Bar;
  readonly beamsPath: string;

  constructor(
    tabWindow: TabWindow,
    barCoords: Point,
    bar: Bar,
    showMeasure: boolean,
    showTempo: boolean
  ) {
    this.tabWindow = tabWindow;
    this.chordElements = [];
    this.showMeasure = showMeasure;
    this.showTempo = showTempo;
    this.measureRect = new Rect();
    this.measureBeatsCoords = new Point();
    this.measureDurationCoords = new Point();
    this.tempoCoords = new Point();
    this.prependRect = new Rect();
    this.appendRect = new Rect();
    this.rect = new Rect(barCoords.x, barCoords.y);
    this.bar = bar;
    this.beamsPath = "";

    this.calc();
  }

  calc(): void {
    // Set measure rect and coords
    if (this.showMeasure) {
      this.measureRect.x = this.rect.x;
      this.measureRect.y = this.rect.y;
      this.measureRect.width = this.tabWindow.dim.noteMinSize / 2;
      this.measureRect.height = this.tabWindow.dim.barHeight / 2;

      this.measureBeatsCoords.x =
        this.measureRect.x + this.measureRect.width / 2;
      this.measureBeatsCoords.y =
        this.measureRect.y + this.measureRect.height / 2;

      this.measureDurationCoords.x =
        this.measureRect.x + this.measureRect.width / 2;
      this.measureDurationCoords.y =
        this.measureRect.y + (3 * this.measureRect.height) / 2;
    }

    // Set tempo coords
    if (this.showTempo) {
      this.tempoCoords.x = this.rect.x;
      this.tempoCoords.y = this.rect.y - this.tabWindow.dim.noteMinSize;
    }

    // Set prepend rect
    this.prependRect.x = this.showMeasure
      ? this.measureRect.x + this.measureRect.width
      : this.rect.x;
    this.prependRect.y = this.rect.y;
    this.prependRect.width = this.tabWindow.dim.noteMinSize;
    this.prependRect.height = this.tabWindow.dim.barHeight;

    // Calculate chords
    let chordCoords = new Point(
      this.prependRect.x + this.prependRect.width,
      this.prependRect.y
    );
    let chordsWidth = 0;

    for (let chord of this.bar.chords) {
      let chordElement = new ChordElement(
        this.tabWindow,
        this,
        chordCoords,
        chord
      );
      this.chordElements.push(chordElement);

      chordCoords.x += chordElement.rect.width;
      chordsWidth += chordElement.rect.width;
    }

    // Set append rectangles x coords
    this.appendRect.x =
      this.rect.x +
      this.measureRect.width +
      this.prependRect.width +
      chordsWidth;
    this.appendRect.y = this.rect.y;
    this.appendRect.width = this.tabWindow.dim.noteMinSize;
    this.appendRect.height = this.tabWindow.dim.barHeight;

    this.rect.width =
      this.measureRect.width +
      this.prependRect.width +
      chordsWidth +
      this.appendRect.width;
    this.rect.height = this.tabWindow.dim.barHeight;
  }

  scaleBarHorBy(scale: number) {
    if (scale <= 0) {
      throw new Error(`${scale} is an invalid scale: scale must be positive`);
    }

    // Scale rectangles
    this.measureRect.width *= scale;
    this.prependRect.width *= scale;
    this.appendRect.width *= scale;
    this.rect.width *= scale;

    // Scale coords (except bar start x)
    this.measureBeatsCoords.x *= scale;
    this.measureDurationCoords.x *= scale;
    this.tempoCoords.x *= scale;
    this.prependRect.x *= scale;
    this.appendRect.x *= scale;
    this.rect.x *= scale;

    // Scale chords
    for (let chordElement of this.chordElements) {
      chordElement.scaleChordHorBy(scale);
    }
  }

  translateBy(dx: number, dy: number) {
    // Translate bar rectangles
    this.prependRect.x += dx;
    this.prependRect.y += dy;
    this.appendRect.x += dx;
    this.appendRect.y += dy;
    this.rect.x += dx;
    this.rect.y += dy;

    // Translate chord elements
    for (let chordElement of this.chordElements) {
      chordElement.translateBy(dx, dy);
    }
  }

  insertEmptyChord(index: number): void {
    this.bar.insertEmptyChord(index);
    this.tabWindow.calc();
  }

  prependChord(): void {
    this.bar.prependChord();
    this.tabWindow.calc();
  }

  appendChord(): void {
    this.bar.appendChord();
    this.tabWindow.calc();
  }

  removeChord(index: number): void {
    this.bar.removeChord(index);
    this.tabWindow.calc();
  }

  changeChordDuration(chord: Chord, duration: number): void {
    this.bar.changeChordDuration(chord, duration);
    this.tabWindow.calc();
  }

  changeBarBeats(beats: number): void {
    this.bar.beats = beats;
    this.tabWindow.calc();
  }

  changeBarDuration(duration: number): void {
    this.bar.duration = duration;
    this.tabWindow.calc();
  }

  changeTempo(tempo: number): void {
    this.bar.tempo = tempo;
    this.tabWindow.calc();
  }

  get durationsFit(): boolean {
    return this.bar.durationsFit;
  }
}
