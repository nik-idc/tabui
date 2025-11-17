import { randomInt } from "@/shared";
import { Bar } from "../bar/bar";
import { MusicInstrument, MusicInstrumentJSON } from "../instrument/instrument";
import { Staff, StaffJSON } from "../staff/staff";
import { TrackContext } from "../context/track-context";
import { Score } from "../score/score";

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
    this._staves =
      staves.length !== 0 ? staves : [new Staff(this, this.context)];
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
