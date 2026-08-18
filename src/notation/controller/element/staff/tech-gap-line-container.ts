import { Point, randomInt, Rect } from "../../../../shared";
import { GuitarTechnique, Technique, TechniqueType } from "../../../model";
import { TrackElement } from "../track-element";
import {
  NotationContainer,
  NotationNode,
  NotationNodeType,
} from "../notation-element";
import { BeatElement } from "../beat/beat-element";
import { TabBeatElement } from "../beat/tab-beat-element";
import {
  GuitarTechniqueLabelElement,
  TECHNIQUE_ALLOWS_STACKING,
  TechLineNumber,
} from "../technique/guitar-technique";
import { TechniqueLabelElement } from "../technique";
import { TechGapContainer } from "./tech-gap-container";
import type { BarElement } from "../bar/bar-element";
import type { TrackLineElement } from "../track/track-line-element";

/**
 * Class representing a single line of a staff line's technique label gap
 */
export class TechGapLineContainer implements NotationContainer {
  readonly nodeType = NotationNodeType.Container;

  public static createStableIdentity(
    techGapContainer: TechGapContainer,
    techLineNumber: TechLineNumber
  ): string {
    return `tech-gap-line:${techGapContainer.getStableIdentity()}:${techLineNumber}`;
  }

  /** Technique label element's unique identifier */
  readonly uuid: number;
  /** Parent staff gap element */
  readonly techGapContainer: TechGapContainer;
  /** Line number in tech gap (1/2/3) */
  readonly techLineNumber: TechLineNumber;
  /** Root track element */
  readonly trackElement: TrackElement;
  readonly voiceNumber = null;

  public get owningTrackLineElement(): TrackLineElement {
    return this.techGapContainer.notationStyleLineContainer.staffLineContainer
      .trackLineElement;
  }

  public get owningBarElement(): BarElement | null {
    return null;
  }

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
   * @param techGapContainer Tech gap element
   * @param techLineNumber Line number in the gap
   */
  constructor(
    techGapContainer: TechGapContainer,
    techLineNumber: TechLineNumber
  ) {
    this.uuid = randomInt();
    this.techGapContainer = techGapContainer;
    this.techLineNumber = techLineNumber;
    this.trackElement = this.techGapContainer.trackElement;

    this._beatsLabelsMap = new Map();
    this._labelElements = [];
    this._labelElementsByIdentity = new Map();
    this._prevLabelElementsByIdentity = new Map();
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
        this.techGapContainer.boundingBox.width,
        this.trackElement.layoutDimensions.TECH_LABEL_HEIGHT
      );
    }
  }

  /**
   * Clears transient label state before repopulating.
   */
  public build(): void {
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
    const reservesRow =
      this.techGapContainer.notationStyleLineContainer.hasTechniqueLine(
        this.techLineNumber
      );
    if (this._labelElements.length === 0 && !reservesRow) {
      this._boundingBox = undefined;
      return;
    }

    if (this._boundingBox === undefined) {
      this._boundingBox = new Rect();
    }
    this._boundingBox.setDimensions(
      this.techGapContainer.boundingBox.width,
      this.trackElement.layoutDimensions.TECH_LABEL_HEIGHT
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

    const prevLine = this.techGapContainer.getPrevGapLine(this);
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

  public refreshOwnedNotationNodes(): NotationNode[] {
    return [
      this,
      ...this._labelElements.flatMap((label) =>
        label.refreshOwnedNotationNodes()
      ),
    ];
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this._boundingBox === undefined ? "" : this.buildStateHash();
  }

  public getStableIdentity(): string {
    return TechGapLineContainer.createStableIdentity(
      this.techGapContainer,
      this.techLineNumber
    );
  }

  /** Global coords of the notation style line element */
  public get globalCoords(): Point {
    return new Point(
      this.techGapContainer.globalCoords.x + (this._boundingBox?.x ?? 0),
      this.techGapContainer.globalCoords.y + (this._boundingBox?.y ?? 0)
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
      this.techGapContainer.lineLocalCoords.x + (this._boundingBox?.x ?? 0),
      this.techGapContainer.lineLocalCoords.y + (this._boundingBox?.y ?? 0)
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
