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
} from "../../../../../shared";
import { GuitarTechniqueDescriptors } from "./guitar-technique-descriptors";
import { TrackElement } from "../../track-element";
import { BeatElement } from "../../beat/beat-element";
import { TechGapLineElement } from "../../staff/tech-gap-line-element";
import { TechniqueLabelElement } from "../technique-label-element";
import { SVGPathDescriptor, SVGTextDescriptor } from "../technique-element";
import type { BarElement } from "../../bar/bar-element";
import type { TrackLineElement } from "../../track/track-line-element";

/**
 * Class that contains a guitar technique label
 */
export class GuitarTechniqueLabelElement implements TechniqueLabelElement {
  public static createStableIdentity(
    gapLineElement: TechGapLineElement,
    technique: GuitarTechnique,
    beatElement: BeatElement
  ): string {
    const trackLineStableIdentity =
      gapLineElement.techGapElement.notationStyleLineElement.staffLineElement.trackLineElement.getStableIdentity();
    return `technique-label:${trackLineStableIdentity}:${gapLineElement.techLineNumber}:${technique.uuid}:${beatElement.beat.uuid}`;
  }

  /** Technique label element's unique identifier */
  readonly uuid: number;
  /** Technique */
  readonly technique: GuitarTechnique;
  /** Parent tech gap line element */
  readonly gapLineElement: TechGapLineElement;
  /** Parent beat element */
  readonly beatElement: BeatElement;
  /** Root track element */
  readonly trackElement: TrackElement;
  readonly voiceNumber = null;

  public get owningTrackLineElement(): TrackLineElement {
    return this.gapLineElement.owningTrackLineElement;
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
   * @param gapLineElement Parent gap line element
   */
  constructor(
    technique: GuitarTechnique,
    gapLineElement: TechGapLineElement,
    beatElement: BeatElement
  ) {
    this.uuid = randomInt();
    this.technique = technique;
    this.gapLineElement = gapLineElement;
    this.trackElement = this.gapLineElement.trackElement;
    this.beatElement = beatElement;

    this._boundingBox = new Rect();
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

    const nums = getPitchRatioNums(this.technique.bendOptions.bendPitch);
    const bigNumSize = this.trackElement.layoutDimensions.NOTE_TEXT_SIZE;
    const x = this._boundingBox.x + this._boundingBox.width - bigNumSize / 2;
    const y =
      this._boundingBox.y + this._boundingBox.height / 2 - bigNumSize / 2;

    this._pathDescriptors = [];
    this._textDescriptors = [];

    if ([1, 2, 3].includes(nums[0]) && nums[1] === 0) {
      let text: string;
      switch (nums[0]) {
        case 1:
          text = "full";
          break;
        case 2:
          text = "2";
          break;
        case 3:
          text = "3";
          break;
        default:
          text = "full";
          break;
      }
      this._textDescriptors = [
        GuitarTechniqueDescriptors.createTextDescriptor(
          x,
          y,
          this.trackElement.layoutDimensions.NOTE_TEXT_SIZE,
          text
        ),
      ];
      return;
    }

    const ratio = GuitarTechniqueDescriptors.createRatioDescriptors(
      nums[0],
      nums[1],
      nums[2],
      x,
      y,
      bigNumSize
    );
    this._pathDescriptors = ratio.pathDescriptors;
    this._textDescriptors = ratio.textDescriptors;
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

    const nums = getPitchRatioNums(this.technique.bendOptions.prebendPitch);

    const bigNumSize = this.trackElement.layoutDimensions.NOTE_TEXT_SIZE;
    const x = this._boundingBox.x + this._boundingBox.width / 2;
    const y =
      this._boundingBox.y + this._boundingBox.height / 2 - bigNumSize / 2;
    const ratio = GuitarTechniqueDescriptors.createRatioDescriptors(
      nums[0],
      nums[1],
      nums[2],
      x,
      y,
      bigNumSize
    );
    this._pathDescriptors = ratio.pathDescriptors;
    this._textDescriptors = ratio.textDescriptors;
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

    if (
      this.technique.bendOptions.bendPitch ===
      this.technique.bendOptions.releasePitch
    ) {
      this.createBendPitchPath();
      return;
    }

    const bigNumSize = this.trackElement.layoutDimensions.NOTE_TEXT_SIZE;
    const xBend = this._boundingBox.x + this._boundingBox.width - bigNumSize;
    const xRelease = xBend + bigNumSize * 1.5;
    const y =
      this._boundingBox.y +
      this._boundingBox.height / 2 -
      this.trackElement.layoutDimensions.NOTE_TEXT_SIZE / 2;

    const bendNums = getPitchRatioNums(this.technique.bendOptions.bendPitch);
    const bendDescriptors = GuitarTechniqueDescriptors.createRatioDescriptors(
      bendNums[0],
      bendNums[1],
      bendNums[2],
      xBend,
      y,
      bigNumSize
    );

    const releaseNums = getPitchRatioNums(
      this.technique.bendOptions.releasePitch
    );
    const releaseDescriptors =
      GuitarTechniqueDescriptors.createRatioDescriptors(
        releaseNums[0],
        releaseNums[1],
        releaseNums[2],
        xRelease,
        y,
        bigNumSize
      );

    this._pathDescriptors = [
      ...bendDescriptors.pathDescriptors,
      ...releaseDescriptors.pathDescriptors,
    ];
    this._textDescriptors = [
      ...bendDescriptors.textDescriptors,
      ...releaseDescriptors.textDescriptors,
    ];
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

    if (
      this.technique.bendOptions.prebendPitch ===
      this.technique.bendOptions.releasePitch
    ) {
      this.createPrebendPitchPath();
      return;
    }

    const bigNumSize = this.trackElement.layoutDimensions.NOTE_TEXT_SIZE;
    const xPrebend =
      this._boundingBox.x + this._boundingBox.width / 2 + bigNumSize / 4;
    const xRelease = xPrebend + bigNumSize * 1.5;
    const y =
      this._boundingBox.y +
      this._boundingBox.height / 2 -
      this.trackElement.layoutDimensions.NOTE_TEXT_SIZE / 2;

    const prebendNums = getPitchRatioNums(
      this.technique.bendOptions.prebendPitch
    );
    const prebendDescriptors =
      GuitarTechniqueDescriptors.createRatioDescriptors(
        prebendNums[0],
        prebendNums[1],
        prebendNums[2],
        xPrebend,
        y,
        bigNumSize
      );

    const releaseNums = getPitchRatioNums(
      this.technique.bendOptions.releasePitch
    );
    const releaseDescriptors =
      GuitarTechniqueDescriptors.createRatioDescriptors(
        releaseNums[0],
        releaseNums[1],
        releaseNums[2],
        xRelease,
        y,
        bigNumSize
      );

    this._pathDescriptors = [
      ...prebendDescriptors.pathDescriptors,
      ...releaseDescriptors.pathDescriptors,
    ];
    this._textDescriptors = [
      ...prebendDescriptors.textDescriptors,
      ...releaseDescriptors.textDescriptors,
    ];
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
    const x =
      this._boundingBox.x +
      this._boundingBox.width / 2 -
      this.trackElement.layoutDimensions.NOTE_TEXT_SIZE;
    const y = this._boundingBox.y + this._boundingBox.height / 2;
    this._pathDescriptors = [];
    this._textDescriptors = [
      GuitarTechniqueDescriptors.createTextDescriptor(
        x,
        y,
        this.trackElement.layoutDimensions.NOTE_TEXT_SIZE,
        "P.M."
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
      default:
        break;
    }
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

  public refreshOwnedNotationElements(): TechniqueLabelElement[] {
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
    }
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this.buildStateHash();
  }

  public getStableIdentity(): string {
    return GuitarTechniqueLabelElement.createStableIdentity(
      this.gapLineElement,
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
      this.gapLineElement.lineLocalCoords.y -
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
