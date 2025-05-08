import { Beat } from "../../models/beat";
import { GuitarNote } from "../../models/guitar-note";
import { NoteDuration } from "../../models/note-duration";
import { Tab } from "../../models/tab";
import { NoteElement } from "../elements/note-element";
import {
  isSelectedElement,
  MoveRightOutput,
  MoveRightResult,
  SelectedElement,
} from "../elements/selected-element";
import { SelectionElement } from "../elements/selection-element";

export class SelectionManager {
  readonly tab: Tab;
  /**
   * Selected note element
   */
  private _selectedElement: SelectedElement | undefined;
  private _baseSelectionBeat?: Beat;
  /**
   * Selection beats
   */
  private _selectionBeats: Beat[];
  /**
   * Copied data
   */
  private _copiedData: SelectedElement | Beat[];
  constructor(tab: Tab) {
    this.tab = tab;
    this._selectionBeats = [];
    this._copiedData = [];
  }

  /**
   * Select new note element
   * @param tabLineElementId Id of the bar elements line containing the beat element
   * @param barElementId Id of the bar element containing the beat element
   * @param beatElementId Id of the beat element containing the note element
   * @param noteElementId Id of the note element
   */

  public selectNote(note: GuitarNote): void {
    this.clearSelection();

    this._selectedElement = new SelectedElement(this.tab, note.uuid);
  }

  /**
   * Move selected note up
   */
  public moveSelectedNoteUp(): void {
    if (this.selectedElement === undefined) {
      throw Error("No note selected");
    }

    this.clearSelection();
    this.selectedElement.moveUp();
  }

  /**
   * Move selected note down
   */
  public moveSelectedNoteDown(): void {
    if (this.selectedElement === undefined) {
      throw Error("No note selected");
    }

    this.clearSelection();

    this.selectedElement.moveDown();
  }

  /**
   * Move selected note left
   */
  public moveSelectedNoteLeft(): void {
    if (this._selectedElement === undefined) {
      throw Error("No note selected");
    }

    if (this._selectionBeats.length !== 0) {
      // Select left most element of selection
      const leftMostNote =
        this._selectionBeats[0].notes[
          this.selectedElement ? this.selectedElement.stringNum : 1
        ];

      this.selectNote(leftMostNote);
    }

    if (
      this._selectionBeats.length === 0 &&
      this.selectedElement === undefined
    ) {
      throw Error("No note selected");
    }

    this._selectedElement.moveLeft();
  }

  /**
   * Move selected note right
   */
  public moveSelectedNoteRight(): MoveRightOutput {
    if (this._selectedElement === undefined) {
      throw Error("No note selected");
    }

    if (this._selectionBeats.length !== 0) {
      // Select right most element of selection
      const rightMostNote =
        this._selectionBeats[this._selectionBeats.length - 1].notes[
          this.selectedElement ? this.selectedElement.stringNum : 1
        ];

      this.selectNote(rightMostNote);
    }

    if (
      this._selectionBeats.length === 0 &&
      this.selectedElement === undefined
    ) {
      throw Error("No note selected");
    }

    return this._selectedElement.moveRight();
  }

  /**
   * Selects beats in between the two specified beats (including them)
   * @param beat1UUID UUID of the first beat
   * @param beat2UUID UUID of the last beat
   */
  private selectBeatsInBetween(beat1UUID: number, beat2UUID: number): void {
    const beatsSeq = this.tab.getBeatsSeq();

    let startBeatElementSeqId: number = -1;
    let endBeatElementSeqId: number = -1;
    for (let i = 0; i < beatsSeq.length; i++) {
      if (beatsSeq[i].uuid === beat1UUID) {
        startBeatElementSeqId = i;
      }
      if (beatsSeq[i].uuid === beat2UUID) {
        endBeatElementSeqId = i;
      }
    }

    if (startBeatElementSeqId === -1 || endBeatElementSeqId === -1) {
      throw Error("Could not find start and beat elements' ids");
    }

    for (let i = startBeatElementSeqId; i <= endBeatElementSeqId; i++) {
      if (i >= startBeatElementSeqId && i <= endBeatElementSeqId) {
        this._selectionBeats.push(beatsSeq[i]);
      }
    }
  }

  /**
   * Selects specified beat and all the beats between it and base selection element
   * @param beat Beat to select
   */
  public selectBeat(beat: Beat): void {
    if (this._selectedElement) {
      this._selectedElement = undefined;
    }

    const beatsSeq = this.tab.getBeatsSeq();
    let beatSeqId: number = -1;
    let baseBeatSeqId: number = -1;
    for (let i = 0; i < beatsSeq.length; i++) {
      if (beatsSeq[i].uuid === beat.uuid) {
        beatSeqId = i;
      } else if (
        this._baseSelectionBeat !== undefined &&
        beatsSeq[i].uuid === this._baseSelectionBeat.uuid
      ) {
        baseBeatSeqId = i;
      }
    }

    let startBeatUUID: number;
    let endBeatUUID: number;
    if (this._baseSelectionBeat === undefined || beatSeqId === baseBeatSeqId) {
      this._baseSelectionBeat = beat;
      startBeatUUID = beat.uuid;
      endBeatUUID = beat.uuid;
    } else if (beatSeqId > baseBeatSeqId) {
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
   * Changes duration of all selected beats
   * @param newDuration New duration to set
   */
  public changeSelectionDuration(newDuration: NoteDuration): void {
    for (const beat of this._selectionBeats) {
      beat.duration = newDuration;
    }
  }

  /**
   * Copy selected note/beats (depending on which is currently selected)
   */
  public copy(): void {
    this._copiedData = this._selectedElement
      ? new SelectedElement(this.tab, this._selectedElement.note.uuid)
      : this._selectionBeats;
  }

  /**
   * Builds an array of beats from the specified beat UUIDs
   * @param uuids UUIDs
   * @returns Array of beats from the specified beat UUIDs
   */
  private beatsFromUUIDs(uuids: number[]): Beat[] {
    return this.tab.getBeatsSeq().reduce((prev, cur) => {
      if (uuids.includes(cur.uuid)) {
        prev.push(cur);
      }
      return prev;
    }, new Array<Beat>());
  }

  /**
   * Paste copied data:
   * Paste beats after selected note if selected beats OR
   * Paste note, i.e., change fret value of selected note to that of selected
   * @returns
   */
  public paste(): void {
    if (!isSelectedElement(this._copiedData)) {
      // Return if nothing to paste
      if (this._copiedData.length === 0) {
        return;
      }

      if (this._selectedElement !== undefined) {
        // Insert if currently not selecting
        this._selectedElement.bar.insertBeats(
          this._selectedElement.beatId,
          this._copiedData
        );
      } else {
        this.tab.replaceBeats(this._selectionBeats, this._copiedData);
        this.clearSelection();
      }
    } else {
      if (this._selectedElement === undefined) {
        throw Error(
          "Attempting to paste a note value but selected element is undefined"
        );
      }

      this._selectedElement.note.fret = this._copiedData.note.fret;
    }
  }

  public deleteSelected(): void {
    this.tab.removeBeats(this._selectionBeats);
    this.clearSelection();
  }

  /**
   * Checks if note element is the selected element
   * @param noteElement Note element to check
   * @returns True if selected, false otherwise
   */
  public isNoteElementSelected(noteElement: NoteElement): boolean {
    if (this._selectedElement === undefined) {
      throw Error("No note selected");
    }

    return this._selectedElement.note.uuid === noteElement.note.uuid;
  }

  /**
   * Selected note element
   */
  public get selectedElement(): SelectedElement | undefined {
    return this._selectedElement;
  }

  /**
   *
   */
  public get selectionBeats(): Beat[] {
    return this._selectionBeats;
  }
}
