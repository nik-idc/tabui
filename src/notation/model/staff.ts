import { randomInt } from "../../shared";
import { Bar } from "./bar";
import { TrackContext } from "./track-context";
import { MusicInstrument } from "./instrument/instrument";
import { ClefType } from "./clef-type";
import { MasterBar } from "./master-bar";
import { Track } from "./track";
import { Beat } from "./beat";
import { VoiceBar, VoiceNumber } from "./voice-bar";
import { Note } from "./note";

/**
 * A staff in this context is a representation of an
 * individually played part on an instrument. For example:
 * - A piano usually has 2 staffs: Treble & Bass (i.e. right & left hand parts)
 * - A guitar usually has 1 staff
 */
export class Staff<I extends MusicInstrument = MusicInstrument> {
  /** Staff's unqiue identifier */
  readonly uuid: number;
  /** Track in which the staff lives */
  readonly track: Track<I>;
  /** Track context */
  readonly trackContext: TrackContext<I>;

  /** Bars belonging to the staff */
  private _bars: Bar<I>[];
  /** Clef type for the staff */
  private _clefType: ClefType;
  /** Indicates whether to display guitar tablature  */
  private _showTablature: boolean;
  /** Indicates whether to display classical music notation  */
  private _showClassicNotation: boolean;

  private _voiceNumberBarCounts: Map<VoiceNumber, number>;

  /**
   * Creates a staff using the supplied live bars; an empty array stays empty until track alignment adds bars.
   * @param track Owning track, retained by reference.
   * @param trackContext Track context
   * @param bars Bars belonging to the staff
   * @param clefType Clef type
   * @param showTablature Whether to display tablature.
   * @param showClassicNotation Standard-notation flag; standard notation is not implemented.
   * @throws If supplied voice data makes staff bookkeeping inconsistent.
   */
  constructor(
    track: Track<I>,
    trackContext: TrackContext<I>,
    bars: Bar<I>[] = [],
    clefType: ClefType = ClefType.Treble,
    showTablature: boolean = true,
    showClassicNotation: boolean = false
  ) {
    this.uuid = randomInt();
    this.track = track;
    this.trackContext = trackContext;

    this._bars = bars;
    this._clefType = clefType;
    this._showTablature = showTablature;
    this._showClassicNotation = showClassicNotation;

    this._voiceNumberBarCounts = new Map([
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
    ]);

    this.rebuildVoiceBarCounts();
  }

  /**
   * Inserts an existing bar on this staff only, without copying or rebinding it.
   * @param index Zero-based insertion position, using array-splice semantics.
   * @param bar Bar already owned by this staff, with the correct shared master bar.
   * @returns Inserted bar
   * @throws If voice bookkeeping is inconsistent.
   */
  public insertReadyBar(index: number, bar: Bar<I>): Bar<I> {
    this._bars.splice(index, 0, bar);
    this.recordBarAdded(bar);

    return bar;
  }

  /**
   * Inserts a bar on this staff only; use score methods for score-wide edits.
   * @param index Zero-based insertion position, using array-splice semantics.
   * @param masterBar Master bar
   * @param beats Live beats for the selected voice; empty creates a quarter rest. Parent references are not rebound.
   * @param voiceNumber Voice to populate, alongside existing non-empty staff voices seeded with rests.
   * @returns Live inserted bar.
   * @throws If voice timing or staff bookkeeping fails.
   */
  public insertBar(
    index: number,
    masterBar: MasterBar,
    beats: Beat<I>[] = [],
    voiceNumber: VoiceNumber = 1
  ): Bar<I> {
    const newBar = new Bar<I>(this, this.trackContext, masterBar);
    this._bars.splice(index, 0, newBar);
    this.insertVoiceBarsForNewBar(newBar, beats, voiceNumber);

    return newBar;
  }

  /**
   * Appends a bar on this staff only; use score methods for score-wide edits.
   * @param masterBar Master bar
   * @param beats Live beats for the selected voice; empty creates a quarter rest. Parent references are not rebound.
   * @param voiceNumber Voice to populate, alongside existing non-empty staff voices seeded with rests.
   * @returns Live inserted bar.
   * @throws If voice timing or staff bookkeeping fails.
   */
  public appendBar(
    masterBar: MasterBar,
    beats: Beat<I>[] = [],
    voiceNumber: VoiceNumber = 1
  ): Bar<I> {
    const newBar = new Bar<I>(this, this.trackContext, masterBar);
    this._bars.push(newBar);
    this.insertVoiceBarsForNewBar(newBar, beats, voiceNumber);

    return newBar;
  }

  /**
   * Prepends a bar on this staff only; use score methods for score-wide edits.
   * @param masterBar Master bar
   * @param beats Live beats for the selected voice; empty creates a quarter rest. Parent references are not rebound.
   * @param voiceNumber Voice to populate, alongside existing non-empty staff voices seeded with rests.
   * @returns Live inserted bar.
   * @throws If voice timing or staff bookkeeping fails.
   */
  public prependBar(
    masterBar: MasterBar,
    beats: Beat<I>[] = [],
    voiceNumber: VoiceNumber = 1
  ): Bar<I> {
    const newBar = new Bar<I>(this, this.trackContext, masterBar);
    this._bars.unshift(newBar);
    this.insertVoiceBarsForNewBar(newBar, beats, voiceNumber);

    return newBar;
  }

  private insertVoiceBarsForNewBar(
    bar: Bar<I>,
    beats: Beat<I>[],
    voiceNumber: VoiceNumber
  ): void {
    const voiceNumbers = new Set<VoiceNumber>(this.nonEmptyVoiceNumbers);
    voiceNumbers.add(voiceNumber);

    for (const currentVoiceNumber of voiceNumbers) {
      bar.insertVoiceBar(
        currentVoiceNumber,
        currentVoiceNumber === voiceNumber ? beats : []
      );
    }
  }

  /**
   * Removes a bar from the staff at the specified index
   * @param index Zero-based position of the bar to remove.
   * @returns Removed live bar.
   * @throws If the index is outside this staff, this is its last bar, or bookkeeping fails.
   */
  public removeBar(index: number): Bar<I> {
    if (index < 0 || index >= this._bars.length) {
      throw Error(`${index} is invalid bar index`);
    }
    if (this._bars.length === 1) {
      throw Error("Staff must have at least one bar");
    }

    const removedBar = this._bars[index];
    this._bars.splice(index, 1);
    this.recordBarRemoved(removedBar);

    return removedBar;
  }

  private adjustVoiceBarCount(voiceNumber: VoiceNumber, delta: number): void {
    const currentCount = this._voiceNumberBarCounts.get(voiceNumber);
    if (currentCount === undefined) {
      throw Error(`Couldn't get voice ${voiceNumber} bar count`);
    }

    const nextCount = currentCount + delta;
    if (nextCount < 0) {
      throw Error(`Voice ${voiceNumber} bar count cannot be negative`);
    }

    this._voiceNumberBarCounts.set(voiceNumber, nextCount);
  }

  /** Records a non-empty voice bar in staff counts; does not insert it into a bar. */
  public recordVoiceBarAdded(voiceBar: VoiceBar<I>): void {
    if (voiceBar.isEmpty()) {
      return;
    }

    this.adjustVoiceBarCount(voiceBar.voiceNumber, 1);
  }

  /**
   * Removes a non-empty voice bar from staff counts; does not clear its voice slot.
   * @throws If bookkeeping would make the count negative.
   */
  public recordVoiceBarRemoved(voiceBar: VoiceBar<I>): void {
    if (voiceBar.isEmpty()) {
      return;
    }

    this.adjustVoiceBarCount(voiceBar.voiceNumber, -1);
  }

  private recordBarAdded(bar: Bar<I>): void {
    for (const voiceBar of bar.voiceBarsAsArray) {
      this.recordVoiceBarAdded(voiceBar);
    }
  }

  private recordBarRemoved(bar: Bar<I>): void {
    for (const voiceBar of bar.voiceBarsAsArray) {
      this.recordVoiceBarRemoved(voiceBar);
    }
  }

  private rebuildVoiceBarCounts(): void {
    for (const voiceNumber of this._voiceNumberBarCounts.keys()) {
      this._voiceNumberBarCounts.set(voiceNumber, 0);
    }

    for (const bar of this._bars) {
      for (const voiceBar of bar.voiceBarsAsArray) {
        this.recordVoiceBarAdded(voiceBar);
      }
    }
  }

  /**
   * Gets the next beat in the same voice, checking only the immediately next bar at a boundary.
   * @param beat Beat after which to find the next beat
   * @returns Live next beat, or null at the staff boundary or an absent/empty next voice. Inputs must belong to this staff.
   */
  public getNextBeat(beat: Beat<I>): Beat<I> | null {
    const beatIndex = beat.voiceBar.beats.indexOf(beat);
    const nextBeatInBar = beat.voiceBar.beats[beatIndex + 1];
    if (nextBeatInBar !== undefined) {
      return nextBeatInBar;
    }

    const barIndex = this._bars.indexOf(beat.voiceBar.bar);
    const nextBar = this._bars[barIndex + 1];
    const nextVoiceBar = nextBar?.getVoiceBar(beat.voiceBar.voiceNumber);
    if (nextVoiceBar !== undefined && nextVoiceBar !== null) {
      return nextVoiceBar.beats[0] ?? null;
    }

    return null;
  }

  /**
   * Gets the previous beat in the same voice, checking only the immediately previous bar at a boundary.
   * @param beat Beat before which to find the prev beat
   * @returns Live previous beat, or null at the staff boundary or an absent/empty previous voice. Inputs must belong to this staff.
   */
  public getPrevBeat(beat: Beat<I>): Beat<I> | null {
    const beatIndex = beat.voiceBar.beats.indexOf(beat);
    const prevBeatInBar = beat.voiceBar.beats[beatIndex - 1];
    if (prevBeatInBar !== undefined) {
      return prevBeatInBar;
    }

    const barIndex = this._bars.indexOf(beat.voiceBar.bar);
    const prevBar = this._bars[barIndex - 1];
    const prevVoiceBar = prevBar?.getVoiceBar(beat.voiceBar.voiceNumber);
    if (prevVoiceBar !== undefined && prevVoiceBar !== null) {
      return prevVoiceBar.beats[prevVoiceBar.beats.length - 1] ?? null;
    }

    return null;
  }

  /**
   * Gets the same note slot in the next beat of this voice, including across a bar boundary.
   * @param note Note after which to find the next note
   * @returns Live slot note (which may be empty), or null at a boundary or rest. The input must be present in its beat on this staff.
   * @throws If the input beat is a rest.
   */
  public getNextNote(note: Note<I>): Note<I> | null {
    const noteIndex = note.beat.notes?.indexOf(note);
    if (noteIndex === undefined) {
      throw new Error("Could not locate note inside beat");
    }

    const nextBeat = this.getNextBeat(note.beat);
    if (nextBeat === null || nextBeat.notes === null) {
      return null;
    }

    return nextBeat.notes[noteIndex];
  }

  /**
   * Gets the same note slot in the previous beat of this voice, including across a bar boundary.
   * @param note Note before which to find the previous note; must be present in its beat on this staff.
   * @returns Live slot note (which may be empty), or null at a boundary or rest.
   * @throws If the input beat is a rest.
   */
  public getPrevNote(note: Note<I>): Note<I> | null {
    const noteIndex = note.beat.notes?.indexOf(note);
    if (noteIndex === undefined) {
      throw new Error("Could not locate note inside beat");
    }

    const nextBeat = this.getPrevBeat(note.beat);
    if (nextBeat === null || nextBeat.notes === null) {
      return null;
    }

    return nextBeat.notes[noteIndex];
  }

  /**
   * Returns a new array of live beats in one voice across all bars, skipping absent slots; defaults to voice 1.
   */
  public getBeatsSeq(voiceNumber: VoiceNumber = 1): Beat<I>[] {
    return this.getVoiceBeatsSeq(voiceNumber);
  }

  /** Returns a new array of live beats in one voice across all bars, skipping absent slots. */
  public getVoiceBeatsSeq(voiceNumber: VoiceNumber): Beat<I>[] {
    return this._bars.flatMap(
      (bar) => bar.getVoiceBar(voiceNumber)?.beats ?? []
    );
  }

  /**
   * Get next bar in the staff
   * @param bar Bar after which to find the next bar
   * @returns Next bar, null after the last bar, or the first bar if the input is absent from this staff.
   */
  public getNextBar(bar: Bar<I>): Bar<I> | null {
    const barIndex = this._bars.indexOf(bar);
    const nextBar = this._bars[barIndex + 1];
    return nextBar ?? null;
  }

  /**
   * Get prev bar in the staff
   * @param bar Bar before which to find the prev bar
   * @returns Previous bar, or null for the first bar or a bar absent from this staff.
   */
  public getPrevBar(bar: Bar<I>): Bar | null {
    const barIndex = this._bars.indexOf(bar);
    const prevBar = this._bars[barIndex - 1];
    return prevBar ?? null;
  }

  /**
   * Copies bars and display settings with a new UUID, retaining the track and context.
   * Copied descendants retain original parent/master-bar references.
   * @throws If copied data or timing is invalid.
   */
  public deepCopy(): Staff<I> {
    const barsCopy: Bar<I>[] = [];
    for (const bar of this._bars) {
      barsCopy.push(bar.deepCopy());
    }

    return new Staff<I>(
      this.track,
      this.trackContext,
      barsCopy,
      this._clefType,
      this._showTablature,
      this._showClassicNotation
    );
  }

  /** Live staff-bar array; use bar methods for bookkeeping and score methods for score-wide alignment. */
  public get bars(): Bar<I>[] {
    return this._bars;
  }

  /** Clef type for the staff */
  public get clefType(): ClefType {
    return this._clefType;
  }

  /** Show tablature setter */
  public set showTablature(newShowTablature: boolean) {
    this._showTablature = newShowTablature;
  }
  /** Indicates whether to display guitar tablature */
  public get showTablature(): boolean {
    return this._showTablature;
  }

  /** Show classic notation setter */
  public set showClassicNotation(newShowClassicNotation: boolean) {
    this._showClassicNotation = newShowClassicNotation;
  }
  /** Standard-notation display flag; standard notation is not implemented. */
  public get showClassicNotation(): boolean {
    return this._showClassicNotation;
  }

  /** Ascending voice numbers with at least one beat, including rests, according to staff counts. */
  public get nonEmptyVoiceNumbers(): VoiceNumber[] {
    return [...this._voiceNumberBarCounts.entries()]
      .filter(([, count]) => count !== 0)
      .map(([voiceNumber]) => voiceNumber)
      .sort((a, b) => a - b);
  }
}
