import { Beat } from "../../models/beat";
import { GuitarNote } from "../../models/guitar-note";
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
  private _baseSelectionElementUUID?: number;
  private _selectionElementsUUIDs: number[];
  /**
   * Copied data
   */
  private _copiedData: SelectedElement | number[];
  constructor(tab: Tab) {
    this.tab = tab;
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
    if (this.selectionElementsUUIDs.length !== 0) {
      // Select left most element of selection
      const leftMostElementUUID = this.selectedElement[0];
      let leftMostNote: GuitarNote;
      this.tab.bars.findIndex((bar) => {
        return bar.beats.some((beat) => {
          leftMostNote =
            beat.notes[
              this.selectedElement ? this.selectedElement.stringNum : 1
            ];
          return beat.uuid === leftMostElementUUID;
        });
      });

      this.selectNote(leftMostNote);
    }

    if (
      this.selectionElementsUUIDs.length === 0 &&
      this.selectedElement === undefined
    ) {
      throw Error("No note selected");
    }

    this.selectedElement.moveLeft();
  }

  /**
   * Move selected note right
   */
  public moveSelectedNoteRight(): MoveRightOutput {
    if (this.selectionElementsUUIDs.length !== 0) {
      // Select right most element of selection
      const rightMostElement =
        this.selectionElementsUUIDs[this.selectionElementsUUIDs.length - 1];
      let rightMostNote: GuitarNote;
      this.tab.bars.findIndex((bar) => {
        return bar.beats.some((beat) => {
          rightMostNote =
            beat.notes[
              this.selectedElement ? this.selectedElement.stringNum : 1
            ];
          return beat.uuid === rightMostElement;
        });
      });

      this.selectNote(rightMostNote);
    }

    if (
      this.selectionElementsUUIDs.length === 0 &&
      this.selectedElement === undefined
    ) {
      throw Error("No note selected");
    }

    return this.selectedElement.moveRight();
  }

  /**
   * Selects beats in between the two specified beats (including them)
   * @param beat1UUID UUID of the first beat
   * @param beat2UUID UUID of the last beat
   */
  private selectBeatsInBetween(beat1UUID: number, beat2UUID: number): void {
    const beatsSeq = this.tab.getBeatsSeq();

    const startBeatElementSeqId = beatsSeq.findIndex((beat) => {
      return beat.uuid === beat1UUID;
    });
    const endBeatElementSeqId = beatsSeq.findIndex((beat) => {
      return beat.uuid === beat2UUID;
    });

    for (let i = startBeatElementSeqId; i <= endBeatElementSeqId; i++) {
      if (i >= startBeatElementSeqId && i <= endBeatElementSeqId) {
        this._selectionElementsUUIDs.push(beatsSeq[i].uuid);
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
    const beatSeqId = beatsSeq.indexOf(beat);
    const baseBeatSeqId = beatsSeq.findIndex((beat) => {
      return beat.uuid === this._baseSelectionElementUUID;
    });

    let startBeatUUID: number;
    let endBeatUUID: number;
    if (baseBeatSeqId === -1 || beatSeqId === baseBeatSeqId) {
      this._baseSelectionElementUUID = beat.uuid;
      startBeatUUID = beat.uuid;
      endBeatUUID = beat.uuid;
    } else if (beatSeqId > baseBeatSeqId) {
      startBeatUUID = this._baseSelectionElementUUID;
      endBeatUUID = beat.uuid;
    } else {
      startBeatUUID = beat.uuid;
      endBeatUUID = this._baseSelectionElementUUID;
    }

    // Clear selection rects
    this._selectionElementsUUIDs = [];

    // Select all beats in new selection
    this.selectBeatsInBetween(startBeatUUID, endBeatUUID);
  }

  /**
   * Clears all selection
   */
  public clearSelection(): void {
    this._baseSelectionElementUUID = undefined;
    this._selectionElementsUUIDs = [];
  }

  /**
   * Copy selected note/beats (depending on which is currently selected)
   */
  public copy(): void {
    this._copiedData = this._selectedElement
      ? new SelectedElement(this.tab, this._selectedElement.note.uuid)
      : this._selectionElementsUUIDs;
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

      if (this._selectionElementsUUIDs.length === 0) {
        // Insert if currently not selecting
        const copiedBeats = this.beatsFromUUIDs(this._copiedData);
        this._selectedElement.bar.insertBeats(
          this._selectedElement.beatId,
          copiedBeats
        );
      } else {
        const selectedBeats = this.beatsFromUUIDs(this._copiedData);
        const oldBeats = this.beatsFromUUIDs(this._selectionElementsUUIDs);
        this.tab.replaceBeats(oldBeats, selectedBeats);
        this.clearSelection();
      }
    } else {
      this._selectedElement.note.fret = this._copiedData.note.fret;
    }
  }

  public deleteSelected(): void {
    this.tab.removeBeats(this.beatsFromUUIDs(this._selectionElementsUUIDs));
    this.clearSelection();
  }

  /**
   * Gets beats from selection (as a get function because this is a .map wrapper)
   * @returns Selected beats ('Beat' class)
   */
  public getSelectionBeats(): Beat[] {
    return this.beatsFromUUIDs(this._selectionElementsUUIDs);
  }

  /**
   * Checks if note element is the selected element
   * @param noteElement Note element to check
   * @returns True if selected, false otherwise
   */
  public isNoteElementSelected(noteElement: NoteElement): boolean {
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
  public get selectionElementsUUIDs(): number[] {
    return this._selectionElementsUUIDs;
  }
}
