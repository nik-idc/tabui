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
   * Size of info text
   */
  readonly infoTextSize: number;
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
   * Height of a time signature rectangle
   */
  readonly timeSigRectHeight: number;
  /**
   * Height of one tab line (bar + durations above it)
   */
  readonly tabLineHeight: number;
  /**
   * Height of durations object above the notes
   */
  readonly durationsHeight: number;
  /**
   * Width of info block (time signature and/or tempo)
   */
  readonly infoWidth: number;

  /**
   * Class that contains all the needed dim info of tab lines
   * @param width Tab window width
   * @param noteTextSize Size of note text
   * @param infoTextSize Size of info text
   * @param durationsHeight Height of durations object above the notes
   * @param stringsCount Strings count
   */
  constructor(
    width: number,
    noteTextSize: number,
    infoTextSize: number,
    durationsHeight: number,
    stringsCount: number
  ) {
    this.width = width;

    this.noteTextSize = noteTextSize;
    this.infoTextSize = infoTextSize;
    this.noteRectHeight = this.noteTextSize * 2;
    this.noteRectWidthThirtySecond = this.noteTextSize * 3;
    this.noteRectWidthSixteenth = this.noteRectWidthThirtySecond * 1.1;
    this.noteRectWidthEighth = this.noteRectWidthThirtySecond * 1.2;
    this.noteRectWidthQuarter = this.noteRectWidthThirtySecond * 1.3;
    this.noteRectWidthHalf = this.noteRectWidthThirtySecond * 1.4;
    this.noteRectWidthWhole = this.noteRectWidthThirtySecond * 1.5;

    this.durationsHeight = durationsHeight;
    this.timeSigRectHeight = this.noteRectHeight * (stringsCount - 1);
    this.tabLineHeight = this.noteRectHeight * stringsCount + this.durationsHeight;

    this.infoWidth = this.noteRectWidthThirtySecond;
  }
}
