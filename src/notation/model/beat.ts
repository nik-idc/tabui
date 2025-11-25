import { randomInt } from "@/shared";
import { Bar } from "./bar";
import { TrackContext } from "./track-context";
import { MusicInstrument } from "./instrument/instrument";
import { NoteJSON, Note, NoteValue } from "./note";
import { NoteDuration } from "./note-duration";
import { TupletSettingsJSON, TupletSettings } from "./tuplet-settings";
import { TechniqueType } from "./technique-type";

export type BeatDots = 0 | 1 | 2;

/**
 * Beat JSON format
 */
export interface BeatJSON {
  notes: (NoteJSON | null)[];
  duration: NoteDuration;
  dots: number;
  tupletSettings: TupletSettingsJSON | undefined;
  beamGroupId: number | undefined;
  lastInBeamGroup: boolean;
}

/**
 * Class that represents a beat
 */
export class Beat<I extends MusicInstrument = MusicInstrument> {
  /** Beat's unique identifier */
  readonly uuid: number;
  /** Bar in which the beat lives */
  readonly bar: Bar<I>;
  /** Track context */
  readonly trackContext: TrackContext<I>;

  /** Beat notes */
  private _notes: Note<I>[] = [];
  /** * Base beat duration */
  private _baseDuration: NoteDuration;
  /** * Dots applied to the beat (0 = no dots, 1 = 1 dot, 2 = 2 dots) */
  private _dots: BeatDots = 0;
  /** * Tuplet settings of the beat */
  private _tupletSettings: TupletSettings | null = null;
  /** * Index of the beam group the beat belongs to (undefined if not in any group) */
  private _beamGroupId: number | null = null;
  /** * True only if part of a beam group and is the last beat of that group */
  private _lastInBeamGroup: boolean;

  /**
   * Class that represents a beat
   * @param bar Bar in which the beat lives
   * @param trackContext Track context
   * @param notes Notes
   * @param baseDuration Base duration
   * @param dots Dots count
   * @param tupletSettings Tuplet settings
   * @param beamGroupId Beam group ID
   * @param lastInBeamGroup If is last in beam group
   */
  constructor(
    bar: Bar<I>,
    trackContext: TrackContext<I>,
    notes: Note<I>[] = [],
    baseDuration: NoteDuration = NoteDuration.Quarter,
    dots: BeatDots = 0,
    tupletSettings: TupletSettings | null = null,
    beamGroupId: number | null = null,
    lastInBeamGroup: boolean = false
  ) {
    this.uuid = randomInt();
    this.bar = bar;
    this.trackContext = trackContext;

    this._notes = notes;
    this._baseDuration = baseDuration;
    this._dots = dots === undefined ? 0 : dots;
    this._lastInBeamGroup = false;
    this._tupletSettings = tupletSettings;
    this._beamGroupId = beamGroupId;
    this._lastInBeamGroup = lastInBeamGroup;

    if (notes.length !== 0) {
      this._notes = notes;
    } else {
      // TODO: !! DEFAULT NOTES !!
      //
      // this._notes = Array.from(
      //   { length: this.trackContext.instrument.stringsCount },
      //   (_, stringNum) => new GuitarNote(this.guitar, stringNum + 1, undefined)
      // );
    }
  }

  /**
   * Checks if beat's notes have a technique
   * @param type Type of note technique
   * @returns True if beat's notes have technique, false otherwise
   */
  public hasTechnique(type: TechniqueType): boolean {
    return this._notes.some((n) => n.hasTechnique(type));
  }

  /**
   * Returns true if no notes are present in the beat
   */
  public isEmpty(): boolean {
    return !this._notes.some((gn) => gn.noteValue !== NoteValue.None);
  }

  /**
   * Compares contents of this beat with some other beat
   * (ignoring UUID)
   * @param otherBeat Beat to compare with
   * @returns True if equal, false otherwise
   */
  public compare(otherBeat: Beat<I>): boolean {
    if (
      this.trackContext !== otherBeat.trackContext ||
      this._notes.length !== otherBeat.notes.length ||
      this._baseDuration !== otherBeat._baseDuration ||
      this._dots !== otherBeat._dots ||
      this._tupletSettings !== otherBeat._tupletSettings
    ) {
      return false;
    }

    // Compare notes
    for (let i = 0; i < this._notes.length; i++) {
      if (!this._notes[i].compare(otherBeat.notes[i])) {
        return false;
      }
    }

    // If all is the same then beats are equal
    return true;
  }

  /**
   * Creates a deep copy of the beat
   * @returns Beat's deep copy
   */
  public deepCopy(): Beat<I> {
    const notes = [];
    for (let i = 0; i < this._notes.length; i++) {
      notes[i] = this._notes[i].deepCopy();
    }

    const tupletSettingsCopy: TupletSettings | null =
      this._tupletSettings !== null
        ? {
            normalCount: this._tupletSettings.normalCount,
            tupletCount: this._tupletSettings.tupletCount,
          }
        : null;

    const beat = new Beat<I>(
      this.bar,
      this.trackContext,
      notes,
      this._baseDuration,
      this._dots,
      tupletSettingsCopy,
      this._beamGroupId,
      this._lastInBeamGroup
    );

    return beat;
  }

  /**
   * Parses beat into JSON string
   * @returns Parsed JSON string
   */
  public toJSON(): BeatJSON {
    const notesJSON = [];
    for (const note of this._notes) {
      notesJSON.push(note.toJSON());
    }

    return {
      notes: notesJSON,
      duration: this._baseDuration,
      dots: this._dots,
      tupletSettings: this._tupletSettings ?? undefined,
      beamGroupId: this._beamGroupId ?? undefined,
      lastInBeamGroup: this._lastInBeamGroup,
    };
  }

  /** Notes getter */
  public get notes(): Note<I>[] {
    return this._notes;
  }

  /** Base duration setter */
  public set baseDuration(newDuration: NoteDuration) {
    this._baseDuration = newDuration;
  }
  /** Base duration getter */
  public get baseDuration(): NoteDuration {
    return this._baseDuration;
  }
  /** Full beat duration getter */
  public get fullDuration(): number {
    let duration = this._baseDuration;
    switch (this._dots) {
      case 0:
        duration = this._baseDuration;
        break;
      case 1:
        duration = this._baseDuration + this._baseDuration / 2;
        break;
      case 2:
        duration =
          this._baseDuration + this._baseDuration / 2 + this._baseDuration / 4;
        break;
    }

    if (this._tupletSettings !== null) {
      duration =
        duration *
        (this._tupletSettings.tupletCount / this._tupletSettings.normalCount);
    }

    return duration;
  }

  /** Dots setter */
  public set dots(newDots: BeatDots) {
    this._dots = newDots;
  }
  /** Dots getter */
  public get dots(): number {
    return this._dots;
  }

  /** Tuplet settings setter */
  public set tupletSettings(newSettings: TupletSettings | null) {
    this._tupletSettings = newSettings;
  }
  /** Tuplet settings getter */
  public get tupletSettings(): TupletSettings | null {
    return this._tupletSettings;
  }

  /** Beam group ID setter */
  public set beamGroupId(newBeamGroupId: number | null) {
    this._beamGroupId = newBeamGroupId;
    if (this._beamGroupId === null) {
      this._lastInBeamGroup = false;
    }
  }
  /** Beam group ID getter */
  public get beamGroupId(): number | null {
    return this._beamGroupId;
  }

  /** Last in beam group setter */
  public set lastInBeamGroup(newLastInBeamGroup: boolean) {
    this._lastInBeamGroup = newLastInBeamGroup;
  }
  /** Last in beam group getter */
  public get lastInBeamGroup(): boolean {
    return this._lastInBeamGroup;
  }
}
