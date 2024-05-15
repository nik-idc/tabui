/**
 * Class that contains all the needed dim info of tab lines
 */
export class TabWindowDim {
  /**
   * Tab window width
   */
  readonly width: number;
  /**
   * Tab window height
   */
  readonly lineHeight: number;
  /**
   * Min size of a note
   */
  readonly minNoteSize: number;
  /**
   * Gap between tab lines
   */
  readonly gap: number;
  /**
   * Height of one bar
   */
  readonly barHeight: number;
  /**
   * Height of one tab line (bar + durations above it)
   */
  readonly tabLineHeight: number;
  /**
   * Height of durations object above the notes
   */
  readonly durationsHeight: number;
  /**
   * Min width of info block (time signature and/or tempo)
   */
  readonly minInfoWidth: number;

  /**
   * Class that contains all the needed dim info of tab lines
   * @param width Tab window width
   * @param minNoteSize Min size of a note
   * @param gap Gap between tab lines
   * @param durationsHeight Height of durations object above the notes
   * @param strCount Strings count
   */
  constructor(
    width: number,
    minNoteSize: number,
    gap: number,
    durationsHeight: number,
    strCount: number
  ) {
    this.width = width;
    this.minNoteSize = minNoteSize;
    this.gap = gap;
    this.durationsHeight = durationsHeight;

    this.minInfoWidth = this.minNoteSize * 2;

    this.barHeight = strCount * minNoteSize;
    this.tabLineHeight = this.barHeight + this.durationsHeight;
    this.lineHeight = durationsHeight + this.barHeight;
  }
}
