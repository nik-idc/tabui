import { randomInt } from "@/shared";
import { Beat, BeatJSON } from "./beat";
import { NoteDuration } from "./note-duration";
import { getBeaming } from "./bar-beaming";
import { MusicInstrument } from "./instrument/instrument";
import { MasterBar } from "./master-bar";
import { TrackContext } from "./track-context";
import { Staff } from "./staff";
import { BarTupletGroup } from "./tuplet-group";
import { TupletSettings, tupletSettingsEqual } from "./tuplet-settings";
import {
  applyDotsToFraction,
  applyTupletToFraction,
  fractionToTicks,
  getBaseDurationFraction,
  lcmAll,
} from "./timing";

export type BeatArrayOperationOutput<
  I extends MusicInstrument = MusicInstrument,
> = {
  index: number;
  beats: Beat<I>[];
};

/**
 * Bar JSON format
 */
export interface BarJSON {
  beats: BeatJSON[];
}

type MetricSpan = {
  startTick: number;
  endTick: number;
};

/**
 * Class that represents a musical bar
 */
export class Bar<I extends MusicInstrument = MusicInstrument> {
  /** Bar's unqiue identifier */
  readonly uuid: number;
  /** Staff in which the bar lives */
  readonly staff: Staff<I>;
  /** Track context */
  readonly trackContext: TrackContext<I>;
  /** Reference to the master bar the bar belongs to */
  readonly masterBar: MasterBar;
  /**  Array of all beats in the bar */
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
   * Class that represents a musical bar
   * @param staff Staff in which the bar lives
   * @param trackContext Track context
   * @param masterBar Master bar
   * @param beats Beats for this bar
   */
  constructor(
    staff: Staff<I>,
    trackContext: TrackContext<I>,
    masterBar: MasterBar,
    beats: Beat<I>[] = []
  ) {
    this.uuid = randomInt();
    this.staff = staff;
    this.trackContext = trackContext;
    this.masterBar = masterBar;
    this.beats = beats.length === 0 ? [this.createDefaultBeat(0)] : beats;

    this._beamingGroups = [];
    this._tupletGroups = [];
    this._tickResolution = 1;
    this._barTicks = 0;
    this._actualTicks = 0;

    this.rebuildTiming();
  }

  private ensureSeedBeat(): Beat<I>[] {
    if (this.beats.length !== 0) {
      return [];
    }

    const seedBeat = this.createDefaultBeat(0);
    this.beats.push(seedBeat);
    return [seedBeat];
  }

  private resetBeamingMetadata(): void {
    for (const beat of this.beats) {
      beat.beamGroupId = null;
      beat.lastInBeamGroup = false;
    }
  }

  private computeTickResolution(): number {
    const requiredDenominators: number[] = [
      this.masterBar.barDurationFraction.denominator,
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
      this.masterBar.barDurationFraction,
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
    const durationDenominator = 1 / this.masterBar.timeSignatureDenominator;
    const beamingGroups = getBeaming(
      this.masterBar.timeSignatureNumerator,
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

  public rebuildTiming(): void {
    this.ensureSeedBeat();
    this.recomputeTupletGroups();
    this.rebuildBeatTicks();
    this.recomputeBeaming();
  }

  /**
   * Computes beaming for all the beats inside of this bar.
   * Kept for compatibility: delegates to timing rebuild.
   */
  public computeBeaming(): void {
    this.rebuildTiming();
  }

  /**
   * Computes bar's tuplet groups from scratch beat-by-beat.
   * Kept for compatibility: delegates to timing rebuild.
   */
  public computeBarTupletGroups(): void {
    this.rebuildTiming();
  }

  /**
   * Gets actual duration of all the beats in the bar
   * @returns Sum of all bar's beats' durations
   */
  public getActualBarDuration(): number {
    return this._actualTicks / this._tickResolution;
  }

  /**
   * Checks if the beat needs to be played
   * @param beatToCheck Beat to check
   * @returns True if beat should be played, false otherwise
   */
  public beatPlayable(beatToCheck: Beat<I>): boolean {
    if (!this.beats.includes(beatToCheck)) {
      throw Error("Beat is not this bar");
    }

    return beatToCheck.endTick <= this._barTicks;
  }

  /**
   * Inserts beats
   * @param index Index after which to insert the beat
   * @param beats Beats to insert
   */
  public insertBeats(index: number, beats: Beat<I>[]): Beat<I>[] {
    if (index < 0 || index > this.beats.length) {
      throw Error(`${index} is invalid beat index`);
    }

    const beatsCopies: Beat<I>[] = [];
    for (const beat of beats) {
      beatsCopies.push(beat.deepCopy());
    }
    this.beats.splice(index, 0, ...beatsCopies);

    this.rebuildTiming();

    return beatsCopies;
  }

  /**
   * Insert a beat
   * @param index Index after which to insert the beat
   * @param beat Beat to insert
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
    return new Beat(this, this.trackContext, [], duration);
  }

  /**
   * Prepends beats to the beginning of the bar
   */
  public prependBeats(beats?: Beat<I>[]): BeatArrayOperationOutput<I> {
    const beatsToInsert = beats ?? [this.createDefaultBeat(0)];
    const insertedBeats = this.insertBeats(0, beatsToInsert);

    return { index: 0, beats: insertedBeats };
  }

  /**
   * Appends beats to the end of the bar
   */
  public appendBeats(beats?: Beat<I>[]): BeatArrayOperationOutput<I> {
    const index = this.beats.length;
    const beatsToInsert = beats ?? [this.createDefaultBeat(index)];
    const insertedBeats = this.insertBeats(index, beatsToInsert);

    return { index: index, beats: insertedBeats };
  }

  /**
   * Remove beat from beats array
   * @param index Index of the beat
   */
  public removeBeat(index: number): BeatArrayOperationOutput<I>[] {
    if (index < 0 || index >= this.beats.length) {
      throw Error(`${index} is invalid beat index`);
    }

    const outputs: BeatArrayOperationOutput<I>[] = [];
    outputs.push({ index: index, beats: this.beats.splice(index, 1) });
    this.ensureSeedBeat();

    this.rebuildTiming();

    return outputs;
  }

  /**
   * Removes beats from bar
   * @param beats Beats to remove
   */
  public removeBeats(beats: Beat<I>[]): BeatArrayOperationOutput<I>[][] {
    const outputs: BeatArrayOperationOutput<I>[][] = [];
    for (const beat of beats) {
      const beatIndex = this.beats.indexOf(beat);
      outputs.push(this.removeBeat(beatIndex));
    }

    return outputs;
  }

  /**
   * Creates bar's deep copy
   * @returns Deep copy of the bar
   */
  public deepCopy(): Bar<I> {
    const beatsCopies: Beat<I>[] = [];
    for (const beat of this.beats) {
      beatsCopies.push(beat.deepCopy());
    }

    return new Bar<I>(
      this.staff,
      this.trackContext,
      this.masterBar,
      beatsCopies
    );
  }

  /**
   * Checks if the bar is empty (actually or musically)
   * @returns True if empty, false otherwise
   */
  public isEmpty(): boolean {
    return this.beats.length === 1 && this.beats[0].isEmpty();
  }

  /**
   * Indicates if all beats in the bar fit.
   * Returns true if durations fit OR no beats in the bar
   */
  public checkDurationsFit(): boolean {
    if (this.beats.length === 1 && this.beats[0].isEmpty()) {
      return true;
    }

    return this._actualTicks === this._barTicks;
  }

  /** Beaming groups getter*/
  public get beamingGroups(): number[] {
    return this._beamingGroups;
  }

  /** Tuplet groups getter*/
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
   * Parses bar into JSON
   * @returns Bar JSON
   */
  public toJSON(): BarJSON {
    if (this.isEmpty()) {
      return { beats: [] };
    }

    const beatsJSON: BeatJSON[] = [];
    for (const beat of this.beats) {
      beatsJSON.push(beat.toJSON());
    }

    return {
      beats: beatsJSON,
    };
  }

  /**
   * Compares contents of this bar with some other bar
   * (ignoring UUID)
   * @param otherBar Bar to compare with
   * @returns True if equal, false otherwise
   */
  public compare(otherBar: Bar<I>): boolean {
    if (
      this.masterBar !== otherBar.masterBar ||
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
