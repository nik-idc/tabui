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
import { randomInt } from "../../misc/random-int";

const dotScale1Dot = 1.05;
const dotScale2Dot = 1.1;

/**
 * Class that handles drawing beat element in the tab
 */
export class BeatElement {
  readonly uuid: number;
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
   * This beat's dot rectangle (is defined if dot count > 0)
   */
  readonly dotRect: Rect;
  /**
   * This beat's rectangle
   */
  rect: Rect;
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
   * @param labelsGapHeight Gap height for effect labels
   */
  constructor(
    dim: TabWindowDim,
    beatCoords: Point,
    beat: Beat,
    labelsGapHeight: number = 0
  ) {
    this.uuid = randomInt();
    this.dim = dim;
    this.durationRect = new Rect();
    this.dotRect = new Rect();
    // this.beamRect = new Rect();
    this.rect = new Rect(beatCoords.x, beatCoords.y);
    this.beat = beat;
    this._effectLabelsRect = new Rect(
      0,
      this.dim.durationsHeight,
      0,
      labelsGapHeight
    );
    this._effectLabelElements = [];
    this._beatNotesElement = new BeatNotesElement(
      this.dim,
      this.beat,
      this.rect.width,
      this._effectLabelsRect.height
    );

    this.calc();
  }

  private calcRectAndNotes(): void {
    let mappingWidth = this.dim.widthMapping.get(this.beat.duration);
    if (mappingWidth === undefined) {
      throw Error(
        `${this.beat.duration} is an invalid beat duration OR error in mapping`
      );
    }
    this.rect.width = mappingWidth;

    // By how much the rect width should multiply depending on the number of dots
    let dotsScaling = 1;
    switch (this.beat.dots) {
      case 0:
        dotsScaling = 1;
        break;
      case 1:
        dotsScaling = dotScale1Dot;
        break;
      case 2:
        dotsScaling = dotScale2Dot;
        break;
      default:
        dotsScaling = 1;
        break;
    }
    this.rect.width *= dotsScaling;

    this.rect.height =
      this.dim.tabLineMinHeight + this._effectLabelsRect.height;

    this._effectLabelsRect.width = this.rect.width;

    this._beatNotesElement.rect.width = this.rect.width;
    this._beatNotesElement.rect.y =
      this.dim.durationsHeight + this._effectLabelsRect.height;
    this._beatNotesElement.rect.height =
      this.dim.noteRectHeight * this.beat.guitar.stringsCount;
    this._beatNotesElement.calc();
  }

  private calcDurationDims(): void {
    // 140 - radius of ellipse in SVG files, 827 - viewBox
    const magicNumber = 140 / 827; // some bullshit
    const offset =
      this.beat.beamGroupId === undefined
        ? 0
        : magicNumber * this.dim.durationsWidth * 2;
    this.durationRect.x =
      this.rect.width / 2 - this.dim.durationsWidth / 2 - offset;
    this.durationRect.y = 0;
    this.durationRect.width = this.dim.durationsWidth;
    this.durationRect.height = this.dim.durationsHeight;
  }

  private calcBeamRect(): void {
    this.dotRect.set(
      this.durationRect.right,
      0,
      this.dim.durationsWidth,
      this.dim.durationsHeight
    );
  }

  private calcEffectLabels(): void {
    const newEffectLabelElements: EffectLabelElement[] = [];
    const oldEffectLabelElements = [...this._effectLabelElements];

    let totalLabelsHeight = 0;
    for (const noteElement of this._beatNotesElement.noteElements) {
      if (!noteElement) continue; // !!?? Not sure if this is needed
      for (const effect of noteElement.note.effects) {
        if (!EFFECT_TYPE_TO_LABEL[effect.effectType]) {
          continue;
        }

        const oldElementIndex = oldEffectLabelElements.findIndex(
          (e) => e.effect.uuid === effect.uuid
        );
        let element: EffectLabelElement;

        const x = 0;
        const y = this.durationRect.leftBottom.y + totalLabelsHeight;
        const width = this.rect.width;
        const height = this.dim.effectLabelHeight;
        const rect = new Rect(x, y, width, height);

        if (oldElementIndex !== -1) {
          // Current label element is already present and calc-ed,
          // so just need to update it's dimensions
          element = oldEffectLabelElements.splice(oldElementIndex, 1)[0];
          element.update(rect);
        } else {
          // New label element has been just added,
          // need to create a new effect label element
          element = new EffectLabelElement(this.dim, rect, effect);
        }
        newEffectLabelElements.push(element);

        totalLabelsHeight += height;
      }
    }
    if (totalLabelsHeight > 0) {
      // const gapHeight = totalLabelsHeight - this._effectLabelsRect.height;
      // this.setEffectGap(gapHeight);
      this.setEffectGap(totalLabelsHeight);
    }
    this._effectLabelElements = newEffectLabelElements;
  }

  /**
   * Calculate dimensions of the beat element and its' child elements
   */
  public calc(): void {
    this.calcRectAndNotes();
    this.calcDurationDims();
    this.calcBeamRect();
    this.calcEffectLabels();
  }

  public setHeight(newHeight: number): void {
    const diff = newHeight - this.rect.height;
    this._effectLabelsRect.height += diff;
    this._beatNotesElement.rect.y += diff;
    this.rect.height += diff;
  }

  public setEffectGap(newGapHeight: number): void {
    const oldGapHeight = this._effectLabelsRect.height;

    this._beatNotesElement.rect.y += newGapHeight - oldGapHeight;
    this.rect.height += newGapHeight - oldGapHeight;

    this._effectLabelsRect.height = newGapHeight;
  }

  /**
   * Inserts a gap between the durations rectangle and beat notes.
   * The result is that the beat element is taller, beat notes are
   * moved down and the gap between durations and notes is increased
   * (or created if there was none)
   */
  public insertEffectGap(): void {
    this._effectLabelsRect.height += this.dim.effectLabelHeight;
    this._beatNotesElement.rect.y += this.dim.effectLabelHeight;
    this.rect.height += this.dim.effectLabelHeight;
  }

  public removeEffectGap(): void {
    this._effectLabelsRect.height -= this.dim.effectLabelHeight;
    this._beatNotesElement.rect.y -= this.dim.effectLabelHeight;
    this.rect.height -= this.dim.effectLabelHeight;
  }

  public scaleHorBy(scale: number): void {
    if (this.beat.beamGroupId !== undefined) {
      const diff = this.rect.width * scale - this.durationRect.width;
      this.durationRect.x += diff / 2;
    } else {
      this.durationRect.x =
        (this.rect.width * scale) / 2 - this.durationRect.width / 2;
    }
    this.dotRect.x = this.durationRect.right;

    this.rect.x *= scale;
    this.rect.width *= scale;

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
