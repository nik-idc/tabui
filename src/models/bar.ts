import { Beat } from "./beat";
import { Guitar } from "./guitar";
import { NoteDuration } from "./note-duration";
import { Tab } from "./tab";
import { randomInt } from "../misc/random-int";

export enum BarRepeatStatus {
  None,
  Start,
  End,
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
   * (upper number in time signature)
   */
  public duration: NoteDuration;
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
    this.duration = duration;
    // this._isRepeatStart = false;
    // this._isRepeatEnd = false;
    // this._durationsFit = true;
    this._repeatStatus = repeatStatus;
    if (beats === undefined) {
      this.beats = [];
      for (let i = 0; i < this._beatsCount; i++) {
        this.beats.push(new Beat(this.guitar, this.duration));
      }
    } else {
      this.beats = beats;
    }
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
   * Inserts empty beat in the bar before beat with index 'index'
   * @param index Index of the beat that will be prepended by the new beat
   */
  public insertEmptyBeat(index: number): void {
    // Check index validity
    if (index < 0 || index > this.beats.length) {
      throw Error(`${index} is invalid beat index`);
    }

    // Insert beat in the data model
    let newBeat = new Beat(this.guitar, NoteDuration.Quarter);
    this.beats.splice(index, 0, newBeat);
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

    const barDuration = this._beatsCount * this.duration;
    let duration = 0;
    for (const beat of this.beats) {
      duration += beat.duration;

      if (duration <= barDuration && beat === beatToCheck) {
        return true;
      }
    }

    return false;
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
      this.duration,
      beatsCopies
    );
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
  set beatsCount(newBeats: number) {
    if (newBeats < 1 || newBeats > 32) {
      throw Error(`${newBeats} is invalid beats value`);
    }

    this._beatsCount = newBeats;
  }

  /**
   * Tempo getter/setter
   */
  set tempo(newTempo: number) {
    if (newTempo <= 0) {
      throw Error(
        `${newTempo} is an invalid tempo value: tempo can't be 0 or less`
      );
    }

    this._tempo = newTempo;
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

    let durations = 0;
    for (let beat of this.beats) {
      // durations += beat.duration;
      durations += beat.getFullDuration();
    }

    return durations === this._beatsCount * this.duration;
  }

  /**
   * Time signature value
   */
  get signature() {
    return this._beatsCount * this.duration;
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
      duration: this.duration,
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
      bar1.duration !== bar2.duration ||
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
