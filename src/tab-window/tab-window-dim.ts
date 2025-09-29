import { NoteDuration } from "../models/note-duration";

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
   * Width of a dotted sixty-fourth note rectangle
   */
  readonly noteRectWidth64D: number;
  /**
   * Width of a dotted thirty-second note rectangle
   */
  readonly noteRectWidth32D: number;
  /**
   * Width of a dotted sixteenth note rectangle
   */
  readonly noteRectWidth16D: number;
  /**
   * Width of a dotted eighth note rectangle
   */
  readonly noteRectWidth8D: number;
  /**
   * Width of a dotted quarter note rectangle
   */
  readonly noteRectWidth4D: number;
  /**
   * Width of a dotted half note rectangle
   */
  readonly noteRectWidth2D: number;
  /**
   * Width of a double dotted sixty-fourth note rectangle
   */
  readonly noteRectWidth64DD: number;
  /**
   * Width of a double dotted thirty-second note rectangle
   */
  readonly noteRectWidth32DD: number;
  /**
   * Width of a double dotted sixteenth note rectangle
   */
  readonly noteRectWidth16DD: number;
  /**
   * Width of a double dotted eighth note rectangle
   */
  readonly noteRectWidth8DD: number;
  /**
   * Width of a double dotted quarter note rectangle
   */
  readonly noteRectWidth4DD: number;
  /**
   * Width of a double dotted half note rectangle
   */
  readonly noteRectWidth2DD: number;
  /**
   * Width of a triplet sixty-fourth note rectangle
   */
  readonly noteRectWidth64T: number;
  /**
   * Width of a triplet thirty-second note rectangle
   */
  readonly noteRectWidth32T: number;
  /**
   * Width of a triplet sixteenth note rectangle
   */
  readonly noteRectWidth16T: number;
  /**
   * Width of a triplet eighth note rectangle
   */
  readonly noteRectWidth8T: number;
  /**
   * Width of a triplet quarter note rectangle
   */
  readonly noteRectWidth4T: number;
  /**
   * Width of a triplet half note rectangle
   */
  readonly noteRectWidth2T: number;
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

    this.noteRectHeight = this.noteTextSize * 2;
    this.noteRectWidth64 = this.noteTextSize * 2.75;
    this.noteRectWidth32 = this.noteTextSize * 3;
    this.noteRectWidth16 = this.noteRectWidth32 * 1.1;
    this.noteRectWidth8 = this.noteRectWidth32 * 1.2;
    this.noteRectWidth4 = this.noteRectWidth32 * 1.3;
    this.noteRectWidth2 = this.noteRectWidth32 * 1.4;
    this.noteRectWidth1 = this.noteRectWidth32 * 1.5;
    this.noteRectWidth64D = this.noteRectWidth64 + this.noteTextSize / 2;
    this.noteRectWidth32D = this.noteRectWidth32 + this.noteTextSize / 2;
    this.noteRectWidth16D = this.noteRectWidth16 + this.noteTextSize / 2;
    this.noteRectWidth8D = this.noteRectWidth8 + this.noteTextSize / 2;
    this.noteRectWidth4D = this.noteRectWidth4 + this.noteTextSize / 2;
    this.noteRectWidth2D = this.noteRectWidth2 + this.noteTextSize / 2;
    this.noteRectWidth64DD = this.noteRectWidth64D + this.noteTextSize / 4;
    this.noteRectWidth32DD = this.noteRectWidth32D + this.noteTextSize / 4;
    this.noteRectWidth16DD = this.noteRectWidth16D + this.noteTextSize / 4;
    this.noteRectWidth8DD = this.noteRectWidth8D + this.noteTextSize / 4;
    this.noteRectWidth4DD = this.noteRectWidth4D + this.noteTextSize / 4;
    this.noteRectWidth2DD = this.noteRectWidth2D + this.noteTextSize / 4;
    this.noteRectWidth64T = this.noteRectWidth32 / 3;
    this.noteRectWidth32T = this.noteRectWidth16 / 3;
    this.noteRectWidth16T = this.noteRectWidth8 / 3;
    this.noteRectWidth8T = this.noteRectWidth4 / 3;
    this.noteRectWidth4T = this.noteRectWidth2 / 3;
    this.noteRectWidth2T = this.noteRectWidth1 / 3;
    this.widthMapping = new Map([
      [NoteDuration.SixtyFourth, this.noteRectWidth64],
      [NoteDuration.ThirtySecond, this.noteRectWidth32],
      [NoteDuration.Sixteenth, this.noteRectWidth16],
      [NoteDuration.Eighth, this.noteRectWidth8],
      [NoteDuration.Quarter, this.noteRectWidth4],
      [NoteDuration.Half, this.noteRectWidth2],
      [NoteDuration.Whole, this.noteRectWidth1],
      [NoteDuration.SixtyFourthDotted, this.noteRectWidth64D],
      [NoteDuration.ThirtySecondDotted, this.noteRectWidth32D],
      [NoteDuration.SixteenthDotted, this.noteRectWidth16D],
      [NoteDuration.EighthDotted, this.noteRectWidth8D],
      [NoteDuration.QuarterDotted, this.noteRectWidth4D],
      [NoteDuration.HalfDotted, this.noteRectWidth2D],
      [NoteDuration.SixtyFourthDoubleDotted, this.noteRectWidth64DD],
      [NoteDuration.ThirtySecondDoubleDotted, this.noteRectWidth32DD],
      [NoteDuration.SixteenthDoubleDotted, this.noteRectWidth16DD],
      [NoteDuration.EighthDoubleDotted, this.noteRectWidth8DD],
      [NoteDuration.QuarterDoubleDotted, this.noteRectWidth4DD],
      [NoteDuration.HalfDoubleDotted, this.noteRectWidth2DD],
      [NoteDuration.SixtyFourthTriplet, this.noteRectWidth64T],
      [NoteDuration.ThirtySecondTriplet, this.noteRectWidth32T],
      [NoteDuration.SixteenthTriplet, this.noteRectWidth16T],
      [NoteDuration.EighthTriplet, this.noteRectWidth8T],
      [NoteDuration.QuarterTriplet, this.noteRectWidth4T],
      [NoteDuration.HalfTriplet, this.noteRectWidth2T],
    ]);

    this.effectLabelHeight = this.noteTextSize * 2;

    this.staffLinesHeight = this.noteRectHeight * (stringsCount - 1);

    this.timeSigRectWidth = this.noteRectWidth32;
    this.timeSigRectHeight = this.staffLinesHeight;
    // '= XXX' = 5 characters of 'tempoTextSize' size
    this.tempoRectWidth = this.durationsHeight + this.tempoTextSize * 5;
    this.tempoRectHeight = this.durationsHeight;

    this.repeatSignWidth = this.noteRectWidth64 / 2;
    this.repeatSignHeight = this.timeSigRectHeight;

    this.tabLineMinHeight =
      this.tempoRectHeight +
      this.noteRectHeight * stringsCount +
      this.durationsHeight;
  }
}
