import { randomInt } from "@/shared";
import { Beat, BeatJSON } from "./beat";
import { NoteDuration } from "./note-duration";
import { getBeaming } from "./bar-beaming";
import { BarRepeatStatus } from "./bar-repeat-status";
import { MusicInstrument } from "./instrument/instrument";
import { MasterBar } from "./master-bar";
import { TrackContext } from "./track-context";
import { INSTRUMENT_TYPES } from "./instrument/instrument-type";
import { MusicInstrumentKind } from "./instrument/instrument-kind";
import { Staff } from "./staff";
import { BarTupletGroup } from "./tuplet-group";
import { TupletSettings, tupletSettingsEqual } from "./tuplet-settings";

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

type PretendBeamingBeat = {
  fullDuration: number;
  beamGroupId: number | null;
  lastInBeamGroup: boolean;
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
    if (beats.length === 0) {
      // this.beats = [new Beat<I>(this, this.trackContext, NoteDuration.Quarter)];

      // TODO: Figure out behavior for when passed beats is empty
      // this.beats = [new Beat<I>(this, this.trackContext)];
      this.beats = [];
    } else {
      this.beats = beats;
    }

    this._beamingGroups = [];
    this._tupletGroups = [];

    this.computeBeaming();
    this.computeBarTupletGroups();
  }

  private resetBeamingMetadata(): void {
    for (const beat of this.beats) {
      beat.beamGroupId = null;
      beat.lastInBeamGroup = false;
    }
  }

  private buildPretendBeats(): {
    pretendBeats: PretendBeamingBeat[];
    realToPretendMap: Map<Beat<I>, PretendBeamingBeat>;
  } {
    // Index complete tuplets by beat for O(1) membership checks.
    const pretendBeats: PretendBeamingBeat[] = [];
    const realToPretendMap = new Map<Beat<I>, PretendBeamingBeat>();
    const completeTupletGroupByBeat = new Map<Beat<I>, BarTupletGroup<I>>();

    for (const tupletGroup of this._tupletGroups) {
      if (!tupletGroup.complete) {
        continue;
      }

      for (const tupletBeat of tupletGroup.beats) {
        completeTupletGroupByBeat.set(tupletBeat, tupletGroup);
      }
    }

    // Build temporary rhythmic representation used by beaming.
    for (let i = 0; i < this.beats.length; i++) {
      const beat = this.beats[i];
      const tupletGroup = completeTupletGroupByBeat.get(beat);

      if (tupletGroup && tupletGroup.beats[0] === beat) {
        // Replace N tuplet beats with M equivalent "pretend" beats.
        const tupletBeats = tupletGroup.beats;
        const baseDuration = tupletBeats[0].baseDuration;
        const pretendBeatPrototypes = Array.from(
          { length: tupletGroup.tupletCount },
          () => ({
            fullDuration: baseDuration,
            beamGroupId: null,
            lastInBeamGroup: false,
          })
        );

        // Map each real tuplet beat to the pretend beat it belongs to.
        for (let j = 0; j < tupletGroup.normalCount; j++) {
          const realBeat = tupletBeats[j];
          const correspondingPretendBeat =
            pretendBeatPrototypes[
              Math.floor(
                (j / tupletGroup.normalCount) * tupletGroup.tupletCount
              )
            ];
          realToPretendMap.set(realBeat, correspondingPretendBeat);
        }

        pretendBeats.push(...pretendBeatPrototypes);
        // Skip beats already consumed as part of this complete tuplet.
        i += tupletGroup.normalCount - 1;
      } else {
        // Non-tuplet beats map one-to-one into the pretend sequence.
        const pretendBeat = {
          fullDuration: beat.fullDuration,
          beamGroupId: null,
          lastInBeamGroup: false,
        };
        pretendBeats.push(pretendBeat);
        realToPretendMap.set(beat, pretendBeat);
      }
    }

    return { pretendBeats, realToPretendMap };
  }

  private getBeamingPlan(): { beamingGroups: number[]; factor: number } {
    const beamingGroups = getBeaming(
      this.masterBar.beatsCount,
      1 / this.masterBar.duration
    );
    const factor =
      1 / this.masterBar.duration < 8 ? 8 : 1 / this.masterBar.duration;

    return { beamingGroups, factor };
  }

  private advanceBeamingState(
    beamingGroups: number[],
    factor: number,
    state: {
      currentBeamGroupId: number;
      beamingGroupIndex: number;
      remainingDuration: number;
    }
  ): void {
    state.currentBeamGroupId++;
    state.beamingGroupIndex =
      (state.beamingGroupIndex + 1) % beamingGroups.length;
    const currentBeamGroup = beamingGroups[state.beamingGroupIndex];
    state.remainingDuration = currentBeamGroup ? currentBeamGroup / factor : 0;
  }

  private applyBeamingToPretendBeats(
    pretendBeats: PretendBeamingBeat[],
    beamingGroups: number[],
    factor: number
  ): void {
    // Cursor that tracks the current metric beaming bucket.
    const state = {
      currentBeamGroupId: 0,
      beamingGroupIndex: 0,
      remainingDuration: beamingGroups[0] ? beamingGroups[0] / factor : 0,
    };
    let currentGroupBeats: PretendBeamingBeat[] = [];

    // Finalize the current pretend-beat group boundary.
    const closeCurrentGroup = (): void => {
      if (currentGroupBeats.length > 0) {
        currentGroupBeats[currentGroupBeats.length - 1].lastInBeamGroup = true;
      }
      currentGroupBeats = [];
    };

    for (const beat of pretendBeats) {
      // Notes longer than eighths break beaming at this position.
      if (beat.fullDuration > NoteDuration.Eighth) {
        closeCurrentGroup();
        this.advanceBeamingState(beamingGroups, factor, state);
        continue;
      }

      // Assign beat to the current metric bucket.
      if (state.remainingDuration > 0) {
        beat.beamGroupId = state.currentBeamGroupId;
        state.remainingDuration -= beat.fullDuration;
        currentGroupBeats.push(beat);
      }

      // Move to next bucket once the current one is filled.
      if (state.remainingDuration <= 0) {
        closeCurrentGroup();
        this.advanceBeamingState(beamingGroups, factor, state);
      }
    }
  }

  private mapPretendToRealBeaming(
    realToPretendMap: Map<Beat<I>, PretendBeamingBeat>
  ): void {
    // Copy computed beaming metadata back onto real beats.
    for (const realBeat of this.beats) {
      const pretendBeat = realToPretendMap.get(realBeat);
      if (pretendBeat && realBeat.baseDuration <= NoteDuration.Eighth) {
        realBeat.beamGroupId = pretendBeat.beamGroupId;
        realBeat.lastInBeamGroup = pretendBeat.lastInBeamGroup;
      }
    }
  }

  private isolateTupletBeamGroups(): void {
    // Index beats once to avoid repeated indexOf scans.
    const beatIndexMap = new Map<Beat<I>, number>();
    for (let i = 0; i < this.beats.length; i++) {
      beatIndexMap.set(this.beats[i], i);
    }

    let maxGroupId = Math.max(
      ...this.beats
        .map((b) => b.beamGroupId)
        .filter((id) => id !== null)
        .map((id) => id as number),
      0
    );

    for (const tupletGroup of this._tupletGroups) {
      if (!tupletGroup.complete) {
        continue;
      }

      // Tuplets with only unbeamable notes do not need isolation.
      const tupletIsUnbeamable = tupletGroup.beats.every(
        (b) => b.baseDuration > NoteDuration.Eighth
      );
      if (tupletIsUnbeamable) {
        continue;
      }

      const realBeats = tupletGroup.beats;
      const firstBeat = realBeats[0];
      const firstBeatIndex = beatIndexMap.get(firstBeat);
      if (firstBeatIndex === undefined) {
        continue;
      }
      const beatBefore = this.beats[firstBeatIndex - 1];

      let needsNewGroup = false;
      if (beatBefore && beatBefore.beamGroupId === firstBeat.beamGroupId) {
        needsNewGroup = true;
      }

      if (!needsNewGroup) {
        const lastBeat = realBeats[realBeats.length - 1];
        const lastBeatIndex = beatIndexMap.get(lastBeat);
        if (lastBeatIndex === undefined) {
          continue;
        }
        const beatAfter = this.beats[lastBeatIndex + 1];
        if (beatAfter && beatAfter.beamGroupId === lastBeat.beamGroupId) {
          needsNewGroup = true;
        }
      }

      if (needsNewGroup) {
        // Force this tuplet into a dedicated visual beam group.
        maxGroupId++;
        for (const realBeat of realBeats) {
          realBeat.beamGroupId = maxGroupId;
        }
      }
    }
  }

  private cleanupSingleBeatGroups(): void {
    // Group beats by assigned beam ID in one pass.
    const groupsById = new Map<number, Beat<I>[]>();
    for (const beat of this.beats) {
      if (beat.beamGroupId === null) {
        continue;
      }

      const groupBeats = groupsById.get(beat.beamGroupId);
      if (groupBeats === undefined) {
        groupsById.set(beat.beamGroupId, [beat]);
      } else {
        groupBeats.push(beat);
      }
    }

    // Convert one-beat groups to unbeamed beats.
    for (const groupBeats of groupsById.values()) {
      if (groupBeats.length === 1) {
        groupBeats[0].beamGroupId = null;
        groupBeats[0].lastInBeamGroup = false;
      } else {
        groupBeats[groupBeats.length - 1].lastInBeamGroup = true;
      }
    }
  }

  private normalizeBeamGroupIds(): void {
    // Remap surviving IDs to a dense 0..N-1 sequence.
    const normalizedIdsMap = new Map<number, number>();
    let nextNormalizedId = 0;

    for (const beat of this.beats) {
      const originalId = beat.beamGroupId;
      if (originalId === null) {
        continue;
      }

      if (!normalizedIdsMap.has(originalId)) {
        normalizedIdsMap.set(originalId, nextNormalizedId);
        nextNormalizedId++;
      }

      beat.beamGroupId = normalizedIdsMap.get(originalId) ?? null;
    }
  }

  /**
   * Computes beaming for all the beats inside of this bar
   * Algorithm overview:
   * 1. Clear previous beam metadata from real beats.
   * 2. Build a temporary beat sequence where complete tuplets are replaced by
   *    the rhythmic space they represent.
   * 3. Run ordinary time-signature beaming on that temporary sequence.
   * 4. Copy the computed beam metadata back onto the real beats.
   * 5. Split complete tuplets into their own visual beam groups when needed.
   * 6. Remove any beam groups that ended up with only one beat.
   * TODO: There is a much cleaner alternative approach:
   * - Instead of pretend beats, compute each beat’s:
   * -- start position in bar
   * -- end position in bar
   * -- effective duration (including tuplet ratio)
   * - Then assign beam groups by crossing metric boundaries directly.
   * This should be done once ticks are introduced into the Model layer
   */
  public computeBeaming(): void {
    this.resetBeamingMetadata();

    if (this.beats.length < 2) {
      return;
    }

    const { pretendBeats, realToPretendMap } = this.buildPretendBeats();
    const { beamingGroups, factor } = this.getBeamingPlan();

    this.applyBeamingToPretendBeats(pretendBeats, beamingGroups, factor);
    this.mapPretendToRealBeaming(realToPretendMap);
    this.isolateTupletBeamGroups();
    this.cleanupSingleBeatGroups();
    this.normalizeBeamGroupIds();

    this._beamingGroups = beamingGroups;
  }

  /**
   * Computes bar's tuplet groups from scratch beat-by-beat
   */
  public computeBarTupletGroups(): void {
    this._tupletGroups = [];
    let curGroupBeats: Beat<I>[] = [];
    let curTupletSettings: TupletSettings | null = null;
    let prevBeat: Beat<I> | undefined = undefined;
    for (const beat of this.beats) {
      if (prevBeat === undefined) {
        // If on first beat
        if (beat.tupletSettings !== null) {
          // If current beat in tuplet, start
          // filling up the current tuplet group
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
        // If current beat not in a tuplet
        if (prevBeat.tupletSettings !== null) {
          // If current beat marks the end of a current tuplet
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

      // // By this point current tuplet settings must be defined
      // if (curTupletSettings === undefined) {
      //   throw Error("Current tuplet settings undefined");
      // }

      if (curTupletSettings === null) {
        curTupletSettings = {
          normalCount: beat.tupletSettings.normalCount,
          tupletCount: beat.tupletSettings.tupletCount,
        };
      }
      if (tupletSettingsEqual(beat.tupletSettings, prevBeat.tupletSettings)) {
        // If settings are equal, *check if current beat fits*
        // and either push to existing tuplet group or create a new one
        // with the same settings
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

    // If current tuplet group has elements, make a new last tuplet group out of it
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

    this.computeBeaming();
  }

  /**
   * Gets actual duration of all the beats in the bar
   * @returns Sum of all bar's beats' durations
   */
  public getActualBarDuration(): number {
    let durations = 0;
    for (let beat of this.beats) {
      durations += beat.fullDuration;
    }

    return durations;
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

    const maxDuration = this.masterBar.maxDuration;
    let duration = 0;
    for (const beat of this.beats) {
      duration += beat.fullDuration;

      if (duration <= maxDuration && beat === beatToCheck) {
        return true;
      }
    }

    return false;
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

    this.computeBeaming();
    this.computeBarTupletGroups();

    return beatsCopies;
  }

  /**
   * Insert a beat
   * @param bar Bar to modify
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
    // Check index validity
    if (index < 0 || index >= this.beats.length) {
      throw Error(`${index} is invalid beat index`);
    }

    // Remove beat
    const outputs: BeatArrayOperationOutput<I>[] = [];
    outputs.push({ index: index, beats: this.beats.splice(index, 1) });

    // Recalc beaming
    this.computeBeaming();
    this.computeBarTupletGroups();

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
    if (this.beats.length === 0) {
      return true;
    }

    if (this.beats.length > 1) {
      return false;
    }

    return this.beats[0].isEmpty();
  }

  /**
   * Indicates if all beats in the bar fit.
   * Returns true if durations fit OR no beats in the bar
   */
  public checkDurationsFit(): boolean {
    if (this.beats.length === 0) {
      return true;
    }

    if (this.beats.length === 1 && this.beats[0].isEmpty()) {
      return true;
    }

    let durations = 0;
    for (let beat of this.beats) {
      durations += beat.fullDuration;
    }

    return durations === this.masterBar.maxDuration;
  }

  /** Beaming groups getter*/
  public get beamingGroups(): number[] {
    return this._beamingGroups;
  }

  /** Tuplet groups getter*/
  public get tupletGroups(): BarTupletGroup[] {
    return this._tupletGroups;
  }

  /**
   * Parses bar into JSON
   * @returns Bar JSON
   */
  public toJSON(): BarJSON {
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

    // Compare beats
    for (let i = 0; i < this.beats.length; i++) {
      if (!this.beats[i].compare(otherBar.beats[i])) {
        return false;
      }
    }

    // Equal if all is the same
    return true;
  }
}
