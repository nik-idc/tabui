import {
  Score,
  Beat,
  NoteDuration,
  GuitarTechniqueType,
  Bar,
  Track,
  ScoreEditor,
  GuitarNote,
  BarRepeatStatus,
  TechniqueType,
  BendTechniqueOptions,
  MasterBar,
  MasterBarData,
} from "@/notation/model";
import { SelectedNotesAndIds, TrackElement } from "../elements";
import { BarElement } from "../elements/bar-element";
import { BeatElement } from "../elements/beat-element";
import { NoteElement } from "../elements/note-element";
import {
  MoveRightResult,
  SelectedNote,
  SelectedMoveDirection,
  MoveRightOutput,
} from "../selection/selected-note";
import { SelectionManager } from "../selection/selection-manager";

/**
 * Class responsible for managing editing & element state
 */
export class TrackControllerEditor {
  /** Undo stack */
  readonly undoStack: Track[];
  /** Redo stackD */
  readonly redoStack: Track[];

  /** Track element */
  private _trackElement: TrackElement;
  /** Selection manager */
  private _selectionManager: SelectionManager;

  /**
   * Class responsible for managing editing & element state
   * @param trackElement Track element
   */
  constructor(trackElement: TrackElement) {
    this._trackElement = trackElement;
    this.undoStack = [];
    this.redoStack = [];

    this._selectionManager = new SelectionManager(this._trackElement.track);
  }

  /**
   * Selectes note using note element
   * @param noteElement
   */
  public selectNoteElement(noteElement: NoteElement): void {
    this._selectionManager.selectNote(noteElement.note);
  }

  /**
   * Selects first note
   */
  public selectFirstNote(): void {
    const note = this._trackElement.track.staves[0].bars[0].beats[0].notes[0];
    this._selectionManager.selectNote(note);
  }

  /**
   * Handles added beat after moving right
   */
  private handleAddedBeat(): void {
    const selectedNote = this._selectionManager.selectedNote;
    if (selectedNote === undefined) {
      throw Error("Handling added beat when selected note undefined");
    }

    ScoreEditor.appendBeat(selectedNote.bar);

    this._trackElement.calc();
  }
  /**
   * Handles added bar after moving right
   */
  private handleAddedBar(): void {
    const selectedNote = this._selectionManager.selectedNote;
    if (selectedNote === undefined) {
      throw Error("Handling added beat when selected note undefined");
    }

    this._trackElement.track.score.appendMasterBar({
      tempo: selectedNote.bar.masterBar.tempo,
      beatsCount: selectedNote.bar.masterBar.beatsCount,
      duration: selectedNote.bar.masterBar.duration,
      repeatStatus: selectedNote.bar.masterBar.repeatStatus,
      repeatCount: selectedNote.bar.masterBar.repeatCount,
    });
    selectedNote.afterAddedBar();

    this._trackElement.calc();
  }

  /**
   *
   * @param moveRightOutput Output of a move right operation
   * @param selectedNote Selected
   */
  private handleMoveRight(moveRightOutput: MoveRightOutput): void {
    switch (moveRightOutput.result) {
      case MoveRightResult.Nothing:
        break;
      case MoveRightResult.AddedBeat:
        this.handleAddedBeat();
        break;
      case MoveRightResult.AddedBar:
        this.handleAddedBar();
        break;
      default:
        throw Error("Unexpected outcome after moving note right");
    }
  }

  /**
   * Moves selected note right
   */
  private moveSelectedNoteRight(): void {
    if (this._selectionManager.selectedNote === undefined) {
      throw Error("Can't move right, selected note is undefined");
    }

    const beforeMoveRight = this._trackElement.track.deepCopy();
    const moveRightOutput = this._selectionManager.moveSelectedNoteRight();

    if (moveRightOutput.result !== MoveRightResult.Nothing) {
      this.undoStack.push(beforeMoveRight);
      this.redoStack.splice(0, this.redoStack.length);
    }

    this.handleMoveRight(moveRightOutput);
  }

  /**
   * Move selected note in specified direction
   * @param direction Move direction
   */
  public moveSelectedNote(direction: SelectedMoveDirection): void {
    switch (direction) {
      case SelectedMoveDirection.Left:
        this._selectionManager.moveSelectedNoteLeft();
        break;
      case SelectedMoveDirection.Right:
        this.moveSelectedNoteRight();
        break;
      case SelectedMoveDirection.Up:
        this._selectionManager.moveSelectedNoteUp();
        break;
      case SelectedMoveDirection.Down:
        this._selectionManager.moveSelectedNoteDown();
        break;
      default:
        break;
    }
  }

  /**
   * Set selected note's fret
   * @param newFret New fret value
   */
  public setSelectedNoteFret(newFret: number): void {
    if (this._selectionManager.selectedNote === undefined) {
      throw Error("Selected note is undefined");
    }
    if (!(this._selectionManager.selectedNote.note instanceof GuitarNote)) {
      throw Error("Can't set fret of a non-guitar note");
    }

    this.undoStack.push(this._trackElement.track.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);

    ScoreEditor.setNoteFret(this._selectionManager.selectedNote.note, newFret);
  }

  /**
   * Set dots
   * @param newDots New dots count
   */
  public setDots(newDots: number): void {
    if (this._selectionManager.selectedNote !== undefined) {
      throw Error("Can't set selection dots, selected note is defined");
    }

    this.undoStack.push(this._trackElement.track.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);

    const selection = this._selectionManager.selectionAsBeats;
    ScoreEditor.setDots(selection, newDots);

    this._trackElement.calc();
  }

  /**
   * Sets selection beat/beats tuplet
   * @param normalCount Normal count
   * @param tupletCount Tuplet count
   */
  public setSelectedBeatsTuplet(
    normalCount: number,
    tupletCount: number
  ): void {
    if (normalCount === tupletCount) {
      return;
    }

    this.undoStack.push(this._trackElement.track.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);

    const selection = this._selectionManager.selectionAsBeats;
    ScoreEditor.setTuplet(selection, normalCount, tupletCount);

    this._trackElement.calc();
  }

  /**
   * Set selected bar's tempo
   * @param newTempo New tempo value
   */
  public setSelectedBarTempo(newTempo: number): void {
    this.undoStack.push(this._trackElement.track.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);

    const selectedNote = this._selectionManager.selectedNote;
    if (selectedNote === undefined) {
      return;
    }

    if (selectedNote.bar.masterBar.tempo === newTempo) {
      return;
    }

    selectedNote.bar.masterBar.tempo = newTempo;
    this._trackElement.calc();
  }

  /**
   * Set selected bar's time signature
   * @param beatsCount Beats count
   * @param duration Duration
   */
  public setSelectedBarTimeSignature(
    beatsCount?: number,
    duration?: NoteDuration
  ): void {
    if (beatsCount === undefined && duration === undefined) {
      throw Error("Set bar time signature with both values undefined");
    }

    this.undoStack.push(this._trackElement.track.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);

    const selectedNote = this._selectionManager.selectedNote;
    if (selectedNote === undefined) {
      return;
    }

    if (beatsCount !== undefined) {
      selectedNote.bar.masterBar.beatsCount = beatsCount;
    }
    if (duration !== undefined) {
      selectedNote.bar.masterBar.duration = duration;
    }

    this._trackElement.calc();
  }

  /**
   * Set selected bar repeat status
   * @param status New status
   */
  public setSelectedBarRepeatStatus(status: BarRepeatStatus): void {
    this.undoStack.push(this._trackElement.track.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);

    const selectedNote = this._selectionManager.selectedNote;
    if (selectedNote === undefined) {
      throw Error(
        "Set selected bar repeat status called when selected note undefined"
      );
    }
    selectedNote.bar.masterBar.repeatStatus = status;

    this._trackElement.calc();
  }

  /**
   * Sets selected beat duration
   * @param newDuration New duration
   */
  public setSelectedBeatDuration(newDuration: NoteDuration): void {
    this.undoStack.push(this._trackElement.track.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);

    const selectedNote = this._selectionManager.selectedNote;
    if (selectedNote === undefined) {
      return;
    }

    selectedNote.beat.baseDuration = newDuration;

    this._trackElement.calc();
  }

  /**
   * Sets technique
   * @param type Type of technique
   * @param bendOptions Potenital bend gutiar technique options
   */
  public setTechnique(
    type: TechniqueType,
    bendOptions?: BendTechniqueOptions
  ): void {
    const before = this._trackElement.track.deepCopy();

    const selectionNotes = this._selectionManager.selectionAsBeats.flatMap(
      (b) => b.notes
    );
    const changesMade = ScoreEditor.setTechniqueNotes(
      selectionNotes,
      type,
      bendOptions
    );

    if (changesMade) {
      this.undoStack.push(before);
      this.redoStack.splice(0, this.redoStack.length);
      this._trackElement.calc();
    }
  }

  /**
   * Checks if note element is the selected element
   * @param noteElement Note element to check
   * @returns True if selected, false otherwise
   */
  public isNoteElementSelected(noteElement: NoteElement): boolean {
    return this._selectionManager.isNoteElementSelected(noteElement);
  }

  /**
   * Clears selection
   */
  public clearSelection(): void {
    this._selectionManager.clearSelection();
    this._trackElement.resetSelection();
  }

  /**
   * Clears selected element
   */
  public clearSelectedNote(): void {
    this._selectionManager.clearSelectedNote();
  }

  /**
   * Selects beat
   * @param beatElement Beat element
   */
  public selectBeat(beatElement: BeatElement): void {
    this._selectionManager.selectBeat(beatElement.beat);

    this._trackElement.recalcBeatElementSelection(
      this._selectionManager.selectionBeats
    );
  }

  /**
   * Sets selection duration
   * @param newDuration New duration
   */
  public setDuration(newDuration: NoteDuration): void {
    this.undoStack.push(this._trackElement.track.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);

    const selection = this._selectionManager.selectionAsBeats;
    for (const beat of selection) {
      ScoreEditor.setDuration(beat, newDuration);
    }

    this._trackElement.calc();
  }

  /**
   * Copy selected data
   */
  public copy(): void {
    this._selectionManager.copy();
  }

  /**
   * Paste copied data:
   * Paste beats after selected note if selected beats OR
   * Paste note, i.e., set fret value of selected note to that of selected
   * @returns
   */
  public paste(): void {
    this.undoStack.push(this._trackElement.track.deepCopy());
    this.redoStack.splice(0, this.redoStack.length);

    const clipboard = this._selectionManager.clipboard;
    const selectedNote = this._selectionManager.selectedNote;
    const selectionBeats = this._selectionManager.selectionBeats;
    if (clipboard instanceof Array) {
      // Return if nothing to paste
      if (clipboard.length === 0) {
        return;
      }

      if (selectedNote !== undefined) {
        // Insert if currently not selecting
        ScoreEditor.insertBeats(
          selectedNote.bar,
          selectedNote.beatIndex,
          clipboard
        );
      } else {
        ScoreEditor.replaceBeats(selectionBeats, clipboard);
        this.clearSelection();
      }
    } else if (clipboard !== undefined) {
      if (selectedNote === undefined) {
        throw Error(
          "Attempting to paste a note value but selected element is undefined"
        );
      }

      selectedNote.note.noteValue = clipboard.noteValue;
      selectedNote.note.octave = clipboard.octave;
    }

    this._trackElement.calc();
  }

  /**
   * Delete selected beats
   */
  public deleteSelectedBeats(): void {
    ScoreEditor.removeBeats(this._selectionManager.selectionBeats);
    this.clearSelection();

    this._trackElement.calc();
  }

  /**
   * Appends a bar to the track and all the score tracks
   * @param bar Bar to append
   */
  public appendBar(masterBarData?: MasterBarData): void {
    this._trackElement.track.score.appendMasterBar(masterBarData);

    this._trackElement.calc();
  }

  /**
   * Prepends a bar to the track and all the score tracks
   * @param bar Bar to prepend
   */
  public prependBar(masterBarData?: MasterBarData): void {
    this._trackElement.track.score.prependMasterBar(masterBarData);

    this._trackElement.calc();
  }

  /**
   * Inserts a bar to the track at specified index and all the score tracks
   * @param bar Bar to insert
   */
  public insertBar(barIndex: number, masterBarData?: MasterBarData): void {
    if (
      barIndex < 0 ||
      barIndex > this._trackElement.track.score.masterBars.length
    ) {
      throw Error(`Invalid bar index: '${barIndex}'`);
    }

    this._trackElement.track.score.insertMasterBar(barIndex, masterBarData);

    this._trackElement.calc();
  }

  /**
   * Removes bar from the score
   * @param barIndex Index of the bar to remove
   */
  public removeBar(barIndex: number): void {
    if (
      barIndex < 0 ||
      barIndex > this._trackElement.track.score.masterBars.length
    ) {
      throw Error(`Invalid bar index: '${barIndex}'`);
    }

    this._trackElement.track.score.removeMasterBar(barIndex);

    this._trackElement.calc();
  }

  /**
   * Insert beat
   * @param barElement Bar element
   * @param prevBeatElement Previous beat element
   * @returns
   */
  public insertBeat(
    barElement: BarElement,
    prevBeatElement: BeatElement
  ): void {
    const index = barElement.beatElements.indexOf(prevBeatElement);
    if (index < 0 || index >= barElement.beatElements.length) {
      return;
    }

    ScoreEditor.insertBeat(barElement.bar, index);

    this._trackElement.calc();
  }

  // /**
  //  * Undo (reestablish previous state)
  //  */
  // public undo(): void {
  //   const prevTrack = this.undoStack.pop();
  //   if (prevTrack === undefined) {
  //     return;
  //   }

  //   IMPLEMENT USING COMMAND PATTERN
  //   IMPLEMENT USING COMMAND PATTERN
  //   IMPLEMENT USING COMMAND PATTERN
  //   IMPLEMENT USING COMMAND PATTERN
  //   IMPLEMENT USING COMMAND PATTERN

  //   this.redoStack.push(this._trackElement.track.deepCopy());
  //   this._trackElement = new TrackElement(prevTrack)
  //   this._selectionManager = new SelectionManager(this._trackElement.track);
  // }

  // public redo(): void {
  //   const nextTrack = this.redoStack.pop();
  //   if (nextTrack === undefined) {
  //     return;
  //   }

  //   IMPLEMENT USING COMMAND PATTERN
  //   IMPLEMENT USING COMMAND PATTERN
  //   IMPLEMENT USING COMMAND PATTERN
  //   IMPLEMENT USING COMMAND PATTERN
  //   IMPLEMENT USING COMMAND PATTERN

  //   this.undoStack.push(this._trackElement.track.deepCopy());
  //   this._trackElement.track = nextTrack;

  //   this._selectionManager = new SelectionManager(this._trackElement.track);
  //   this._trackElement.resetTrack(this._trackElement.track);
  // }

  public get selectionManager(): SelectionManager {
    return this._selectionManager;
  }
}

// // =========================================
// // ==== TOO AFRAID TO COMPLETELY DELETE ====

//   /**
//    * Applies
//    * @param type
//    * @param techniqueOptions
//    * @returns
//    */
//   public applyTechniqueSingle(
//     type: GuitarTechniqueType,
//     techniqueOptions?: GuitarTechniqueOptions
//   ): boolean {
//     const elsAndIds = this.getSelectedNoteElementsAndIds();

//     const beforeApply = this._trackElement.track.deepCopy();
//     const result = elsAndIds.trackLineElement.applyTechniqueSingle(
//       elsAndIds.barElementId,
//       elsAndIds.beatElementId,
//       elsAndIds.stringNum,
//       type,
//       techniqueOptions
//     );

//     if (!result) {
//       return false;
//     }

//     if (result) {
//       this.undoStack.push(beforeApply);
//       this.redoStack.splice(0, this.redoStack.length);
//     }

//     this._trackElement.calc();

//     if (
//       elsAndIds.trackLineElementId !==
//       this._trackElement.trackLineElements.length - 1
//     ) {
//       elsAndIds.trackLineElement.justifyElements();
//     }

//     return true;
//   }

//   public removeTechniqueSingle(
//     type: GuitarTechniqueType,
//     techniqueOptions?: GuitarTechniqueOptions
//   ): void {
//     const elsAndIds = this.getSelectedNoteElementsAndIds();
//     if (elsAndIds.noteElement === undefined) {
//       return;
//     }

//     const techniqueIndex =
//       elsAndIds.noteElement.guitarTechniqueElements.findIndex((gfe) => {
//         return (
//           gfe.technique.type === type &&
//           gfe.technique.bendOptions === techniqueOptions
//         );
//       });

//     if (techniqueIndex === -1) {
//       return;
//     }

//     this.undoStack.push(this._trackElement.track.deepCopy());
//     this.redoStack.splice(0, this.redoStack.length);

//     elsAndIds.trackLineElement.removeTechniqueSingle(
//       elsAndIds.barElementId,
//       elsAndIds.beatElementId,
//       elsAndIds.stringNum,
//       techniqueIndex
//     );

//     this._trackElement.calc();

//     if (
//       elsAndIds.trackLineElementId !==
//       this._trackElement.trackLineElements.length - 1
//     ) {
//       elsAndIds.trackLineElement.justifyElements();
//     }
//   }

//   private setTechniqueSingle(
//     type: GuitarTechniqueType,
//     techniqueOptions?: GuitarTechniqueOptions
//   ): boolean {
//     const selectedNote = this._selectionManager.selectedNote;
//     if (selectedNote === undefined) {
//       throw Error("Set technique single called but selected element undefined");
//     }

//     const applyRes = this._trackElement.track.setTechniqueNote(
//       selectedNote.barId,
//       selectedNote.beatId,
//       selectedNote.stringNum,
//       type,
//       techniqueOptions
//     );

//     this._trackElement.calc();

//     return applyRes;
//   }

//   private setTechniqueMultiple(
//     type: GuitarTechniqueType,
//     techniqueOptions?: GuitarTechniqueOptions
//   ): boolean {
//     if (this._selectionManager.selectedNote !== undefined) {
//       throw new Error(
//         "Can't set technique for multiple notes, selected element defined"
//       );
//     }

//     this.undoStack.push(this._trackElement.track.deepCopy());
//     this.redoStack.splice(0, this.redoStack.length);

//     const applyRes = this._trackElement.track.setTechniqueBeats(
//       this._selectionManager.selectionBeats,
//       type,
//       techniqueOptions
//     );

//     this._trackElement.calc();

//     return applyRes;
//   }

//   // ==== TOO AFRAID TO COMPLETELY DELETE ====
//   // =========================================
