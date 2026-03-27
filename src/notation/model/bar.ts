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

  /**
   * Computes beaming for all the beats inside of this bar
   * AI SLOP AI SLOP I HAVE NO IDEA HOW THIS WORKS AI SLOP AI SLOP
   * NEEDS TO BE REWRITTEN SO THAT I UNDERSTAND HOW IT WORKS
   */
  public computeBeaming(): void {
    // NEEDS TO BE REWRITTEN SO THAT I UNDERSTAND HOW IT WORKS
    // NEEDS TO BE REWRITTEN SO THAT I UNDERSTAND HOW IT WORKS
    // NEEDS TO BE REWRITTEN SO THAT I UNDERSTAND HOW IT WORKS
    // NEEDS TO BE REWRITTEN SO THAT I UNDERSTAND HOW IT WORKS

    // 1. Reset all beaming information on the actual beats.
    for (const beat of this.beats) {
      beat.beamGroupId = null;
      beat.lastInBeamGroup = false;
    }

    if (this.beats.length < 2) {
      return;
    }

    // 2. Create a "pretend" list of beats for calculation.
    // This is the core of the beaming logic for tuplets. To figure out how notes
    // around a tuplet should be beamed, we create a temporary list of beats where
    // the tuplet is replaced by the notes it rhythmically represents (e.g., a 3:2 triplet
    // of eighths is replaced by 2 regular eighths).
    const pretendBeats: Beat[] = [];
    // This map links the original beats to the pretend beats used for calculation.
    const realToPretendMap = new Map<Beat, Beat>();

    for (let i = 0; i < this.beats.length; i++) {
      const beat = this.beats[i];
      const tupletGroup = this._tupletGroups.find((tg) =>
        tg.beats.some((tb) => tb.actualBeat === beat)
      );

      // If we find the first beat of a complete tuplet group...
      if (
        tupletGroup &&
        tupletGroup.complete &&
        tupletGroup.beats[0].actualBeat === beat
      ) {
        const tupletBeats = tupletGroup.beats.map((tb) => tb.actualBeat);
        const baseDuration = tupletBeats[0].baseDuration;

        // ...create M "pretend" beats to stand in for the N real tuplet notes.
        const pretendBeatPrototypes = Array(tupletGroup.tupletCount).fill(
          new Beat<I>(this, this.trackContext, [], baseDuration)
        );

        // Map all N real beats to their corresponding M pretend beats.
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
        i += tupletGroup.normalCount - 1; // Skip the already processed real tuplet beats.
      } else {
        // For regular beats or incomplete tuplets, they represent themselves.
        pretendBeats.push(beat);
        realToPretendMap.set(beat, beat);
      }
    }

    // 3. Run the standard beaming algorithm on the `pretendBeats` list.
    // This calculates the metrically correct beaming as if there were no tuplets.
    const beamingGroups = getBeaming(
      this.masterBar.beatsCount,
      1 / this.masterBar.duration
    );
    const factor =
      1 / this.masterBar.duration < 8 ? 8 : 1 / this.masterBar.duration;

    let currentBeamGroupId = 0;
    let beamingGroupIndex = 0;
    let currentBeamGroup = beamingGroups[beamingGroupIndex];
    let remainingDuration = currentBeamGroup ? currentBeamGroup / factor : 0;

    for (const beat of pretendBeats) {
      // if (beat.fullDuration > NoteDuration.Eighth || beat.isEmpty()) {
      if (beat.fullDuration > NoteDuration.Eighth) {
        currentBeamGroupId++;
        beamingGroupIndex = (beamingGroupIndex + 1) % beamingGroups.length;
        currentBeamGroup = beamingGroups[beamingGroupIndex];
        remainingDuration = currentBeamGroup ? currentBeamGroup / factor : 0;
        continue;
      }

      if (remainingDuration > 0) {
        beat.beamGroupId = currentBeamGroupId;
        remainingDuration -= beat.fullDuration;
      }

      if (remainingDuration <= 0) {
        const groupBeats = pretendBeats.filter(
          (b) => b.beamGroupId === currentBeamGroupId
        );
        if (groupBeats.length > 0) {
          groupBeats[groupBeats.length - 1].lastInBeamGroup = true;
        }

        currentBeamGroupId++;
        beamingGroupIndex = (beamingGroupIndex + 1) % beamingGroups.length;
        currentBeamGroup = beamingGroups[beamingGroupIndex];
        remainingDuration = currentBeamGroup ? currentBeamGroup / factor : 0;
      }
    }

    // 4. Map the beaming information from the pretend beats back to the real beats.
    for (const realBeat of this.beats) {
      const pretendBeat = realToPretendMap.get(realBeat);
      if (pretendBeat && realBeat.baseDuration <= NoteDuration.Eighth) {
        realBeat.beamGroupId = pretendBeat.beamGroupId;
        realBeat.lastInBeamGroup = pretendBeat.lastInBeamGroup;
      }
    }

    // 5. Isolate the tuplets into their own beam groups.
    // This ensures that a tuplet is always a visually distinct group.
    let maxGroupId = Math.max(
      ...this.beats
        .map((b) => b.beamGroupId)
        .filter((id) => id !== undefined)
        .map((id) => id as number),
      0
    );

    for (const tupletGroup of this._tupletGroups) {
      if (!tupletGroup.complete) {
        continue;
      }

      const tupletIsUnbeamable = tupletGroup.beats.every(
        (b) => b.actualBeat.baseDuration > NoteDuration.Eighth
      );
      if (tupletIsUnbeamable) {
        continue;
      }

      const realBeats = tupletGroup.beats.map((tb) => tb.actualBeat);
      const firstBeat = realBeats[0];
      const beatBefore = this.beats[this.beats.indexOf(firstBeat) - 1];

      // A tuplet needs its own group if it's currently beamed with a preceding note...
      let needsNewGroup = false;
      if (beatBefore && beatBefore.beamGroupId === firstBeat.beamGroupId) {
        needsNewGroup = true;
      }

      // ...or if it's beamed with a succeeding note.
      if (!needsNewGroup) {
        const lastBeat = realBeats[realBeats.length - 1];
        const beatAfter = this.beats[this.beats.indexOf(lastBeat) + 1];
        if (beatAfter && beatAfter.beamGroupId === lastBeat.beamGroupId) {
          needsNewGroup = true;
        }
      }

      if (needsNewGroup) {
        // maxGroupId++; // I have no idea why this is here
        for (const realBeat of realBeats) {
          realBeat.beamGroupId = maxGroupId;
        }
      }
    }

    // 6. Final cleanup: un-beam any groups that have only one beat.
    const allGroupIds = [
      ...new Set(
        this.beats.map((b) => b.beamGroupId).filter((id) => id !== undefined)
      ),
    ];
    for (const id of allGroupIds) {
      const groupBeats = this.beats.filter((b) => b.beamGroupId === id);
      if (groupBeats.length === 1) {
        groupBeats[0].beamGroupId = null;
        groupBeats[0].lastInBeamGroup = false;
      } else {
        // Ensure the last beat of any valid group is marked as such.
        groupBeats[groupBeats.length - 1].lastInBeamGroup = true;
      }
    }

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
  public insertBeats(index: number, beats: Beat<I>[]): void {
    if (index < 0 || index > this.beats.length) {
      throw Error(`${index} is invalid beat index`);
    }

    const beatsCopies = [];
    for (const beat of beats) {
      beatsCopies.push(beat.deepCopy());
    }
    this.beats.splice(index, 0, ...beatsCopies);

    this.computeBeaming();
    this.computeBarTupletGroups();
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
    this.insertBeats(index, [beat]);

    return { index: index, beats: [beat] };
  }

  /**
   * Inserts empty beat in the bar before beat with index 'index'
   * @param bar Bar to modify
   * @param index Index of the beat that will be prepended by the new beat
   */
  public insertEmptyBeat(index: number): BeatArrayOperationOutput<I> {
    const duration =
      index === 0 ? NoteDuration.Quarter : this.beats[index - 1].baseDuration;
    const newBeat = new Beat(this, this.trackContext, [], duration);
    this.insertBeats(index, [newBeat]);

    return { index: index, beats: [newBeat] };
  }

  /**
   * Prepends beat to the beginning of the bar
   * @param bar Bar to modify
   */
  public prependBeat(beat?: Beat<I>): BeatArrayOperationOutput<I> {
    return this.insertEmptyBeat(0);
  }

  /**
   * Appends beat to the end of the bar
   * @param bar Bar to modify
   */
  public appendBeat(beat?: Beat<I>): BeatArrayOperationOutput<I> {
    if (beat === undefined) {
      return this.insertEmptyBeat(this.beats.length);
    } else {
      const index =
        this.beats.length === 0 ? this.beats.length : this.beats.length - 1;
      return this.insertBeat(index, beat);
    }
  }

  /**
   * Remove beat from beats array
   * @param index Index of the beat
   */
  public removeBeat(index: number): BeatArrayOperationOutput<I>[] {
    // Check index validity
    if (index < 0 || index > this.beats.length) {
      throw Error(`${index} is invalid beat index`);
    }

    // Remove beat
    const outputs: BeatArrayOperationOutput<I>[] = [];
    outputs.push({ index: index, beats: this.beats.splice(index, 1) });

    // Insert empty beat if bar beats count drops to 0
    if (this.beats.length === 0) {
      outputs.push(this.insertEmptyBeat(0));
    }

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
