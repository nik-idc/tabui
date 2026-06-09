import {
  VoiceBar,
  Beat,
  DURATION_TO_FLAG_COUNT,
  Guitar,
  BarRepeatStatus,
  Bar,
} from "@/notation/model";
import { Rect, Point, randomInt } from "@/shared";
import { EditorLayoutDimensions } from "@/notation/controller/editor-layout-dimensions";
import { TrackElement } from "@/notation/controller/element/track-element";
import { calculateMasterBarDurationUnits } from "@/notation/controller/layout/bar-layout";
import { NotationElement } from "@/notation/controller/element/notation-element";
import {
  NotationStyle,
  StaffLineElement,
} from "@/notation/controller/element/staff/staff-line-element";
import { NotationStyleLineElement } from "@/notation/controller/element/staff/notation-style-line-element";
import { BeamSegmentElement } from "./beam-segment-element";
import { BarTupletGroupElement } from "./bar-tuplet-group-element";
import { TabBeatElement } from "../beat/tab-beat-element";
import { SheetBeatElement } from "../beat/sheet-beat-element";
import { BeatElement, getBeatWidth } from "../beat/beat-element";
import { HorLine, Line, VertLine } from "@/shared/rendering/geometry/line";
import { BarElement } from "./bar-element";

// TODO:: Fix repeat rects shifting when there are multple staves

/**
 * Class that handles geometry & visually relevant info of a bar
 */
export class VoiceBarElement implements NotationElement {
  public static createStableIdentity(
    notationStyle: NotationStyle,
    voiceBar: VoiceBar
  ): string {
    return `voice-bar:${voiceBar.uuid}:${notationStyle}`;
  }

  /** Unique identifier for the bar element */
  readonly uuid: number;
  /** The bar */
  readonly voiceBar: VoiceBar;
  /** Parent bar element */
  public barElement: BarElement;
  /** Root track element */
  readonly trackElement: TrackElement;

  /** This bar's beat elements */
  private _beatElements: BeatElement[];

  /** Bar element rectangle */
  private _boundingBox: Rect;

  constructor(voiceBar: VoiceBar, barElement: BarElement) {
    this.uuid = randomInt();
    this.voiceBar = voiceBar;
    this.trackElement = barElement.trackElement;
    this.barElement = barElement;

    this._beatElements = [];

    this._boundingBox = new Rect();

    this.build();
  }

  /**
   * Fills the beat elements array
   */
  public buildBeats(): void {
    const prevBeatElements = new Map(
      this._beatElements.map((e) => [e.getStableIdentity(), e])
    );

    this._beatElements = [];
    for (const beat of this.voiceBar.beats) {
      const existingBeatElement = prevBeatElements.get(
        TabBeatElement.createStableIdentity(this, beat)
      );
      if (existingBeatElement !== undefined) {
        existingBeatElement.build();
        this._beatElements.push(existingBeatElement);
        continue;
      }

      let beatElement: BeatElement;
      switch (this.barElement.notationStyle) {
        case NotationStyle.Classic:
          beatElement = new SheetBeatElement(beat, this);
          break;
        case NotationStyle.Tablature:
          beatElement = new TabBeatElement(beat, this);
          break;
        default:
          throw Error(
            `Unsupported notation style value: '${this.barElement.notationStyle}'`
          );
      }

      this._beatElements.push(beatElement);
    }
  }

  public build(): void {
    this.trackElement.registerElement(this);

    this.buildBeats();
  }

  /**
   * Measure the dimensions of all sub elements of this track line element
   */
  public measure(): void {
    for (const beatElement of this._beatElements) {
      beatElement.measure();
    }

    this._boundingBox.setDimensions(
      this.barElement.voiceContentWidth,
      this._beatElements[0].boundingBox.height
    );
  }

  /**
   * Calculates layout for all child elements, i.e. their X and Y coordinates
   */
  public layout(): void {
    this._boundingBox.setCoords(this.barElement.startGap.right, 0);

    for (const beatElement of this._beatElements) {
      beatElement.layout();
    }
  }

  /**
   * Updates the element fully
   */
  public update(): void {
    this.build();
    this.measure();
    this.layout();
  }

  public refreshOwnedNotationElements(): NotationElement[] {
    const elements: NotationElement[] = [this];

    elements.push(
      ...this._beatElements.flatMap((be) => be.refreshOwnedNotationElements())
    );

    return elements;
  }

  public getBeatX(beat: Beat): number {
    const masterBarIndex = this.voiceBar.bar.staff.bars.indexOf(
      this.voiceBar.bar
    );
    const durationUnits = calculateMasterBarDurationUnits(
      this.trackElement.track,
      masterBarIndex
    );
    if (durationUnits === 0) {
      return 0;
    }

    const beatStartUnits = beat.startTick / this.voiceBar.tickResolution;
    const beatStartRatio = beatStartUnits / durationUnits;

    return (
      EditorLayoutDimensions.RHYTHM_ATTACK_PADDING +
      beatStartRatio * this.voiceDurationSpanWidth
    );
  }

  public getBeatWidth(beat: Beat): number {
    const masterBarIndex = this.voiceBar.bar.staff.bars.indexOf(
      this.voiceBar.bar
    );
    const durationUnits = calculateMasterBarDurationUnits(
      this.trackElement.track,
      masterBarIndex
    );
    if (durationUnits === 0) {
      return 0;
    }

    const beatDurationTicks = beat.endTick - beat.startTick;
    const beatDurationUnits = beatDurationTicks / this.voiceBar.tickResolution;
    const beatDurationRatio = beatDurationUnits / durationUnits;

    return Math.max(
      EditorLayoutDimensions.MIN_RHYTHM_COLUMN_GAP,
      beatDurationRatio * this.voiceDurationSpanWidth
    );
  }

  private get voiceDurationSpanWidth(): number {
    return Math.max(
      0,
      this.barElement.voiceContentWidth -
        EditorLayoutDimensions.RHYTHM_ATTACK_PADDING * 2
    );
  }

  public getBeatElement(beat: Beat): BeatElement | null {
    const beatElement = this._beatElements.find((be) => be.beat === beat);
    return beatElement ?? null;
  }

  /**
   * Gets next beat element
   * @param beatElement Beat element
   * @returns Next beat element or null
   */
  public getNextBeatElement(beatElement: BeatElement): BeatElement | null {
    const beatIndex = this._beatElements.indexOf(beatElement);
    const nextBeat = this._beatElements[beatIndex + 1];
    return nextBeat ?? null;
  }

  /**
   * Gets prev beat element
   * @param beatElement Beat element
   * @returns Prev beat element or null
   */
  public getPrevBeatElement(beatElement: BeatElement): BeatElement | null {
    const beatIndex = this._beatElements.indexOf(beatElement);
    const prevBeat = this._beatElements[beatIndex - 1];
    return prevBeat ?? null;
  }

  /** String encoding the state of this element */
  public get stateHash(): string {
    const hashArr: string[] = [
      `${this.globalBoundingBox.x}` +
        `${this.globalBoundingBox.y}` +
        `${this.globalBoundingBox.width}` +
        `${this.globalBoundingBox.height}`,
    ];

    return hashArr.join("");
  }

  public getStableIdentity(): string {
    return VoiceBarElement.createStableIdentity(
      this.barElement.notationStyle,
      this.voiceBar
    );
  }

  /** This bar's beat elements */
  public get beatElements(): BeatElement[] {
    return this._beatElements;
  }

  /** Coords of this element in its owning track line space */
  public get lineLocalCoords(): Point {
    return new Point(
      this.barElement.lineLocalCoords.x + this._boundingBox.x,
      this.barElement.lineLocalCoords.y + this._boundingBox.y
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

  /** VoiceBar element layout bounding box */
  public get boundingBox(): Rect {
    return this._boundingBox;
  }

  /** This bar's layout bounding box in global coordinates */
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

  /** Global coords of the bar element */
  public get globalCoords(): Point {
    return new Point(
      this.barElement.globalCoords.x + this._boundingBox.x,
      this.barElement.globalCoords.y + this._boundingBox.y
    );
  }
}

export function getVoiceBarWidth(voiceBar: VoiceBar): number {
  let width = 0;

  if (voiceBar.bar.masterBar.repeatStatus === BarRepeatStatus.Start) {
    width += EditorLayoutDimensions.REPEAT_SIGN_WIDTH;
  }

  const prevBar: Bar | null = voiceBar.bar.staff.getPrevBar(voiceBar.bar);
  if (
    prevBar === null ||
    prevBar.masterBar.maxDuration !== voiceBar.bar.masterBar.maxDuration
  ) {
    width += EditorLayoutDimensions.TIME_SIG_RECT_WIDTH;
  }

  for (const beat of voiceBar.beats) {
    width += getBeatWidth(beat);
  }

  if (voiceBar.bar.masterBar.repeatStatus === BarRepeatStatus.End) {
    width += EditorLayoutDimensions.REPEAT_SIGN_WIDTH;
  }

  return width;
}
