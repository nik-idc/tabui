import { Rect } from "../shapes/rect";
import { NoteElement } from "./note-element";
/**
 * Class that handles drawing note elements of the beat
 */
export class BeatNotesElement {
    /**
     * Tab window dimensions
     */
    dim;
    /**
     * Beat
     */
    beat;
    /**
     * Rectangle
     */
    rect;
    /**
     * Note elements
     */
    noteElements;
    /**
     * Class that handles drawing note elements of the beat
     * @param dim Tab window dimensions
     * @param beat Beat
     * @param width Width of the beat element
     * @param labelsGapHeight Height of the labels gap. Dictates the y-axis of the rect
     */
    constructor(dim, beat, width, labelsGapHeight = 0) {
        this.dim = dim;
        this.beat = beat;
        this.rect = new Rect(0, this.dim.durationsHeight + labelsGapHeight, width, this.dim.noteRectHeight * this.beat.guitar.stringsCount);
        this.noteElements = new Array(this.beat.guitar.stringsCount);
        this.calc();
    }
    /**
     * Calculate the note elements
     */
    calc() {
        // Calc note elements
        for (let stringNum = 1; stringNum <= this.beat.notes.length; stringNum++) {
            this.noteElements[stringNum - 1] = new NoteElement(this.dim, this.rect.width, this.beat.notes[stringNum - 1]);
        }
    }
    scaleHorBy(scale) {
        this.rect.x *= scale;
        this.rect.width *= scale;
        for (const noteElement of this.noteElements) {
            noteElement.scaleHorBy(scale);
        }
    }
}
//# sourceMappingURL=beat-notes-element.js.map