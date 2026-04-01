import { Staff, Beat, Note, Track } from "@/notation/model";
import { BeatElement } from "@/notation/controller/element/beat/beat-element";
import { NoteElement } from "@/notation/controller/element/note/note-element";
import { SelectedNote, MoveRightOutput } from "./selected-note";

/**
 * Class that manages selection state
 */
export class SelectionManager {
  /** Track */
  readonly track: Track;

  /** Current staff */
  private _staff: Staff;
  /** Selected note element */
  private _selectedNote?: SelectedNote;
  /** Base beat of the selection */
  private _baseSelectionBeat?: Beat;
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
    this._selectionBeats = [];
    this._clipboard = [];
  }

  /**
   * Selects note & clears beat selection
   * @param note Note to select
   */
  public selectNote(note: Note): void {
    this._staff = note.beat.bar.staff;

    this.clearSelection();
    this._selectedNote = new SelectedNote(note);
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
  public moveSelectedNoteLeft(): void {
    if (this._selectedNote === undefined) {
      throw Error("No note selected");
    }

    if (this._selectionBeats.length !== 0) {
      // Select left most element of selection
      const leftMostNote =
        this._selectionBeats[0].notes[
          this.selectedNote ? this.selectedNote.noteIndex : 0
        ];

      this.selectNote(leftMostNote);
    }

    if (this._selectionBeats.length === 0 && this.selectedNote === undefined) {
      throw Error("No note selected");
    }

    this._selectedNote.moveLeft();
  }

  /**
   * Move selected note right
   */
  public moveSelectedNoteRight(): MoveRightOutput {
    if (this._selectedNote === undefined) {
      throw Error("No note selected");
    }

    if (this._selectionBeats.length !== 0) {
      // Select right most element of selection
      const rightMostNote =
        this._selectionBeats[this._selectionBeats.length - 1].notes[
          this.selectedNote ? this.selectedNote.noteIndex : 0
        ];

      this.selectNote(rightMostNote);
    }

    if (this._selectionBeats.length === 0 && this.selectedNote === undefined) {
      throw Error("No note selected");
    }

    return this._selectedNote.moveRight();
  }

  /**
   * Selects beats in between the two specified beats (including them)
   * @param beat1UUID UUID of the first beat
   * @param beat2UUID UUID of the last beat
   */
  private selectBeatsInBetween(beat1UUID: number, beat2UUID: number): void {
    const beatsSeq = this._staff.getBeatsSeq();

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

    if (
      this._baseSelectionBeat !== undefined &&
      beat.bar.staff !== this._baseSelectionBeat.bar.staff
    ) {
      // Don't add beats from a different staff to selection
      return;
    }

    if (beat.bar.staff !== this._staff) {
      this._staff = beat.bar.staff;
      this.clearSelection();
    }

    const beatsSeq = this._staff.getBeatsSeq();
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
  }

  /**
   * Clears all selection
   */
  public clearSelection(): void {
    this._baseSelectionBeat = undefined;
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
    this._clipboard =
      this._selectedNote !== undefined
        ? this._selectedNote.note.deepCopy()
        : this._selectionBeats;
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

    return this._selectedNote.note.uuid === noteElement.note.uuid;
  }

  /** Selected note element */
  public get selectedNote(): SelectedNote | undefined {
    return this._selectedNote;
  }

  /** Selection beats */
  public get selectionBeats(): Beat[] {
    return this._selectionBeats;
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
