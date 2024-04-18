import { Chord } from "./chord";
import { Guitar } from "./guitar";
import { NoteDuration } from "./note-duration";
import { Tab } from "./tab";

export class Bar {
  readonly guitar: Guitar;
  private _tempo: number;
  private _beats: number;
  private _duration: NoteDuration;
  readonly chords: Chord[];
  private _durationsFit: boolean;

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
    this._duration = duration;
    this._durationsFit = true;
    if (chords === undefined) {
      this.chords = [];
      for (let i = 0; i < this._beats; i++) {
        this.chords.push(new Chord(this.guitar, this._duration));
      }
    } else {
      this.chords = chords;
    }

    this.checkDurationsFit();
  }

  checkDurationsFit(): void {
    let durations = 0;
    for (let chord of this.chords) {
      durations += chord.duration;
    }

    this._durationsFit = durations == this._beats * this._duration;
  }

  insertEmptyChord(index: number): void {
    // Check index validity
    if (index < 0 || index > this.chords.length) {
      throw new Error(`${index} is invalid chord index`);
    }

    // Insert chord in the data model
    let newChord = new Chord(this.guitar, NoteDuration.Quarter);
    this.chords.splice(index, 0, newChord);

    // Check if durations fit after inserting
    this.checkDurationsFit();
  }

  prependChord(): void {
    this.insertEmptyChord(0);
  }

  appendChord(): void {
    this.insertEmptyChord(this.chords.length);
  }

  removeChord(index: number): void {
    // Check index validity
    if (index < 0 || index > this.chords.length) {
      throw new Error(`${index} is invalid chord index`);
    }

    // Remove chord
    this.chords.splice(index, 1);

    // Check if durations fit after removing
    this.checkDurationsFit();
  }

  changeChordDuration(chord: Chord, duration: NoteDuration): void {
    let index = this.chords.indexOf(chord);
    this.chords[index].duration = duration;
    this.checkDurationsFit();
  }

  get beats(): number {
    return this._beats;
  }

  set beats(newBeats: number) {
    if (newBeats < 1 || newBeats > 32) {
      throw new Error(`${newBeats} is invalid beats value`);
    }

    this._beats = newBeats;
    this.checkDurationsFit();
  }

  get duration(): number {
    return this._duration;
  }

  set duration(newDuration: number) {
    if (!Object.values(NoteDuration).includes(newDuration)) {
      throw new Error(`${newDuration} is invalid duration value`);
    }

    this._duration = newDuration;
    this.checkDurationsFit();
  }

  set tempo(newTempo: number) {
    this._tempo = newTempo;
  }

  get tempo(): number {
    return this._tempo;
  }

  get durationsFit(): boolean {
    return this._durationsFit;
  }

  get measure() {
    return this.beats * this.duration;
  }

  static fromObject(obj: any): Bar {
    if (
      obj.guitar === undefined ||
      obj._beats === undefined ||
      obj._duration === undefined ||
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
    ); // Parse chords
    bar.checkDurationsFit();
    return bar;
  }
}
