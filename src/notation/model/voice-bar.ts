import { randomInt } from "../../shared";
import { Beat } from "./beat";
import { NoteDuration } from "./note-duration";
import { getBeaming } from "./bar-beaming";
import { MusicInstrument } from "./instrument/instrument";
import { TrackContext } from "./track-context";
import { BarTupletGroup } from "./tuplet-group";
import { TupletSettings, tupletSettingsEqual } from "./tuplet-settings";
import {
  applyDotsToFraction,
  applyTupletToFraction,
  fractionToTicks,
  getBaseDurationFraction,
  lcmAll,
} from "./timing";
import { Bar } from "./bar";

/** Beat-array edit metadata with live beat references. */
export type BeatArrayOperationOutput<
  I extends MusicInstrument = MusicInstrument,
> = {
  /** Zero-based starting position in the voice's beat array. */
  index: number;
  /** Beats inserted or removed by this operation. */
  beats: Beat<I>[];
};

/** Removal metadata used to restore beats and reverse empty-voice normalization. */
export type BeatRemovalOutput<I extends MusicInstrument = MusicInstrument> = {
  /** Original positions and live removed beats. */
  removed: BeatArrayOperationOutput<I>;
  /** Fallback rests inserted to keep the bar usable. */
  inserted: BeatArrayOperationOutput<I>[];
  /** Voice slots cleared by normalization, or null if none were cleared. */
  removedVoiceNumbers: VoiceNumber[] | null;
};

type MetricSpan = {
  startTick: number;
  endTick: number;
};

/** One-based voice slot within a staff bar. */
export type VoiceNumber = 1 | 2 | 3 | 4;

/**
 * One voice's beats and derived timing within a staff bar.
 */
export class VoiceBar<I extends MusicInstrument = MusicInstrument> {
  /** Bar's unqiue identifier */
  readonly uuid: number;
  /** Owning staff bar, retained by reference. */
  readonly bar: Bar<I>;
  /** Track context */
  readonly trackContext: TrackContext<I>;
  /** Number of the voice */
  readonly voiceNumber: VoiceNumber;
  /** Live beat array; use voice methods to maintain timing and staff counts. */
  readonly beats: Beat<I>[];

  /**  Beaming groups */
  private _beamingGroups: number[];
  /** Tuplet groups */
  private _tupletGroups: BarTupletGroup<I>[];
  /** Bar-local tick resolution (ticks per whole note) */
  private _tickResolution: number;
  /** Max ticks available in this bar based on time signature */
  private _barTicks: number;
  /** Actual sum of all beat ticks */
  private _actualTicks: number;

  /**
   * Creates a voice and rebuilds its timing, tuplet groups, and beaming.
   * @param bar Owning staff bar, retained by reference.
   * @param trackContext Track context
   * @param voiceNumber One-based voice slot from 1 through 4.
   * @param beats Retained live array of beats already owned by this voice; empty creates a quarter rest.
   * @throws If supplied rhythm or meter cannot be rebuilt consistently.
   */
  constructor(
    bar: Bar<I>,
    trackContext: TrackContext<I>,
    voiceNumber: VoiceNumber,
    beats: Beat<I>[] = []
  ) {
    this.uuid = randomInt();
    this.bar = bar;
    this.trackContext = trackContext;
    this.voiceNumber = voiceNumber;
    this.beats = beats.length === 0 ? [this.createDefaultBeat(0)] : beats;

    this._beamingGroups = [];
    this._tupletGroups = [];
    this._tickResolution = 1;
    this._barTicks = 0;
    this._actualTicks = 0;

    this.rebuildTiming();
  }

  private resetBeamingMetadata(): void {
    for (const beat of this.beats) {
      beat.beamGroupId = null;
      beat.lastInBeamGroup = false;
    }
  }

  private computeTickResolution(): number {
    const requiredDenominators: number[] = [
      this.bar.masterBar.barDurationFraction.denominator,
    ];

    for (const beat of this.beats) {
      const baseFraction = getBaseDurationFraction(beat.baseDuration);
      const dottedFraction = applyDotsToFraction(baseFraction, beat.dots);
      const playedFraction = applyTupletToFraction(
        dottedFraction,
        beat.tupletSettings
      );

      requiredDenominators.push(baseFraction.denominator);
      requiredDenominators.push(dottedFraction.denominator);
      requiredDenominators.push(playedFraction.denominator);
    }

    return lcmAll([...new Set(requiredDenominators)]);
  }

  private rebuildBeatTicks(): void {
    this._tickResolution = this.computeTickResolution();
    this._barTicks = fractionToTicks(
      this.bar.masterBar.barDurationFraction,
      this._tickResolution
    );

    let cursor = 0;
    for (const beat of this.beats) {
      const baseTicks = beat.getBaseDurationTicks(this._tickResolution);
      const fullTicks = beat.getFullDurationTicks(this._tickResolution);
      const startTick = cursor;
      const endTick = startTick + fullTicks;

      beat.setTiming(baseTicks, fullTicks, startTick, endTick);
      cursor = endTick;
    }

    this._actualTicks = cursor;
  }

  private getBeamingPlan(): { beamingGroups: number[]; factor: number } {
    const durationDenominator = 1 / this.bar.masterBar.timeSignatureDenominator;
    const beamingGroups = getBeaming(
      this.bar.masterBar.timeSignatureNumerator,
      durationDenominator
    );
    const factor = durationDenominator < 8 ? 8 : durationDenominator;

    return { beamingGroups, factor };
  }

  private buildMetricSpans(
    beamingGroups: number[],
    factor: number
  ): MetricSpan[] {
    let cursor = 0;
    const spans: MetricSpan[] = [];
    for (const group of beamingGroups) {
      const durationTicks = fractionToTicks(
        { numerator: group, denominator: factor },
        this._tickResolution
      );
      spans.push({
        startTick: cursor,
        endTick: cursor + durationTicks,
      });
      cursor += durationTicks;
    }

    if (cursor !== this._barTicks) {
      throw Error(
        `Beaming spans total ${cursor} ticks, expected ${this._barTicks}`
      );
    }

    return spans;
  }

  private metricSpanIndexForBeat(beat: Beat<I>, spans: MetricSpan[]): number {
    for (let i = 0; i < spans.length; i++) {
      const span = spans[i];
      if (beat.startTick >= span.startTick && beat.endTick <= span.endTick) {
        return i;
      }
    }

    return -1;
  }

  private isBeatBeamable(beat: Beat<I>): boolean {
    return beat.baseDuration <= NoteDuration.Eighth;
  }

  private assignBeamGroup(beats: Beat<I>[], groupId: number): void {
    for (const beat of beats) {
      beat.beamGroupId = groupId;
      beat.lastInBeamGroup = false;
    }

    beats[beats.length - 1].lastInBeamGroup = true;
  }

  private buildCompleteTupletGroupStartMap(): Map<Beat<I>, BarTupletGroup<I>> {
    const map = new Map<Beat<I>, BarTupletGroup<I>>();

    for (const group of this._tupletGroups) {
      if (!group.complete) {
        continue;
      }
      map.set(group.beats[0], group);
    }

    return map;
  }

  private recomputeBeaming(): void {
    this.resetBeamingMetadata();
    this._beamingGroups = [];

    if (this.beats.length < 2) {
      return;
    }

    const { beamingGroups, factor } = this.getBeamingPlan();
    this._beamingGroups = beamingGroups;
    const metricSpans = this.buildMetricSpans(beamingGroups, factor);

    const completeTupletGroupStarts = this.buildCompleteTupletGroupStartMap();

    let nextBeamGroupId = 0;
    let i = 0;
    while (i < this.beats.length) {
      const beat = this.beats[i];
      const tupletGroup = completeTupletGroupStarts.get(beat);

      if (tupletGroup !== undefined) {
        const beamableTupletBeats = tupletGroup.beats.filter((b) =>
          this.isBeatBeamable(b)
        );
        if (beamableTupletBeats.length >= 2) {
          this.assignBeamGroup(beamableTupletBeats, nextBeamGroupId);
          nextBeamGroupId++;
        }

        i += tupletGroup.beats.length;
        continue;
      }

      if (!this.isBeatBeamable(beat)) {
        i++;
        continue;
      }

      const spanIndex = this.metricSpanIndexForBeat(beat, metricSpans);
      const groupBeats: Beat<I>[] = [beat];

      let j = i + 1;
      while (j < this.beats.length) {
        const nextBeat = this.beats[j];
        if (completeTupletGroupStarts.has(nextBeat)) {
          break;
        }
        if (!this.isBeatBeamable(nextBeat)) {
          break;
        }
        if (this.metricSpanIndexForBeat(nextBeat, metricSpans) !== spanIndex) {
          break;
        }

        groupBeats.push(nextBeat);
        j++;
      }

      if (groupBeats.length >= 2) {
        this.assignBeamGroup(groupBeats, nextBeamGroupId);
        nextBeamGroupId++;
      }

      i = j;
    }
  }

  private recomputeTupletGroups(): void {
    this._tupletGroups = [];
    let curGroupBeats: Beat<I>[] = [];
    let curTupletSettings: TupletSettings | null = null;
    let prevBeat: Beat<I> | undefined = undefined;

    for (const beat of this.beats) {
      if (prevBeat === undefined) {
        if (beat.tupletSettings !== null) {
          curGroupBeats.push(beat);
          curTupletSettings = {
            normalCount: beat.tupletSettings.normalCount,
            tupletCount: beat.tupletSettings.tupletCount,
          };
        }
        prevBeat = beat;
        continue;
      }

      if (beat.tupletSettings === null) {
        if (prevBeat.tupletSettings !== null) {
          if (curTupletSettings === null) {
            throw Error(
              "Current tuplet settings undefined at the end of current tuplet"
            );
          }
          this._tupletGroups.push(
            new BarTupletGroup<I>(
              curGroupBeats,
              curTupletSettings.normalCount,
              curTupletSettings.tupletCount
            )
          );
          curGroupBeats = [];
          curTupletSettings = null;
        }
        prevBeat = beat;
        continue;
      }

      if (curTupletSettings === null) {
        curTupletSettings = {
          normalCount: beat.tupletSettings.normalCount,
          tupletCount: beat.tupletSettings.tupletCount,
        };
      }
      if (tupletSettingsEqual(beat.tupletSettings, prevBeat.tupletSettings)) {
        if (curTupletSettings.normalCount === curGroupBeats.length) {
          this._tupletGroups.push(
            new BarTupletGroup(
              curGroupBeats,
              curTupletSettings.normalCount,
              curTupletSettings.tupletCount
            )
          );
          curGroupBeats = [beat];
        } else {
          curGroupBeats.push(beat);
        }
      } else {
        if (curGroupBeats.length !== 0) {
          this._tupletGroups.push(
            new BarTupletGroup(
              curGroupBeats,
              curTupletSettings.normalCount,
              curTupletSettings.tupletCount
            )
          );
        }
        curGroupBeats = [beat];
        curTupletSettings = {
          normalCount: beat.tupletSettings.normalCount,
          tupletCount: beat.tupletSettings.tupletCount,
        };
      }

      prevBeat = beat;
    }

    if (curGroupBeats.length !== 0) {
      if (curTupletSettings === null) {
        throw Error("Current tuplet beats count > 0 but settings undefined");
      }
      this._tupletGroups.push(
        new BarTupletGroup(
          curGroupBeats,
          curTupletSettings.normalCount,
          curTupletSettings.tupletCount
        )
      );
    }
  }

  /**
   * Rebuilds tuplet groups, tick resolution, beat offsets, and beaming from current data.
   * @throws If rhythm fractions, tuplet groups, or meter beaming cannot be represented consistently.
   */
  public rebuildTiming(): void {
    this.recomputeTupletGroups();
    this.rebuildBeatTicks();
    this.recomputeBeaming();
  }

  /**
   * Computes beaming for all the beats inside of this bar.
   * Kept for compatibility: delegates to timing rebuild.
   * @throws If rhythm, tuplet groups, or meter beaming cannot be rebuilt consistently.
   */
  public computeBeaming(): void {
    this.rebuildTiming();
  }

  /**
   * Computes bar's tuplet groups from scratch beat-by-beat.
   * Kept for compatibility: delegates to timing rebuild.
   * @throws If rhythm, tuplet groups, or meter beaming cannot be rebuilt consistently.
   */
  public computeBarTupletGroups(): void {
    this.rebuildTiming();
  }

  /**
   * Returns the last rebuilt sum of this voice's played durations in whole-note units.
   */
  public getActualBarDuration(): number {
    return this._actualTicks / this._tickResolution;
  }

  /**
   * Tests whether the beat's rebuilt end tick is within the meter, including rests.
   * @param beatToCheck Beat to check
   * @returns True if beat should be played, false otherwise
   * @throws If the beat is absent from this voice.
   */
  public beatPlayable(beatToCheck: Beat<I>): boolean {
    if (!this.beats.includes(beatToCheck)) {
      throw Error("Beat is not this bar");
    }

    return beatToCheck.endTick <= this._barTicks;
  }

  /**
   * Copies beats into this voice and rebuilds timing and beaming.
   * @param index Zero-based insertion position, from zero through the beat count.
   * @param beats Content to copy into this voice; empty has no effect after index validation.
   * @returns Live inserted copies.
   * @throws If the index is outside the voice, copying fails, or timing/bookkeeping fails.
   */
  public insertBeats(index: number, beats: Beat<I>[]): Beat<I>[] {
    if (!Number.isInteger(index) || index < 0 || index > this.beats.length) {
      throw Error(`${index} is invalid beat index`);
    }
    if (beats.length === 0) {
      return [];
    }

    const copies = beats.map((beat) => beat.deepCopy(this));
    return this.bar.replaceSelectedBeats(
      [],
      [{ voiceBar: this, index, beats: copies }]
    ).insertedBeats;
  }

  /**
   * Replaces the beat array contents with supplied references and rebuilds timing.
   * @param beats Beats already owned by this voice; an empty array normalizes the bar.
   * @throws If timing/beaming cannot be rebuilt or emptying the voice reveals inconsistent staff counts.
   */
  public replaceBeats(beats: Beat<I>[]): void {
    this.bar.replaceVoiceBeats(this, beats);
  }

  /**
   * Inserts a beat copy and rebuilds timing and beaming.
   * @param index Zero-based insertion position, from zero through the beat count.
   * @param beat Content to copy; omitted creates a quarter-duration beat with empty note slots.
   * @returns Live inserted copy and its insertion index.
   * @throws If the index is outside the voice, copying fails, or timing/bookkeeping fails.
   */
  public insertBeat(
    index: number,
    beat?: Beat<I>
  ): BeatArrayOperationOutput<I> {
    if (beat === undefined) {
      beat = new Beat<I>(this, this.trackContext);
    }
    const insertedBeats = this.insertBeats(index, [beat]);

    return { index: index, beats: insertedBeats };
  }

  private createDefaultBeat(index: number): Beat<I> {
    const duration =
      index === 0 ? NoteDuration.Quarter : this.beats[index - 1].baseDuration;
    return new Beat(this, this.trackContext, null, duration);
  }

  /**
   * Inserts a quarter rest at index zero and returns its live edit metadata.
   * @throws If beat construction or timing rebuild fails.
   */
  public insertDefaultRest(): BeatArrayOperationOutput<I> {
    const insertedBeat = this.insertBeats(0, [this.createDefaultBeat(0)]);
    return {
      index: 0,
      beats: insertedBeat,
    };
  }

  /**
   * Prepends beat copies and rebuilds timing; omitted beats insert a quarter rest.
   * @returns Live inserted copies and index zero.
   * @throws If copying or timing/bookkeeping fails.
   */
  public prependBeats(beats?: Beat<I>[]): BeatArrayOperationOutput<I> {
    const beatsToInsert = beats ?? [this.createDefaultBeat(0)];
    const insertedBeats = this.insertBeats(0, beatsToInsert);

    return { index: 0, beats: insertedBeats };
  }

  /**
   * Appends beat copies and rebuilds timing; omitted beats insert a rest with the previous beat's written duration (quarter if empty).
   * @returns Live inserted copies and their zero-based starting position.
   * @throws If copying or timing/bookkeeping fails.
   */
  public appendBeats(beats?: Beat<I>[]): BeatArrayOperationOutput<I> {
    const index = this.beats.length;
    const beatsToInsert = beats ?? [this.createDefaultBeat(index)];
    const insertedBeats = this.insertBeats(index, beatsToInsert);

    return { index: index, beats: insertedBeats };
  }

  /**
   * Removes one beat and rebuilds timing, clearing empty voice slots or adding fallback rests when needed.
   * @param index Zero-based beat position.
   * @returns Removed content and fallback-rest/voice-slot metadata for restoration.
   * @throws If the index is outside this voice or timing/bookkeeping fails.
   */
  public removeBeat(index: number): BeatRemovalOutput<I> {
    if (index < 0 || index >= this.beats.length) {
      throw Error(`${index} is invalid beat index`);
    }

    return this.bar.replaceSelectedBeats([this.beats[index]]).removals[0];
  }

  /**
   * Removes beats in input order and normalizes the bar once after removal.
   * @param beats Live beats still present in this voice; duplicates are not supported.
   * @returns Removal and fallback-rest metadata for each input beat.
   * @throws If a beat is absent or timing/bookkeeping fails.
   */
  public removeBeats(beats: Beat<I>[]): BeatRemovalOutput<I>[] {
    if (beats.some((b) => b.voiceBar !== this)) {
      throw Error("Beat belongs to another voice");
    }
    return this.bar.replaceSelectedBeats(beats).removals;
  }

  /**
   * Copies beats and techniques into a new voice, retaining the owning bar and context, then rebuilds timing.
   * @throws If copied data or timing is invalid.
   */
  public deepCopy(): VoiceBar<I> {
    const voiceBar = new VoiceBar<I>(
      this.bar,
      this.trackContext,
      this.voiceNumber,
      []
    );
    voiceBar.beats.splice(0, voiceBar.beats.length);
    for (const beat of this.beats) {
      voiceBar.beats.push(beat.deepCopy(voiceBar));
    }
    voiceBar.rebuildTiming();
    return voiceBar;
  }

  /** Returns true only when this voice has no beats. */
  public isEmpty(): boolean {
    return this.beats.length === 0;
  }

  /**
   * Returns true if this voice is empty or its rebuilt duration exactly fills the meter.
   * Underfilled and overfull voices return false; no content is trimmed.
   */
  public checkDurationsFit(): boolean {
    if (this.isEmpty()) {
      return true;
    }

    return this._actualTicks === this._barTicks;
  }

  /** Live metric grouping lengths, in eighth-note or finer meter units; replaced on timing rebuild. */
  public get beamingGroups(): number[] {
    return this._beamingGroups;
  }

  /** Live derived groups containing beat references; replaced on timing rebuild. */
  public get tupletGroups(): BarTupletGroup[] {
    return this._tupletGroups;
  }

  /** Bar-local tick resolution (ticks per whole note) */
  public get tickResolution(): number {
    return this._tickResolution;
  }

  /** Max ticks available in this bar based on time signature */
  public get barTicks(): number {
    return this._barTicks;
  }

  /** Actual sum of all beat ticks */
  public get actualTicks(): number {
    return this._actualTicks;
  }

  /**
   * Compares shared master-bar identity and beat content, ignoring UUID, voice number, and derived timing.
   * @param otherBar Bar to compare with
   * @returns True if equal, false otherwise
   */
  public compare(otherBar: VoiceBar<I>): boolean {
    if (
      this.bar.masterBar !== otherBar.bar.masterBar ||
      this.beats.length !== otherBar.beats.length
    ) {
      return false;
    }

    for (let i = 0; i < this.beats.length; i++) {
      if (!this.beats[i].compare(otherBar.beats[i])) {
        return false;
      }
    }

    return true;
  }
}
