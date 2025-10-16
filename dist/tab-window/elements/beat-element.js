import { Rect } from "../shapes/rect";
import { NoteDuration } from "../../models/note-duration";
import { EffectLabelElement } from "./effects/effect-label-element";
import { EFFECT_TYPE_TO_LABEL } from "./effects/guitar-effect-element-lists";
import { BeatNotesElement } from "./beat-notes-element";
/**
 * Class that handles drawing beat element in the tab
 */
export class BeatElement {
    /**
     * Tab window dimensions
     */
    dim;
    /**
     * Inidicates whether this beat element is selected
     */
    selected = false;
    /**
     * This beat's note elements
     */
    _beatNotesElement;
    /**
     * This beat's duration rectangle
     */
    durationRect;
    /**
     * This beat's rectangle
     */
    rect;
    /**
     * The beat
     */
    beat;
    /**
     * Effect label elements
     */
    _effectLabelElements;
    /**
     * Effect labels rectangle
     */
    _effectLabelsRect;
    /**
     * Class that handles drawing beat element in the tab
     * @param dim Tab window dimensions
     * @param beatCoords Beat element coords
     * @param beat Beat
     */
    constructor(dim, beatCoords, beat, labelsGapHeight = 0) {
        this.dim = dim;
        this.durationRect = new Rect();
        this.rect = new Rect(beatCoords.x, beatCoords.y);
        this.beat = beat;
        this._effectLabelsRect = new Rect(0, this.dim.durationsHeight, 0, labelsGapHeight);
        this._effectLabelElements = [];
        this._beatNotesElement = new BeatNotesElement(this.dim, this.beat, this.rect.width, this._effectLabelsRect.height);
        this.calc();
    }
    calcRectAndNotes() {
        switch (this.beat.duration) {
            case NoteDuration.ThirtySecond:
                this.rect.width = this.dim.noteRectWidthThirtySecond;
                break;
            case NoteDuration.Sixteenth:
                this.rect.width = this.dim.noteRectWidthSixteenth;
                break;
            case NoteDuration.Eighth:
                this.rect.width = this.dim.noteRectWidthEighth;
                break;
            case NoteDuration.Quarter:
                this.rect.width = this.dim.noteRectWidthQuarter;
                break;
            case NoteDuration.Half:
                this.rect.width = this.dim.noteRectWidthHalf;
                break;
            case NoteDuration.Whole:
                this.rect.width = this.dim.noteRectWidthWhole;
                break;
            default:
                throw Error(`${this.beat.duration} is an invalid beat duration`);
        }
        this.rect.height =
            this.dim.tabLineMinHeight + this._effectLabelsRect.height;
        this._effectLabelsRect.width = this.rect.width;
        this._beatNotesElement = new BeatNotesElement(this.dim, this.beat, this.rect.width, this._effectLabelsRect.height);
    }
    calcDurationDims() {
        // Calc duration transform
        this.durationRect.x = 0;
        this.durationRect.y = 0;
        this.durationRect.width = this.rect.width;
        this.durationRect.height = this.dim.durationsHeight;
    }
    calcEffectLabels() {
        this._effectLabelElements = [];
        let totalLabelsHeight = 0;
        for (const noteElement of this._beatNotesElement.noteElements) {
            for (const effect of noteElement.note.effects) {
                if (!EFFECT_TYPE_TO_LABEL[effect.effectType]) {
                    continue;
                }
                // Add effect label
                const x = 0;
                const y = this.durationRect.leftBottom.y + totalLabelsHeight;
                const width = this.rect.width;
                const height = this.dim.effectLabelHeight;
                const rect = new Rect(x, y, width, height);
                this._effectLabelElements.push(new EffectLabelElement(this.dim, rect, effect));
                totalLabelsHeight += height;
                if (totalLabelsHeight > this._effectLabelsRect.height) {
                    const gapHeight = totalLabelsHeight - this._effectLabelsRect.height;
                    this.insertEffectGap(gapHeight);
                }
            }
        }
    }
    /**
     * Calculate dimensions of the beat element and its' child elements
     */
    calc() {
        this.calcRectAndNotes();
        this.calcDurationDims();
        this.calcEffectLabels();
    }
    setHeight(newHeight) {
        const diff = newHeight - this.rect.height;
        this._effectLabelsRect.height += diff;
        this._beatNotesElement.rect.y += diff;
        this.rect.height += diff;
    }
    /**
     * Inserts a gap between the durations rectangle and beat notes.
     * The result is that the beat element is taller, beat notes are
     * moved down and the gap between durations and notes is increased
     * (or created if there was none)
     */
    insertEffectGap(gapHeight) {
        this._effectLabelsRect.height += gapHeight;
        this._beatNotesElement.rect.y += gapHeight;
        this.rect.height += gapHeight;
    }
    removeEffectGap() {
        this._effectLabelsRect.height -= this.dim.effectLabelHeight;
        this._beatNotesElement.rect.y -= this.dim.effectLabelHeight;
        this.rect.height -= this.dim.effectLabelHeight;
    }
    scaleHorBy(scale) {
        this.rect.x *= scale;
        this.rect.width *= scale;
        this.durationRect.x *= scale;
        this.durationRect.width *= scale;
        this._effectLabelsRect.x *= scale;
        this._effectLabelsRect.width *= scale;
        for (const effectLabelElement of this._effectLabelElements) {
            effectLabelElement.scaleHorBy(scale);
        }
        this._beatNotesElement.scaleHorBy(scale);
    }
    get beatNotesElement() {
        return this._beatNotesElement;
    }
    get effectLabelElements() {
        return this._effectLabelElements;
    }
}
//# sourceMappingURL=beat-element.js.map