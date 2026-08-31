import { Bar } from "./bar";
import { DEFAULT_MASTER_BAR, MasterBar, MasterBarData } from "./master-bar";
import { MusicInstrument } from "./instrument/instrument";
import { Guitar } from "./instrument/guitar/guitar";
import { Note } from "./note";
import { Staff } from "./staff";
import { Track } from "./track";
import { Beat } from "./beat";
import { VoiceBar, VoiceNumber } from "./voice-bar";

export type TrackArrayOperationOutput<
  I extends MusicInstrument = MusicInstrument,
> = {
  index: number;
  tracks: Track<I>[];
};

export type NoteLocation = {
  track: Track;
  staff: Staff;
  bar: Bar;
  voiceBar: VoiceBar;
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
 * Class representing a full score
 */
export class Score {
  /** Score-wide output volume applied after all track buses. */
  public masterVolume: number;
  /** Score-wide output pan applied after all track buses. */
  public masterPan: number;

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
    this.masterVolume = 1;
    this.masterPan = 0;
    this._masterBars = [new MasterBar(DEFAULT_MASTER_BAR)];

    if (this._tracks.length === 0) {
      this._tracks.push(new Track(this, new Guitar(), "Track 1"));
      return;
    }

    for (const track of this._tracks) {
      if (track.staves.length === 0) {
        track.insertStaff(0);
      }

      for (const staff of track.staves) {
        if (staff.bars.length === 0) {
          staff.appendBar(this._masterBars[0]);
        }
      }
    }
  }

  public isMasterBarRepeatStatusValid(masterBar: MasterBar): boolean {
    if (!masterBar.isRepeatStart && !masterBar.isRepeatEnd) {
      return true;
    }

    const barIndex = this._masterBars.indexOf(masterBar);
    if (barIndex === -1) {
      throw new Error("Master bar not found in the score");
    }

    if (
      masterBar.isRepeatStart &&
      masterBar.isRepeatEnd &&
      masterBar.repeatCount
    ) {
      return true;
    }

    if (masterBar.isRepeatStart) {
      for (let i = barIndex + 1; i < this._masterBars.length; i++) {
        const currentBar = this._masterBars[i];

        if (currentBar.isRepeatStart) {
          // Nesting repeats aren't allowed yet
          return false;
        }

        if (currentBar.isRepeatEnd && currentBar.repeatCount) {
          return true;
        }
      }

      return false;
    }

    if (masterBar.isRepeatEnd) {
      for (let i = barIndex - 1; i >= 0; i--) {
        const currentBar = this._masterBars[i];

        if (currentBar.isRepeatEnd) {
          // Nesting repeats aren't allowed yet
          return false;
        }

        if (currentBar.isRepeatStart) {
          return true;
        }
      }

      return false;
    }

    return true;
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
    this._masterBars.splice(index, 0, masterBar);

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
    masterBarData: MasterBarData = DEFAULT_MASTER_BAR,
    voiceNumber: VoiceNumber = 1
  ): MasterBarArrayOperationOutput {
    const newMasterBar = new MasterBar(masterBarData);
    this._masterBars.splice(index, 0, newMasterBar);

    const staffBars: Map<number, Bar> = new Map();
    for (const track of this._tracks) {
      for (const staff of track.staves) {
        staffBars.set(
          staff.uuid,
          staff.insertBar(index, newMasterBar, [], voiceNumber)
        );
      }
    }

    return { index, masterBar: newMasterBar, bars: staffBars };
  }

  /**
   * Appends a new master bar & appends a bar to every staff of every track
   * @param masterBarData Master bar data
   */
  public appendMasterBar(
    masterBarData: MasterBarData = DEFAULT_MASTER_BAR,
    voiceNumber: VoiceNumber = 1
  ): MasterBarArrayOperationOutput {
    const newMasterBar = new MasterBar(masterBarData);
    this._masterBars.push(newMasterBar);

    const staffBars: Map<number, Bar> = new Map();
    for (const track of this._tracks) {
      for (const staff of track.staves) {
        staffBars.set(
          staff.uuid,
          staff.appendBar(newMasterBar, [], voiceNumber)
        );
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
    masterBarData: MasterBarData = DEFAULT_MASTER_BAR,
    voiceNumber: VoiceNumber = 1
  ): MasterBarArrayOperationOutput {
    const newMasterBar = new MasterBar(masterBarData);
    this._masterBars.unshift(newMasterBar);

    const staffBars: Map<number, Bar> = new Map();
    for (const track of this._tracks) {
      for (const staff of track.staves) {
        staffBars.set(
          staff.uuid,
          staff.prependBar(newMasterBar, [], voiceNumber)
        );
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
    if (index < 0 || index >= this._masterBars.length) {
      throw new Error("Master bar not in score");
    }
    if (this._masterBars.length === 1) {
      throw new Error("Score must have at least one master bar");
    }

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
  public addTrack(
    instrument: MusicInstrument,
    name: string
  ): TrackArrayOperationOutput {
    if (this._masterBars.length === 0) {
      this._masterBars.push(new MasterBar(DEFAULT_MASTER_BAR));
    }

    const newTrack = new Track(this, instrument, name);

    this._tracks.push(newTrack);

    return { index: this._tracks.length - 1, tracks: [newTrack] };
  }

  /**
   * Remove track from the score
   * @param index Index of the score to remove
   * @returns Track before the deleted track or
   * track after, depending on the index
   */
  public removeTrack(index: number): Track {
    if (index < 0 || index >= this._tracks.length) {
      throw new Error("Track not in score");
    }

    const trackBefore = this.tracks[index - 1];
    const trackAfter = this.tracks[index + 1];
    if (trackBefore === undefined && trackAfter === undefined) {
      throw new Error("Empty score currently unhandled");
    }
    const newTrack = trackBefore !== undefined ? trackBefore : trackAfter;

    this._tracks.splice(index, 1);

    return newTrack;
  }

  public moveTrack(track: Track, targetIndex: number): void {
    const currentIndex = this._tracks.indexOf(track);
    if (currentIndex === -1) {
      throw new Error("Track not in score");
    }
    if (targetIndex < 0 || targetIndex >= this._tracks.length) {
      throw new Error("Target track index out of score");
    }
    if (currentIndex === targetIndex) {
      return;
    }

    this._tracks.splice(currentIndex, 1);
    this._tracks.splice(targetIndex, 0, track);
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
}
