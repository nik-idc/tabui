import { randomInt } from "../../shared";
import { Bar } from "./bar";
import { TrackContext } from "./track-context";
import { MusicInstrument } from "./instrument/instrument";
import { ClefType } from "./clef-type";
import { MasterBar } from "./master-bar";
import { Track } from "./track";
import { Beat } from "./beat";
import { VoiceBar, VoiceNumber } from "./voice-bar";

/**
 * A staff in this context is a representation of an
 * individually played part on an instrument. For example:
 * - A piano usually has 2 staffs: Treble & Bass (i.e. right & left hand parts)
 * - A guitar usually has 1 staff
 */
export class Staff<I extends MusicInstrument = MusicInstrument> {
  /** Staff's unqiue identifier */
  readonly uuid: number;
  /** Track in which the staff lives */
  readonly track: Track<I>;
  /** Track context */
  readonly trackContext: TrackContext<I>;

  /** Bars belonging to the staff */
  private _bars: Bar<I>[];
  /** Clef type for the staff */
  private _clefType: ClefType;
  /** Indicates whether to display guitar tablature  */
  private _showTablature: boolean;
  /** Indicates whether to display classical music notation  */
  private _showClassicNotation: boolean;

  private _voiceNumberBarCounts: Map<VoiceNumber, number>;

  /**
   * A staff in this context is a representation of an
   * individually played part on an instrument
   * @param trackContext Track context
   * @param bars Bars belonging to the staff
   * @param clefType Clef type
   */
  constructor(
    track: Track<I>,
    trackContext: TrackContext<I>,
    bars: Bar<I>[] = [],
    clefType: ClefType = ClefType.Treble,
    showTablature: boolean = true,
    showClassicNotation: boolean = false
  ) {
    this.uuid = randomInt();
    this.track = track;
    this.trackContext = trackContext;

    this._bars = bars;
    this._clefType = clefType;
    this._showTablature = showTablature;
    this._showClassicNotation = showClassicNotation;

    this._voiceNumberBarCounts = new Map([
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
    ]);

    this.rebuildVoiceBarCounts();
  }

  /**
   * Inserts a ready bar (mostly for commands)
   * @param index Index
   * @param bar Bar
   * @returns Inserted bar
   */
  public insertReadyBar(index: number, bar: Bar<I>): Bar<I> {
    this._bars.splice(index, 0, bar);
    this.recordBarAdded(bar);

    return bar;
  }

  /**
   * Inserts a bar to the staff after the specified index
   * @param index Index after which to insert the bar
   * @param masterBar Master bar
   * @param beats Beats
   */
  public insertBar(
    index: number,
    masterBar: MasterBar,
    beats: Beat<I>[] = [],
    voiceNumber: VoiceNumber = 1
  ): Bar<I> {
    const newBar = new Bar<I>(this, this.trackContext, masterBar);
    this._bars.splice(index, 0, newBar);
    this.insertVoiceBarsForNewBar(newBar, beats, voiceNumber);

    return newBar;
  }

  /**
   * Appends bar to the staff bars
   * @param masterBar Master bar
   * @param beats Beats
   */
  public appendBar(
    masterBar: MasterBar,
    beats: Beat<I>[] = [],
    voiceNumber: VoiceNumber = 1
  ): Bar<I> {
    const newBar = new Bar<I>(this, this.trackContext, masterBar);
    this._bars.push(newBar);
    this.insertVoiceBarsForNewBar(newBar, beats, voiceNumber);

    return newBar;
  }

  /**
   * Prepends bar to the staff bars
   * @param masterBar Master bar
   * @param beats Beats
   */
  public prependBar(
    masterBar: MasterBar,
    beats: Beat<I>[] = [],
    voiceNumber: VoiceNumber = 1
  ): Bar<I> {
    const newBar = new Bar<I>(this, this.trackContext, masterBar);
    this._bars.unshift(newBar);
    this.insertVoiceBarsForNewBar(newBar, beats, voiceNumber);

    return newBar;
  }

  private insertVoiceBarsForNewBar(
    bar: Bar<I>,
    beats: Beat<I>[],
    voiceNumber: VoiceNumber
  ): void {
    const voiceNumbers = new Set<VoiceNumber>(this.nonEmptyVoiceNumbers);
    voiceNumbers.add(voiceNumber);

    for (const currentVoiceNumber of voiceNumbers) {
      bar.insertVoiceBar(
        currentVoiceNumber,
        currentVoiceNumber === voiceNumber ? beats : []
      );
    }
  }

  /**
   * Removes a bar from the staff at the specified index
   * @param index Index of the bar to remove
   */
  public removeBar(index: number): Bar<I> {
    if (index < 0 || index >= this._bars.length) {
      throw Error(`${index} is invalid bar index`);
    }
    if (this._bars.length === 1) {
      throw Error("Staff must have at least one bar");
    }

    const removedBar = this._bars[index];
    this._bars.splice(index, 1);
    this.recordBarRemoved(removedBar);

    return removedBar;
  }

  private adjustVoiceBarCount(voiceNumber: VoiceNumber, delta: number): void {
    const currentCount = this._voiceNumberBarCounts.get(voiceNumber);
    if (currentCount === undefined) {
      throw Error(`Couldn't get voice ${voiceNumber} bar count`);
    }

    const nextCount = currentCount + delta;
    if (nextCount < 0) {
      throw Error(`Voice ${voiceNumber} bar count cannot be negative`);
    }

    this._voiceNumberBarCounts.set(voiceNumber, nextCount);
  }

  public recordVoiceBarAdded(voiceBar: VoiceBar<I>): void {
    if (voiceBar.isEmpty()) {
      return;
    }

    this.adjustVoiceBarCount(voiceBar.voiceNumber, 1);
  }

  public recordVoiceBarRemoved(voiceBar: VoiceBar<I>): void {
    if (voiceBar.isEmpty()) {
      return;
    }

    this.adjustVoiceBarCount(voiceBar.voiceNumber, -1);
  }

  private recordBarAdded(bar: Bar<I>): void {
    for (const voiceBar of bar.voiceBarsAsArray) {
      this.recordVoiceBarAdded(voiceBar);
    }
  }

  private recordBarRemoved(bar: Bar<I>): void {
    for (const voiceBar of bar.voiceBarsAsArray) {
      this.recordVoiceBarRemoved(voiceBar);
    }
  }

  private rebuildVoiceBarCounts(): void {
    for (const voiceNumber of this._voiceNumberBarCounts.keys()) {
      this._voiceNumberBarCounts.set(voiceNumber, 0);
    }

    for (const bar of this._bars) {
      for (const voiceBar of bar.voiceBarsAsArray) {
        this.recordVoiceBarAdded(voiceBar);
      }
    }
  }

  /**
   * Get next beat in the staff
   * @param beat Beat after which to find the next beat
   * @returns Next beat or null if passed beat is the last one
   */
  public getNextBeat(beat: Beat<I>): Beat<I> | null {
    const beatIndex = beat.voiceBar.beats.indexOf(beat);
    const nextBeatInBar = beat.voiceBar.beats[beatIndex + 1];
    if (nextBeatInBar !== undefined) {
      return nextBeatInBar;
    }

    const barIndex = this._bars.indexOf(beat.voiceBar.bar);
    const nextBar = this._bars[barIndex + 1];
    const nextVoiceBar = nextBar?.getVoiceBar(beat.voiceBar.voiceNumber);
    if (nextVoiceBar !== undefined && nextVoiceBar !== null) {
      return nextVoiceBar.beats[0];
    }

    return null;
  }

  /**
   * Get prev beat in the staff
   * @param beat Beat before which to find the prev beat
   * @returns Prev beat or null if passed beat is the first one
   */
  public getPrevBeat(beat: Beat<I>): Beat | null {
    const beatIndex = beat.voiceBar.beats.indexOf(beat);
    const prevBeatInBar = beat.voiceBar.beats[beatIndex - 1];
    if (prevBeatInBar !== undefined) {
      return prevBeatInBar;
    }

    const barIndex = this._bars.indexOf(beat.voiceBar.bar);
    const prevBar = this._bars[barIndex - 1];
    const prevVoiceBar = prevBar?.getVoiceBar(beat.voiceBar.voiceNumber);
    if (prevVoiceBar !== undefined && prevVoiceBar !== null) {
      return prevVoiceBar.beats[prevVoiceBar.beats.length - 1];
    }

    return null;
  }

  /**
   * All the beats as an array. Does a flat map, so consider performance
   */
  public getBeatsSeq(voiceNumber: VoiceNumber = 1): Beat<I>[] {
    return this.getVoiceBeatsSeq(voiceNumber);
  }

  public getVoiceBeatsSeq(voiceNumber: VoiceNumber): Beat<I>[] {
    return this._bars.flatMap(
      (bar) => bar.getVoiceBar(voiceNumber)?.beats ?? []
    );
  }

  /**
   * Get next bar in the staff
   * @param bar Bar after which to find the next bar
   * @returns Next bar or null if passed bar is the last one
   */
  public getNextBar(bar: Bar<I>): Bar<I> | null {
    const barIndex = this._bars.indexOf(bar);
    const nextBar = this._bars[barIndex + 1];
    return nextBar ?? null;
  }

  /**
   * Get prev bar in the staff
   * @param bar Bar before which to find the prev bar
   * @returns Prev bar or null if passed bar is the first one
   */
  public getPrevBar(bar: Bar<I>): Bar | null {
    const barIndex = this._bars.indexOf(bar);
    const prevBar = this._bars[barIndex - 1];
    return prevBar ?? null;
  }

  /**
   * Creates full deep copy of the staff
   */
  public deepCopy(): Staff<I> {
    const barsCopy: Bar<I>[] = [];
    for (const bar of this._bars) {
      barsCopy.push(bar.deepCopy());
    }

    return new Staff<I>(
      this.track,
      this.trackContext,
      barsCopy,
      this._clefType,
      this._showTablature,
      this._showClassicNotation
    );
  }

  /** Bars getter */
  public get bars(): Bar<I>[] {
    return this._bars;
  }

  /** Clef type for the staff */
  public get clefType(): ClefType {
    return this._clefType;
  }

  /** Show tablature setter */
  public set showTablature(newShowTablature: boolean) {
    this._showTablature = newShowTablature;
  }
  /** Indicates whether to display guitar tablature */
  public get showTablature(): boolean {
    return this._showTablature;
  }

  /** Show classic notation setter */
  public set showClassicNotation(newShowClassicNotation: boolean) {
    this._showClassicNotation = newShowClassicNotation;
  }
  /** Indicates whether to display classical music notation */
  public get showClassicNotation(): boolean {
    return this._showClassicNotation;
  }

  public get nonEmptyVoiceNumbers(): VoiceNumber[] {
    return [...this._voiceNumberBarCounts.entries()]
      .filter(([, count]) => count !== 0)
      .map(([voiceNumber]) => voiceNumber)
      .sort((a, b) => a - b);
  }
}
