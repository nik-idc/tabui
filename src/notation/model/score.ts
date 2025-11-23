import { Bar } from "./bar";
import { DEFAULT_MASTER_BAR, MasterBar, MasterBarData } from "./master-bar";
import { MusicInstrument } from "./instrument/instrument";
import { Note } from "./note";
import { Staff } from "./staff";
import { Track, TrackJSON } from "./track";
import { Beat } from "./beat";

export type NoteLocation = {
  track: Track;
  staff: Staff;
  bar: Bar;
  beat: Beat;
  note: Note;
};

export type BeatLocation = Omit<NoteLocation, "note">;
export type BarLocation = Omit<BeatLocation, "beat">;

export type MasterBarArrayOperationOutput = {
  index: number;
  masterBar: MasterBar;
  bars: Map<number, Bar>;
};

/**
 * Staff JSON format
 */
export interface ScoreJSON {
  tracks: TrackJSON[];
  name: string;
  artist: string;
  song: string;
}

/**
 * Class representing a full score
 */
export class Score {
  /** Score's tracks */
  private _tracks: Track<MusicInstrument>[];
  /** Score's name */
  private _name: string;
  /** Score's song artist */
  private _artist: string;
  /** Score's song name */
  private _song: string;
  /** Master bars */
  private _masterBars: MasterBar[];

  /**
   * Class representing a full score
   * @param tracks Score's tracks
   * @param name Score's name
   * @param artist Score's song artist
   * @param song Score's song name
   */
  constructor(
    tracks: Track<MusicInstrument>[] = [],
    name: string = "Unknown",
    artist: string = "Unknown artist",
    song: string = "Unknown song"
  ) {
    this._tracks = tracks;

    this._name = name;
    this._artist = artist;
    this._song = song;
    this._masterBars = [];
  }

  /**
   * Inserts an existing master bar & associated bars into the score
   * @param index Index
   * @param masterBar Master bar
   * @param bars Bars map (staff UUID -> bar)
   */
  public insertReadyMasterBar(
    index: number,
    masterBar: MasterBar,
    bars: Map<number, Bar>
  ): void {
    this._masterBars.push(masterBar);

    for (const track of this._tracks) {
      for (const staff of track.staves) {
        const staffBar = bars.get(staff.uuid);
        if (staffBar === undefined) {
          staff.insertBar(index, masterBar);
        } else {
          staff.insertReadyBar(index, staffBar);
        }
      }
    }
  }

  /**
   * Inserts a new master bar & inserts a bar to every staff of every track
   * @param index Index after which to insert the bar
   */
  public insertMasterBar(
    index: number,
    masterBarData: MasterBarData = DEFAULT_MASTER_BAR
  ): MasterBarArrayOperationOutput {
    const newMasterBar = new MasterBar(masterBarData);
    this._masterBars.splice(index, 0, newMasterBar);

    const staffBars: Map<number, Bar> = new Map();
    for (const track of this._tracks) {
      for (const staff of track.staves) {
        staffBars.set(staff.uuid, staff.insertBar(index, newMasterBar));
      }
    }

    return { index: index + 1, masterBar: newMasterBar, bars: staffBars };
  }

  /**
   * Appends a new master bar & appends a bar to every staff of every track
   * @param masterBarData Master bar data
   */
  public appendMasterBar(
    masterBarData: MasterBarData = DEFAULT_MASTER_BAR
  ): MasterBarArrayOperationOutput {
    const newMasterBar = new MasterBar(masterBarData);
    this._masterBars.push(newMasterBar);

    const staffBars: Map<number, Bar> = new Map();
    for (const track of this._tracks) {
      for (const staff of track.staves) {
        staffBars.set(staff.uuid, staff.appendBar(newMasterBar));
      }
    }

    return {
      index: this._masterBars.length - 1,
      masterBar: newMasterBar,
      bars: staffBars,
    };
  }

  /**
   * Prepends a new master bar & prepends a bar to every staff of every track
   * @param masterBarData Master bar data
   */
  public prependMasterBar(
    masterBarData: MasterBarData = DEFAULT_MASTER_BAR
  ): MasterBarArrayOperationOutput {
    const newMasterBar = new MasterBar(masterBarData);
    this._masterBars.unshift(newMasterBar);

    const staffBars: Map<number, Bar> = new Map();
    for (const track of this._tracks) {
      for (const staff of track.staves) {
        staffBars.set(staff.uuid, staff.prependBar(newMasterBar));
      }
    }

    return {
      index: 0,
      masterBar: newMasterBar,
      bars: staffBars,
    };
  }

  /**
   * Removes a master and all the track's bars at the specified index
   * @param index Index of the bar to remove
   */
  public removeMasterBar(index: number): MasterBarArrayOperationOutput {
    const removedStaffBars: Map<number, Bar> = new Map();
    for (const track of this._tracks) {
      for (const staff of track.staves) {
        removedStaffBars.set(staff.uuid, staff.removeBar(index));
      }
    }

    const removedBar = this._masterBars[index];
    this._masterBars.splice(index, 1);

    return { index: index, masterBar: removedBar, bars: removedStaffBars };
  }

  /**
   * Add new empty track to the score
   * @param instrument Track's instrument
   * @param name Track name
   */
  public addTrack(instrument: MusicInstrument, name: string): void {
    const newTrack = new Track(this, instrument, name);

    for (const masterBar of this.masterBars) {
      for (const staff of newTrack.staves) {
        staff.appendBar(masterBar);
      }
    }

    this._tracks.push(newTrack);
  }

  /**
   * Remove track from the score
   * @param index Index of the score to remove
   */
  public removeTrack(index: number): void {
    this._tracks.splice(index);
  }

  /** Name setter */
  public set name(newName: string) {
    this._name = newName;
  }
  /** Name getter */
  public get name(): string {
    return this._name;
  }

  /** Artist setter */
  public set artist(newArtist: string) {
    this._artist = newArtist;
  }
  /** Artist getter */
  public get artist(): string {
    return this._artist;
  }

  /** Song setter */
  public set song(newSong: string) {
    this._song = newSong;
  }
  /** Song getter */
  public get song(): string {
    return this._song;
  }

  /** Master bars getter */
  public get masterBars(): MasterBar[] {
    return this._masterBars;
  }

  /** Tracks getter */
  public get tracks(): Track[] {
    return this._tracks;
  }

  // /**
  //  * Locates note
  //  * @param noteToLocate Note to locate
  //  * @returns Note location or undefined if couldn't find
  //  */
  // public locateNote<I extends MusicInstrument>(
  //   noteToLocate: Note<I>
  // ): NoteLocation | undefined {
  //   for (const track of this._tracks) {
  //     for (const staff of track.staves) {
  //       for (const bar of staff.bars) {
  //         for (const beat of bar.beats) {
  //           for (const note of beat.notes) {
  //             if (note.uuid === noteToLocate.uuid) {
  //               return {
  //                 track,
  //                 staff,
  //                 bar,
  //                 beat,
  //                 note,
  //               };
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }
  // }

  // /**
  //  * Locates beat
  //  * @param beatToLocate Beat to locate
  //  * @returns Beat location or undefined if couldn't find
  //  */
  // public locateBeat<I extends MusicInstrument>(
  //   beatToLocate: Beat<I>
  // ): BeatLocation | undefined {
  //   for (const track of this._tracks) {
  //     for (const staff of track.staves) {
  //       for (const bar of staff.bars) {
  //         for (const beat of bar.beats) {
  //           if (beat.uuid === beatToLocate.uuid) {
  //             return {
  //               track,
  //               staff,
  //               bar,
  //               beat,
  //             };
  //           }
  //         }
  //       }
  //     }
  //   }
  // }

  // /**
  //  * Locates bar
  //  * @param barToLocate Bar to locate
  //  * @returns Bar location or undefined if couldn't find
  //  */
  // public locateBar<I extends MusicInstrument>(
  //   barToLocate: Bar<I>
  // ): BarLocation | undefined {
  //   for (const track of this._tracks) {
  //     for (const staff of track.staves) {
  //       for (const bar of staff.bars) {
  //         if (bar.uuid === barToLocate.uuid) {
  //           return {
  //             track,
  //             staff,
  //             bar,
  //           };
  //         }
  //       }
  //     }
  //   }
  // }

  /**
   * Converts score to JSON format
   * @returns Score in JSON format
   */
  public toJSON(): ScoreJSON {
    const tracksJSON: TrackJSON[] = [];
    for (const track of this._tracks) {
      tracksJSON.push(track.toJSON());
    }

    return {
      tracks: tracksJSON,
      name: this._name,
      artist: this._artist,
      song: this._song,
    };
  }
}
