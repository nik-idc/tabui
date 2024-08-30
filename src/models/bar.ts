import { Chord } from "./chord";
import { Guitar } from "./guitar";
import { NoteDuration } from "./note-duration";
import { Tab } from "./tab";

/**
 * Class that represents a musical bar
 */
export class Bar {
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
  private _beats: number;
  /**
   * The duration of the note that constitutes a whole bar
   * (upper number in time signature)
   */
  public duration: NoteDuration;
  /**
   * Array of all chords in the bar
   */
  readonly chords: Chord[];
  /**
   * Indicates if all chords in the bar fit
   */
  private _durationsFit: boolean;

  /**
   * Class that represents a musical bar
   * @param guitar Guitar on which the bar is played
   * @param tempo Tempo of the bar
   * @param beats Number of beats for the bar
   * @param duration The duration of the note that constitutes a whole bar
   * @param chords Array of all chords in the bar
   */
  constructor(
    guitar: Guitar,
    tempo: number,
    beats: number,
    duration: NoteDuration,
    chords: Chord[] | undefined
  ) {
    this.guitar = guitar;
    this._tempo = tempo;
    this._beats = beats;
    this.duration = duration;
    this._durationsFit = true;
    if (chords === undefined) {
      this.chords = [];
      for (let i = 0; i < this._beats; i++) {
        this.chords.push(new Chord(this.guitar, this.duration));
      }
    } else {
      this.chords = chords;
    }

    this.calcDurationsFit();
  }

  /**
   * Gets actual duration of all the chords in the bar
   * @returns Sum of all bar's chords' durations
   */
  public actualDuration(): number {
    let durations = 0;
    for (let chord of this.chords) {
      durations += chord.duration;
    }

    return durations;
  }

  /**
   * Determines if all chords of the bar fit correctly inside of it
   */
  public calcDurationsFit(): void {
    let durations = 0;
    for (let chord of this.chords) {
      durations += chord.duration;
    }

    this._durationsFit = durations == this._beats * this.duration;
  }

  /**
   * Inserts empty chord in the bar before chord with index 'index'
   * @param index Index of the chord that will be prepended by the new chord
   */
  public insertEmptyChord(index: number): void {
    // Check index validity
    if (index < 0 || index > this.chords.length) {
      throw new Error(`${index} is invalid chord index`);
    }

    // Insert chord in the data model
    let newChord = new Chord(this.guitar, NoteDuration.Quarter);
    this.chords.splice(index, 0, newChord);

    // Check if durations fit after inserting
    this.calcDurationsFit();
  }

  /**
   * Prepends chord to the beginning of the bar
   */
  public prependChord(): void {
    this.insertEmptyChord(0);
  }

  /**
   * Appends chord to the end of the bar
   */
  public appendChord(): void {
    this.insertEmptyChord(this.chords.length);
  }

  /**
   * Removes chord at index
   * @param index Index of the chord to be removed
   */
  public removeChord(index: number): void {
    // Check index validity
    if (index < 0 || index > this.chords.length) {
      throw new Error(`${index} is invalid chord index`);
    }

    // Remove chord
    this.chords.splice(index, 1);

    // Check if durations fit after removing
    this.calcDurationsFit();
  }

  /**
   * Insert chords after specified chord
   * @param chordId Id of the chord after which to insert
   * @param chords Chords to insert
   */
  public insertChords(chordId: number, chords: Chord[]) {
    // Insert chords at specified position
    this.chords.splice(chordId + 1, 0, ...chords);

    // Check if durations fit after inserting
    this.calcDurationsFit();
  }

  /**
   * Changes duration of a chord
   * @param chord Chord to change the duration of
   * @param duration New chord duration
   */
  public changeChordDuration(chord: Chord, duration: NoteDuration): void {
    let index = this.chords.indexOf(chord);
    this.chords[index].duration = duration;
    this.calcDurationsFit();
  }

  /**
   * Beats (upper number in time signature) getter/setter
   */
  get beats(): number {
    return this._beats;
  }

  /**
   * Beats (upper number in time signature) getter/setter
   */
  set beats(newBeats: number) {
    if (newBeats < 1 || newBeats > 32) {
      throw new Error(`${newBeats} is invalid beats value`);
    }

    this._beats = newBeats;
    this.calcDurationsFit();
  }

  /**
   * Tempo getter/setter
   */
  set tempo(newTempo: number) {
    if (newTempo <= 0) {
      throw new Error(
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
   * Indicates if all chords in the bar fit
   */
  get durationsFit(): boolean {
    return this._durationsFit;
  }

  /**
   * Time signature value
   */
  get signature() {
    return this.beats * this.duration;
  }

  /**
   * Parses a JSON object into a Bar class object
   * @param obj JSON object to parse
   * @returns Parsed Bar object
   */
  static fromObject(obj: any): Bar {
    if (
      obj.guitar === undefined ||
      obj._beats === undefined ||
      obj.duration === undefined ||
      obj.chords === undefined ||
      obj._durationsFit === undefined ||
      obj._tempo === undefined
    ) {
      throw new Error("Invalid js object to parse to bar");
    }

    let guitar = Guitar.fromObject(obj.guitar); // Parse guitar
    let bar = new Bar(guitar, obj._tempo, obj._beats, obj._duration, undefined); // Create bar instance
    bar.chords.length = 0; // Delete default chords
    obj.chords.forEach((chord: any) =>
      bar.chords.push(Chord.fromObject(chord))
    );
    bar.calcDurationsFit();
    return bar;
  }
}
