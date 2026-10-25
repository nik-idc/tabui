import { Bar } from "./bar";
import { DEFAULT_MASTER_BAR, MasterBar, MasterBarData } from "./master-bar";
import { MusicInstrument } from "./instrument/instrument";
import { Guitar } from "./instrument/guitar/guitar";
import { Note } from "./note";
import { Staff } from "./staff";
import { Track } from "./track";
import { Beat } from "./beat";
import { VoiceBar, VoiceNumber } from "./voice-bar";
import { NoteDuration } from "./note-duration";

/** Complete meter value to apply to one shared master bar. */
export type TimeSignatureChange = {
  /** Shared bar whose matching voices need rebuilding. */
  masterBar: MasterBar;
  /** Meter numerator. */
  beatsCount: number;
  /** Written denominator duration. */
  duration: NoteDuration;
};

/** Track-array edit metadata with live model references. */
export type TrackArrayOperationOutput<
  I extends MusicInstrument = MusicInstrument,
> = {
  /** Zero-based starting position in the score's track array. */
  index: number;
  /** Tracks inserted or removed by the operation. */
  tracks: Track<I>[];
};

/** Live model references along the ownership path to a note. */
export type NoteLocation = {
  track: Track;
  staff: Staff;
  bar: Bar;
  voiceBar: VoiceBar;
  beat: Beat;
  note: Note;
};

/** Live ownership path to a beat, including its voice. */
export type BeatLocation = Omit<NoteLocation, "note">;
/** Live ownership path to a voice bar within a staff bar. */
export type BarLocation = Omit<BeatLocation, "beat">;

/** Score-wide insertion/removal metadata for a shared master bar. */
export type MasterBarArrayOperationOutput = {
  /** Zero-based master-bar position at the time of the operation. */
  index: number;
  /** Live inserted or removed master bar. */
  masterBar: MasterBar;
  /** Associated live staff bars keyed by staff UUID. */
  bars: Map<number, Bar>;
};

/**
 * Class representing a full score
 */
export class Score {
  /** Linear master gain after track mixing, normally 0–1; assignments are not validated. */
  public masterVolume: number;
  /** Master stereo pan after track mixing, normally -1 (left) to 1 (right); assignments are not validated. */
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
   * Creates one default master bar and, for an empty track array, one guitar track.
   * @param tracks Retained live array; supplied tracks keep their parent references. Missing staves/bars are filled, without rebinding existing bars.
   * @param name Score's name
   * @param artist Score's song artist
   * @param song Score's song name
   * @throws If filling missing staff/bar content or rebuilding its timing fails.
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

  /**
   * Tests repeat pairing without nested repeats; unmarked bars always pass.
   * @throws If a repeat-marked master bar does not belong to this score.
   */
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

  /** Applies meters and rebuilds matching voices across all tracks, without trimming or filling note content. Failures may leave partial changes. */
  public setTimeSignatures(changes: TimeSignatureChange[]): void {
    const masterBars = new Set(changes.map((v) => v.masterBar));
    for (const change of changes) {
      change.masterBar.beatsCount = change.beatsCount;
      change.masterBar.duration = change.duration;
    }

    const voices = new Set<VoiceBar>();
    for (const track of this._tracks) {
      for (const staff of track.staves) {
        for (const bar of staff.bars) {
          if (!masterBars.has(bar.masterBar)) {
            continue;
          }
          for (const voice of bar.voiceBarsAsArray) {
            voices.add(voice);
          }
        }
      }
    }
    for (const voice of voices) {
      voice.rebuildTiming();
    }
  }

  /**
   * Inserts an existing master bar and associated staff bars without copying or rebinding them.
   * @param index Zero-based insertion position, using array-splice semantics.
   * @param masterBar Shared master bar for this score position.
   * @param bars Live bars keyed by staff UUID, already owned by the destination staff and master bar; missing entries create defaults.
   * @throws If default voice timing or staff bookkeeping fails.
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
   * Inserts a master bar and corresponding bars on every staff.
   * @param index Integer insertion position from zero through the master-bar count.
   * @param masterBarData Tempo, meter, and repeat settings; omitted uses DEFAULT_MASTER_BAR.
   * @param voiceNumber Voice to seed with a quarter rest, alongside the staff's existing non-empty voices.
   * @returns Live master bar and staff bars keyed by staff UUID, with the supplied index.
   * @throws If settings, timing, or staff bookkeeping are invalid.
   */
  public insertMasterBar(
    index: number,
    masterBarData: MasterBarData = DEFAULT_MASTER_BAR,
    voiceNumber: VoiceNumber = 1
  ): MasterBarArrayOperationOutput {
    const invalidIndex =
      !Number.isInteger(index) || index < 0 || index > this._masterBars.length;
    if (invalidIndex) {
      throw Error(`${index} is invalid bar index`);
    }
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
   * Appends a master bar and corresponding bars on every staff.
   * @param masterBarData Tempo, meter, and repeat settings; omitted uses DEFAULT_MASTER_BAR.
   * @param voiceNumber Voice to seed with a quarter rest, alongside existing non-empty voices.
   * @returns Live bars keyed by staff UUID and their zero-based position.
   * @throws If settings, timing, or staff bookkeeping are invalid.
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
   * Prepends a master bar and corresponding bars on every staff.
   * @param masterBarData Tempo, meter, and repeat settings; omitted uses DEFAULT_MASTER_BAR.
   * @param voiceNumber Voice to seed with a quarter rest, alongside existing non-empty voices.
   * @returns Live bars keyed by staff UUID, at index zero.
   * @throws If settings, timing, or staff bookkeeping are invalid.
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
   * Removes a master bar and the corresponding bar on every staff.
   * @param index Zero-based score position.
   * @returns Removed live master/staff bars and their original index.
   * @throws If the index is outside the score, removal would empty the score/staff, or staff bookkeeping fails.
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
   * Appends a track with one staff and default-rest bars aligned to all master bars.
   * @param instrument Track's instrument
   * @param name Track name
   * @returns Live new track and its zero-based insertion position.
   * @throws If default note construction or voice timing fails.
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
   * Removes a track, keeping at least one track in the score.
   * @param index Zero-based track position to remove.
   * @returns Track before the deleted track or
   * track after, depending on the index
   * @throws If the index is outside the score or this is the last track.
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

  /**
   * Moves an existing track to its final zero-based position in this score.
   * @throws If the track is absent or the target is outside the track array.
   */
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

  /** Live master-bar array; use score methods to keep staff bars aligned. */
  public get masterBars(): MasterBar[] {
    return this._masterBars;
  }

  /** Live track array; inserted tracks must already belong to this score. */
  public get tracks(): Track[] {
    return this._tracks;
  }
}
