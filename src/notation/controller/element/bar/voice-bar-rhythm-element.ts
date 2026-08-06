import { VoiceBar, VoiceNumber } from "../../../model";
import { TrackElement } from "../track-element";
import {
  BarTupletGroupElement,
  BeamSegmentElement,
  NotationElement,
  TabBeatElement,
} from "..";
import { Point, randomInt, Rect } from "../../../../shared";
import { VoiceBarElement } from "./voice-bar-element";
import { TabBeatRhythmElement } from "../beat/tab-beat-rhythm-element";
import { BarElement } from "./bar-element";
import type { TrackLineElement } from "../track/track-line-element";

export class VoiceBarRhythmElement implements NotationElement {
  /** Unique identifier for the bar element */
  readonly uuid: number;
  /** The bar */
  readonly voiceBar?: VoiceBar;
  /** Voice number for this rhythm row. */
  readonly voiceNumber: VoiceNumber;
  /** Parent bar element */
  public barElement: BarElement;
  /** Corresponding voice bar element */
  public voiceBarElement?: VoiceBarElement;
  /** Root track element */
  readonly trackElement: TrackElement;

  public get owningTrackLineElement(): TrackLineElement {
    return this.barElement.owningTrackLineElement;
  }

  public get owningBarElement(): BarElement {
    return this.barElement;
  }

  /** Beat stem elements for each beat of the voice bar element */
  private _beatRhythmElements: TabBeatRhythmElement[];
  /** Beam segments of this bar element */
  private _beamSegments: BeamSegmentElement[];
  /** All tuplet element */
  private _tupletElements: BarTupletGroupElement[];

  /** Bar element rectangle */
  private _boundingBox: Rect;

  constructor(
    barElement: BarElement,
    voiceNumber: VoiceNumber,
    voiceBarElement?: VoiceBarElement
  ) {
    this.uuid = randomInt();
    this.voiceBar = voiceBarElement?.voiceBar;
    this.voiceNumber = voiceNumber;
    this.trackElement = barElement.trackElement;
    this.barElement = barElement;
    this.voiceBarElement = voiceBarElement;

    this._beatRhythmElements = [];
    this._beamSegments = [];
    this._tupletElements = [];

    this._boundingBox = new Rect();

    this.build();
  }

  private buildBeatRhythmElements(): void {
    const prevRhythmElements = new Map(
      this._beatRhythmElements.map((e) => [e.getStableIdentity(), e])
    );
    this._beatRhythmElements = [];
    if (this.voiceBar === undefined || this.voiceBarElement === undefined) {
      return;
    }

    for (const beatElement of this.voiceBarElement.beatElements) {
      const stableIdentity = beatElement.getStableIdentity();
      const existingRhythmElement = prevRhythmElements.get(stableIdentity);
      if (existingRhythmElement !== undefined) {
        existingRhythmElement.build();
        this._beatRhythmElements.push(existingRhythmElement);
        continue;
      }

      this._beatRhythmElements.push(
        new TabBeatRhythmElement(this, beatElement as TabBeatElement)
      );
    }
  }

  /**
   * Fills the beam segments array
   */
  private buildBeamSegments(): void {
    const prevBeamSegments = new Map(
      this._beamSegments.map((e) => [e.getStableIdentity(), e])
    );
    this._beamSegments = [];
    if (this.voiceBar === undefined || this.voiceBarElement === undefined) {
      return;
    }

    for (let i = 0; i < this.voiceBar.beamingGroups.length; i++) {
      const beamGroupBeats = this.voiceBarElement.beatElements.filter(
        (be) => be.beat.beamGroupId === i
      );

      if (beamGroupBeats.length <= 1) {
        continue;
      }

      for (let j = 0; j < beamGroupBeats.length - 1; j++) {
        const curBeatElement = beamGroupBeats[j];
        const nextBeatElement = beamGroupBeats[j + 1];
        const prevBeatElement = beamGroupBeats[j - 1];
        const stableIdentity = BeamSegmentElement.createStableIdentity(
          this,
          curBeatElement as TabBeatElement,
          nextBeatElement as TabBeatElement,
          prevBeatElement as TabBeatElement | undefined
        );
        const existingBeamSegment = prevBeamSegments.get(stableIdentity);
        if (existingBeamSegment !== undefined) {
          existingBeamSegment.build();
          this._beamSegments.push(existingBeamSegment);
          continue;
        }

        this._beamSegments.push(
          new BeamSegmentElement(
            this,
            curBeatElement as TabBeatElement,
            nextBeatElement as TabBeatElement,
            prevBeatElement as TabBeatElement
          )
        );
      }

      const lastBeatElement = beamGroupBeats[beamGroupBeats.length - 1];
      const prevLastBeatElement = beamGroupBeats[beamGroupBeats.length - 2];
      const terminalStableIdentity = BeamSegmentElement.createStableIdentity(
        this,
        lastBeatElement as TabBeatElement,
        undefined,
        prevLastBeatElement as TabBeatElement
      );
      const existingTerminalBeam = prevBeamSegments.get(terminalStableIdentity);
      if (existingTerminalBeam !== undefined) {
        existingTerminalBeam.build();
        this._beamSegments.push(existingTerminalBeam);
        continue;
      }

      this._beamSegments.push(
        new BeamSegmentElement(
          this,
          lastBeatElement as TabBeatElement,
          undefined,
          prevLastBeatElement as TabBeatElement
        )
      );
    }
  }

  /**
   * Fills the bar tuplet groups array
   */
  public buildTupletGroupElements(): void {
    const prevTupletElements = new Map(
      this._tupletElements.map((e) => [e.getStableIdentity(), e])
    );
    this._tupletElements = [];
    if (this.voiceBar === undefined || this.voiceBarElement === undefined) {
      return;
    }

    const beatElements = this.voiceBarElement.beatElements as TabBeatElement[];

    for (const tupletGroup of this.voiceBar.tupletGroups) {
      const tupletTabBeatElements = beatElements.filter((b) =>
        tupletGroup.beats.some((tb) => tb.uuid === b.beat.uuid)
      );

      const existingTupletElement = prevTupletElements.get(
        BarTupletGroupElement.createStableIdentity(this, tupletGroup)
      );
      if (existingTupletElement !== undefined) {
        existingTupletElement.setBeatElements(tupletTabBeatElements);
        existingTupletElement.build();
        this._tupletElements.push(existingTupletElement);
        continue;
      }

      this._tupletElements.push(
        new BarTupletGroupElement(tupletGroup, this, tupletTabBeatElements)
      );
    }
  }

  build(): void {
    this.buildBeatRhythmElements();
    this.buildBeamSegments();
    this.buildTupletGroupElements();
  }

  measure(): void {
    for (const beatRhythmElement of this._beatRhythmElements) {
      beatRhythmElement.measure();
    }

    for (const beamSegment of this._beamSegments) {
      beamSegment.measure();
    }

    for (const tupletElement of this._tupletElements) {
      tupletElement.measure();
    }

    this._boundingBox.setDimensions(
      this.voiceBarElement?.boundingBox.width ??
        this.barElement.voiceContentWidth,
      this.trackElement.layoutDimensions.DURATIONS_HEIGHT +
        this.trackElement.layoutDimensions.TUPLET_RECT_HEIGHT
    );
  }

  layout(): void {
    const prevVoiceBarRhythmElement =
      this.barElement.getPrevVoiceBarRhythmElement(this);
    const y =
      prevVoiceBarRhythmElement?.boundingBox.bottom ??
      this.barElement.voiceContentHeight;
    this._boundingBox.setCoords(this.barElement.startGap.right, y);

    for (const beatRhythmElement of this._beatRhythmElements) {
      beatRhythmElement.layout();
    }

    for (const beamSegment of this._beamSegments) {
      beamSegment.layout();
    }

    for (const tupletElement of this._tupletElements) {
      tupletElement.layout();
    }
  }

  update(): void {
    this.build();
    this.measure();
    this.layout();
  }

  get stateHash(): string {
    return [
      this.globalBoundingBox.x,
      this.globalBoundingBox.y,
      this.globalBoundingBox.width,
      this.globalBoundingBox.height,
      ...this._beatRhythmElements.map((e) => e.stateHash),
      ...this._beamSegments.map((e) => e.stateHash),
      ...this._tupletElements.map((e) => e.stateHash),
    ].join("");
  }

  get boundingBox(): Rect {
    return this._boundingBox;
  }

  // public get barLocalCoords(): Point {
  //   return new Point(
  //     this.barElement.lineLocalCoords.x + this._boundingBox.x,
  //     this.barElement.lineLocalCoords.y + this._boundingBox.y
  //   );
  // }
  //
  // public get barLocalBoundingBox(): Rect {
  //   return new Rect(
  //     this.lineLocalCoords.x,
  //     this.lineLocalCoords.y,
  //     this._boundingBox.width,
  //     this._boundingBox.height
  //   );
  // }

  public get lineLocalCoords(): Point {
    return new Point(
      this.barElement.lineLocalCoords.x + this._boundingBox.x,
      this.barElement.lineLocalCoords.y + this._boundingBox.y
    );
  }

  public get lineLocalBoundingBox(): Rect {
    return new Rect(
      this.lineLocalCoords.x,
      this.lineLocalCoords.y,
      this._boundingBox.width,
      this._boundingBox.height
    );
  }

  get globalCoords(): Point {
    return new Point(
      this.barElement.globalCoords.x + this._boundingBox.x,
      this.barElement.globalCoords.y + this._boundingBox.y
    );
  }

  get globalBoundingBox(): Rect {
    return new Rect(
      this.globalCoords.x,
      this.globalCoords.y,
      this._boundingBox.width,
      this._boundingBox.height
    );
  }

  get rect(): Rect {
    return this.boundingBox;
  }

  get globalRect(): Rect {
    return this.globalBoundingBox;
  }

  getStableIdentity(): string {
    return `voice-bar-rhythm:${this.barElement.getStableIdentity()}:${this.voiceNumber}`;
  }

  refreshOwnedNotationElements(): NotationElement[] {
    return [
      this,
      ...this._beatRhythmElements.flatMap((element) =>
        element.refreshOwnedNotationElements()
      ),
      ...this._beamSegments.flatMap((element) =>
        element.refreshOwnedNotationElements()
      ),
      ...this._tupletElements.flatMap((element) =>
        element.refreshOwnedNotationElements()
      ),
    ];
  }
}
