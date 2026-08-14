import { Staff, Beat, Note, Track, VoiceNumber } from "../../model";
import { BeatElement } from "../element/beat/beat-element";
import { NoteElement } from "../element/note/note-element";
import { SelectedNote, MoveRightOutput } from "./selected-note";

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
  private _selectedNote?: SelectedNote;
  /** Base beat of the selection */
  private _baseSelectionBeat?: Beat;
  /** Most recent beat used to extend the anchored range. */
  private _selectionEndBeat?: Beat;
  /** Whether the current range was initiated with the anchor control. */
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

  /**
   * Selects note & clears beat selection
   * @param note Note to select
   */
  public selectNote(note: Note): void {
    this._staff = note.beat.voiceBar.bar.staff;
    this._activeVoiceNumber = note.beat.voiceBar.voiceNumber;
    const noteIndex = note.beat.notes?.indexOf(note) ?? 0;

    this.clearSelection();
    this._selectedNote = new SelectedNote(note.beat, noteIndex);
  }

  public selectBeatCursor(beat: Beat, noteIndex: number): void {
    this._staff = beat.voiceBar.bar.staff;
    this._activeVoiceNumber = beat.voiceBar.voiceNumber;

    this.clearSelection();
    this._selectedNote = new SelectedNote(beat, noteIndex);
  }

  /**
   * Move selected note up
   */
  public moveSelectedNoteUp(): void {
    if (this.selectedNote === undefined) {
      throw Error("No note selected");
    }

    this.clearSelection();
    this.selectedNote.moveUp();
  }

  /**
   * Move selected note down
   */
  public moveSelectedNoteDown(): void {
    if (this.selectedNote === undefined) {
      throw Error("No note selected");
    }

    this.clearSelection();
    this.selectedNote.moveDown();
  }

  /**
   * Move selected note left
   */
  public moveSelectedNoteLeft(editingEnabled: boolean = true): void {
    if (this._selectedNote === undefined) {
      throw Error("No note selected");
    }

    if (this._selectionBeats.length !== 0) {
      // Select left most element of selection
      const leftMostBeat = this._selectionBeats[0];
      const leftMostNote =
        leftMostBeat.notes?.[
          this.selectedNote ? this.selectedNote.noteIndex : 0
        ];

      if (leftMostNote !== undefined) {
        this.selectNote(leftMostNote);
      }
    }

    if (this._selectionBeats.length === 0 && this.selectedNote === undefined) {
      throw Error("No note selected");
    }

    this._selectedNote.moveLeft(editingEnabled);
    this._activeVoiceNumber = this._selectedNote.voiceNumber;
  }

  /**
   * Move selected note right
   */
  public moveSelectedNoteRight(
    editingEnabled: boolean = true
  ): MoveRightOutput {
    if (this._selectedNote === undefined) {
      throw Error("No note selected");
    }

    if (this._selectionBeats.length !== 0) {
      // Select right most element of selection
      const rightMostBeat =
        this._selectionBeats[this._selectionBeats.length - 1];
      const rightMostNote =
        rightMostBeat.notes?.[
          this.selectedNote ? this.selectedNote.noteIndex : 0
        ];

      if (rightMostNote !== undefined) {
        this.selectNote(rightMostNote);
      }
    }

    if (this._selectionBeats.length === 0 && this.selectedNote === undefined) {
      throw Error("No note selected");
    }

    const output = this._selectedNote.moveRight(editingEnabled);
    this._activeVoiceNumber = this._selectedNote.voiceNumber;
    return output;
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
    if (this._selectedNote) {
      this._selectedNote = undefined;
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
    const beat = this._selectedNote?.beat ?? this._selectionBeats[0];
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
    this._selectedNote = undefined;
  }

  /**
   * Syncs currently selected note to current runtime structure.
   */
  public syncSelection(): void {
    this._selectedNote?.syncToStructure();
  }

  /**
   * Copy selected note/beats (depending on which is currently selected)
   */
  public copy(): void {
    const selectedNote = this._selectedNote?.note;
    this._clipboard = selectedNote
      ? selectedNote.deepCopy()
      : this._selectionBeats.map((beat) => beat.deepCopy());
  }

  /**
   * Checks if note element is the selected element
   * @param noteElement Note element to check
   * @returns True if selected, false otherwise
   */
  public isNoteElementSelected(noteElement: NoteElement): boolean {
    if (this._selectedNote === undefined) {
      throw Error("No note selected");
    }

    return this._selectedNote.note?.uuid === noteElement.note?.uuid;
  }

  /** Selected note element */
  public get selectedNote(): SelectedNote | undefined {
    return this._selectedNote;
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
    return this._selectedNote === undefined
      ? this._selectionBeats
      : [this._selectedNote.beat];
  }

  /** Copied data */
  public get clipboard(): Note | Beat[] | undefined {
    return this._clipboard;
  }
}
