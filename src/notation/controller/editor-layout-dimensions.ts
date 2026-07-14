import { MusicInstrument, NoteDuration } from "../model";

export interface EditorLayoutDimensionsConfig {
  width: number;
  noteTextSize: number;
  timeSigTextSize: number;
  tempoTextSize: number;
  durationsHeight: number;
  horizontalPadding: number;
}

export class EditorLayoutDimensions {
  /* ==== NOTATION VIEW ==== */
  /** Width of the tab */
  private readonly _WIDTH: number;
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

  constructor(config: EditorLayoutDimensionsConfig) {
    this._WIDTH = config.width;
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
      0.75 * this._WIDTH_MAPPING[NoteDuration.SixtyFourth]!;

    this._TECH_LABEL_HEIGHT = this._NOTE_RECT_HEIGHT;
  }

  /**
   * Gets the staff line minimum height. Staff lines + durations
   * Not to be confused with 'getStaffHeight'.
   * @param instrument Instrument
   * @returns Staff line minimum height
   */
  public getStaffLineMinHeight(instrument: MusicInstrument): number {
    return (
      this._NOTE_RECT_HEIGHT * instrument.maxPolyphony +
      this._DURATIONS_HEIGHT +
      this._TUPLET_RECT_HEIGHT
    );
  }

  /**
   * Gets the height of staff (just the lines)
   * @param instrument Instrument
   * @returns Staff height
   */
  public getStaffHeight(instrument: MusicInstrument): number {
    return this._NOTE_RECT_HEIGHT * (instrument.maxPolyphony - 1);
  }

  /**
   * Gets the height of staff (just the lines)
   * @param instrument Instrument
   * @returns Staff height
   */
  public getBarsLineMinHeight(instrument: MusicInstrument): number {
    return this._NOTE_RECT_HEIGHT * (instrument.maxPolyphony - 1);
  }

  get WIDTH(): number {
    return this._WIDTH;
  }

  get HORIZONTAL_PADDING(): number {
    return this._HORIZONTAL_PADDING;
  }

  get NOTE_TEXT_SIZE(): number {
    return this._NOTE_TEXT_SIZE;
  }

  get TIME_SIG_TEXT_SIZE(): number {
    return this._TIME_SIG_TEXT_SIZE;
  }

  get TEMPO_TEXT_SIZE(): number {
    return this._TEMPO_TEXT_SIZE;
  }

  get NOTE_RECT_WIDTH_MIN(): number {
    return this._NOTE_RECT_WIDTH_MIN;
  }

  get MIN_RHYTHM_COLUMN_GAP(): number {
    return this._MIN_RHYTHM_COLUMN_GAP;
  }

  get RHYTHM_ATTACK_PADDING(): number {
    return this._RHYTHM_ATTACK_PADDING;
  }

  get WIDTH_MAPPING(): Record<NoteDuration, number> {
    return this._WIDTH_MAPPING;
  }

  get NOTE_RECT_HEIGHT(): number {
    return this._NOTE_RECT_HEIGHT;
  }

  get TECHNIQUE_LABEL_HEIGHT(): number {
    return this._TECHNIQUE_LABEL_HEIGHT;
  }

  get DURATIONS_WIDTH(): number {
    return this._DURATIONS_WIDTH;
  }

  get DURATIONS_HEIGHT(): number {
    return this._DURATIONS_HEIGHT;
  }

  get DOT_WIDTH_FACTORS(): Record<number, number> {
    return {
      0: 1,
      1: 1.05,
      2: 1.1,
    };
  }

  get DOT_DIAMETER(): number {
    return this._DOT_DIAMETER;
  }

  get DURATION_FLAG_HEIGHT(): number {
    return this._DURATION_FLAG_HEIGHT;
  }

  get TIME_SIG_RECT_WIDTH(): number {
    return this._TIME_SIG_RECT_WIDTH;
  }

  get TEMPO_RECT_WIDTH(): number {
    return this._TEMPO_RECT_WIDTH;
  }

  get TEMPO_RECT_HEIGHT(): number {
    return this._TEMPO_RECT_HEIGHT;
  }

  get REPEAT_SIGN_WIDTH(): number {
    return this._REPEAT_SIGN_WIDTH;
  }

  get TUPLET_RECT_HEIGHT(): number {
    return this._TUPLET_RECT_HEIGHT;
  }

  get TUPLET_PATH_HEIGHT(): number {
    return this._TUPLET_PATH_HEIGHT;
  }

  get TECH_LABEL_HEIGHT(): number {
    return this._TECH_LABEL_HEIGHT;
  }
}
