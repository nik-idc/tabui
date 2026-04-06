import { randomInt } from "@/shared";
import { Bar } from "./bar";
import { TrackContext } from "./track-context";
import { MusicInstrument } from "./instrument/instrument";
import { NoteJSON, Note, NoteValue } from "./note";
import { NoteDuration } from "./note-duration";
import {
  TupletSettingsJSON,
  TupletSettings,
  tupletSettingsEqual,
} from "./tuplet-settings";
import { TechniqueType } from "./technique-type";
import { Guitar } from "./instrument";
import { GuitarNote } from "./guitar-note";
import {
  applyDotsToFraction,
  applyTupletToFraction,
  fractionToTicks,
  getBaseDurationFraction,
} from "./timing";

export type NoteArrayOperationOutput<
  I extends MusicInstrument = MusicInstrument,
> = {
  index: number;
  notes: Note<I>[];
};

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
  /** Base duration in ticks at the parent bar's resolution */
  private _baseDurationTicks: number;
  /** Played duration in ticks at the parent bar's resolution */
  private _fullDurationTicks: number;
  /** Beat start position in bar-local ticks */
  private _startTick: number;
  /** Beat end position in bar-local ticks */
  private _endTick: number;

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
    this._baseDurationTicks = 0;
    this._fullDurationTicks = 0;
    this._startTick = 0;
    this._endTick = 0;

    const maxPolyphony = this.trackContext.instrument.maxPolyphony;
    if (notes.length !== 0) {
      if (notes.length !== maxPolyphony) {
        throw Error("Beat notes count is different from max polyphony");
      }

      this._notes = notes;
    } else {
      for (let i = 0; i < maxPolyphony; i++) {
        const note = this.trackContext.instrument.createDefaultNote(
          this,
          i
        ) as Note<I>;
        this._notes.push(note);
      }
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
   * Sets a beat's note
   * @param index Index of the note to set
   * @param note Note value to set
   */
  public setNote(index: number, note: Note<I>): NoteArrayOperationOutput<I> {
    if (index < 0 || index >= this._notes.length) {
      throw Error(`${index} is invalid note index`);
    }

    this._notes[index] = note.deepCopy();

    return {
      index: index,
      notes: [this._notes[index]],
    };
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
      !tupletSettingsEqual(this._tupletSettings, otherBeat._tupletSettings)
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
    const withDots = applyDotsToFraction(
      getBaseDurationFraction(this._baseDuration),
      this._dots
    );
    const withTuplet = applyTupletToFraction(withDots, this._tupletSettings);

    return withTuplet.numerator / withTuplet.denominator;
  }

  public getBaseDurationTicks(tickResolution: number): number {
    return fractionToTicks(
      getBaseDurationFraction(this._baseDuration),
      tickResolution
    );
  }

  public getFullDurationTicks(tickResolution: number): number {
    const withDots = applyDotsToFraction(
      getBaseDurationFraction(this._baseDuration),
      this._dots
    );
    const withTuplet = applyTupletToFraction(withDots, this._tupletSettings);

    return fractionToTicks(withTuplet, tickResolution);
  }

  public setTiming(
    baseDurationTicks: number,
    fullDurationTicks: number,
    startTick: number,
    endTick: number
  ): void {
    this._baseDurationTicks = baseDurationTicks;
    this._fullDurationTicks = fullDurationTicks;
    this._startTick = startTick;
    this._endTick = endTick;
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

  /** Base duration in ticks at the parent bar's resolution */
  public get baseDurationTicks(): number {
    return this._baseDurationTicks;
  }

  /** Played duration in ticks at the parent bar's resolution */
  public get fullDurationTicks(): number {
    return this._fullDurationTicks;
  }

  /** Beat start position in bar-local ticks */
  public get startTick(): number {
    return this._startTick;
  }

  /** Beat end position in bar-local ticks */
  public get endTick(): number {
    return this._endTick;
  }
}
