import {
  BendType,
  GuitarTechnique,
  GuitarTechniqueType,
} from "@/notation/model";
import { Point, Rect, getPitchRatioNums, randomInt } from "@/shared";
import { SVGUtils } from "./guitar-technique-html";
import { TabLayoutDimensions } from "@/notation/controller/tab-controller-dim";
import { TechniqueLabelElement } from "../technique-label-element";
import { BeatElement } from "../../beat-element";
import { TechGapLineElement } from "../../tech-gap-line-element";
import { TrackElement } from "../../track-element";

/**
 * Class that contains a guitar technique label
 */
export class GuitarTechniqueLabelElement implements TechniqueLabelElement {
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

  /** Outer rectangle */
  private _rect: Rect;
  /** SVG path */
  private _svgPath?: string;
  /** String encoding the state of this element */
  private _stateHash: string;

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

    this._stateHash = "";

    this._rect = new Rect();

    this.trackElement.registerElement(this);
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
    const bigNumSize = TabLayoutDimensions.NOTE_TEXT_SIZE;
    const x = this._rect.x + this._rect.width - bigNumSize / 2;
    const y = this._rect.y + this._rect.height / 2 - bigNumSize / 2;

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
      this._svgPath = SVGUtils.textSVGHTML(
        x,
        y,
        TabLayoutDimensions.NOTE_TEXT_SIZE,
        text
      );
      return;
    }

    this._svgPath = SVGUtils.ratioSVGHTML(
      nums[0],
      nums[1],
      nums[2],
      x,
      y,
      bigNumSize
    );
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

    const bigNumSize = TabLayoutDimensions.NOTE_TEXT_SIZE;
    const x = this._rect.x + this._rect.width / 2;
    const y = this._rect.y + this._rect.height / 2 - bigNumSize / 2;
    this._svgPath = SVGUtils.ratioSVGHTML(
      nums[0],
      nums[1],
      nums[2],
      x,
      y,
      bigNumSize
    );
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

    const bigNumSize = TabLayoutDimensions.NOTE_TEXT_SIZE;
    const xBend = this._rect.x + this._rect.width - bigNumSize;
    const xRelease = xBend + bigNumSize * 1.5;
    const y =
      this._rect.y +
      this._rect.height / 2 -
      TabLayoutDimensions.NOTE_TEXT_SIZE / 2;

    const bendNums = getPitchRatioNums(this.technique.bendOptions.bendPitch);
    const bendHTML = SVGUtils.ratioSVGHTML(
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
    const releaseHTML = SVGUtils.ratioSVGHTML(
      releaseNums[0],
      releaseNums[1],
      releaseNums[2],
      xRelease,
      y,
      bigNumSize
    );

    this._svgPath = bendHTML + releaseHTML;
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

    const bigNumSize = TabLayoutDimensions.NOTE_TEXT_SIZE;
    const xPrebend = this._rect.x + this._rect.width / 2 + bigNumSize / 4;
    const xRelease = xPrebend + bigNumSize * 1.5;
    const y =
      this._rect.y +
      this._rect.height / 2 -
      TabLayoutDimensions.NOTE_TEXT_SIZE / 2;

    const prebendNums = getPitchRatioNums(
      this.technique.bendOptions.prebendPitch
    );
    const prebendHTML = SVGUtils.ratioSVGHTML(
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
    const releaseHTML = SVGUtils.ratioSVGHTML(
      releaseNums[0],
      releaseNums[1],
      releaseNums[2],
      xRelease,
      y,
      bigNumSize
    );

    this._svgPath = prebendHTML + releaseHTML;
  }

  /**
   * Generates regular vibrato HTML
   */
  private createVibratoPath(): void {
    const x = this._rect.x + this._rect.width / 2 - this._rect.width / 4;
    const y = this._rect.y + this._rect.height / 2;
    const vibratoHeight = this.rect.height / 6;
    const vibratoWidth = this.rect.width / 2;
    this._svgPath = SVGUtils.horizontalSquigglySVGHTML(
      x,
      y,
      vibratoHeight,
      vibratoWidth
    );
  }

  /**
   * Generates Palm Mute HTML
   */
  private createPalmMutePath(): void {
    const x =
      this._rect.x + this._rect.width / 2 - TabLayoutDimensions.NOTE_TEXT_SIZE;
    const y = this._rect.y + this._rect.height / 2;
    this._svgPath = SVGUtils.textSVGHTML(
      x,
      y,
      TabLayoutDimensions.NOTE_TEXT_SIZE,
      "P.M."
    );
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

  /**
   * Dummy build function (for now)
   * TODO: Rethink how this element is done
   */
  public build(): void {}

  /**
   * Calculates the dimensions of the outer rectangle
   */
  public measure(): void {
    this._rect.setDimensions(
      this.beatElement.rect.width,
      TabLayoutDimensions.TECH_LABEL_HEIGHT
    );
  }

  /**
   * Calculates the state hash of the element
   * */
  private calcStateHash(): void {
    const hashArr: string[] = [
      `${this.globalRect.x}` +
        `${this.globalRect.y}` +
        `${this.globalRect.width}` +
        `${this.globalRect.height}`,
    ];

    this._stateHash = hashArr.join("");

    // // Prompt the track element to check if this element has changed
    // this.trackElement.checkIfDirty(this);
  }

  /**
   * Calculates the coordinates of the outer rectangle & the path
   */
  public layout(): void {
    // Setting to beat element's global coords since
    // the label element is inside the tech gap line
    // whose rect is always (0, 0, {track line width}, {gap line height})
    // this._rect.setCoords(this.beatElement.globalCoords.x, 0);
    this._rect.setCoords(0, 0);

    this.createPath();

    // Calculating state hash at the last step of
    // element's update process - layout
    this.calcStateHash();
  }

  /**
   * Updates the element fully
   */
  public update(): void {
    this.build();
    this.measure();
    this.layout();
  }

  /**
   * Builds technique label element path
   */
  public createPath(): void {
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

  /**
   * Scales the label horizontally
   * @param scale Scale factor
   */
  public scaleHorBy(scale: number): void {
    this._rect.x *= scale;
    this._rect.width *= scale;

    this.createPath();

    // Calculating state hash at the last step of
    // element's update process - layout
    this.calcStateHash();
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    return this._stateHash;
  }

  public getModelUUID(): number {
    return (
      this.gapLineElement.getModelUUID() +
      this.technique.uuid +
      this.beatElement.beat.uuid
    );
  }

  /**
   * Outer rectangle
   */
  public get rect(): Rect {
    return this._rect;
  }

  /** This element's rect in global coords */
  public get globalRect(): Rect {
    return new Rect(
      this.globalCoords.x,
      this.globalCoords.y,
      this._rect.width,
      this._rect.height
    );
  }

  /**
   * SVG path (full path HTML including styling, i.e. transparent/non-transparent)
   */
  public get svgPath(): string | undefined {
    return this._svgPath;
  }

  /** Global coords of the guitar technique label element */
  public get globalCoords(): Point {
    return new Point(
      this.beatElement.globalCoords.x + this._rect.x,
      this.gapLineElement.globalCoords.y
    );
  }
}

// ==== TOO AFRAID TO DELETE ====
// /**
//  * Calculates the outer rectangle
//  */
// private createRect(): void {
//   const existingLabels = this.techniqueLabelElements;

//   let y = 0;
//   const siblingLabel = existingLabels.find(
//     (l) => l.technique.type === this.technique.type
//   );
//   if (
//     TECHNIQUE_ALLOWS_STACKING[this.technique.type] &&
//     siblingLabel !== undefined
//   ) {
//     y = siblingLabel.rect.y;
//   } else {
//     y = existingLabels[existingLabels.length - 1]?.rect.y ?? 0;
//   }

//   this._rect.set(
//     0,
//     y,
//     this.rect.width,
//     TabLayoutDimensions.TECH_LABEL_HEIGHT
//   );
// }
