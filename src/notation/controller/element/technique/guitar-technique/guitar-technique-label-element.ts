import {
  BendType,
  GuitarTechnique,
  GuitarTechniqueType,
} from "../../../../model";
import {
  Point,
  Rect,
  getPitchRatioNums,
  randomInt,
  ratioNumsToChar,
} from "../../../../../shared";
import { GuitarTechniqueDescriptors } from "./guitar-technique-descriptors";
import { TrackElement } from "../../track-element";
import { BeatElement } from "../../beat/beat-element";
import { TechGapLineContainer } from "../../staff/tech-gap-line-container";
import { TechniqueLabelElement } from "../technique-label-element";
import { SVGPathDescriptor, SVGTextDescriptor } from "../technique-element";
import type { BarElement } from "../../bar/bar-element";
import type { TrackLineElement } from "../../track/track-line-element";
import { NotationNodeType } from "../../notation-element";
import { TabBeatElement } from "../../beat/tab-beat-element";
import { GuitarTechniqueElement } from "./guitar-technique-element";

/**
 * Class that contains a guitar technique label
 */
export class GuitarTechniqueLabelElement implements TechniqueLabelElement {
  readonly nodeType = NotationNodeType.Element;

  public static createStableIdentity(
    gapLineContainer: TechGapLineContainer,
    technique: GuitarTechnique,
    beatElement: BeatElement
  ): string {
    return `technique-label:${gapLineContainer.techLineNumber}:${technique.uuid}:${beatElement.beat.uuid}`;
  }

  /** Technique label element's unique identifier */
  readonly uuid: number;
  /** Technique */
  readonly technique: GuitarTechnique;
  /** Parent tech gap line element */
  readonly gapLineContainer: TechGapLineContainer;
  /** Parent beat element */
  readonly beatElement: TabBeatElement;
  /** Root track element */
  readonly trackElement: TrackElement;
  readonly voiceNumber = null;

  public get owningTrackLineElement(): TrackLineElement {
    return this.gapLineContainer.owningTrackLineElement;
  }

  public get owningBarElement(): BarElement {
    return this.beatElement.barElement;
  }

  /** Outer rectangle */
  private _boundingBox: Rect;
  /** SVG path descriptors */
  private _pathDescriptors?: SVGPathDescriptor[];
  /** SVG text descriptors */
  private _textDescriptors?: SVGTextDescriptor[];

  /**
   * Class that contains an technique label
   * @param technique Technique
   * @param beatElement Corresponding beat element
   * @param gapLineContainer Parent gap line container
   */
  constructor(
    technique: GuitarTechnique,
    gapLineContainer: TechGapLineContainer,
    beatElement: TabBeatElement
  ) {
    this.uuid = randomInt();
    this.technique = technique;
    this.gapLineContainer = gapLineContainer;
    this.trackElement = this.gapLineContainer.trackElement;
    this.beatElement = beatElement;

    this._boundingBox = new Rect();
  }

  /** Returns bend curve ends in this label's descriptor coordinates. */
  private getBendCurveEndXs(): number[] {
    const noteElement = this.beatElement.getNoteElement(this.technique.note);
    const bendOptions = this.technique.bendOptions;
    if (noteElement === null || bendOptions === null) {
      throw Error(
        "Can't align bend label without its note element and options"
      );
    }
    const techniqueElement = noteElement.techniqueElements.find(
      (t) => t.technique === this.technique
    );
    if (!(techniqueElement instanceof GuitarTechniqueElement)) {
      throw Error("Could not find corresponding beat technique element");
    }

    return techniqueElement.calculateBendCurveEndXs(bendOptions.type);
  }

  /** Creates centered plain-text pitch labels at the bend curve ends. */
  private createPitchTexts(pitches: number[]): void {
    const curveEndXs = this.getBendCurveEndXs();
    if (curveEndXs.length !== pitches.length) {
      throw Error("Bend pitches must match bend curve ends");
    }

    const fontSize = this.trackElement.layoutDimensions.NOTE_TEXT_SIZE;
    const y = this._boundingBox.y + this._boundingBox.height / 2 - fontSize / 2;
    this._pathDescriptors = [];
    this._textDescriptors = pitches.map((pitch, index) =>
      GuitarTechniqueDescriptors.createTextDescriptor(
        curveEndXs[index],
        y,
        fontSize,
        ratioNumsToChar(getPitchRatioNums(pitch))
      )
    );
  }

  /**
   * Generates bend pitch HTML
   */
  private createBendPitchPath(): void {
    if (this.technique.bendOptions === null) {
      throw Error("Can't do bend label element - no bend options");
    }
    if (this.technique.bendOptions.bendPitch === undefined) {
      throw Error("Can't do bend label element - bend pitch null");
    }
    this.createPitchTexts([this.technique.bendOptions.bendPitch]);
  }

  /**
   * Generates prebend pitch HTML
   */
  private createPrebendPitchPath(): void {
    if (this.technique.bendOptions === null) {
      throw Error("Can't do prebend label element - no bend options");
    }
    if (this.technique.bendOptions.prebendPitch === undefined) {
      throw Error("Can't do prebend label element - prebend pitch null");
    }

    this.createPitchTexts([this.technique.bendOptions.prebendPitch]);
  }

  /**
   * Generates bend-and-release pitch HTML
   */
  private createBendAndReleasePitchPath(): void {
    if (this.technique.bendOptions === null) {
      throw Error(
        "Attempting to do bend & release label when bend options null"
      );
    }
    if (
      this.technique.bendOptions.bendPitch === undefined ||
      this.technique.bendOptions.releasePitch === undefined
    ) {
      throw Error(
        "Attempting to do bend & release label when bend/release values undefined"
      );
    }

    this.createPitchTexts([
      this.technique.bendOptions.bendPitch,
      this.technique.bendOptions.releasePitch,
    ]);
  }

  /**
   * Generates prebend-and-release pitch HTMLА
   */
  private createPrebendAndReleasePitchPath(): void {
    if (this.technique.bendOptions === null) {
      throw Error(
        "Attempting to do prebend & release label when bend options null"
      );
    }
    if (
      this.technique.bendOptions.prebendPitch === undefined ||
      this.technique.bendOptions.releasePitch === undefined
    ) {
      throw Error(
        "Attempting to do prebend & release label when prebend/release values undefined"
      );
    }

    this.createPitchTexts([
      this.technique.bendOptions.prebendPitch,
      this.technique.bendOptions.releasePitch,
    ]);
  }

  /** Generates a release pitch label. */
  private createReleasePitchPath(): void {
    const releasePitch = this.technique.bendOptions?.releasePitch;
    if (releasePitch === undefined) {
      throw Error("Can't do release label element - release pitch null");
    }

    this.createPitchTexts([releasePitch]);
  }

  /** Generates prebend and bend pitch labels. */
  private createPrebendBendPitchPath(): void {
    const prebendPitch = this.technique.bendOptions?.prebendPitch;
    const bendPitch = this.technique.bendOptions?.bendPitch;
    if (prebendPitch === undefined || bendPitch === undefined) {
      throw Error("Can't do prebend/bend labels - pitch null");
    }

    this.createPitchTexts([prebendPitch, bendPitch]);
  }

  /**
   * Generates regular vibrato HTML
   */
  private createVibratoPath(): void {
    const x =
      this._boundingBox.x +
      this._boundingBox.width / 2 -
      this._boundingBox.width / 4;
    const y = this._boundingBox.y + this._boundingBox.height / 2;
    const vibratoHeight = this.boundingBox.height / 6;
    const vibratoWidth = this.boundingBox.width / 2;
    this._pathDescriptors = [
      GuitarTechniqueDescriptors.createHorizontalVibratoPath(
        x,
        y,
        vibratoHeight,
        vibratoWidth
      ),
    ];
    this._textDescriptors = [];
  }

  /**
   * Generates Palm Mute HTML
   */
  private createPalmMutePath(): void {
    this.createRepeatedTextPath("P.M.");
  }

  private createLetRingPath(): void {
    this.createRepeatedTextPath("LR");
  }

  private createRepeatedTextPath(text: string): void {
    const x = this._boundingBox.x + this._boundingBox.width / 2;
    const y = this._boundingBox.y + this._boundingBox.height / 2;
    this._pathDescriptors = [];
    this._textDescriptors = [
      GuitarTechniqueDescriptors.createTextDescriptor(
        x,
        y,
        this.trackElement.layoutDimensions.NOTE_TEXT_SIZE,
        text
      ),
    ];
  }

  /**
   * Figures out which bend type label to generate
   */
  private createBendLabelPath(): void {
    if (this.technique.bendOptions === null) {
      throw Error(
        "Attempting to do prebend & release label when bend options null"
      );
    }

    switch (this.technique.bendOptions.type) {
      case BendType.Bend:
        this.createBendPitchPath();
        break;
      case BendType.Prebend:
        this.createPrebendPitchPath();
        break;
      case BendType.BendAndRelease:
        this.createBendAndReleasePitchPath();
        break;
      case BendType.PrebendAndRelease:
        this.createPrebendAndReleasePitchPath();
        break;
      case BendType.Hold:
        this.createBendTypeText("hold");
        break;
      case BendType.PrebendBend:
        this.createPrebendBendPitchPath();
        break;
      case BendType.Release:
        this.createReleasePitchPath();
        break;
      default:
        break;
    }
  }

  private createBendTypeText(text: string): void {
    const fontSize = this.trackElement.layoutDimensions.NOTE_TEXT_SIZE;
    this._pathDescriptors = [];
    this._textDescriptors = [
      GuitarTechniqueDescriptors.createTextDescriptor(
        this._boundingBox.width / 2,
        this._boundingBox.height / 2,
        fontSize,
        text,
        this._boundingBox.width
      ),
    ];
  }

  public build(): void {
    this._pathDescriptors = [];
    this._textDescriptors = [];
  }

  /**
   * Calculates the dimensions of the outer rectangle
   */
  public measure(): void {
    this._boundingBox.setDimensions(
      this.beatElement.boundingBox.width,
      this.trackElement.layoutDimensions.TECH_LABEL_HEIGHT
    );
  }

  private buildStateHash(): string {
    const hashArr: string[] = [
      `${this.barLocalBoundingBox.x}` +
        `${this.barLocalBoundingBox.y}` +
        `${this.barLocalBoundingBox.width}` +
        `${this.barLocalBoundingBox.height}` +
        `${JSON.stringify(this._pathDescriptors)}` +
        `${JSON.stringify(this._textDescriptors)}`,
    ];

    return hashArr.join("");
  }

  /**
   * Calculates the coordinates of the outer rectangle & the path
   */
  public layout(): void {
    // Setting to beat element's global coords since
    // the label element is inside the tech gap line
    // whose rect is always (0, 0, {track line width}, {gap line height})
    // this._boundingBox.setCoords(this.beatElement.globalCoords.x, 0);
    this._boundingBox.setCoords(0, 0);

    this.createPath();
  }

  /**
   * Updates the element fully
   */
  public update(): void {
    this.build();
    this.measure();
    this.layout();
  }

  public refreshOwnedNotationNodes(): TechniqueLabelElement[] {
    return [this];
  }

  /**
   * Builds technique label element path
   */
  public createPath(): void {
    this._pathDescriptors = [];
    this._textDescriptors = [];

    switch (this.technique.type) {
      case GuitarTechniqueType.Bend:
        this.createBendLabelPath();
        break;
      case GuitarTechniqueType.Vibrato:
        this.createVibratoPath();
        break;
      case GuitarTechniqueType.PalmMute:
        this.createPalmMutePath();
        break;
      case GuitarTechniqueType.LetRing:
        this.createLetRingPath();
        break;
    }
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this.buildStateHash();
  }

  public getStableIdentity(): string {
    return GuitarTechniqueLabelElement.createStableIdentity(
      this.gapLineContainer,
      this.technique,
      this.beatElement
    );
  }

  /**
   * Outer layout bounding box
   */
  public get boundingBox(): Rect {
    return this._boundingBox;
  }

  /** Coords of this element in its owning track line space */
  public get barLocalCoords(): Point {
    const barLineLocalCoords = this.beatElement.barElement.lineLocalCoords;
    return new Point(
      // NOTE: GPT 5.4's version:
      // this.beatElement.lineLocalCoords.x -
      //   barLineLocalCoords.x +
      //   this._boundingBox.x,
      this.beatElement.barLocalCoords.x + this._boundingBox.x,
      this.gapLineContainer.lineLocalCoords.y -
        barLineLocalCoords.y +
        this._boundingBox.y
    );
  }

  /** Bounding box of this element in bar-local coordinates */
  public get barLocalBoundingBox(): Rect {
    return new Rect(
      this.barLocalCoords.x,
      this.barLocalCoords.y,
      this._boundingBox.width,
      this._boundingBox.height
    );
  }

  /** Coords of this element in its owning track line space */
  public get lineLocalCoords(): Point {
    return new Point(
      this.beatElement.barElement.lineLocalCoords.x + this.barLocalCoords.x,
      this.beatElement.barElement.lineLocalCoords.y + this.barLocalCoords.y
    );
  }

  /** Bounding box of this element in track line-local coordinates */
  public get lineLocalBoundingBox(): Rect {
    return new Rect(
      this.lineLocalCoords.x,
      this.lineLocalCoords.y,
      this._boundingBox.width,
      this._boundingBox.height
    );
  }

  /** This element's layout bounding box in global coordinates */
  public get globalBoundingBox(): Rect {
    return new Rect(
      this.globalCoords.x,
      this.globalCoords.y,
      this._boundingBox.width,
      this._boundingBox.height
    );
  }

  public get rect(): Rect {
    return this.boundingBox;
  }

  public get globalRect(): Rect {
    return this.globalBoundingBox;
  }

  /**
   * SVG path descriptors
   */
  public get pathDescriptors(): SVGPathDescriptor[] | undefined {
    return this._pathDescriptors;
  }

  /** SVG text descriptors */
  public get textDescriptors(): SVGTextDescriptor[] | undefined {
    return this._textDescriptors;
  }

  /** Shared origin for descriptor-local coordinates in track line-local space */
  public get descriptorOriginBarLocal(): Point {
    return this.barLocalCoords;
  }

  /** Shared origin for descriptor-local coordinates in track line-local space */
  public get descriptorOriginLineLocal(): Point {
    return this.lineLocalCoords;
  }

  /** Shared origin for descriptor-local coordinates */
  public get descriptorOrigin(): Point {
    return this.globalCoords;
  }

  /** Global coords of the guitar technique label element */
  public get globalCoords(): Point {
    return new Point(
      this.beatElement.barElement.globalCoords.x + this.barLocalCoords.x,
      this.beatElement.barElement.globalCoords.y + this.barLocalCoords.y
    );
  }
}
