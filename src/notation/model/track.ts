import { randomInt } from "@/shared";
import { Bar } from "./bar";
import { MusicInstrument, MusicInstrumentJSON } from "./instrument/instrument";
import { Staff, StaffJSON } from "./staff";
import { TrackContext } from "./track-context";
import { Score } from "./score";

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

  /** Name if the track */
  private _name: string;
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

    this._name = name;
    this._staves = staves;
    // staves.length !== 0 ? staves : [new Staff(this, this.context)];
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

    return { index: index, staves: [staff] };
  }

  /**
   * Removes staff at specified index
   * @param index Index of the staff to remove
   * @returns Staff array operation outputs
   */
  public removeStaff(index: number): StaffArrayOperationOutput<I>[] {
    // Check index validity
    if (index < 0 || index > this._staves.length) {
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

    return new Track<I>(
      this.score,
      this.context.instrument,
      this._name,
      stavesCopy
    );
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
      name: this._name,
      staves: stavesJSON,
    };
  }

  /** Name of the track setter */
  public set name(newName: string) {
    this._name = newName;
  }
  /** Name of the track getter */
  public get name(): string {
    return this._name;
  }

  /** Track's bars */
  public get staves(): Staff<I>[] {
    return this._staves;
  }
}
