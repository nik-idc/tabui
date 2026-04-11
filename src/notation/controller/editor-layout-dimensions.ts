import { MusicInstrument, NoteDuration } from "@/notation/model";

export interface EditorLayoutDimensionsConfig {
  width: number;
  noteTextSize: number;
  timeSigTextSize: number;
  tempoTextSize: number;
  durationsHeight: number;
}

export class EditorLayoutDimensions {
  /** True if the layout is configured */
  private static _configured: boolean = false;

  /* ==== NOTATION VIEW ==== */
  /** Width of the tab */
  private static _WIDTH: number;

  /* ==== NOTE ELEMENT ==== */
  /** Size of a note's text */
  private static _NOTE_TEXT_SIZE: number;
  /** Minimum allowed rectangle width of a note */
  private static _NOTE_RECT_WIDTH_MIN: number;
  /** Width mapping for durations */
  private static _WIDTH_MAPPING: Record<NoteDuration, number>;
  /** Note rectangle height */
  private static _NOTE_RECT_HEIGHT: number;

  /* ==== BEAT ELEMENT ==== */
  /** Width of the beat's duration rectangle */
  private static _DURATIONS_WIDTH: number;
  /** Width of the beat's duration rectangle */
  private static _DURATIONS_HEIGHT: number;
  /** Diameter of the dot circle */
  private static _DOT_DIAMETER: number;
  /** Height of a single duration flag of a non-beamed beat */
  private static _DURATION_FLAG_HEIGHT: number;
  /** Height of a technique label */
  private static _TECHNIQUE_LABEL_HEIGHT: number;
  /** Height of a tuplet rectangle */
  private static _TUPLET_RECT_HEIGHT: number;
  /** Height of the SVG path for when the tuplet is complete */
  private static _TUPLET_PATH_HEIGHT: number;

  /* ==== BAR ELEMENT ==== */
  /** Size of time signature text */
  private static _TIME_SIG_TEXT_SIZE: number;
  /** Height of a time signature rectangle */
  private static _TIME_SIG_RECT_WIDTH: number;
  /** Size of tempo text */
  private static _TEMPO_TEXT_SIZE: number;
  /** Height of a tempo rectangle */
  private static _TEMPO_RECT_HEIGHT: number;
  /** Width of a tempo rectangle */
  private static _TEMPO_RECT_WIDTH: number;
  /** Repeat sign width */
  private static _REPEAT_SIGN_WIDTH: number;

  /* ==== STAFF LINE ELEMENT ==== */
  private static _TECH_LABEL_HEIGHT: number;

  static configure(config: EditorLayoutDimensionsConfig): void {
    if (this._configured) {
      throw Error("Layout dimensions already configured");
    }

    this._WIDTH = config.width;
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

    this._TECHNIQUE_LABEL_HEIGHT = this._NOTE_TEXT_SIZE * 2;

    this._TIME_SIG_RECT_WIDTH = this._WIDTH_MAPPING[NoteDuration.ThirtySecond];
    // '= XXX' = 5 characters of 'TEMPO_TEXT_SIZE' size
    this._TEMPO_RECT_WIDTH = this._DURATIONS_HEIGHT; //  + this._TEMPO_TEXT_SIZE * 5;
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
  public static getStaffLineMinHeight(instrument: MusicInstrument): number {
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
  public static getStaffHeight(instrument: MusicInstrument): number {
    return this._NOTE_RECT_HEIGHT * (instrument.maxPolyphony - 1);
  }

  /**
   * Gets the height of staff (just the lines)
   * @param instrument Instrument
   * @returns Staff height
   */
  public static getBarsLineMinHeight(instrument: MusicInstrument): number {
    return this._NOTE_RECT_HEIGHT * (instrument.maxPolyphony - 1);
  }

  static get WIDTH(): number {
    return this._WIDTH;
  }

  static get NOTE_TEXT_SIZE(): number {
    return this._NOTE_TEXT_SIZE;
  }

  static get TIME_SIG_TEXT_SIZE(): number {
    return this._TIME_SIG_TEXT_SIZE;
  }

  static get TEMPO_TEXT_SIZE(): number {
    return this._TEMPO_TEXT_SIZE;
  }

  static get NOTE_RECT_WIDTH_MIN(): number {
    return this._NOTE_RECT_WIDTH_MIN;
  }

  static get WIDTH_MAPPING(): Record<NoteDuration, number> {
    return this._WIDTH_MAPPING;
  }

  static get NOTE_RECT_HEIGHT(): number {
    return this._NOTE_RECT_HEIGHT;
  }

  static get TECHNIQUE_LABEL_HEIGHT(): number {
    return this._TECHNIQUE_LABEL_HEIGHT;
  }

  static get DURATIONS_WIDTH(): number {
    return this._DURATIONS_WIDTH;
  }

  static get DURATIONS_HEIGHT(): number {
    return this._DURATIONS_HEIGHT;
  }

  static get DOT_WIDTH_FACTORS(): Record<number, number> {
    return {
      0: 1,
      1: 1.05,
      2: 1.1,
    };
  }

  static get DOT_DIAMETER(): number {
    return this._DOT_DIAMETER;
  }

  static get DURATION_FLAG_HEIGHT(): number {
    return this._DURATION_FLAG_HEIGHT;
  }

  static get TIME_SIG_RECT_WIDTH(): number {
    return this._TIME_SIG_RECT_WIDTH;
  }

  static get TEMPO_RECT_WIDTH(): number {
    return this._TEMPO_RECT_WIDTH;
  }

  static get TEMPO_RECT_HEIGHT(): number {
    return this._TEMPO_RECT_HEIGHT;
  }

  static get REPEAT_SIGN_WIDTH(): number {
    return this._REPEAT_SIGN_WIDTH;
  }

  static get TUPLET_RECT_HEIGHT(): number {
    return this._TUPLET_RECT_HEIGHT;
  }

  static get TUPLET_PATH_HEIGHT(): number {
    return this._TUPLET_PATH_HEIGHT;
  }

  static get TECH_LABEL_HEIGHT(): number {
    return this._TECH_LABEL_HEIGHT;
  }
}
