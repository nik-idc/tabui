import { Staff, Beat, Note, Track, VoiceNumber } from "../../model";

import { NoteElement } from "../element/note/note-element";
import {
  SelectionCursor,
  MoveRightOutput,
  SelectedMoveDirection,
  SelectionAddress,
  SelectionHistorySnapshot,
} from "./selection-cursor";

type HorizontalOffset = -1 | 1;
type BarOffset = HorizontalOffset | 0;

/**
 * Class that manages selection state
 */
export class SelectionManager {
  /** Track */
  readonly track: Track;

  /** Current staff */
  private _staff: Staff;
  /** Current voice number */
  private _activeVoiceNumber: VoiceNumber;
  /** Selected note element */
  private _selectionCursor?: SelectionCursor;
  /** Base beat of the selection */
  private _baseSelectionBeat?: Beat;
  /** Most recent beat used to extend the anchored range. */
  private _selectionEndBeat?: Beat;
  /**
   * Whether the current range was initiated with the anchor control.
   * TODO: Possible rename to something that would communicate "selection" button clearer.
   */
  private _selectionAnchorExplicitlySet: boolean = false;
  /** Selection beats */
  private _selectionBeats: Beat[];
  /** Copied data */
  private _clipboard?: Note | Beat[];

  /**
   * Class that manages selection state
   * @param track Track
   */
  constructor(track: Track) {
    this.track = track;

    this._staff = this.track.staves[0];
    this._activeVoiceNumber = 1;
    this._selectionBeats = [];
    this._clipboard = [];
  }

  private addressForBeat(beat: Beat, noteIndex: number): SelectionAddress {
    const staff = beat.voiceBar.bar.staff;
    return {
      staffIndex: this.track.staves.indexOf(staff),
      barIndex: staff.bars.indexOf(beat.voiceBar.bar),
      voiceNumber: beat.voiceBar.voiceNumber,
      beatIndex: beat.voiceBar.beats.indexOf(beat),
      noteIndex,
    };
  }

  /** Captures selection coordinates without retaining model objects. */
  public captureHistorySnapshot(): SelectionHistorySnapshot {
    if (this._selectionCursor !== undefined) {
      return {
        cursor: this.addressForBeat(
          this._selectionCursor.beat,
          this._selectionCursor.noteIndex
        ),
        range: null,
      };
    }

    if (
      this._baseSelectionBeat !== undefined &&
      this._selectionEndBeat !== undefined
    ) {
      return {
        cursor: null,
        range: {
          anchor: this.addressForBeat(this._baseSelectionBeat, 0),
          end: this.addressForBeat(this._selectionEndBeat, 0),
          explicit: this._selectionAnchorExplicitlySet,
        },
      };
    }

    return { cursor: null, range: null };
  }

  private resolveAddress(address: SelectionAddress): Beat | undefined {
    const staff = this.track.staves[address.staffIndex];
    const bar = staff?.bars[address.barIndex];
    const voiceBar = bar?.getVoiceBar(address.voiceNumber);
    return voiceBar?.beats[address.beatIndex];
  }

  private findFallback(address: SelectionAddress): Beat | undefined {
    const staves = this.track.staves;
    const orderedStaves = staves
      .map((staff, index) => ({ staff, index }))
      .sort(
        (a, b) =>
          Math.abs(a.index - address.staffIndex) -
          Math.abs(b.index - address.staffIndex)
      );
    for (const { staff } of orderedStaves) {
      const bars = staff.bars;
      const orderedBars = bars
        .map((bar, index) => ({ bar, index }))
        .sort(
          (a, b) =>
            Math.abs(a.index - address.barIndex) -
            Math.abs(b.index - address.barIndex)
        );
      for (const { bar } of orderedBars) {
        const orderedVoiceBars = bar.voiceBarsAsArray
          .filter((voiceBar) => voiceBar.beats.length > 0)
          .sort(
            (a, b) =>
              Math.abs(a.voiceNumber - address.voiceNumber) -
              Math.abs(b.voiceNumber - address.voiceNumber)
          );
        const voiceBar = orderedVoiceBars[0];
        if (voiceBar !== undefined) {
          const beatIndex = Math.max(
            0,
            Math.min(address.beatIndex, voiceBar.beats.length - 1)
          );
          return voiceBar.beats[beatIndex];
        }
      }
    }
    return undefined;
  }

  /** Restores a historical cursor at its saved address or nearest valid beat. */
  private restoreCursor(cursorAddress: SelectionAddress): boolean {
    const beat =
      this.resolveAddress(cursorAddress) ?? this.findFallback(cursorAddress);
    if (beat !== undefined) {
      this.selectBeatCursor(
        beat,
        Math.max(
          0,
          Math.min(
            cursorAddress.noteIndex,
            beat.voiceBar.bar.staff.trackContext.instrument.maxPolyphony - 1
          )
        )
      );
      return true;
    }
    return false;
  }

  /** Restores a valid range without clearing state before its addresses validate. */
  private restoreRange(range: SelectionHistorySnapshot["range"]): boolean {
    if (range === null) {
      return false;
    }
    const anchor = this.resolveAddress(range.anchor);
    const end = this.resolveAddress(range.end);
    const sameLane =
      anchor !== undefined &&
      end !== undefined &&
      anchor.voiceBar.bar.staff === end.voiceBar.bar.staff &&
      anchor.voiceBar.voiceNumber === end.voiceBar.voiceNumber;
    if (!sameLane || anchor === undefined || end === undefined) {
      return false;
    }
    this._selectionCursor = undefined;
    this.clearSelection();
    this.selectBeat(anchor);
    this.selectBeat(end);
    this._selectionAnchorExplicitlySet = range.explicit;
    return true;
  }

  /** Restores the nearest cursor from either snapshot when primary restoration fails. */
  private restoreFallback(
    snapshot: SelectionHistorySnapshot,
    opposite: SelectionHistorySnapshot
  ): void {
    const ranges = [snapshot.range, opposite.range];
    this._selectionCursor = undefined;
    this.clearSelection();
    const cursorAddresses = [snapshot.cursor, opposite.cursor];
    for (const cursorAddress of cursorAddresses) {
      if (cursorAddress === null) {
        continue;
      }
      const fallbackBeat = this.findFallback(cursorAddress);
      if (fallbackBeat !== undefined) {
        this.selectBeatCursor(fallbackBeat, 0);
        return;
      }
    }
    for (const range of ranges) {
      const fallbackAddress = range?.anchor;
      if (fallbackAddress === undefined) {
        continue;
      }
      const fallbackBeat = this.findFallback(fallbackAddress);
      if (fallbackBeat !== undefined) {
        this.selectBeatCursor(fallbackBeat, 0);
        return;
      }
    }
  }

  /** Restores a historical selection, falling back to a nearby valid cursor. */
  public restoreHistorySnapshot(
    snapshot: SelectionHistorySnapshot,
    opposite: SelectionHistorySnapshot
  ): void {
    if (snapshot.cursor !== null && this.restoreCursor(snapshot.cursor)) {
      return;
    }

    if (this.restoreRange(snapshot.range)) {
      return;
    }

    if (opposite.cursor !== null && this.restoreCursor(opposite.cursor)) {
      return;
    }

    this.restoreFallback(snapshot, opposite);
  }

  /**
   * Selects note & clears beat selection
   * @param note Note to select
   */
  public selectNote(note: Note): void {
    this._staff = note.beat.voiceBar.bar.staff;
    this._activeVoiceNumber = note.beat.voiceBar.voiceNumber;
    const noteIndex = note.beat.notes?.indexOf(note) ?? 0;

    this.clearSelection();
    this._selectionCursor = new SelectionCursor(note.beat, noteIndex);
  }

  public selectBeatCursor(beat: Beat, noteIndex: number): void {
    this._staff = beat.voiceBar.bar.staff;
    this._activeVoiceNumber = beat.voiceBar.voiceNumber;

    this.clearSelection();
    this._selectionCursor = new SelectionCursor(beat, noteIndex);
  }

  /**
   * Move selected note up
   */
  public moveSelectedNoteUp(): void {
    if (this.selectionCursor === undefined) {
      throw Error("No note selected");
    }

    this.clearSelection();
    this.selectionCursor.moveUp();
  }

  /**
   * Move selected note down
   */
  public moveSelectedNoteDown(): void {
    if (this.selectionCursor === undefined) {
      throw Error("No note selected");
    }

    this.clearSelection();
    this.selectionCursor.moveDown();
  }

  /** Moves the cursor left, starting outside the selected range if active. */
  public moveSelectedNoteLeft(editingEnabled: boolean = true): void {
    if (this._selectionBeats.length !== 0) {
      const leftMostBeat = this._selectionBeats[0];
      if (leftMostBeat === undefined) {
        throw Error("Selected beat range is empty");
      }
      this.selectBeatCursor(leftMostBeat, 0);
    }

    if (this._selectionCursor === undefined) {
      throw Error("No note selected");
    }

    this._selectionCursor.moveLeft(editingEnabled);
    this._activeVoiceNumber = this._selectionCursor.voiceNumber;
  }

  /** Moves the cursor right, starting outside the selected range if active. */
  public moveSelectedNoteRight(
    editingEnabled: boolean = true
  ): MoveRightOutput {
    if (this._selectionBeats.length !== 0) {
      const rightMostBeat =
        this._selectionBeats[this._selectionBeats.length - 1];
      if (rightMostBeat === undefined) {
        throw Error("Selected beat range is empty");
      }
      this.selectBeatCursor(rightMostBeat, 0);
    }

    if (this._selectionCursor === undefined) {
      throw Error("No note selected");
    }

    const output = this._selectionCursor.moveRight(editingEnabled);
    this._activeVoiceNumber = this._selectionCursor.voiceNumber;
    return output;
  }

  /** Starts a range at the cursor if needed, then moves its active endpoint. */
  private extendSelectionTo(beat: Beat): void {
    const cursorBeat = this._selectionCursor?.beat;
    if (cursorBeat !== undefined) {
      this.selectBeat(cursorBeat);
    }
    this.selectBeat(beat);
  }

  /** Finds the requested edge beat in this beat's current or adjacent bar. */
  private getBarEdgeBeat(
    beat: Beat,
    barOffset: BarOffset,
    edgeOffset: HorizontalOffset
  ): Beat | undefined {
    const staff = beat.voiceBar.bar.staff;
    const barIndex = staff.bars.indexOf(beat.voiceBar.bar);
    if (barIndex === -1) {
      return undefined;
    }
    const targetBar = staff.bars[barIndex + barOffset];
    const targetBeats = targetBar?.getVoiceBar(
      beat.voiceBar.voiceNumber
    )?.beats;
    if (targetBeats === undefined) {
      return undefined;
    }

    return edgeOffset === -1
      ? targetBeats[0]
      : targetBeats[targetBeats.length - 1];
  }

  /** Extends the fixed-anchor range by one beat in either direction. */
  public extendSelectionByBeat(direction: SelectedMoveDirection): boolean {
    const cursorBeat = this._selectionCursor?.beat;
    if (cursorBeat !== undefined) {
      this.selectBeat(cursorBeat);
      return true;
    }

    const offset = direction === SelectedMoveDirection.Left ? -1 : 1;
    const endBeat = this._selectionEndBeat ?? this._selectionCursor?.beat;
    if (endBeat === undefined) {
      return false;
    }

    const beats = endBeat.voiceBar.bar.staff.getBeatsSeq(
      endBeat.voiceBar.voiceNumber
    );
    const endIndex = beats.indexOf(endBeat);
    if (endIndex === -1) {
      return false;
    }
    const targetBeat = beats[endIndex + offset];
    if (targetBeat === undefined) {
      return false;
    }

    this.extendSelectionTo(targetBeat);
    return true;
  }

  /** Finds the next beat (if moving by bar) without changing selection state */
  public moveByBar(direction: SelectedMoveDirection): Beat | undefined {
    const directionOffset: HorizontalOffset =
      direction === SelectedMoveDirection.Left ? -1 : 1;
    const currentBeat = this._selectionEndBeat ?? this._selectionCursor?.beat;
    if (currentBeat === undefined) {
      return undefined;
    }

    const staff = currentBeat.voiceBar.bar.staff;
    const beats = staff.getBeatsSeq(currentBeat.voiceBar.voiceNumber);
    const anchorBeat = this._baseSelectionBeat ?? currentBeat;
    const currentIndex = beats.indexOf(currentBeat);
    const anchorIndex = beats.indexOf(anchorBeat);
    if (currentIndex === -1 || anchorIndex === -1) {
      return undefined;
    }

    const isMovingTowardAnchor =
      (currentIndex - anchorIndex) * directionOffset < 0;
    const isAnchorInAnotherBar =
      anchorBeat.voiceBar.bar !== currentBeat.voiceBar.bar;
    if (isMovingTowardAnchor && isAnchorInAnotherBar) {
      const nearEdgeOffset = (directionOffset * -1) as HorizontalOffset;
      return this.getBarEdgeBeat(currentBeat, directionOffset, nearEdgeOffset);
    }

    const currentEdge = this.getBarEdgeBeat(currentBeat, 0, directionOffset);
    if (currentEdge === undefined) {
      return undefined;
    }
    if (currentBeat !== currentEdge) {
      return currentEdge;
    }

    return this.getBarEdgeBeat(currentBeat, directionOffset, directionOffset);
  }

  /** Moves the cursor by bar, or replaces a range from its active endpoint. */
  public moveSelectionByBar(direction: SelectedMoveDirection): boolean {
    const targetBeat = this.moveByBar(direction);
    if (targetBeat === undefined) {
      return false;
    }

    const noteIndex = this._selectionCursor?.noteIndex ?? 0;
    this.selectBeatCursor(targetBeat, noteIndex);
    return true;
  }

  /** Extends the fixed-anchor range to the next bar edge in either direction. */
  public extendSelectionByBar(direction: SelectedMoveDirection): boolean {
    const targetBeat = this.moveByBar(direction);
    if (targetBeat === undefined) {
      return false;
    }

    this.extendSelectionTo(targetBeat);
    return true;
  }

  /**
   * Selects beats in between the two specified beats (including them)
   * @param beat1UUID UUID of the first beat
   * @param beat2UUID UUID of the last beat
   */
  private selectBeatsInBetween(beat1UUID: number, beat2UUID: number): void {
    const beatsSeq = this._staff.getBeatsSeq(this._activeVoiceNumber);

    let startBeatElementSeqIndex: number = -1;
    let endBeatElementSeqIndex: number = -1;
    for (let i = 0; i < beatsSeq.length; i++) {
      if (beatsSeq[i].uuid === beat1UUID) {
        startBeatElementSeqIndex = i;
      }
      if (beatsSeq[i].uuid === beat2UUID) {
        endBeatElementSeqIndex = i;
      }
    }

    if (startBeatElementSeqIndex === -1 || endBeatElementSeqIndex === -1) {
      throw Error("Could not find start and beat element' ids");
    }

    for (let i = startBeatElementSeqIndex; i <= endBeatElementSeqIndex; i++) {
      if (i >= startBeatElementSeqIndex && i <= endBeatElementSeqIndex) {
        this._selectionBeats.push(beatsSeq[i]);
      }
    }
  }

  /**
   * Selects specified beat and all the beats between it and base selection element
   * @param beat Beat to select
   */
  public selectBeat(beat: Beat): void {
    if (this._selectionCursor) {
      this._selectionCursor = undefined;
    }

    const baseSelectionVoiceBar = this._baseSelectionBeat?.voiceBar;
    const isDifferentSelectionLane =
      baseSelectionVoiceBar !== undefined &&
      (beat.voiceBar.bar.staff !== baseSelectionVoiceBar.bar.staff ||
        beat.voiceBar.voiceNumber !== baseSelectionVoiceBar.voiceNumber);
    if (isDifferentSelectionLane) {
      // Don't extend an anchored range into another staff or voice.
      return;
    }

    if (beat.voiceBar.bar.staff !== this._staff) {
      this._staff = beat.voiceBar.bar.staff;
      this.clearSelection();
    }
    this._activeVoiceNumber = beat.voiceBar.voiceNumber;

    const beatsSeq = this._staff.getBeatsSeq(this._activeVoiceNumber);
    let beatSeqIndex: number = -1;
    let baseBeatSeqIndex: number = -1;
    for (let i = 0; i < beatsSeq.length; i++) {
      if (beatsSeq[i].uuid === beat.uuid) {
        beatSeqIndex = i;
      } else if (
        this._baseSelectionBeat !== undefined &&
        beatsSeq[i].uuid === this._baseSelectionBeat.uuid
      ) {
        baseBeatSeqIndex = i;
      }
    }

    let startBeatUUID: number;
    let endBeatUUID: number;
    if (
      this._baseSelectionBeat === undefined ||
      beatSeqIndex === baseBeatSeqIndex
    ) {
      this._baseSelectionBeat = beat;
      this._selectionAnchorExplicitlySet = false;
      startBeatUUID = beat.uuid;
      endBeatUUID = beat.uuid;
    } else if (beatSeqIndex > baseBeatSeqIndex) {
      startBeatUUID = this._baseSelectionBeat.uuid;
      endBeatUUID = beat.uuid;
    } else {
      startBeatUUID = beat.uuid;
      endBeatUUID = this._baseSelectionBeat.uuid;
    }

    // Clear selection rects
    this._selectionBeats = [];

    // Select all beats in new selection
    this.selectBeatsInBetween(startBeatUUID, endBeatUUID);
    this._selectionEndBeat = beat;
  }

  /** Anchors a one-beat range at the current note or selected beat. */
  public setSelectionAnchor(): boolean {
    const beat = this._selectionCursor?.beat ?? this._selectionBeats[0];
    if (beat === undefined) {
      return false;
    }

    this.selectBeat(beat);
    this._selectionAnchorExplicitlySet = true;
    return true;
  }

  /** Clears a range and restores a note cursor at its anchor beat. */
  public clearRange(): boolean {
    const anchor = this._baseSelectionBeat;
    if (anchor === undefined) {
      return false;
    }

    this.selectBeatCursor(anchor, 0);
    return true;
  }

  /**
   * Clears all selection
   */
  public clearSelection(): void {
    this._baseSelectionBeat = undefined;
    this._selectionEndBeat = undefined;
    this._selectionAnchorExplicitlySet = false;
    this._selectionBeats = [];
  }

  /**
   * Clears selected element
   */
  public clearSelectedNote(): void {
    this._selectionCursor = undefined;
  }

  /**
   * Syncs currently selected note to current runtime structure.
   */
  public syncSelection(): void {
    this._selectionCursor?.syncToStructure();
  }

  /**
   * Copy selected note/beats (depending on which is currently selected)
   */
  public copy(): void {
    const selectionCursor = this._selectionCursor?.note;
    this._clipboard = selectionCursor
      ? selectionCursor.deepCopy()
      : this._selectionBeats.map((beat) => beat.deepCopy());
  }

  /**
   * Checks if note element is the selected element
   * @param noteElement Note element to check
   * @returns True if selected, false otherwise
   */
  public isNoteElementSelected(noteElement: NoteElement): boolean {
    if (this._selectionCursor === undefined) {
      throw Error("No note selected");
    }

    return this._selectionCursor.note?.uuid === noteElement.note?.uuid;
  }

  /** Selected note element */
  public get selectionCursor(): SelectionCursor | undefined {
    return this._selectionCursor;
  }

  /** Current voice number */
  public get activeVoiceNumber(): VoiceNumber {
    return this._activeVoiceNumber;
  }

  public set activeVoiceNumber(voiceNumber: VoiceNumber) {
    this._activeVoiceNumber = voiceNumber;
  }

  /** Selection beats */
  public get selectionBeats(): Beat[] {
    return this._selectionBeats;
  }

  /** Whether a beat range currently has an anchor. */
  public get hasSelectionAnchor(): boolean {
    return this._baseSelectionBeat !== undefined;
  }

  /** Whether the current range was initiated with the anchor control. */
  public get hasExplicitSelectionAnchor(): boolean {
    return this._selectionAnchorExplicitlySet;
  }

  /** Most recent beat used to extend the anchored range. */
  public get selectionEndBeat(): Beat | undefined {
    return this._selectionEndBeat;
  }

  /** Either beats selection array or selected note's beat as a 1 element array */
  public get selectionAsBeats(): Beat[] {
    return this._selectionCursor === undefined
      ? this._selectionBeats
      : [this._selectionCursor.beat];
  }

  /** Copied data */
  public get clipboard(): Note | Beat[] | undefined {
    return this._clipboard;
  }
}
