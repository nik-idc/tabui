import { Rect } from "../shapes/rect";
import { Point } from "../shapes/point";
import { GuitarEffectElement } from "./effects/guitar-effect-element";
/**
 * Class that handles drawing note element in the tab
 */
export class NoteElement {
    /**
     * Tab window dimensions
     */
    dim;
    /**
     * The note
     */
    note;
    /**
     * Rectangle of the main clickable-area rectangle
     */
    rect = new Rect();
    /**
     * Rectangle of the note text rectangle
     */
    textRect = new Rect();
    /**
     * Rectangle of the note text rectangle
     */
    textCoords = new Point();
    /**
     * Array of guitar effect elements
     */
    _guitarEffectElements;
    /**
     * Class that handles drawing note element in the tab
     * @param dim Tab window dimensions
     * @param width Width of the beat element
     * @param note Note
     */
    constructor(dim, width, note) {
        this.dim = dim;
        this.note = note;
        this.rect = new Rect(0, this.dim.noteRectHeight * (this.note.stringNum - 1), width, this.dim.noteRectHeight);
        this._guitarEffectElements = [];
        this.calc();
    }
    /**
     * Calculate dimensions of the note element
     */
    calc() {
        this.textRect.x =
            this.rect.x + this.rect.width / 2 - this.dim.noteTextSize / 2;
        this.textRect.y =
            this.rect.y + this.rect.height / 2 - this.dim.noteTextSize / 2;
        this.textRect.width = this.dim.noteTextSize;
        this.textRect.height = this.dim.noteTextSize;
        this.textCoords.x = this.textRect.x + this.dim.noteTextSize / 2;
        this.textCoords.y = this.textRect.y + this.dim.noteTextSize / 2;
        this._guitarEffectElements = [];
        for (const effect of this.note.effects) {
            this._guitarEffectElements.push(new GuitarEffectElement(effect, this.note.stringNum, this.rect, this.dim));
        }
    }
    scaleHorBy(scale) {
        this.rect.x *= scale;
        this.rect.width *= scale;
        this.textRect.x =
            this.rect.x + this.rect.width / 2 - this.dim.noteTextSize / 2;
        // this.textRect.x *= scale;
        // this.textRect.width *= scale;
        this.textCoords.x *= scale;
        for (const effectElement of this._guitarEffectElements) {
            effectElement.scaleHorBy(scale);
        }
    }
    get guitarEffectElements() {
        return this._guitarEffectElements;
    }
}
//# sourceMappingURL=note-element.js.map