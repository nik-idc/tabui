import { randomInt } from "../../shared";
import { MusicInstrument } from "./instrument/instrument";
import { Staff } from "./staff";
import { TrackContext } from "./track-context";
import { Score } from "./score";
import { GuitarNote } from "./guitar-note";

/** KeepFrets recalculates pitch; Transpose preserves pitch by recalculating frets. */
export enum TrackInstrumentChangeMode {
  KeepFrets = "keepFrets",
  Transpose = "transpose",
}

/** Staff-array edit metadata containing live inserted or removed staves. */
export type StaffArrayOperationOutput<
  I extends MusicInstrument = MusicInstrument,
> = {
  /** Zero-based position at the time of the operation. */
  index: number;
  /** Staves affected by this individual edit. */
  staves: Staff<I>[];
};

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

  /** Linear track gain, normally 0–1; this field does not validate assignments. */
  public volume: number;
  /** Stereo pan, normally -1 (left) to 1 (right); assignments are not validated. */
  public pan: number;
  /** Silences this track's playback bus. */
  public muted: boolean;
  /** Makes this track audible alongside other soloed tracks, unless muted. */
  public soloed: boolean;
  /** Name of the track */
  public name: string;

  /** Track's staves */
  private _staves: Staff<I>[];

  /**
   * Creates a track with one default staff if none are supplied, aligning staff bar counts to the score.
   * @param score Score in which the track lives
   * @param instrument Musical instrument of the track
   * @param name Name of the track.
   * @param staves Retained live array; existing parent/context references are not rebound.
   * @throws If bar alignment, default note construction, or voice timing fails.
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

  /**
   * Replaces the shared instrument and updates existing guitar notes in place.
   * Note-slot arrays are retained, even when the string count changes.
   * Frets above the new fretboard's maximum are clamped when preserving pitch.
   * @param mode Keep frets and recalculate pitch by default, or preserve pitch and recalculate frets.
   * @throws If tuning is missing for an existing string, its octave is null, or pitch/fret conversion fails.
   */
  public setInstrument(
    instrument: I,
    mode: TrackInstrumentChangeMode = TrackInstrumentChangeMode.KeepFrets
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

              if (mode === TrackInstrumentChangeMode.Transpose) {
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
   * Inserts a staff and aligns all staff bar counts to the score.
   * @param index Zero-based insertion position, from zero through the staff count.
   * @param staff Existing staff already owned by this track; omitted creates a default staff.
   * @returns Live inserted staff and its insertion position.
   * @throws If the index is outside the allowed range or bar alignment/timing fails.
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
   * Removes a staff, creating a default staff if the track would be empty.
   * @param index Zero-based staff position.
   * @returns Removal metadata, followed by insertion metadata if a fallback staff was created.
   * @throws If the index is outside the track or fallback construction/timing fails.
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
   * Copies staff content, name, and mix fields with a new UUID, sharing the score and instrument.
   * Copied descendants retain their original parent/context references.
   * @throws If copied data or timing is invalid.
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

  /** Live staff array; use insertStaff() and removeStaff() to maintain bar alignment. */
  public get staves(): Staff<I>[] {
    return this._staves;
  }
}
