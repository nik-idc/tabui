import { Point, randomInt, Rect } from "@/shared";
import { GuitarTechnique, Technique, TechniqueType } from "@/notation/model";
import { EditorLayoutDimensions } from "@/notation/controller/editor-layout-dimensions";
import { TrackElement } from "@/notation/controller/element/track-element";
import { NotationElement } from "@/notation/controller/element/notation-element";
import { BeatElement } from "@/notation/controller/element/beat/beat-element";
import { TabBeatElement } from "@/notation/controller/element/beat/tab-beat-element";
import {
  GuitarTechniqueLabelElement,
  TECHNIQUE_ALLOWS_STACKING,
  TechLineNumber,
} from "@/notation/controller/element/technique/guitar-technique";
import { TechniqueLabelElement } from "@/notation/controller/element/technique";
import { TechGapElement } from "./tech-gap-element";

/**
 * Class representing a single line of a staff line's technique label gap
 */
export class TechGapLineElement implements NotationElement {
  public static createStableIdentity(
    techGapElement: TechGapElement,
    techLineNumber: TechLineNumber
  ): string {
    return `tech-gap-line:${techGapElement.getStableIdentity()}:${techLineNumber}`;
  }

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
  /** Label elements indexed by stable identity */
  private _labelElementsByIdentity: Map<string, TechniqueLabelElement>;
  /** Previous label elements indexed by stable identity during build */
  private _prevLabelElementsByIdentity: Map<string, TechniqueLabelElement>;

  /** Outer rectangle */
  private _boundingBox?: Rect;
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

    this._beatsLabelsMap = new Map();
    this._labelElements = [];
    this._labelElementsByIdentity = new Map();
    this._prevLabelElementsByIdentity = new Map();

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

    const stableIdentity =
      beatElement instanceof TabBeatElement
        ? GuitarTechniqueLabelElement.createStableIdentity(
            this,
            technique as GuitarTechnique,
            beatElement
          )
        : "";
    let labelElement = this._prevLabelElementsByIdentity.get(stableIdentity);
    if (labelElement !== undefined) {
      labelElement.build();
      this._labelElements.push(labelElement);
      this._labelElementsByIdentity.set(stableIdentity, labelElement);
      beatsLabels.add(technique.type);
      return;
    }

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
    this._labelElementsByIdentity.set(stableIdentity, labelElement);
    beatsLabels.add(technique.type);

    if (this._boundingBox === undefined) {
      this._boundingBox = new Rect(
        0,
        0,
        this.techGapElement.boundingBox.width,
        EditorLayoutDimensions.TECH_LABEL_HEIGHT
      );
    }
  }

  /**
   * Clears transient label state before repopulating.
   */
  public build(): void {
    this.trackElement.registerElement(this);
    this._prevLabelElementsByIdentity = new Map(this._labelElementsByIdentity);
    this._beatsLabelsMap = new Map();
    this._labelElements = [];
    this._labelElementsByIdentity.clear();
    this._boundingBox = undefined;
  }

  /**
   * Goes through all the technique labels and sets their dimensions
   */
  public measure(): void {
    if (this._labelElements.length === 0) {
      this._boundingBox = undefined;
      return;
    }

    if (this._boundingBox === undefined) {
      this._boundingBox = new Rect();
    }
    this._boundingBox.setDimensions(
      this.techGapElement.boundingBox.width,
      EditorLayoutDimensions.TECH_LABEL_HEIGHT
    );

    for (const label of this._labelElements) {
      label.measure();
    }
  }

  private buildStateHash(): string {
    const hashArr: string[] = [];

    if (this.globalBoundingBox.width !== undefined) {
      hashArr.push(`${this.globalBoundingBox.x}`);
      hashArr.push(`${this.globalBoundingBox.y}`);
      hashArr.push(`${this.globalBoundingBox.width}`);
      hashArr.push(`${this.globalBoundingBox.height}`);
    }

    return hashArr.join("");
  }

  /**
   * Goes through all the technique labels and sets their coordinates
   */
  public layout(): void {
    if (this._boundingBox === undefined) {
      return;
    }

    const prevLine = this.techGapElement.getPrevGapLine(this);
    const y = prevLine?.boundingBox.bottom ?? 0;
    this._boundingBox.setCoords(0, y);

    for (const label of this._labelElements) {
      label.layout();
    }
  }

  public update(): void {
    this.build();
    this.measure();
    this.layout();
  }

  public refreshOwnedNotationElements(): NotationElement[] {
    return [
      this,
      ...this._labelElements.flatMap((label) =>
        label.refreshOwnedNotationElements()
      ),
    ];
  }

  /**
   * Scales the element & its children horizontally by the factor
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number): void {
    if (this._boundingBox !== undefined) {
      this._boundingBox.x *= scale;
      this._boundingBox.width *= scale;
    }

    for (const label of this._labelElements) {
      label.scaleHorBy(scale);
    }
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this._boundingBox === undefined ? "" : this.buildStateHash();
  }

  public getStableIdentity(): string {
    return TechGapLineElement.createStableIdentity(
      this.techGapElement,
      this.techLineNumber
    );
  }

  /** Global coords of the notation style line element */
  public get globalCoords(): Point {
    return new Point(
      this.techGapElement.globalCoords.x + (this._boundingBox?.x ?? 0),
      this.techGapElement.globalCoords.y + (this._boundingBox?.y ?? 0)
    );
  }

  /** Line outer layout bounding box */
  public get boundingBox(): Rect {
    // Fallback keeps interface contract for not-yet-measured instances.
    return this._boundingBox ?? new Rect();
  }

  /** Coords of this element in its owning track line space */
  public get lineLocalCoords(): Point {
    return new Point(
      this.techGapElement.lineLocalCoords.x + (this._boundingBox?.x ?? 0),
      this.techGapElement.lineLocalCoords.y + (this._boundingBox?.y ?? 0)
    );
  }

  /** Bounding box of this element in track line-local coordinates */
  public get lineLocalBoundingBox(): Rect {
    return new Rect(
      this.lineLocalCoords.x,
      this.lineLocalCoords.y,
      this._boundingBox?.width ?? 0,
      this._boundingBox?.height ?? 0
    );
  }

  /** This element's layout bounding box in global coordinates */
  public get globalBoundingBox(): Rect {
    return new Rect(
      this.globalCoords.x,
      this.globalCoords.y,
      this._boundingBox?.width,
      this._boundingBox?.height
    );
  }

  public get rect(): Rect {
    return this.boundingBox;
  }

  public get globalRect(): Rect {
    return this.globalBoundingBox;
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
