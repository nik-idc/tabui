import { Beat, Guitar, GuitarTechnique } from "@/notation/model";
import { Rect, Point, randomInt } from "@/shared";
import { BeatNotesElement } from "./beat-notes-element";
import { BarElement } from "./bar-element";
import { TabLayoutDimensions } from "../tab-controller-dim";
import { GuitarTechniqueLabelElement } from "./technique/guitar-technique/guitar-technique-label-element";
import { TECHNIQUE_TYPE_TO_LABEL } from "./technique/guitar-technique/guitar-technique-element-lists";
import { TechniqueLabelElement } from "./technique/technique-label-element";

// These 2 being defined like this is maybe bad
// but as long as they're only needed here
// I don't really see the reason to move them
const dotScale1Dot = 1.05;
const dotScale2Dot = 1.1;

/**
 * Class that handles geometry & visually relevant info of a beat
 */
export class BeatElement {
  /** Beat element's unique identifier */
  readonly uuid: number;
  /** The beat */
  readonly beat: Beat;
  /** Parent bar element */
  readonly barElement: BarElement;

  /** This beat's note element */
  private _beatNotesElement: BeatNotesElement;
  /** Technique label element */
  private _techniqueLabelElements: TechniqueLabelElement[];
  /** This beat's rectangle */
  private _rect: Rect;
  /** This beat's duration rectangle */
  private _durationRect: Rect;
  /** This beat's dot rectangle */
  private _dotRect: Rect;
  /** Technique labels rectangle */
  private _techniqueLabelsRect: Rect;
  /** Inidicates whether this beat element is selected */
  private _selected: boolean = false;

  /**
   * Class that handles geometry & visually relevant info of a beat
   * @param beat Beat
   * @param barElement Parent bar element
   * @param labelsGapHeight Labels gap heigh (0 by default)
   */
  constructor(beat: Beat, barElement: BarElement, labelsGapHeight: number = 0) {
    this.uuid = randomInt();
    this.beat = beat;
    this.barElement = barElement;

    this._beatNotesElement = new BeatNotesElement(this.beat, this);
    this._techniqueLabelElements = [];
    this._rect = new Rect(barElement.rect.x, barElement.rect.y);
    this._durationRect = new Rect();
    this._dotRect = new Rect();
    this._techniqueLabelsRect = new Rect(
      0,
      TabLayoutDimensions.DURATIONS_HEIGHT,
      0,
      labelsGapHeight
    );

    this.calc();
  }

  /**
   * Calculates main rectangle & notes within the beat
   */
  private calcRectAndNotes(): void {
    let mappingWidth = TabLayoutDimensions.WIDTH_MAPPING.get(
      this.beat.baseDuration
    );
    if (mappingWidth === undefined) {
      throw Error(
        `${this.beat.baseDuration} is an invalid beat duration OR error in mapping`
      );
    }
    this._rect.width = mappingWidth;

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
    this._rect.width *= dotsScaling;

    if (this.beat.tupletSettings !== null) {
      const tupletScale =
        this.beat.tupletSettings.tupletCount /
        this.beat.tupletSettings.normalCount;
      this._rect.width *= tupletScale;
      if (this._rect.width < TabLayoutDimensions.NOTE_RECT_WIDTH_MIN) {
        // To make sure beats don't get too small causing UI errors
        this._rect.width = TabLayoutDimensions.NOTE_RECT_WIDTH_MIN;
      }
    }

    const minHeight = TabLayoutDimensions.getStaffLineMinHeight(
      this.beat.trackContext.instrument
    );
    this._rect.height = minHeight + this._techniqueLabelsRect.height;

    this._techniqueLabelsRect.width = this._rect.width;

    this._beatNotesElement.rect.width = this._rect.width;
    this._beatNotesElement.rect.y =
      TabLayoutDimensions.DURATIONS_HEIGHT + this._techniqueLabelsRect.height;
    this._beatNotesElement.rect.height =
      TabLayoutDimensions.NOTE_RECT_HEIGHT *
      this.beat.trackContext.instrument.maxPolyphony;

    this._beatNotesElement.calc();
  }

  /**
   * Calculates beat duration rectangle
   */
  private calcDurationRect(): void {
    // 140 - radius of ellipse in SVG files, 827 - viewBox
    const magicNumber = 140 / 827; // some bullshit
    const offset =
      this.beat.beamGroupId === undefined
        ? 0
        : magicNumber * TabLayoutDimensions.DURATIONS_WIDTH * 2;
    this._durationRect.x =
      this._rect.width / 2 - TabLayoutDimensions.DURATIONS_WIDTH / 2 - offset;
    this._durationRect.y = 0;
    this._durationRect.width = TabLayoutDimensions.DURATIONS_WIDTH;
    this._durationRect.height = TabLayoutDimensions.DURATIONS_HEIGHT;
  }

  /**
   * Calculates beaming rectangle
   */
  private calcBeamRect(): void {
    this._dotRect.set(
      this._durationRect.right,
      0,
      TabLayoutDimensions.DURATIONS_WIDTH,
      TabLayoutDimensions.DURATIONS_HEIGHT
    );
  }

  /**
   * Calculates technique labels
   */
  private calcTechniqueLabels(): void {
    this._techniqueLabelElements = [];

    let totalLabelsHeight: number = 0;
    const noteElements = this._beatNotesElement.noteElements;
    for (const noteElement of noteElements) {
      for (const technique of noteElement.note.techniques) {
        if (!TECHNIQUE_TYPE_TO_LABEL[technique.type]) {
          continue;
        }
        
        if (this.beat.trackContext.instrument instanceof Guitar) {
          const labelElement = new GuitarTechniqueLabelElement(
            technique as GuitarTechnique,
            this
          );
          this._techniqueLabelElements.push(labelElement);
          totalLabelsHeight += TabLayoutDimensions.TECHNIQUE_LABEL_HEIGHT;
        }
      }
    }

    if (totalLabelsHeight > 0) {
      this.setTechniqueGap(totalLabelsHeight);
    }
  }

  /**
   * Calculate dimensions of the beat element and its' child element
   */
  public calc(): void {
    this.calcRectAndNotes();
    this.calcDurationRect();
    this.calcBeamRect();
    this.calcTechniqueLabels();
  }

  /**
   * Sets height of the beat element
   */
  public setHeight(newHeight: number): void {
    const diff = newHeight - this._rect.height;
    this._techniqueLabelsRect.height += diff;
    this._beatNotesElement.rect.y += diff;
    this._rect.height += diff;
  }

  /**
   * Sets new technique label hap
   * @param newGapHeight New technique label gap height
   */
  public setTechniqueGap(newGapHeight: number): void {
    const oldGapHeight = this._techniqueLabelsRect.height;

    this._beatNotesElement.rect.y += newGapHeight - oldGapHeight;
    this._rect.height += newGapHeight - oldGapHeight;

    this._techniqueLabelsRect.height = newGapHeight;
  }

  /**
   * Inserts a gap between the durations rectangle and beat notes.
   * The result is that the beat element is taller, beat notes are
   * moved down and the gap between durations and notes is increased
   * (or created if there was none)
   */
  public insertTechniqueGap(): void {
    this._techniqueLabelsRect.height +=
      TabLayoutDimensions.TECHNIQUE_LABEL_HEIGHT;
    this._beatNotesElement.rect.y += TabLayoutDimensions.TECHNIQUE_LABEL_HEIGHT;
    this._rect.height += TabLayoutDimensions.TECHNIQUE_LABEL_HEIGHT;
  }

  /**
   * Removes technique label gap
   */
  public removeTechniqueGap(): void {
    this._techniqueLabelsRect.height -=
      TabLayoutDimensions.TECHNIQUE_LABEL_HEIGHT;
    this._beatNotesElement.rect.y -= TabLayoutDimensions.TECHNIQUE_LABEL_HEIGHT;
    this._rect.height -= TabLayoutDimensions.TECHNIQUE_LABEL_HEIGHT;
  }

  /**
   * Scales beat element & all it's children horizontally
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number): void {
    if (this.beat.beamGroupId !== undefined) {
      const diff = this._rect.width * scale - this._durationRect.width;
      this._durationRect.x += diff / 2;
    } else {
      this._durationRect.x =
        (this._rect.width * scale) / 2 - this._durationRect.width / 2;
    }
    this._dotRect.x = this._durationRect.right;

    this._rect.x *= scale;
    this._rect.width *= scale;

    this._techniqueLabelsRect.x *= scale;
    this._techniqueLabelsRect.width *= scale;

    for (const techniqueLabelElement of this._techniqueLabelElements) {
      techniqueLabelElement.scaleHorBy(scale);
    }

    this._beatNotesElement.scaleHorBy(scale);
  }

  /** Beat's note element */
  public get beatNotesElement(): BeatNotesElement {
    return this._beatNotesElement;
  }

  /** Technique label element */
  public get techniqueLabelElements(): TechniqueLabelElement[] {
    return this._techniqueLabelElements;
  }

  /** This beat's rectangle */
  public get rect(): Rect {
    return this._rect;
  }

  /** This beat's duration rectangle */
  public get durationRect(): Rect {
    return this._durationRect;
  }

  /** This beat's dot rectangle */
  public get dotRect(): Rect {
    return this._dotRect;
  }

  /** Technique labels rectangle */
  public get techniqueLabelsRect(): Rect {
    return this._techniqueLabelsRect;
  }

  /** Selection status setter */
  public set selected(newSelectedValue: boolean) {
    this._selected = newSelectedValue;
  }
  /** Selection status getter */
  public get selected(): boolean {
    return this._selected;
  }
}
