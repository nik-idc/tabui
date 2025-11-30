import { MusicInstrument, NoteDuration } from "@/notation/model";

export interface TabLayoutDimensionsConfig {
  width: number;
  noteTextSize: number;
  timeSigTextSize: number;
  tempoTextSize: number;
  durationsHeight: number;
}

export class TabLayoutDimensions {
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
  private static _WIDTH_MAPPING: Map<NoteDuration, number>;
  /** Note rectangle height */
  private static _NOTE_RECT_HEIGHT: number;
  /* ==== BEAT ELEMENT ==== */
  /** Width of the beat's duration rectangle */
  private static _DURATIONS_WIDTH: number;
  /** Width of the beat's duration rectangle */
  private static _DURATIONS_HEIGHT: number;
  /** Height of a technique label */
  private static _TECHNIQUE_LABEL_HEIGHT: number;
  /** Height of a tuplet rectangle */
  private static _TUPLET_RECT_HEIGHT: number;
  /* ==== BAR ELEMENT ==== */
  /** Size of time signature text */
  private static _TIME_SIG_TEXT_SIZE: number;
  /** Width of a time signature rectangle */
  // private static _TIME_SIG_RECT_HEIGHT: number;
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
  /** Repeat sign height */
  // private static _REPEAT_SIGN_HEIGHT: number;
  /* ==== STAFF ELEMENT ==== */
  /** TO BE DOCUMENTED  */
  // private static _TAB_LINE_MIN_HEIGHT: number;
  /** TO BE DOCUMENTED */
  // private static _STAFF_LINES_HEIGHT: number;

  static configure(config: TabLayoutDimensionsConfig): void {
    if (this._configured) {
      throw Error("Layout dimensions already configured");
    }

    this._WIDTH = config.width;
    this._NOTE_TEXT_SIZE = config.noteTextSize;
    this._TIME_SIG_TEXT_SIZE = config.timeSigTextSize;
    this._TEMPO_TEXT_SIZE = config.tempoTextSize;
    this._DURATIONS_WIDTH = config.durationsHeight; // 1.25 * config.durationsHeight;
    this._DURATIONS_HEIGHT = config.durationsHeight;
    this._TUPLET_RECT_HEIGHT = this._DURATIONS_HEIGHT;

    this._NOTE_RECT_HEIGHT = this._NOTE_TEXT_SIZE * 2;
    this._WIDTH_MAPPING = new Map([
      [NoteDuration.SixtyFourth, this._NOTE_TEXT_SIZE * 2.75],
      [NoteDuration.ThirtySecond, this._NOTE_TEXT_SIZE * 3],
      [NoteDuration.Sixteenth, 1.1 * (this._NOTE_TEXT_SIZE * 3)],
      [NoteDuration.Eighth, 1.2 * (this._NOTE_TEXT_SIZE * 3)],
      [NoteDuration.Quarter, 1.3 * (this._NOTE_TEXT_SIZE * 3)],
      [NoteDuration.Half, 1.4 * (this._NOTE_TEXT_SIZE * 3)],
      [NoteDuration.Whole, 1.5 * (this._NOTE_TEXT_SIZE * 3)],
    ]);
    this._NOTE_RECT_WIDTH_MIN =
      0.75 * this._WIDTH_MAPPING.get(NoteDuration.SixtyFourth)!;

    this._TECHNIQUE_LABEL_HEIGHT = this._NOTE_TEXT_SIZE * 2;

    this._TIME_SIG_RECT_WIDTH = this._WIDTH_MAPPING.get(
      NoteDuration.ThirtySecond
    )!;
    // this._TIME_SIG_RECT_HEIGHT = this._STAFF_LINES_HEIGHT;
    // '= XXX' = 5 characters of 'TEMPO_TEXT_SIZE' size
    this._TEMPO_RECT_WIDTH = this._DURATIONS_HEIGHT + this._TEMPO_TEXT_SIZE * 5;
    this._TEMPO_RECT_HEIGHT = this._DURATIONS_HEIGHT;

    this._REPEAT_SIGN_WIDTH =
      0.75 * this._WIDTH_MAPPING.get(NoteDuration.SixtyFourth)!;
    // this._REPEAT_SIGN_HEIGHT = this._TIME_SIG_RECT_HEIGHT;

    // this._TAB_LINE_MIN_HEIGHT =
    // this._TEMPO_RECT_HEIGHT +
    // this._NOTE_RECT_HEIGHT * stringsCount +
    // this._DURATIONS_HEIGHT +
    // this._TUPLET_RECT_HEIGHT;
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

  static get WIDTH_MAPPING(): Map<NoteDuration, number> {
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
}

/**
 * ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE
 * ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE
 * ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE
 * ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE
 * ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE
 * ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE
 * ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE
 * ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE
 * ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE
 * ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE
 * ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE
 * ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE
 * ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE
 * ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE
 * ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE
 * ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE
 * ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE
 * ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE ARCHIVE
 */

/**
 * Class that contains all the needed dim info of tab lines
 */
export class TabControllerDim {
  /**
   * Tab window width
   */
  readonly width: number;
  /**
   * Size of note text
   */
  readonly noteTextSize: number;
  /**
   * Size of time signature text
   */
  readonly timeSigTextSize: number;
  /**
   * Size of tempo text
   */
  readonly tempoTextSize: number;
  /**
   * Width of a whole note rectangle
   */
  readonly noteRectWidth1: number;
  /**
   * Width of a half note rectangle
   */
  readonly noteRectWidth2: number;
  /**
   * Width of a quarter note rectangle
   */
  readonly noteRectWidth4: number;
  /**
   * Width of a eighth note rectangle
   */
  readonly noteRectWidth8: number;
  /**
   * Width of a sixteenth note rectangle
   */
  readonly noteRectWidth16: number;
  /**
   * Width of a thirty-second note rectangle
   */
  readonly noteRectWidth32: number;
  /**
   * Width of a sixty-fourth note rectangle
   */
  readonly noteRectWidth64: number;
  /**
   * Minimum accepted width of a note
   */
  readonly noteRectWidthMin: number;
  /**
   * NoteDuration-to-RectWidth mapping for more convenient use
   */
  readonly widthMapping: Map<NoteDuration, number>;
  /**
   * Height of a note rectangle
   */
  readonly noteRectHeight: number;
  /**
   * Height of an technique label above the beat
   */
  readonly techniqueLabelHeight: number;
  /**
   * Minimum height of one tab line (bar + durations above it).
   * NOTE: Each tab line may have a different height due to the
   * labels above the notes. Since each tab line has its own
   * unique number of element, the height of the tab line
   * is calculated dynamically and stored in the 'TabLineElement' class
   * within the 'rect' property. This is just the min height
   */
  readonly tabLineMinHeight: number;
  /**
   * Width of durations object above the notes
   */
  readonly durationsWidth: number;
  /**
   * Height of durations object above the notes
   */
  readonly durationsHeight: number;
  /**
   * Height of all staff lines combined
   */
  readonly staffLinesHeight: number;
  /**
   * Height of a time signature rectangle
   */
  readonly timeSigRectHeight: number;
  /**
   * Width of time signature block
   */
  readonly timeSigRectWidth: number;
  /**
   * Height of tempo block
   */
  readonly tempoRectHeight: number;
  /**
   * Width of tempo block
   */
  readonly tempoRectWidth: number;
  /**
   * Width of repeat sign
   */
  readonly repeatSignWidth: number;
  /**
   * Height of repeat sign
   */
  readonly repeatSignHeight: number;
  /**
   * Height of the tuplet rectangle
   */
  readonly tupletRectHeight: number;

  /**
   * Class that contains all the needed dim info of tab lines
   * @param width Tab window width
   * @param noteTextSize Size of note text
   * @param timeSigTextSize Size of time signature text
   * @param tempoTextSize Size of tempo text
   * @param durationsHeight Height of durations object above the notes
   * @param stringsCount Strings count
   */
  constructor(
    width: number,
    noteTextSize: number,
    timeSigTextSize: number,
    tempoTextSize: number,
    durationsHeight: number,
    stringsCount: number
  ) {
    this.width = width;
    this.noteTextSize = noteTextSize;
    this.timeSigTextSize = timeSigTextSize;
    this.tempoTextSize = tempoTextSize;
    this.durationsWidth = 1.25 * durationsHeight;
    this.durationsHeight = durationsHeight;
    this.tupletRectHeight = this.durationsHeight;

    this.noteRectHeight = this.noteTextSize * 2;
    this.noteRectWidth64 = this.noteTextSize * 2.75;
    this.noteRectWidth32 = this.noteTextSize * 3;
    this.noteRectWidth16 = this.noteRectWidth32 * 1.1;
    this.noteRectWidth8 = this.noteRectWidth32 * 1.2;
    this.noteRectWidth4 = this.noteRectWidth32 * 1.3;
    this.noteRectWidth2 = this.noteRectWidth32 * 1.4;
    this.noteRectWidth1 = this.noteRectWidth32 * 1.5;
    this.noteRectWidthMin = 0.75 * this.noteRectWidth64;
    this.widthMapping = new Map([
      [NoteDuration.SixtyFourth, this.noteRectWidth64],
      [NoteDuration.ThirtySecond, this.noteRectWidth32],
      [NoteDuration.Sixteenth, this.noteRectWidth16],
      [NoteDuration.Eighth, this.noteRectWidth8],
      [NoteDuration.Quarter, this.noteRectWidth4],
      [NoteDuration.Half, this.noteRectWidth2],
      [NoteDuration.Whole, this.noteRectWidth1],
    ]);

    this.techniqueLabelHeight = this.noteTextSize * 2;

    this.staffLinesHeight = this.noteRectHeight * (stringsCount - 1);

    this.timeSigRectWidth = this.noteRectWidth32;
    this.timeSigRectHeight = this.staffLinesHeight;
    // '= XXX' = 5 characters of 'tempoTextSize' size
    this.tempoRectWidth = this.durationsHeight + this.tempoTextSize * 5;
    this.tempoRectHeight = this.durationsHeight;

    this.repeatSignWidth = 0.75 * this.noteRectWidth64;
    this.repeatSignHeight = this.timeSigRectHeight;

    this.tabLineMinHeight =
      this.tempoRectHeight +
      this.noteRectHeight * stringsCount +
      this.durationsHeight +
      this.tupletRectHeight;
  }
}
