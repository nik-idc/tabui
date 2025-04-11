import { Beat } from "../../models/beat";
import { Rect } from "../shapes/rect";
import { NoteElement } from "./note-element";
import { Point } from "../shapes/point";
import { TabWindowDim } from "../tab-window-dim";
import { NoteDuration } from "../../models/note-duration";
import { EffectLabelElement } from "./effects/effect-label-element";
import { EFFECT_TYPE_TO_LABEL } from "./effects/guitar-effect-element-lists";
import { tabEvent, TabEventType } from "../../events/tab-event";
import { BeatNotesElement } from "./beat-notes-element";

/**
 * Class that handles drawing beat element in the tab
 */
export class BeatElement {
  /**
   * Tab window dimensions
   */
  readonly dim: TabWindowDim;
  /**
   * Inidicates whether this beat element is selected
   */
  public selected: boolean = false;
  /**
   * This beat's note elements
   */
  private _beatNotesElement: BeatNotesElement;
  /**
   * This beat's duration rectangle
   */
  readonly durationRect: Rect;
  /**
   * This beat's rectangle
   */
  readonly rect: Rect;
  /**
   * The beat
   */
  readonly beat: Beat;
  /**
   * Effect label elements
   */
  private _effectLabelElements: EffectLabelElement[];
  /**
   * Effect labels rectangle
   */
  private _effectLabelsRect: Rect;

  /**
   * Class that handles drawing beat element in the tab
   * @param dim Tab window dimensions
   * @param beatCoords Beat element coords
   * @param beat Beat
   */
  constructor(
    dim: TabWindowDim,
    beatCoords: Point,
    beat: Beat,
    labelsGapHeight: number = 0
  ) {
    this.dim = dim;
    this.durationRect = new Rect();
    this.rect = new Rect(beatCoords.x, beatCoords.y);
    this.beat = beat;
    this._effectLabelsRect = new Rect(
      0,
      this.dim.durationsHeight,
      0,
      labelsGapHeight
    );

    this.calc();
  }

  private calcRectAndNotes(): void {
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

    this._beatNotesElement = new BeatNotesElement(
      this.dim,
      this.beat,
      this.rect.width,
      this._effectLabelsRect.height
    );
  }

  private calcDurationDims(): void {
    // Calc duration transform
    this.durationRect.x = 0;
    this.durationRect.y = 0;
    this.durationRect.width = this.rect.width;
    this.durationRect.height = this.dim.durationsHeight;
  }

  private calcEffectLabels(): void {
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
        this._effectLabelElements.push(
          new EffectLabelElement(this.dim, rect, effect)
        );

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
  public calc(): void {
    this.calcRectAndNotes();
    this.calcDurationDims();
    this.calcEffectLabels();
  }

  public setHeight(newHeight: number): void {
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
  public insertEffectGap(gapHeight: number): void {
    this._effectLabelsRect.height += gapHeight;
    this._beatNotesElement.rect.y += gapHeight;
    this.rect.height += gapHeight;
  }

  public removeEffectGap(): void {
    this._effectLabelsRect.height -= this.dim.effectLabelHeight;
    this._beatNotesElement.rect.y -= this.dim.effectLabelHeight;
    this.rect.height -= this.dim.effectLabelHeight;
  }

  public scaleHorBy(scale: number): void {
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

  public get beatNotesElement(): BeatNotesElement {
    return this._beatNotesElement;
  }

  public get effectLabelElements(): EffectLabelElement[] {
    return this._effectLabelElements;
  }
}
