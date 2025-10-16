/**
 * Class that contains all the needed dim info of tab lines
 */
export class TabWindowDim {
    /**
     * Tab window width
     */
    width;
    /**
     * Size of note text
     */
    noteTextSize;
    /**
     * Size of time signature text
     */
    timeSigTextSize;
    /**
     * Size of tempo text
     */
    tempoTextSize;
    /**
     * Width of a whole note rectangle
     */
    noteRectWidthWhole;
    /**
     * Width of a half note rectangle
     */
    noteRectWidthHalf;
    /**
     * Width of a quarter note rectangle
     */
    noteRectWidthQuarter;
    /**
     * Width of a eighth note rectangle
     */
    noteRectWidthEighth;
    /**
     * Width of a sixteenth note rectangle
     */
    noteRectWidthSixteenth;
    /**
     * Width of a thirty-second note rectangle
     */
    noteRectWidthThirtySecond;
    /**
     * Height of a note rectangle
     */
    noteRectHeight;
    /**
     * Height of an effect label above the beat
     */
    effectLabelHeight;
    /**
     * Minimum height of one tab line (bar + durations above it).
     * NOTE: Each tab line may have a different height due to the
     * labels above the notes. Since each tab line has its own
     * unique number of elements, the height of the tab line
     * is calculated dynamically and stored in the 'TabLineElement' class
     * within the 'rect' property. This is just the min height
     */
    tabLineMinHeight;
    /**
     * Height of durations object above the notes
     */
    durationsHeight;
    /**
     * Height of all staff lines combined
     */
    staffLinesHeight;
    /**
     * Height of a time signature rectangle
     */
    timeSigRectHeight;
    /**
     * Width of time signature block
     */
    timeSigRectWidth;
    /**
     * Height of tempo block
     */
    tempoRectHeight;
    /**
     * Width of tempo block
     */
    tempoRectWidth;
    /**
     * Class that contains all the needed dim info of tab lines
     * @param width Tab window width
     * @param noteTextSize Size of note text
     * @param timeSigTextSize Size of time signature text
     * @param tempoTextSize Size of tempo text
     * @param durationsHeight Height of durations object above the notes
     * @param stringsCount Strings count
     */
    constructor(width, noteTextSize, timeSigTextSize, tempoTextSize, durationsHeight, stringsCount) {
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
        this.effectLabelHeight = this.noteTextSize * 2;
        this.staffLinesHeight = this.noteRectHeight * (stringsCount - 1);
        this.timeSigRectWidth = this.noteRectWidthThirtySecond;
        this.timeSigRectHeight = this.staffLinesHeight;
        // '= XXX' = 5 characters of 'tempoTextSize' size
        this.tempoRectWidth = this.durationsHeight + this.tempoTextSize * 5;
        this.tempoRectHeight = this.durationsHeight;
        this.tabLineMinHeight =
            this.tempoRectHeight +
                this.noteRectHeight * stringsCount +
                this.durationsHeight;
    }
}
//# sourceMappingURL=tab-window-dim.js.map