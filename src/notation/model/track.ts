import { randomInt } from "@/shared";
import { MusicInstrument, MusicInstrumentJSON } from "./instrument/instrument";
import { Staff, StaffJSON } from "./staff";
import { TrackContext } from "./track-context";
import { Score } from "./score";
import { GuitarNote } from "./guitar-note";

export type TrackInstrumentChangeMode = "keepFrets" | "transpose";

export type StaffArrayOperationOutput<
  I extends MusicInstrument = MusicInstrument,
> = {
  index: number;
  staves: Staff<I>[];
};

/**
 * Track JSON format
 */
export interface TrackJSON {
  instrument: MusicInstrumentJSON;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  staves: StaffJSON[];
}

/**
 * Class representing a single track
 */
export class Track<I extends MusicInstrument = MusicInstrument> {
  /** Track's unqiue identifier */
  readonly uuid: number;
  /** Score in which the track lives */
  readonly score: Score;
  /** This track's context */
  readonly context: TrackContext<I>;

  public volume: number;
  public pan: number;
  public muted: boolean;
  public soloed: boolean;
  /** Name of the track */
  public name: string;

  /** Track's staves */
  private _staves: Staff<I>[];

  /**
   * Class representing a single track
   * @param score Score in which the track lives
   * @param instrument Musical instrument of the track
   * @param name Name if the track
   * @param staves Track's staves
   */
  constructor(
    score: Score,
    instrument: I,
    name: string,
    staves: Staff<I>[] = []
  ) {
    this.uuid = randomInt();
    this.score = score;
    this.context = {
      instrument: instrument,
    };

    this.name = name;
    this.volume = 0.5;
    this.pan = 0;
    this.muted = false;
    this.soloed = false;
    this._staves =
      staves.length !== 0 ? staves : [new Staff(this, this.context)];

    this.ensureStaffBarsAligned();
  }

  private ensureStaffBarsAligned(): void {
    const masterBars = this.score.masterBars;
    if (masterBars.length === 0) {
      return;
    }

    for (const staff of this._staves) {
      while (staff.bars.length > masterBars.length) {
        staff.removeBar(staff.bars.length - 1);
      }

      for (let i = staff.bars.length; i < masterBars.length; i++) {
        staff.appendBar(masterBars[i]);
      }
    }
  }

  public setInstrument(
    instrument: I,
    mode: TrackInstrumentChangeMode = "keepFrets"
  ): void {
    this.context.instrument = instrument;

    for (const staff of this._staves) {
      for (const bar of staff.bars) {
        for (const voiceBar of bar.voiceBarsAsArray) {
          for (const beat of voiceBar.beats) {
            for (const note of beat.notes ?? []) {
              if (!(note instanceof GuitarNote)) {
                continue;
              }

              if (mode === "transpose") {
                note.calculateFretFromNote();
              } else {
                note.calcNoteFromFret();
              }
            }
          }
        }
      }
    }
  }

  /**
   * Insert a staff
   * @param index Index after which to insert the staff
   * @param staff Staff to insert
   */
  public insertStaff(
    index: number,
    staff?: Staff<I>
  ): StaffArrayOperationOutput<I> {
    if (index < 0 || index > this._staves.length) {
      throw Error(`${index} is invalid staff index`);
    }

    if (staff === undefined) {
      staff = new Staff<I>(this, this.context);
    }

    this._staves.splice(index, 0, staff);
    this.ensureStaffBarsAligned();

    return { index: index, staves: [staff] };
  }

  /**
   * Removes staff at specified index
   * @param index Index of the staff to remove
   * @returns Staff array operation outputs
   */
  public removeStaff(index: number): StaffArrayOperationOutput<I>[] {
    // Check index validity
    if (index < 0 || index >= this._staves.length) {
      throw Error(`${index} is invalid staff index`);
    }

    // Remove staff
    const outputs: StaffArrayOperationOutput<I>[] = [];
    outputs.push({ index: index, staves: this._staves.splice(index, 1) });

    // Insert empty staff if track staves count drops to 0
    if (this._staves.length === 0) {
      outputs.push(this.insertStaff(0));
    }

    return outputs;
  }

  /**
   * Creates full deep copy of the track
   */
  public deepCopy(): Track<I> {
    const stavesCopy: Staff<I>[] = [];
    for (const staff of this.staves) {
      stavesCopy.push(staff.deepCopy());
    }

    const track = new Track<I>(
      this.score,
      this.context.instrument,
      this.name,
      stavesCopy
    );
    track.volume = this.volume;
    track.pan = this.pan;
    track.muted = this.muted;
    track.soloed = this.soloed;
    return track;
  }

  /**
   * Converts track to JSON format
   * @returns Track in JSON format
   */
  public toJSON(): TrackJSON {
    const stavesJSON: StaffJSON[] = [];
    for (const staff of this.staves) {
      stavesJSON.push(staff.toJSON());
    }

    return {
      instrument: this.context.instrument.toJSON(),
      name: this.name,
      volume: this.volume,
      pan: this.pan,
      muted: this.muted,
      soloed: this.soloed,
      staves: stavesJSON,
    };
  }

  /** Track's bars */
  public get staves(): Staff<I>[] {
    return this._staves;
  }
}
