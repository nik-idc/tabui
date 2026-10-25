import { MusicInstrument, NoteDuration } from "../model";

/** Base notation measurements in CSS pixels, used to derive the remaining layout dimensions. */
export interface EditorLayoutDimensionsConfig {
  /** Available notation width. */
  width: number;
  /** Font size for fret text and the base scale for note spacing. */
  noteTextSize: number;
  /** Time-signature font size. */
  timeSigTextSize: number;
  /** Tempo-label font size. */
  tempoTextSize: number;
  /** Height reserved for duration symbols. */
  durationsHeight: number;
  /** Page margin on each horizontal side of the notation. */
  horizontalPadding: number;
}

/** Notation measurements in CSS pixels, derived from base font sizes and spacing. */
export class EditorLayoutDimensions {
  /* ==== NOTATION VIEW ==== */
  /** Width of the tab */
  private _width: number;
  /** Horizontal page margin around the notation content. */
  private readonly _HORIZONTAL_PADDING: number;

  /* ==== NOTE ELEMENT ==== */
  /** Size of a note's text */
  private readonly _NOTE_TEXT_SIZE: number;
  /** Minimum allowed rectangle width of a note */
  private readonly _NOTE_RECT_WIDTH_MIN: number;
  /** Minimum gap between adjacent musical timing columns. */
  private readonly _MIN_RHYTHM_COLUMN_GAP: number;
  /** Padding before the first and after the last attack column in a bar. */
  private readonly _RHYTHM_ATTACK_PADDING: number;
  /** Width mapping for durations */
  private readonly _WIDTH_MAPPING: Record<NoteDuration, number>;
  /** Note rectangle height */
  private readonly _NOTE_RECT_HEIGHT: number;

  /* ==== BEAT ELEMENT ==== */
  /** Width of the beat's duration rectangle */
  private readonly _DURATIONS_WIDTH: number;
  /** Width of the beat's duration rectangle */
  private readonly _DURATIONS_HEIGHT: number;
  /** Diameter of the dot circle */
  private readonly _DOT_DIAMETER: number;
  /** Height of a single duration flag of a non-beamed beat */
  private readonly _DURATION_FLAG_HEIGHT: number;
  /** Height of a technique label */
  private readonly _TECHNIQUE_LABEL_HEIGHT: number;
  /** Height of a tuplet rectangle */
  private readonly _TUPLET_RECT_HEIGHT: number;
  /** Height of the SVG path for when the tuplet is complete */
  private readonly _TUPLET_PATH_HEIGHT: number;

  /* ==== BAR ELEMENT ==== */
  /** Size of time signature text */
  private readonly _TIME_SIG_TEXT_SIZE: number;
  /** Height of a time signature rectangle */
  private readonly _TIME_SIG_RECT_WIDTH: number;
  /** Size of tempo text */
  private readonly _TEMPO_TEXT_SIZE: number;
  /** Height of a tempo rectangle */
  private readonly _TEMPO_RECT_HEIGHT: number;
  /** Width of a tempo rectangle */
  private readonly _TEMPO_RECT_WIDTH: number;
  /** Repeat sign width */
  private readonly _REPEAT_SIGN_WIDTH: number;

  /* ==== STAFF LINE ELEMENT ==== */
  private readonly _TECH_LABEL_HEIGHT: number;

  /** Creates dimensions from supplied values without validating their ranges. */
  constructor(config: EditorLayoutDimensionsConfig) {
    this._width = config.width;
    this._HORIZONTAL_PADDING = config.horizontalPadding;
    this._NOTE_TEXT_SIZE = config.noteTextSize;
    this._TIME_SIG_TEXT_SIZE = config.timeSigTextSize;
    this._TEMPO_TEXT_SIZE = config.tempoTextSize;
    this._DURATIONS_HEIGHT = config.durationsHeight;
    this._TUPLET_RECT_HEIGHT = this._DURATIONS_HEIGHT;

    this._DURATIONS_WIDTH = this._DURATIONS_HEIGHT; // 1.25 * config.durationsHeight;
    this._DOT_DIAMETER = this._NOTE_TEXT_SIZE / 2;
    this._DURATION_FLAG_HEIGHT = this._DOT_DIAMETER / 2;

    this._TUPLET_PATH_HEIGHT = this._DOT_DIAMETER;

    this._NOTE_RECT_HEIGHT = this._NOTE_TEXT_SIZE * 2;
    this._WIDTH_MAPPING = {
      [NoteDuration.SixtyFourth]: this._NOTE_TEXT_SIZE * 2.75,
      [NoteDuration.ThirtySecond]: this._NOTE_TEXT_SIZE * 3,
      [NoteDuration.Sixteenth]: 1.1 * (this._NOTE_TEXT_SIZE * 3),
      [NoteDuration.Eighth]: 1.2 * (this._NOTE_TEXT_SIZE * 3),
      [NoteDuration.Quarter]: 1.3 * (this._NOTE_TEXT_SIZE * 3),
      [NoteDuration.Half]: 1.4 * (this._NOTE_TEXT_SIZE * 3),
      [NoteDuration.Whole]: 1.5 * (this._NOTE_TEXT_SIZE * 3),
    };
    this._NOTE_RECT_WIDTH_MIN =
      0.75 * this._WIDTH_MAPPING[NoteDuration.SixtyFourth];
    this._MIN_RHYTHM_COLUMN_GAP = this._NOTE_TEXT_SIZE * 3;
    this._RHYTHM_ATTACK_PADDING = this._NOTE_TEXT_SIZE;

    this._TECHNIQUE_LABEL_HEIGHT = this._NOTE_TEXT_SIZE * 2;

    this._TIME_SIG_RECT_WIDTH = this._WIDTH_MAPPING[NoteDuration.ThirtySecond];
    this._TEMPO_RECT_WIDTH = this._DURATIONS_HEIGHT;
    this._TEMPO_RECT_HEIGHT = this._DURATIONS_HEIGHT;

    this._REPEAT_SIGN_WIDTH =
      0.75 * this._WIDTH_MAPPING[NoteDuration.SixtyFourth];

    this._TECH_LABEL_HEIGHT = this._NOTE_RECT_HEIGHT;
  }

  /**
   * Returns minimum line height in CSS pixels: one note rectangle per slot plus duration and tuplet space.
   * @param instrument Instrument
   */
  public getStaffLineMinHeight(instrument: MusicInstrument): number {
    return (
      this._NOTE_RECT_HEIGHT * instrument.maxPolyphony +
      this._DURATIONS_HEIGHT +
      this._TUPLET_RECT_HEIGHT
    );
  }

  /**
   * Returns the CSS pixel distance from the first staff line to the last, without rhythm or label space.
   * @param instrument Instrument
   */
  public getStaffHeight(instrument: MusicInstrument): number {
    return this._NOTE_RECT_HEIGHT * (instrument.maxPolyphony - 1);
  }

  /**
   * Returns the same staff-line span as getStaffHeight(), in CSS pixels, for bar-line layout.
   * @param instrument Instrument
   */
  public getBarsLineMinHeight(instrument: MusicInstrument): number {
    return this._NOTE_RECT_HEIGHT * (instrument.maxPolyphony - 1);
  }

  /** Returns one rhythm row's height in CSS pixels; hasTuplet reserves extra bracket and label space when needed. */
  public getRhythmRowHeight(hasTuplet: boolean): number {
    if (!hasTuplet) {
      return this._DURATIONS_HEIGHT + this._TUPLET_RECT_HEIGHT;
    }

    const visibleTupletHeight =
      this._TUPLET_RECT_HEIGHT / 2 +
      this._TUPLET_PATH_HEIGHT * 2 +
      this._TEMPO_TEXT_SIZE / 2;
    return (
      this._DURATIONS_HEIGHT +
      Math.max(this._TUPLET_RECT_HEIGHT, visibleTupletHeight)
    );
  }

  /** Available notation width in CSS pixels. */
  get width(): number {
    return this._width;
  }

  /** Sets the width in CSS pixels without validation or requesting an editor redraw. */
  public setWidth(width: number): void {
    this._width = width;
  }

  /** Horizontal page margin on each side, in CSS pixels. */
  get horizontalPadding(): number {
    return this._HORIZONTAL_PADDING;
  }

  /** Width of the staff-height append area after the final bar. */
  get barAppendWidth(): number {
    return this._REPEAT_SIGN_WIDTH * 2.5;
  }

  /** Beat insertion hint size, scaled from the configured fret-text size. */
  get beatAppendTextSize(): number {
    return this._NOTE_TEXT_SIZE * (5 / 3);
  }

  /** Bar insertion hints use the same text size as beat insertion hints. */
  get barAppendTextSize(): number {
    return this.beatAppendTextSize;
  }

  /** Fret-text font size in CSS pixels. */
  get noteTextSize(): number {
    return this._NOTE_TEXT_SIZE;
  }

  /** Time-signature font size in CSS pixels. */
  get timeSigTextSize(): number {
    return this._TIME_SIG_TEXT_SIZE;
  }

  /** Tempo-label font size in CSS pixels. */
  get tempoTextSize(): number {
    return this._TEMPO_TEXT_SIZE;
  }

  /** Minimum note rectangle width in CSS pixels. */
  get noteRectWidthMin(): number {
    return this._NOTE_RECT_WIDTH_MIN;
  }

  /** Minimum spacing between adjacent timing columns in CSS pixels. */
  get minRhythmColumnGap(): number {
    return this._MIN_RHYTHM_COLUMN_GAP;
  }

  /** Padding around the first and last attack columns in CSS pixels. */
  get rhythmAttackPadding(): number {
    return this._RHYTHM_ATTACK_PADDING;
  }

  /** Shared mutable width map keyed by written duration, with CSS pixel values. */
  get widthMapping(): Record<NoteDuration, number> {
    return this._WIDTH_MAPPING;
  }

  /** Note rectangle height and string-line spacing in CSS pixels. */
  get noteRectHeight(): number {
    return this._NOTE_RECT_HEIGHT;
  }

  /** Technique-label height in CSS pixels. */
  get techniqueLabelHeight(): number {
    return this._TECHNIQUE_LABEL_HEIGHT;
  }

  /** Duration-symbol rectangle width in CSS pixels. */
  get durationsWidth(): number {
    return this._DURATIONS_WIDTH;
  }

  /** Duration-symbol rectangle height in CSS pixels. */
  get durationsHeight(): number {
    return this._DURATIONS_HEIGHT;
  }

  /** New map of spacing multipliers keyed by augmentation-dot count (0, 1, or 2). */
  get dotWidthFactors(): Record<number, number> {
    return {
      0: 1,
      1: 1.05,
      2: 1.1,
    };
  }

  /** Augmentation-dot diameter in CSS pixels. */
  get dotDiameter(): number {
    return this._DOT_DIAMETER;
  }

  /** Height of one duration flag in CSS pixels. */
  get durationFlagHeight(): number {
    return this._DURATION_FLAG_HEIGHT;
  }

  /** Time-signature rectangle width in CSS pixels. */
  get timeSigRectWidth(): number {
    return this._TIME_SIG_RECT_WIDTH;
  }

  /** Tempo rectangle width in CSS pixels. */
  get tempoRectWidth(): number {
    return this._TEMPO_RECT_WIDTH;
  }

  /** Tempo rectangle height in CSS pixels. */
  get tempoRectHeight(): number {
    return this._TEMPO_RECT_HEIGHT;
  }

  /** Repeat-sign width in CSS pixels. */
  get repeatSignWidth(): number {
    return this._REPEAT_SIGN_WIDTH;
  }

  /** Reserved tuplet rectangle height in CSS pixels. */
  get tupletRectHeight(): number {
    return this._TUPLET_RECT_HEIGHT;
  }

  /** Tuplet bracket path height in CSS pixels. */
  get tupletPathHeight(): number {
    return this._TUPLET_PATH_HEIGHT;
  }

  /** Staff-line technique-label height in CSS pixels. */
  get techLabelHeight(): number {
    return this._TECH_LABEL_HEIGHT;
  }
}
