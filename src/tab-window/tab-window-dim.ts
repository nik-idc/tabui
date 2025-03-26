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
  readonly noteRectWidthWhole: number;
  /**
   * Width of a half note rectangle
   */
  readonly noteRectWidthHalf: number;
  /**
   * Width of a quarter note rectangle
   */
  readonly noteRectWidthQuarter: number;
  /**
   * Width of a eighth note rectangle
   */
  readonly noteRectWidthEighth: number;
  /**
   * Width of a sixteenth note rectangle
   */
  readonly noteRectWidthSixteenth: number;
  /**
   * Width of a thirty-second note rectangle
   */
  readonly noteRectWidthThirtySecond: number;
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
   * Height of durations object above the notes
   */
  readonly durationsHeight: number;
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
    this.durationsHeight = durationsHeight;

    this.noteRectHeight = this.noteTextSize * 2;
    this.noteRectWidthThirtySecond = this.noteTextSize * 3;
    this.noteRectWidthSixteenth = this.noteRectWidthThirtySecond * 1.1;
    this.noteRectWidthEighth = this.noteRectWidthThirtySecond * 1.2;
    this.noteRectWidthQuarter = this.noteRectWidthThirtySecond * 1.3;
    this.noteRectWidthHalf = this.noteRectWidthThirtySecond * 1.4;
    this.noteRectWidthWhole = this.noteRectWidthThirtySecond * 1.5;

    this.effectLabelHeight = this.noteRectHeight;

    this.timeSigRectWidth = this.noteRectWidthThirtySecond;
    this.timeSigRectHeight = this.noteRectHeight * (stringsCount - 1);
    // '= XXX' = 5 characters of 'tempoTextSize' size
    this.tempoRectWidth = this.durationsHeight + this.tempoTextSize * 5;
    this.tempoRectHeight = this.durationsHeight;

    this.tabLineMinHeight =
      this.tempoRectHeight +
      this.noteRectHeight * stringsCount +
      this.durationsHeight;
  }
}
