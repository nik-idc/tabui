import { NoteDuration } from "../models/index";

/**
 * Class that contains all the needed dim info of tab lines
 */
export class TabWindowDim {
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
   * Height of an effect label above the beat
   */
  readonly effectLabelHeight: number;
  /**
   * Minimum height of one tab line (bar + durations above it).
   * NOTE: Each tab line may have a different height due to the
   * labels above the notes. Since each tab line has its own
   * unique number of elements, the height of the tab line
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

    this.effectLabelHeight = this.noteTextSize * 2;

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
