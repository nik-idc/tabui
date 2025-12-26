import { randomInt, Rect } from "@/shared";
import { GuitarTechnique, Technique, TechniqueType } from "@/notation/model";
import { TabLayoutDimensions } from "../tab-controller-dim";
import {
  GuitarTechniqueLabelElement,
  TECHNIQUE_ALLOWS_STACKING,
  TechniqueLabelElement,
} from "./technique";
import { BeatElement } from "./beat-element";
import { TabBeatElement } from "./tab-beat-element";
import { TechGapElement } from "./tech-gap-element";

/**
 * Class representing a single line of a staff line's technique label gap
 */
export class TechGapLineElement {
  /** Technique label element's unique identifier */
  readonly uuid: number;
  /** Parent staff gap element */
  readonly techGapElement: TechGapElement;

  /** Maps each BeatElement instance to a Set of TechniqueType labels
   * already processed or drawn for that specific beat element */
  private _beatsLabelsMap = new Map<BeatElement, Set<TechniqueType>>();
  /** Label elements present on this tech gap line */
  private _labelElements: TechniqueLabelElement[];

  /** Outer rectangle */
  private _rect?: Rect;

  /**
   * Class representing a single line of a staff line's
   * technique label gap
   * @param techGapElement Tech gap element
   */
  constructor(techGapElement: TechGapElement) {
    this.uuid = randomInt();
    this.techGapElement = techGapElement;

    this._beatsLabelsMap = new Map();
    this._labelElements = [];
  }

  /**
   * Adds technique to the line
   * @param beatElement
   * @param technique
   */
  public addTechnique(beatElement: BeatElement, technique: Technique): void {
    let beatsLabels = this._beatsLabelsMap.get(beatElement);
    if (beatsLabels === undefined) {
      beatsLabels = new Set();
      this._beatsLabelsMap.set(beatElement, beatsLabels);
    }

    if (
      beatsLabels.has(technique.type) &&
      !TECHNIQUE_ALLOWS_STACKING[technique.type]
    ) {
      return;
    }

    let labelElement: TechniqueLabelElement;
    if (beatElement instanceof TabBeatElement) {
      labelElement = new GuitarTechniqueLabelElement(
        technique as GuitarTechnique,
        this,
        beatElement
      );
    } else {
      throw Error("Sheet beat elements not implemented yet");
    }

    this._labelElements.push(labelElement);
    beatsLabels.add(technique.type);

    if (this._rect === undefined) {
      this._rect = new Rect(
        0,
        0,
        this.techGapElement.rect.width,
        TabLayoutDimensions.TECH_LABEL_HEIGHT
      );
    }
  }

  /**
   * Goes through all the technique labels and sets their dimensions
   */
  public measure(): void {
    for (const label of this._labelElements) {
      label.measure();
    }
  }

  /**
   * Goes through all the technique labels and sets their coordinates
   */
  public layout(): void {
    for (const label of this._labelElements) {
      label.layout();
    }
  }

  /**
   * Scales the element & its children horizontally by the factor
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number): void {
    if (this._rect !== undefined) {
      this._rect.x *= scale;
      this._rect.width *= scale;
    }

    for (const label of this._labelElements) {
      label.scaleHorBy(scale);
    }
  }

  /** Line outer rectangle */
  public get rect(): Rect | undefined {
    return this._rect;
  }

  /** Maps each BeatElement instance to a Set of TechniqueType labels already processed or drawn for that specific beat elemen */
  public get beatsLabelsMap(): Map<BeatElement, Set<TechniqueType>> {
    return this._beatsLabelsMap;
  }

  /** Label elements present on this tech gap line */
  public get labelElements(): TechniqueLabelElement[] {
    return this._labelElements;
  }
}
