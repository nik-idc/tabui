import { Point, randomInt, Rect } from "@/shared";
import { GuitarTechnique, Technique, TechniqueType } from "@/notation/model";
import { TabLayoutDimensions } from "../tab-controller-dim";
import {
  GuitarTechniqueLabelElement,
  TECHNIQUE_ALLOWS_STACKING,
  TechLineNumber,
  TechniqueLabelElement,
} from "./technique";
import { BeatElement } from "./beat-element";
import { TabBeatElement } from "./tab-beat-element";
import { TechGapElement } from "./tech-gap-element";
import { NotationElement } from "./notation-element";
import { TrackElement } from "./track-element";

/**
 * Class representing a single line of a staff line's technique label gap
 */
export class TechGapLineElement implements NotationElement {
  /** Technique label element's unique identifier */
  readonly uuid: number;
  /** Parent staff gap element */
  readonly techGapElement: TechGapElement;
  /** Line number in tech gap (1/2/3) */
  readonly techLineNumber: TechLineNumber;
  /** Root track element */
  readonly trackElement: TrackElement;

  /** Maps each BeatElement instance to a Set of TechniqueType labels
   * already processed or drawn for that specific beat element */
  private _beatsLabelsMap = new Map<BeatElement, Set<TechniqueType>>();
  /** Label elements present on this tech gap line */
  private _labelElements: TechniqueLabelElement[];

  /** Outer rectangle */
  private _rect?: Rect;
  /** String encoding the state of this element */
  private _stateHash: string;

  /**
   * Class representing a single line of a staff line's
   * technique label gap
   * @param techGapElement Tech gap element
   * @param techLineNumber Line number in the gap
   */
  constructor(techGapElement: TechGapElement, techLineNumber: TechLineNumber) {
    this.uuid = randomInt();
    this.techGapElement = techGapElement;
    this.techLineNumber = techLineNumber;
    this.trackElement = this.techGapElement.trackElement;

    this._stateHash = "";

    this._beatsLabelsMap = new Map();
    this._labelElements = [];

    this.trackElement.registerElement(this);
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

  /** Dummy build function to comply with the interface
   * TODO: Rethink this element's update process
   */
  public build(): void {}

  /**
   * Goes through all the technique labels and sets their dimensions
   */
  public measure(): void {
    for (const label of this._labelElements) {
      label.measure();
    }
  }

  /**
   * Calculates the state hash of the element
   * */
  private calcStateHash(): void {
    const hashArr: string[] = [];

    if (this.globalRect.width !== undefined) {
      hashArr.push(`${this.globalRect.x}`);
      hashArr.push(`${this.globalRect.y}`);
      hashArr.push(`${this.globalRect.width}`);
      hashArr.push(`${this.globalRect.height}`);
    }

    this._stateHash = hashArr.join("");

    // checkIfDirty removed - now handled by checkAllDirty() in TrackElement
    // this.trackElement.checkIfDirty(this);
  }

  /**
   * Goes through all the technique labels and sets their coordinates
   */
  public layout(): void {
    const prevLine = this.techGapElement.getPrevGapLine(this);
    const y = prevLine?.rect.bottom ?? 0;
    this._rect?.setCoords(0, y);

    for (const label of this._labelElements) {
      label.layout();
    }

    // Calculating state hash moved to scaleHorBy
    // this.calcStateHash();
  }

  public update(): void {
    this.build();
    this.measure();
    this.layout();
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

    // // Calculating state hash at the last step of
    // // element's update process - layout
    // this.calcStateHash();
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this._stateHash;
  }

  public getModelUUID(): number {
    return this.techGapElement.getModelUUID() + this.techLineNumber;
  }

  /** Global coords of the notation style line element */
  public get globalCoords(): Point {
    return new Point(
      this.techGapElement.globalCoords.x + (this._rect?.x ?? 0),
      this.techGapElement.globalCoords.y + (this._rect?.y ?? 0)
    );
  }

  /** Line outer rectangle */
  public get rect(): Rect {
    // Fallback keeps interface contract for not-yet-measured instances.
    return this._rect ?? new Rect();
  }

  /** This element's rect in global coords */
  public get globalRect(): Rect {
    return new Rect(
      this.globalCoords.x,
      this.globalCoords.y,
      this._rect?.width,
      this._rect?.height
    );
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
