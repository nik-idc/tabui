import { randomInt } from "../../shared";
import type { Bar } from "./bar";
import { TrackContext } from "./track-context";
import { MusicInstrument } from "./instrument/instrument";
import { Note } from "./note";
import { NoteDuration } from "./note-duration";
import {
  TupletSettings,
  tupletSettingsEqual,
  tupletSettingsInRange,
} from "./tuplet-settings";
import { GuitarTechniqueType, TechniqueType } from "./technique-type";
import { NoteValue } from "./note";

import {
  applyDotsToFraction,
  applyTupletToFraction,
  fractionToTicks,
  getBaseDurationFraction,
} from "./timing";
import type { VoiceBar } from "./voice-bar";

/** Note-slot edit metadata containing live result notes. */
export type NoteArrayOperationOutput<
  I extends MusicInstrument = MusicInstrument,
> = {
  /** Zero-based starting slot in the beat's note array. */
  index: number;
  /** Notes installed by the operation. */
  notes: Note<I>[];
};

/** Written augmentation-dot count: none, single, or double. */
export type BeatDots = 0 | 1 | 2;

/** Explicit written-rhythm changes; omitted fields keep their current values. */
export type BeatRhythmChange<I extends MusicInstrument = MusicInstrument> = {
  /** Beat whose owning voice needs a timing rebuild. */
  beat: Beat<I>;
  /** New written duration, before dots and tuplets. */
  duration?: NoteDuration;
  /** New augmentation-dot count. */
  dots?: number;
  /** New tuplet settings, copied independently for each beat; null clears them. */
  tupletSettings?: TupletSettings | null;
};

/**
 * Class that represents a beat
 */
export class Beat<I extends MusicInstrument = MusicInstrument> {
  /** Validates the whole rhythm batch, then applies values and rebuilds each affected voice once. */
  public static updateRhythm<I extends MusicInstrument>(
    changes: BeatRhythmChange<I>[]
  ): void {
    for (const change of changes) {
      Beat.validateRhythm(
        change.dots === undefined ? 0 : change.dots,
        change.tupletSettings === undefined ? null : change.tupletSettings
      );
    }
    const voices = new Set<VoiceBar<I>>();
    for (const change of changes) {
      const { beat, duration, dots, tupletSettings } = change;
      if (duration !== undefined) {
        beat.baseDuration = duration;
      }
      if (dots !== undefined) {
        beat.dots = dots as BeatDots;
      }
      if (tupletSettings !== undefined) {
        beat.tupletSettings =
          tupletSettings === null ? null : { ...tupletSettings };
      }
      voices.add(beat.voiceBar);
    }
    for (const voice of voices) {
      voice.rebuildTiming();
    }
  }

  /** Beat's unique identifier */
  readonly uuid: number;
  /** Bar in which the beat lives */
  readonly voiceBar: VoiceBar<I>;
  /** Track context */
  readonly trackContext: TrackContext<I>;

  /** Beat notes */
  private _notes: Note<I>[] | null = null;
  /** Original bar identity recognizes generated fallback rests through history and destination copies. */
  private _fallbackRestOwner: Bar<I> | null = null;
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
   * Creates a beat with written rhythm; derived tick positions remain zero until its voice rebuilds timing.
   * @param voiceBar Owning voice bar.
   * @param trackContext Track context
   * @param notes Null for a rest, empty array for default empty note slots, or a retained array matching instrument polyphony.
   * @param baseDuration Base duration
   * @param dots Dots count
   * @param tupletSettings Tuplet settings
   * @param beamGroupId Derived beam-group ID, or null; overwritten on timing rebuild.
   * @param lastInBeamGroup Derived final-beat marker; overwritten on timing rebuild.
   * @throws If note-slot count or tuplet settings are invalid, or default-note construction fails.
   */
  constructor(
    voiceBar: VoiceBar<I>,
    trackContext: TrackContext<I>,
    notes: Note<I>[] | null = [],
    baseDuration: NoteDuration = NoteDuration.Quarter,
    dots: BeatDots = 0,
    tupletSettings: TupletSettings | null = null,
    beamGroupId: number | null = null,
    lastInBeamGroup: boolean = false
  ) {
    this.uuid = randomInt();
    this.voiceBar = voiceBar;
    this.trackContext = trackContext;

    this._notes = notes;
    this._baseDuration = baseDuration;
    this._dots = dots === undefined ? 0 : dots;
    this._lastInBeamGroup = false;
    this.tupletSettings = tupletSettings;
    this._beamGroupId = beamGroupId;
    this._lastInBeamGroup = lastInBeamGroup;
    this._baseDurationTicks = 0;
    this._fullDurationTicks = 0;
    this._startTick = 0;
    this._endTick = 0;

    const maxPolyphony = this.trackContext.instrument.maxPolyphony;
    if (notes === null) {
      this._notes = null;
    } else if (notes.length !== 0) {
      if (notes.length !== maxPolyphony) {
        throw Error("Beat notes count is different from max polyphony");
      }

      this._notes = notes;
    } else {
      this._notes = [];
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
   * Checks whether any note has this technique; rests return false.
   * @param type Type of note technique
   * @returns True if beat's notes have technique, false otherwise
   */
  public hasTechnique(type: TechniqueType): boolean {
    return this._notes?.some((n) => n.hasTechnique(type)) ?? false;
  }

  /** Discards all note slots and turns this beat into a rest, keeping its rhythm. */
  public makeRest(): void {
    this._notes = null;
    if (!this.voiceBar.beats.includes(this)) {
      return;
    }

    // Rest breaks ties
    const next = this.voiceBar.bar.staff.getNextBeat(this);
    for (const note of next?.notes ?? []) {
      note.removeTechnique(GuitarTechniqueType.Tie);
    }
  }

  /**
   * Replaces a rest with default empty note slots; leaves an existing note beat intact.
   * @throws If the instrument's default-note factory rejects its tuning or note state.
   */
  public makeBeatWithNotes(): void {
    if (this._notes !== null) {
      return;
    }

    this._notes = [];
    const maxPolyphony = this.trackContext.instrument.maxPolyphony;
    for (let i = 0; i < maxPolyphony; i++) {
      const note = this.trackContext.instrument.createDefaultNote(
        this,
        i
      ) as Note<I>;
      this._notes.push(note);
    }
  }

  /**
   * Replaces one note slot with a copy owned by this beat.
   * @param index Zero-based note-slot position.
   * @param note Note content to copy.
   * @returns Live installed note and its slot index.
   * @throws If this is a rest, the index is outside the note array, or copying fails.
   */
  public setNote(index: number, note: Note<I>): NoteArrayOperationOutput<I> {
    if (this._notes === null) {
      throw Error("Cannot set a note on a rest beat");
    }

    if (index < 0 || index >= this._notes.length) {
      throw Error(`${index} is invalid note index`);
    }

    this._notes[index] = note.deepCopy(this);

    return {
      index: index,
      notes: [this._notes[index]],
    };
  }

  /** Returns true for a note-slot array, even when all slots are empty notes. */
  public hasNotes(): boolean {
    return this._notes !== null;
  }

  /** Returns true only when the note array is null. */
  public isRest(): boolean {
    return this._notes === null;
  }

  /** Returns true for a rest or a note lane containing only empty values. */
  public isEmpty(): boolean {
    return (
      this._notes === null ||
      this._notes.every((note) => note.noteValue === NoteValue.None)
    );
  }

  /**
   * Compares shared track-context identity, written rhythm, and note content, ignoring UUID and derived timing.
   * @param otherBeat Beat to compare with
   * @returns True if equal, false otherwise
   */
  public compare(otherBeat: Beat<I>): boolean {
    if (
      this.trackContext !== otherBeat.trackContext ||
      this.hasNotes() !== otherBeat.hasNotes() ||
      this._baseDuration !== otherBeat._baseDuration ||
      this._dots !== otherBeat._dots ||
      !tupletSettingsEqual(this._tupletSettings, otherBeat._tupletSettings)
    ) {
      return false;
    }

    if (this._notes === null || otherBeat.notes === null) {
      return this._notes === null && otherBeat.notes === null;
    }

    if (this._notes.length !== otherBeat.notes.length) {
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
   * Copies rhythm, note content, and beam markers with new UUIDs; derived ticks remain zero until rebuilt.
   * @param voiceBar Destination owner and instrument context; extra lanes are dropped and missing lanes stay empty.
   * @returns Beat's deep copy
   * @throws If copied rhythm or note data is invalid for the destination instrument.
   */
  public deepCopy(voiceBar: VoiceBar<I> = this.voiceBar): Beat<I> {
    const tupletSettingsCopy: TupletSettings | null =
      this._tupletSettings !== null
        ? {
            normalCount: this._tupletSettings.normalCount,
            tupletCount: this._tupletSettings.tupletCount,
          }
        : null;

    const beat = new Beat<I>(
      voiceBar,
      voiceBar.trackContext,
      this._notes === null ? null : [],
      this._baseDuration,
      this._dots,
      tupletSettingsCopy,
      this._beamGroupId,
      this._lastInBeamGroup
    );
    if (this._notes !== null && beat._notes !== null) {
      const noteCount = Math.min(this._notes.length, beat._notes.length);
      for (let i = 0; i < noteCount; i++) {
        beat._notes[i] = this._notes[i].deepCopy(beat);
      }
    }

    beat._fallbackRestOwner = this._fallbackRestOwner;
    return beat;
  }

  /** Restores saved content from the same voice bar while keeping the beat object used by later commands. */
  public restoreContent(content: Beat<I>): void {
    this._notes = content._notes?.map((n) => n.deepCopy(this)) ?? null;
    this._baseDuration = content._baseDuration;
    this._dots = content._dots;
    this._tupletSettings =
      content._tupletSettings === null ? null : { ...content._tupletSettings };
    this._fallbackRestOwner = content._fallbackRestOwner;
  }

  /** Marks a rest created by empty-bar normalization with its owning bar's identity. */
  public markFallbackRest(): void {
    this._fallbackRestOwner = this.voiceBar.bar;
  }

  /** Matches generated-rest identity, never ordinary rest content or duration. */
  public isMatchingFallbackRest(generated: Beat<I>): boolean {
    return (
      generated._fallbackRestOwner !== null &&
      this._fallbackRestOwner === generated._fallbackRestOwner
    );
  }

  /** Live note-slot array, or null for a rest; empty note values are not rests. */
  public get notes(): Note<I>[] | null {
    return this._notes;
  }

  /** Changes written duration without rebuilding timing; call voiceBar.rebuildTiming() afterward. */
  public set baseDuration(newDuration: NoteDuration) {
    this._baseDuration = newDuration;
  }
  /** Written duration in whole-note units, before dots and tuplets. */
  public get baseDuration(): NoteDuration {
    return this._baseDuration;
  }
  /**
   * Played duration in whole-note units, including dots and tuplets.
   * @throws If dots are unsupported or a rhythm fraction has a zero denominator.
   */
  public get fullDuration(): number {
    const withDots = applyDotsToFraction(
      getBaseDurationFraction(this._baseDuration),
      this._dots
    );
    const withTuplet = applyTupletToFraction(withDots, this._tupletSettings);

    return withTuplet.numerator / withTuplet.denominator;
  }

  /**
   * Converts written duration, without dots or tuplets, to ticks.
   * @param tickResolution Ticks per whole note.
   * @throws If the duration is not an integral number of ticks at this resolution.
   */
  public getBaseDurationTicks(tickResolution: number): number {
    return fractionToTicks(
      getBaseDurationFraction(this._baseDuration),
      tickResolution
    );
  }

  /**
   * Converts played duration, including dots and tuplets, to ticks.
   * @param tickResolution Ticks per whole note.
   * @throws If dots are unsupported, a fraction has a zero denominator, or ticks are not integral.
   */
  public getFullDurationTicks(tickResolution: number): number {
    const withDots = applyDotsToFraction(
      getBaseDurationFraction(this._baseDuration),
      this._dots
    );
    const withTuplet = applyTupletToFraction(withDots, this._tupletSettings);

    return fractionToTicks(withTuplet, tickResolution);
  }

  /**
   * Stores derived timing without changing written rhythm or validating values.
   * @param baseDurationTicks Written duration at the owning voice's tick resolution.
   * @param fullDurationTicks Played duration including dots and tuplets.
   * @param startTick Start offset from the bar's beginning.
   * @param endTick End offset from the bar's beginning.
   */
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

  /** Changes written dots, rejecting unsupported counts; rebuild the owning voice afterward. */
  public set dots(newDots: BeatDots) {
    Beat.validateRhythm(newDots, null);
    this._dots = newDots;
  }
  /** Dots getter */
  public get dots(): number {
    return this._dots;
  }

  /**
   * Retains settings by reference, or clears them with null; rebuild the owning voice afterward.
   * @throws If settings are outside supported bounds.
   */
  public set tupletSettings(newSettings: TupletSettings | null) {
    Beat.validateRhythm(0, newSettings);
    this._tupletSettings = newSettings;
  }

  /** Checks dots and tuplets without changing a beat or its timing. */
  public static validateRhythm(
    dots: number,
    tupletSettings: TupletSettings | null
  ): void {
    if (dots !== 0 && dots !== 1 && dots !== 2) {
      throw Error(`${dots} is an invalid dots value`);
    }
    if (tupletSettings === null) {
      return;
    }
    if (!tupletSettingsInRange(tupletSettings)) {
      const { normalCount, tupletCount } = tupletSettings;
      throw new Error(
        `Tuplet settings {${normalCount},${tupletCount}} are outside the supported range`
      );
    }
  }
  /** Live tuplet settings, or null when no tuplet applies. */
  public get tupletSettings(): TupletSettings | null {
    return this._tupletSettings;
  }

  /** Sets derived beam-group membership; null also clears the last-in-group flag. */
  public set beamGroupId(newBeamGroupId: number | null) {
    this._beamGroupId = newBeamGroupId;
    if (this._beamGroupId === null) {
      this._lastInBeamGroup = false;
    }
  }
  /** Derived beam-group ID within the voice, or null when ungrouped. */
  public get beamGroupId(): number | null {
    return this._beamGroupId;
  }

  /** Last in beam group setter */
  public set lastInBeamGroup(newLastInBeamGroup: boolean) {
    this._lastInBeamGroup = newLastInBeamGroup;
  }
  /** Derived marker for the final beat of a beam group. */
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
