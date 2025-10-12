import { Beat, TupletSettings } from "./beat";
import { Guitar } from "./guitar";
import { NoteDuration } from "./note-duration";
import { Tab } from "./tab";
import { randomInt } from "../misc/random-int";
import { TupletGroup } from "./tuplet-group";

export enum BarRepeatStatus {
  None,
  Start,
  End,
}

/**
 * Build beaming for an irregular tempo
 * @param beatsCount Number of beats in a bar
 * @param duration Duration of a single bar beat
 * @returns
 */
function buildIrregularBeams(beatsCount: number, duration: number): number[] {
  // Adjust beats count and duration to the provided duration
  // (anything below 8 gets multiplied by 8/x: for 4 multiply by 2, for 2 - by 4)
  let adjBeatsCount = beatsCount;
  let adjDuration = duration;
  if (duration < 8) {
    adjBeatsCount *= 8 / duration;
    adjDuration *= 8 / duration;
  }

  // Create all possible counts for when the max num of notes per beam is:
  //
  const counts = [
    [Array(Math.floor(adjBeatsCount / 12)).fill(12), adjBeatsCount % 12],
    [Array(Math.floor(adjBeatsCount / 8)).fill(8), adjBeatsCount % 8],
    [Array(Math.floor(adjBeatsCount / 6)).fill(6), adjBeatsCount % 6],
    [Array(Math.floor(adjBeatsCount / 4)).fill(4), adjBeatsCount % 4],
    [Array(Math.floor(adjBeatsCount / 2)).fill(2), adjBeatsCount % 2],
  ]
    .filter((v) => (v[0] as number[]).length > 0)
    .sort((a, b) => (a[0] as number[]).length - (b[0] as number[]).length);

  let biggestBeamNotesCount = (counts[0][0] as number[])[0];
  const biggestBeamsCount = (counts[0][0] as number[]).length;
  let remainderBeamNotesCount = counts[0][1] as number;

  // Adjust the biggest beam count by moving notes to the remainder beam
  // The goal is:
  // - Keep each beam group reasonably sized (>4 notes difference)
  // - Prefer multiples of 4 when biggestBeamNotesCount > 8
  while (
    biggestBeamNotesCount - remainderBeamNotesCount > 4 &&
    (biggestBeamNotesCount <= 8 || biggestBeamNotesCount % 4 !== 0)
  ) {
    biggestBeamNotesCount -= 2;
    remainderBeamNotesCount += 2;
  }

  const finalBiggsetBeams = Array(biggestBeamsCount).fill(
    biggestBeamNotesCount
  );

  const curBeaming = [...finalBiggsetBeams, remainderBeamNotesCount];
  let pulseBase;
  let pulsesCount;
  if (duration === 2) {
    return curBeaming;
  } else {
    pulseBase = buildIrregularBeams(beatsCount, 2);
    pulsesCount = pulseBase.length;
  }

  const result = Array(pulsesCount).fill(0);
  for (let i = 0; i < pulsesCount; i++) {
    result[i] = pulseBase[i];
  }

  for (let i = 0; i < Math.log2(duration) - 1; i++) {
    for (let j = 0; j < pulsesCount; j++) {
      if (result[j] % 2 !== 0) {
        continue;
      }
      result[j] /= 2;
    }
  }
  result[result.length - 1] -= duration === 4 ? 2 : 0;

  const factor = duration === 4 ? 2 : 1;
  let resultSum = 0;
  for (const el of result) {
    resultSum += el;
  }
  if (resultSum === beatsCount * factor) {
    return result;
  }

  for (let i = result.length - 1; i >= 0; i++) {
    if (resultSum > beatsCount * factor) {
      result[i] -= 1 * factor;
      resultSum -= 1 * factor;
    } else {
      result[i] += 1 * factor;
      resultSum += 1 * factor;
    }

    if (resultSum === beatsCount * factor) {
      return result;
    }
  }

  return result;
}

/**
 * Returns beaming rules for a given time signature.
 * @param beatsCount - top number of the time signature (e.g., 4 in 4/4, 7 in 7/8)
 * @param duration - bottom number of the time signature (e.g., 4 = quarter note, 8 = eighth note)
 * @returns Array of group sizes in "duration" subdivisions (e.g., [2,2,2,2] for 4/4 eighths)
 */
function getBeaming(beatsCount: number, duration: number) {
  const isSimple = beatsCount === 2 || beatsCount === 3 || beatsCount === 4;
  const isCompound = beatsCount % 3 === 0 && beatsCount !== 3 && duration === 8;
  const isIrregular = !isSimple && !isCompound;

  // Handle irregular meters first
  if (isIrregular) {
    return buildIrregularBeams(beatsCount, duration);
  }

  // Compound meter: top divisible by 3 but not 3 itself (6/8, 9/8, 12/8)
  if (isCompound) {
    // Example: 6/8 → [3,3], 9/8 → [3,3,3]
    const groups = [];
    const groupsCount = beatsCount / 3;
    for (let i = 0; i < groupsCount; i++) {
      groups.push(3);
    }
    return groups;
  }

  // Simple meter: top = 2, 3, or 4
  if (isSimple) {
    // Group by 2 or 4 subdivisions, depending on duration
    // Example: 4/4 (quarter) → [2,2,2,2] eighth notes
    //          3/4 (quarter) → [2,2,2] eighth notes
    const groups = [];
    for (let i = 0; i < beatsCount; i++) {
      groups.push(2); // each beat = 2 subdivisions (eighths)
    }
    return groups;
  }

  // Default fallback: no grouping
  return [beatsCount];
}

function tupletSettingsEqual(beat1: Beat, beat2: Beat): boolean {
  return (
    beat1.tupletSettings?.normalCount === beat2.tupletSettings?.normalCount &&
    beat1.tupletSettings?.tupletCount === beat2.tupletSettings?.tupletCount
  );
}

/**
 * Class that represents a musical bar
 */
export class Bar {
  /**
   * Bar's unqiue identifier
   */
  readonly uuid: number;
  /**
   * Guitar on which the bar is played
   */
  readonly guitar: Guitar;
  /**
   * Tempo of the bar
   */
  private _tempo: number;
  /**
   * Number of beats for the bar (upper number in time signature)
   */
  private _beatsCount: number;
  /**
   * The duration of the note that constitutes a whole bar
   * (lower number in time signature)
   */
  private _duration: NoteDuration;
  /**
   * Whether this bar is a repeat start, repeat end or a regular bar
   */
  private _repeatStatus: BarRepeatStatus;
  /**
   * How many times a repeat section should repeat
   * (only defined for bars with _repeatStatus === BarRepeatStatus.End)
   */
  private _repeatCount?: number;
  /**
   * Array of all beats in the bar
   */
  readonly beats: Beat[];
  /**
   * Beaming groups
   */
  private _beamingGroups: number[];
  /**
   * Tuplet groups
   */
  private _tupletGroups: TupletGroup[];

  /**
   * Class that represents a musical bar
   * @param guitar Guitar on which the bar is played
   * @param tempo Tempo of the bar
   * @param beatsCount Number of beats for the bar
   * @param duration The duration of the note that constitutes a whole bar
   * @param beats Array of all beats in the bar
   * @param repeatStatus Array of all beats in the bar
   */
  constructor(
    guitar: Guitar,
    tempo: number,
    beatsCount: number,
    duration: NoteDuration,
    beats: Beat[] | undefined,
    repeatStatus: BarRepeatStatus = BarRepeatStatus.None
  ) {
    this.uuid = randomInt();
    this.guitar = guitar;
    this._tempo = tempo;
    this._beatsCount = beatsCount;
    this._duration = duration;
    // this._isRepeatStart = false;
    // this._isRepeatEnd = false;
    // this._durationsFit = true;
    this._repeatStatus = repeatStatus;
    if (beats === undefined) {
      this.beats = [];
      for (let i = 0; i < this._beatsCount; i++) {
        this.beats.push(new Beat(this.guitar, this._duration));
      }
    } else {
      this.beats = beats;
    }
    this._beamingGroups = [];
    this._tupletGroups = [];

    this.computeBeaming();
    this.computeTupletGroups();
  }

  public computeBeaming(): void {
    // 1. Reset all beaming information on the actual beats.
    for (const beat of this.beats) {
      beat.setBeamGroupId(undefined);
      beat.setIsLastInBeamGroup(false);
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
        const baseDuration = tupletBeats[0].duration;

        // ...create M "pretend" beats to stand in for the N real tuplet notes.
        const pretendBeatPrototypes = Array(tupletGroup.tupletCount).fill(
          new Beat(this.guitar, baseDuration)
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
    const beamingGroups = getBeaming(this._beatsCount, 1 / this._duration);
    const factor = 1 / this._duration < 8 ? 8 : 1 / this._duration;

    let currentBeamGroupId = 0;
    let beamingGroupIndex = 0;
    let currentBeamGroup = beamingGroups[beamingGroupIndex];
    let remainingDuration = currentBeamGroup ? currentBeamGroup / factor : 0;

    for (const beat of pretendBeats) {
      if (beat.getFullDuration() > NoteDuration.Eighth || beat.isEmpty()) {
        currentBeamGroupId++;
        beamingGroupIndex = (beamingGroupIndex + 1) % beamingGroups.length;
        currentBeamGroup = beamingGroups[beamingGroupIndex];
        remainingDuration = currentBeamGroup ? currentBeamGroup / factor : 0;
        continue;
      }

      if (remainingDuration > 0) {
        beat.setBeamGroupId(currentBeamGroupId);
        remainingDuration -= beat.getFullDuration();
      }

      if (remainingDuration <= 0) {
        const groupBeats = pretendBeats.filter(
          (b) => b.beamGroupId === currentBeamGroupId
        );
        if (groupBeats.length > 0) {
          groupBeats[groupBeats.length - 1].setIsLastInBeamGroup(true);
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
      if (pretendBeat) {
        realBeat.setBeamGroupId(pretendBeat.beamGroupId);
        realBeat.setIsLastInBeamGroup(pretendBeat.lastInBeamGroup);
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
      if (!tupletGroup.complete) continue;

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
        maxGroupId++;
        for (const realBeat of realBeats) {
          realBeat.setBeamGroupId(maxGroupId);
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
        groupBeats[0].setBeamGroupId(undefined);
        groupBeats[0].setIsLastInBeamGroup(false);
      } else {
        // Ensure the last beat of any valid group is marked as such.
        groupBeats[groupBeats.length - 1].setIsLastInBeamGroup(true);
      }
    }

    this._beamingGroups = beamingGroups;
  }

  /**
   * Computes bar's tuplet groups from scratch beat-by-beat
   */
  public computeTupletGroups(): void {
    this._tupletGroups = [];
    let curGroupBeats: Beat[] = [];
    let curTupletSettings: TupletSettings | undefined = undefined;
    let prevBeat: Beat | undefined = undefined;
    for (const beat of this.beats) {
      if (prevBeat === undefined) {
        // If on first beat
        if (beat.tupletSettings !== undefined) {
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

      if (beat.tupletSettings === undefined) {
        // If current beat not in a tuplet
        if (prevBeat.tupletSettings !== undefined) {
          // If current beat marks the end of a current tuplet
          if (curTupletSettings === undefined) {
            throw Error(
              "Current tuplet settings undefined at the end of current tuplet"
            );
          }
          this._tupletGroups.push(
            new TupletGroup(
              curGroupBeats,
              curTupletSettings.normalCount,
              curTupletSettings.tupletCount
            )
          );
          curGroupBeats = [];
          curTupletSettings = undefined;
        }
        prevBeat = beat;
        continue;
      }

      // // By this point current tuplet settings must be defined
      // if (curTupletSettings === undefined) {
      //   throw Error("Current tuplet settings undefined");
      // }

      if (curTupletSettings === undefined) {
        curTupletSettings = {
          normalCount: beat.tupletSettings.normalCount,
          tupletCount: beat.tupletSettings.tupletCount,
        };
      }
      if (tupletSettingsEqual(beat, prevBeat)) {
        // If settings are equal, *check if current beat fits*
        // and either push to existing tuplet group or create a new one
        // with the same settings
        if (curTupletSettings.normalCount === curGroupBeats.length) {
          this._tupletGroups.push(
            new TupletGroup(
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
            new TupletGroup(
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
      if (curTupletSettings === undefined) {
        throw Error("Current tuplet beats count > 0 but settings undefined");
      }
      this._tupletGroups.push(
        new TupletGroup(
          curGroupBeats,
          curTupletSettings.normalCount,
          curTupletSettings.tupletCount
        )
      );
    }

    this.computeBeaming();
  }

  public setTuplet(
    beats: Beat[],
    normalCount: number,
    tupletCount: number
  ): void {
    const startIndex = this.beats.indexOf(beats[0]);
    const endIndex = this.beats.indexOf(beats[beats.length - 1]);
    if (startIndex === -1 || endIndex === -1) {
      throw Error("Beats array includes at least one beat outside the bar");
    }
    if (endIndex < startIndex) {
      throw Error(
        "Beats provided in non-seqeuential order, something must have went wrong"
      );
    }

    for (let i = startIndex; i <= endIndex; i++) {
      this.beats[i].setTupletGroupSettings({
        normalCount: normalCount,
        tupletCount: tupletCount,
      });
    }

    this.computeTupletGroups();
  }

  /**
   * Gets actual duration of all the beats in the bar
   * @returns Sum of all bar's beats' durations
   */
  public actualDuration(): number {
    let durations = 0;
    for (let beat of this.beats) {
      durations += beat.duration;
    }

    return durations;
  }

  /**
   * Gets maximum duration this bar can fit
   * @returns Maximum duration this bar can fit
   */
  public getMaxDuration(): number {
    return this._beatsCount * this._duration;
  }

  public insertBeat(index: number, beat: Beat): void {
    // Check index validity
    if (index < 0 || index > this.beats.length) {
      throw Error(`${index} is invalid beat index`);
    }

    // Insert beat in the data model
    this.beats.splice(index, 0, beat);

    // Recalc beaming
    this.computeBeaming();
    this.computeTupletGroups();
  }

  /**
   * Inserts empty beat in the bar before beat with index 'index'
   * @param index Index of the beat that will be prepended by the new beat
   */
  public insertEmptyBeat(index: number): void {
    // Check index validity
    if (index < 0 || index > this.beats.length) {
      throw Error(`${index} is invalid beat index`);
    }

    // Insert beat in the data model
    const duration =
      index === 0 ? NoteDuration.Quarter : this.beats[index - 1].duration;
    let newBeat = new Beat(this.guitar, duration);
    this.beats.splice(index, 0, newBeat);

    // Recalc beaming
    this.computeBeaming();
    this.computeTupletGroups();
  }

  /**
   * Prepends beat to the beginning of the bar
   */
  public prependBeat(): void {
    this.insertEmptyBeat(0);
  }

  /**
   * Appends beat to the end of the bar
   */
  public appendBeat(): void {
    this.insertEmptyBeat(this.beats.length);
  }

  /**
   * Removes beat at index
   * @param index Index of the beat to be removed
   */
  public removeBeat(index: number): void {
    // Check index validity
    if (index < 0 || index > this.beats.length) {
      throw Error(`${index} is invalid beat index`);
    }

    // Remove beat
    this.beats.splice(index, 1);

    if (this.beats.length === 0) {
      this.insertEmptyBeat(0);
    }

    // Recalc beaming
    this.computeBeaming();
    this.computeTupletGroups();
  }

  /**
   * Uses UUID to delete beat
   * @param uuid Beat's UUID
   */
  public removeBeatByUUID(uuid: number): void {
    const beatIndex = this.beats.findIndex((beat) => {
      return beat.uuid === uuid;
    });

    this.removeBeat(beatIndex);

    // Recalc beaming
    this.computeBeaming();
    this.computeTupletGroups();
  }

  /**
   * Insert beats after specified beat
   * @param beatId Id of the beat after which to insert
   * @param beats Beats to insert
   */
  public insertBeats(beatId: number, beats: Beat[]): void {
    const beatsCopies = [];
    for (const beat of beats) {
      beatsCopies.push(beat.deepCopy());
    }

    // Insert beats at specified position
    this.beats.splice(beatId + 1, 0, ...beatsCopies);

    // Recalc beaming
    this.computeBeaming();
    this.computeTupletGroups();
  }

  /**
   * Changes duration of a beat
   * @param beat Beat to change the duration of
   * @param duration New beat duration
   */
  public changeBeatDuration(beat: Beat, duration: NoteDuration): void {
    let index = this.beats.indexOf(beat);
    this.beats[index].duration = duration;
  }

  public setRepeatStart(): void {
    this._repeatStatus =
      this._repeatStatus === BarRepeatStatus.Start
        ? BarRepeatStatus.None
        : BarRepeatStatus.Start;
  }

  public setRepeatEnd(repeatsCount: number = 2): void {
    this._repeatStatus =
      this._repeatStatus === BarRepeatStatus.End
        ? BarRepeatStatus.None
        : BarRepeatStatus.End;
    this._repeatCount = repeatsCount;
  }

  public setRepeatNone(): void {
    this._repeatStatus = BarRepeatStatus.None;
  }

  public beatPlayable(beatToCheck: Beat): boolean {
    if (!this.beats.includes(beatToCheck)) {
      throw Error("Beat is not this bar");
    }

    const barDuration = this._beatsCount * this._duration;
    let duration = 0;
    for (const beat of this.beats) {
      duration += beat.duration;

      if (duration <= barDuration && beat === beatToCheck) {
        return true;
      }
    }

    return false;
  }

  /**
   * Beats (upper number in time signature) getter/setter
   */
  public setBeatsCount(newBeats: number) {
    if (newBeats < 1 || newBeats > 32) {
      throw Error(`${newBeats} is invalid beats value`);
    }

    this._beatsCount = newBeats;

    this.computeBeaming();
    this.computeTupletGroups();
  }

  /**
   * Beats (upper number in time signature) getter/setter
   */
  public setDuration(newDuration: NoteDuration) {
    this._duration = newDuration;

    this.computeBeaming();
    this.computeTupletGroups();
  }

  /**
   * Tempo getter/setter
   */
  public setTempo(newTempo: number) {
    if (newTempo <= 0) {
      throw Error(
        `${newTempo} is an invalid tempo value: tempo can't be 0 or less`
      );
    }

    this._tempo = newTempo;
  }

  public deepCopy(): Bar {
    const beatsCopies = [];
    for (const beat of this.beats) {
      beatsCopies.push(beat.deepCopy());
    }

    return new Bar(
      this.guitar,
      this._tempo,
      this._beatsCount,
      this._duration,
      beatsCopies
    );
  }

  public isEmpty(): boolean {
    if (this.beats.length > 1) {
      return false;
    }

    return this.beats[0].isEmpty();
  }

  /**
   * Beats (upper number in time signature) getter/setter
   */
  get beatsCount(): number {
    return this._beatsCount;
  }

  /**
   * Beats (upper number in time signature) getter/setter
   */
  get duration(): number {
    return this._duration;
  }

  /**
   * Tempo getter/setter
   */
  get tempo(): number {
    return this._tempo;
  }

  /**
   * Indicates if all beats in the bar fit.
   * Returns true if durations fit OR no beats in the bar
   */
  get durationsFit(): boolean {
    if (this.beats.length === 0) {
      return true;
    }

    if (this.beats.length === 1 && this.beats[0].isEmpty()) {
      return true;
    }

    let durations = 0;
    for (let beat of this.beats) {
      // durations += beat.duration;
      durations += beat.getFullDuration();
    }

    return durations === this._beatsCount * this._duration;
  }

  /**
   * Time signature value
   */
  get signature() {
    return this._beatsCount * this._duration;
  }

  /**
   * Whether this bar is a repeat start, repeat end or a regular bar
   */
  public get repeatStatus(): BarRepeatStatus {
    return this._repeatStatus;
  }

  /**
   * How many times a repeat section should repeat
   * (only defined for bars with _repeatStatus === BarRepeatStatus.End)
   */
  public get repeatCount(): number | undefined {
    return this._repeatCount;
  }

  /**
   * Beaming groups
   */
  public get beamingGroups(): number[] {
    return this._beamingGroups;
  }

  /**
   * Tuplet groups
   */
  public get tupletGroups(): TupletGroup[] {
    return this._tupletGroups;
  }

  /**
   * Parses bar into simple object
   * @returns Simple parsed object
   */
  public toJSONObj(): Object {
    const beatsJSON = [];
    for (const beat of this.beats) {
      beatsJSON.push(beat.toJSONObj());
    }

    return {
      tempo: this._tempo,
      beatsCount: this._beatsCount,
      duration: this._duration,
      beats: beatsJSON,
    };
  }

  /**
   * Parses bar into JSON string
   * @returns Parsed JSON string
   */
  public toJSON(): string {
    return JSON.stringify(this.toJSONObj());
  }

  /**
   * Parses a JSON object into a Bar class object
   * @param guitar Guitar of the track
   * @param obj JSON object to parse
   * @returns Parsed Bar object
   */
  static fromJSON(guitar: Guitar, obj: any): Bar {
    if (
      obj.tempo === undefined ||
      obj.beatsCount === undefined ||
      obj.duration === undefined ||
      obj.beats === undefined
    ) {
      throw Error(
        `Invalid JSON to parse into bar, obj: ${JSON.stringify(obj)}`
      );
    }

    const beats: Beat[] = [];
    for (const beat of obj.beats) {
      beats.push(Beat.fromJSON(guitar, beat));
    }

    return new Bar(guitar, obj.tempo, obj.beatsCount, obj.duration, beats);
  }

  /**
   * Compares two bars for equality (ignores uuid)
   * @param bar1 Bar 1
   * @param bar2 Bar 2
   * @returns True if equal (ignoring uuid)
   */
  static compare(bar1: Bar, bar2: Bar): boolean {
    if (
      bar1.guitar !== bar2.guitar ||
      bar1._tempo !== bar2._tempo ||
      bar1._beatsCount !== bar2._beatsCount ||
      bar1._duration !== bar2._duration ||
      bar1.durationsFit !== bar2.durationsFit ||
      bar1.beats.length !== bar2.beats.length
    ) {
      return false;
    }

    // Compare beats
    for (let i = 0; i < bar1.beats.length; i++) {
      if (!Beat.compare(bar1.beats[i], bar2.beats[i])) {
        return false;
      }
    }

    // Equal if all is the same
    return true;
  }

  /**
   * Creates a default bar with 1 beat and no notes
   * @param guitar Guitar
   * @param tempo BPM
   * @param beatsCount Beats count
   * @param duration Duration
   * @returns Default bar with 1 beat and no notes
   */
  static defaultBar(
    guitar: Guitar,
    tempo: number,
    beatsCount: number,
    duration: NoteDuration
  ): Bar {
    return new Bar(guitar, tempo, beatsCount, duration, [
      new Beat(guitar, duration),
    ]);
  }
}
