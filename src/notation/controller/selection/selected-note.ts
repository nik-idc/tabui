import {
  Bar,
  Staff,
  Beat,
  Note,
  VoiceBar,
  VoiceNumber,
} from "@/notation/model";

export enum SelectedMoveDirection {
  Left,
  Right,
  Up,
  Down,
}

/**
 * Types of outcomes for moving a note right
 */
export enum MoveRightResult {
  Nothing,
  AddedBeat,
  AddedBar,
}

/**
 * Move right output type
 */
export type MoveRightOutput =
  | { result: MoveRightResult.Nothing; addedBar: false }
  | { result: MoveRightResult.AddedBeat; addedBar: false }
  | { result: MoveRightResult.AddedBar; addedBar: true };

/**
 * Legacy name: this is moving from note-object selection toward an edit cursor
 * position (staff/bar/voice/beat/note lane). Once rests are stabilized, rename
 * to SelectionCursor or similar.
 */
export class SelectedNote {
  /** Selected note's staff */
  readonly staff: Staff;

  /** Index of the selected note's bar */
  private _barIndex: number = 0;
  /** Number of the selected voice */
  private _voiceNumber: VoiceNumber = 1;
  /** Index of the selected note's beat (within the bar) */
  private _beatIndex: number = 0;
  /** Index of the selected note */
  private _noteIndex: number = 0;
  /** last move right result */
  private _lastMoveRightResult?: MoveRightResult;

  constructor(initialBeat: Beat, noteIndex: number) {
    this.staff = initialBeat.voiceBar.bar.staff;
    this._voiceNumber = initialBeat.voiceBar.voiceNumber;
    this._noteIndex = noteIndex;

    for (let barIndex = 0; barIndex < this.staff.bars.length; barIndex++) {
      const bar = this.staff.bars[barIndex];
      const voiceBar = bar.getVoiceBar(this._voiceNumber);
      if (voiceBar === null) {
        continue;
      }

      for (let beatIndex = 0; beatIndex < voiceBar.beats.length; beatIndex++) {
        if (voiceBar.beats[beatIndex].uuid !== initialBeat.uuid) {
          continue;
        }

        this._barIndex = barIndex;
        this._beatIndex = beatIndex;
        return;
      }
    }
  }

  /**
   * Move selected note up (or to the last string if current is the first)
   */
  public moveUp(): void {
    const maxPolyphony = this.staff.trackContext.instrument.maxPolyphony;
    const newnoteIndex =
      this._noteIndex === 0 ? maxPolyphony - 1 : this._noteIndex - 1;

    this._noteIndex = newnoteIndex;
  }

  /**
   * Move selected note down (or to the first string if current is the last)
   */
  public moveDown(): void {
    const maxPolyphony = this.staff.trackContext.instrument.maxPolyphony;
    const newnoteIndex =
      this._noteIndex === maxPolyphony - 1 ? 0 : this._noteIndex + 1;

    this._noteIndex = newnoteIndex;
  }

  /**
   * Move selected note left (or to the last note of the previous bar)
   */
  public moveLeft(): void {
    // If not first bar beat
    if (this._beatIndex !== 0) {
      this._beatIndex--;
      return;
    }

    // Do nothing if last bar and last beat
    if (this._barIndex === 0) {
      return;
    }

    // Move to the left bar
    this._barIndex--;
    this._beatIndex =
      (this.bar.getVoiceBar(this._voiceNumber)?.beats ?? [0]).length - 1;
  }

  /**
   * Move selected note right (or to the first note of the next bar)
   * @returns A move right result
   */
  public moveRight(): MoveRightOutput {
    // Check if can add beats to the bar
    if (
      this._beatIndex === this.voiceBar.beats.length - 1 &&
      (!this.voiceBar.checkDurationsFit() || this.voiceBar.isEmpty()) &&
      this.voiceBar.getActualBarDuration() <
        this.bar.masterBar.beatsCount * this.bar.masterBar.duration
    ) {
      // If the current beat is not the last one of the bar AND
      // If durations don't fit AND
      // If currently actual bar duration is less than the correct one
      // append a new beat and select it
      this._beatIndex++;

      this._lastMoveRightResult = MoveRightResult.AddedBeat;
      return { result: this._lastMoveRightResult, addedBar: false };
    }

    if (this._beatIndex !== this.voiceBar.beats.length - 1) {
      // Can't add more beats but can move to the next beat
      this._beatIndex++;

      this._lastMoveRightResult = MoveRightResult.Nothing;
      return { result: this._lastMoveRightResult, addedBar: false };
    }

    // Can't move to next beat OR add more beats, move to the next bar
    if (this._barIndex !== this.staff.bars.length - 1) {
      this._barIndex++;
      this._beatIndex = 0;

      this._lastMoveRightResult = MoveRightResult.Nothing;
      return { result: this._lastMoveRightResult, addedBar: false };
    }

    this._lastMoveRightResult = MoveRightResult.AddedBar;
    return { result: this._lastMoveRightResult, addedBar: true };
  }

  /**
   * Syncs selected note state with added bar
   * in the model after move right
   */
  public afterAddedBar(): void {
    if (this._lastMoveRightResult !== MoveRightResult.AddedBar) {
      throw Error(
        "After added bar called when last move right result is not added bar"
      );
    }

    this._barIndex++;
    this._beatIndex = 0;
  }

  /**
   * Syncs stored bar/beat/note indices to current runtime structure.
   */
  public syncToStructure(): void {
    if (this.staff.bars.length === 0) {
      throw Error("Selected note sync called with no bars in staff");
    }

    if (this._barIndex >= this.staff.bars.length) {
      this._barIndex = this.staff.bars.length - 1;
    }
    if (this._barIndex < 0) {
      this._barIndex = 0;
    }

    const bar = this.staff.bars[this._barIndex];
    const voiceBar = this.voiceBar;
    if (voiceBar.beats.length === 0) {
      throw Error("Selected note sync called with no beats in bar");
    }

    if (this._beatIndex >= voiceBar.beats.length) {
      this._beatIndex = voiceBar.beats.length - 1;
    }
    if (this._beatIndex < 0) {
      this._beatIndex = 0;
    }

    const beat = voiceBar.beats[this._beatIndex];
    if (beat.notes !== null && beat.notes.length === 0) {
      throw Error("Selected note sync called with no notes in beat");
    }

    if (beat.notes !== null && this._noteIndex >= beat.notes.length) {
      this._noteIndex = beat.notes.length - 1;
    }
    if (this._noteIndex < 0) {
      this._noteIndex = 0;
    }
  }

  /** Selected note */
  public get note(): Note | null {
    const notes = this.voiceBar.beats[this._beatIndex].notes;
    return notes?.[this._noteIndex] ?? null;
  }

  /** Selected beat */
  public get beat(): Beat {
    return this.voiceBar.beats[this._beatIndex];
  }

  /** Selected bar */
  public get bar(): Bar {
    return this.staff.bars[this._barIndex];
  }

  /** Selected voice bar */
  public get voiceBar(): VoiceBar {
    const voiceBar = this.bar.getVoiceBar(this._voiceNumber);
    if (voiceBar === null) {
      throw Error("Selected note points to an empty voice slot");
    }

    return voiceBar;
  }

  /** Selected note's string number */
  public get noteIndex(): number {
    return this._noteIndex;
  }

  /** Selected beat id */
  public get beatIndex(): number {
    return this._beatIndex;
  }

  /** Selected bar id */
  public get barIndex(): number {
    return this._barIndex;
  }
}
