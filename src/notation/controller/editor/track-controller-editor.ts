import {
  NoteDuration,
  GuitarNote,
  BarRepeatStatus,
  TechniqueType,
  BendTechniqueOptions,
  MasterBarData,
  TupletSettings,
  DEFAULT_MASTER_BAR,
} from "@/notation/model";
import { TrackElement } from "../element";
import { BeatElement } from "../element/beat-element";
import { NoteElement } from "../element/note-element";
import {
  MoveRightResult,
  SelectedMoveDirection,
  MoveRightOutput,
} from "../selection/selected-note";
import { SelectionManager } from "../selection/selection-manager";
import {
  CommandManager,
  AppendBeatCommand,
  AppendBarCommand,
  SetFretCommand,
  SetDotsCommand,
  SetDurationCommand,
  SetTupletCommand,
  SetTempoCommand,
  SetTimeSigCommand,
  SetRepeatStatusCommand,
  SetTechniqueCommand,
  InsertBeatsCommand,
  ReplaceBeatsCommand,
  SetNoteCommand,
  RemoveBeatsCommand,
  PrependBarCommand,
  InsertBarCommand,
  RemoveBarCommand,
} from "./command";

/**
 * Class responsible for managing editing & element state
 */
export class TrackControllerEditor {
  /** Command manager */
  readonly commandManager: CommandManager;

  /** Track element */
  private _trackElement: TrackElement;
  /** Selection manager */
  private _selectionManager: SelectionManager;

  /**
   * Class responsible for managing editing & element state
   * @param trackElement Track element
   */
  constructor(trackElement: TrackElement) {
    this.commandManager = new CommandManager();

    this._trackElement = trackElement;
    this._selectionManager = new SelectionManager(this._trackElement);
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
    const firstNoteElement =
      this._trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].barElements[0].beatElements[0].noteElements[0];
    this.selectNoteElement(firstNoteElement);
  }

  /**
   * Handles added beat after moving right
   */
  private handleAddedBeat(): void {
    const selectedNote = this._selectionManager.selectedNote;
    if (selectedNote === undefined) {
      throw Error("Handling added beat when selected note undefined");
    }

    this.commandManager.execute(new AppendBeatCommand(selectedNote.bar));

    this._trackElement.update();
  }

  /**
   * Handles added bar after moving right
   */
  private handleAddedBar(): void {
    const selectedNote = this._selectionManager.selectedNote;
    if (selectedNote === undefined) {
      throw Error("Handling added beat when selected note undefined");
    }

    this.commandManager.execute(
      new AppendBarCommand(
        selectedNote.bar.staff.track.score,
        selectedNote.bar.masterBar.barData
      )
    );
    selectedNote.afterAddedBar();

    this._trackElement.update();
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

    this.handleMoveRight(this._selectionManager.moveSelectedNoteRight());
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
  public setSelectedNoteFret(newFret: number | null): void {
    const selectedNote = this._selectionManager.selectedNote;
    if (selectedNote === undefined) {
      throw Error("Selected note is undefined");
    }
    if (!(selectedNote.note instanceof GuitarNote)) {
      throw Error("Can't set fret of a non-guitar note");
    }

    this.commandManager.execute(new SetFretCommand(selectedNote.note, newFret));
  }

  /**
   * Set dots
   * @param newDots New dots count
   */
  public setDots(newDots: number): void {
    const selection = this._selectionManager.selectionAsBeats;
    if (selection.length === 0) {
      throw Error("Selection length = 0");
    }
    this.commandManager.execute(new SetDotsCommand(selection, newDots));

    this._trackElement.update();
  }

  /**
   * Sets selection duration
   * @param newDuration New duration
   */
  public setDuration(newDuration: NoteDuration): void {
    const selection = this._selectionManager.selectionAsBeats;
    if (selection.length === 0) {
      throw Error("Selection length = 0");
    }

    this.commandManager.execute(new SetDurationCommand(selection, newDuration));

    this._trackElement.update();
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
    const selection = this._selectionManager.selectionAsBeats;
    if (selection.length === 0) {
      throw Error("Selection length = 0");
    }

    const settings: TupletSettings = { normalCount, tupletCount };
    this.commandManager.execute(new SetTupletCommand(selection, settings));

    this._trackElement.update();
  }

  /**
   * Set selected bar's tempo
   * @param newTempo New tempo value
   */
  public setSelectedBarTempo(newTempo: number): void {
    const selectedNote = this._selectionManager.selectedNote;
    if (selectedNote === undefined) {
      return;
    }

    if (selectedNote.bar.masterBar.tempo === newTempo) {
      return;
    }

    this.commandManager.execute(
      new SetTempoCommand(selectedNote.bar.masterBar, newTempo)
    );

    this._trackElement.update();
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

    const selectedNote = this._selectionManager.selectedNote;
    if (selectedNote === undefined) {
      return;
    }

    if (
      selectedNote.bar.masterBar.beatsCount === beatsCount &&
      selectedNote.bar.masterBar.duration === duration
    ) {
      return;
    }

    this.commandManager.execute(
      new SetTimeSigCommand(selectedNote.bar.masterBar, beatsCount, duration)
    );

    this._trackElement.update();
  }

  /**
   * Set selected bar repeat status
   * @param status New status
   */
  public setSelectedBarRepeatStatus(status: BarRepeatStatus): void {
    const selectedNote = this._selectionManager.selectedNote;
    if (selectedNote === undefined) {
      throw Error(
        "Set selected bar repeat status called when selected note undefined"
      );
    }

    this.commandManager.execute(
      new SetRepeatStatusCommand(selectedNote.bar.masterBar, status)
    );

    this._trackElement.update();
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
    const selectedNote = this._selectionManager.selectedNote;
    const selectionNotes =
      selectedNote !== undefined
        ? [selectedNote.note]
        : this._selectionManager.selectionAsBeats.flatMap((b) => b.notes);

    const command = new SetTechniqueCommand(selectionNotes, type, bendOptions);
    this.commandManager.execute(command);

    if (command.executed) {
      this._trackElement.update();
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
    // this._trackElement.resetSelection();
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
    this._selectionManager.selectBeat(beatElement);

    // this._trackElement.recalcBeatElementSelection(
    //   this._selectionManager.selectionBeats
    // );
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
        this.commandManager.execute(
          new InsertBeatsCommand(
            selectedNote.bar,
            selectedNote.beatIndex,
            clipboard
          )
        );
      } else {
        // Replace currently selected
        this.commandManager.execute(
          new ReplaceBeatsCommand(selectionBeats, clipboard)
        );
        this.clearSelection();
      }
    } else if (clipboard !== undefined) {
      if (selectedNote === undefined) {
        throw Error(
          "Attempting to paste a note value but selected element is undefined"
        );
      }

      // Set note value if selected is a note element
      this.commandManager.execute(
        new SetNoteCommand(
          selectedNote.note,
          clipboard.noteValue,
          clipboard.octave
        )
      );
    }

    this._trackElement.update();
  }

  /**
   * Delete selected beats
   */
  public deleteSelectedBeats(): void {
    this.commandManager.execute(
      new RemoveBeatsCommand(this._selectionManager.selectionBeats)
    );
    this.clearSelection();

    this._trackElement.update();
  }

  /**
   * Appends a bar to the track and all the score tracks
   * @param bar Bar to append
   */
  public appendBar(masterBarData: MasterBarData = DEFAULT_MASTER_BAR): void {
    this.commandManager.execute(
      new AppendBarCommand(this._trackElement.track.score, masterBarData)
    );

    this._trackElement.update();
  }

  /**
   * Prepends a bar to the track and all the score tracks
   * @param bar Bar to prepend
   */
  public prependBar(masterBarData: MasterBarData = DEFAULT_MASTER_BAR): void {
    this.commandManager.execute(
      new PrependBarCommand(this._trackElement.track.score, masterBarData)
    );

    this._trackElement.update();
  }

  /**
   * Inserts a bar to the track at specified index and all the score tracks
   * @param bar Bar to insert
   */
  public insertBar(
    barIndex: number,
    masterBarData: MasterBarData = DEFAULT_MASTER_BAR
  ): void {
    if (
      barIndex < 0 ||
      barIndex > this._trackElement.track.score.masterBars.length
    ) {
      throw Error(`Invalid bar index: '${barIndex}'`);
    }

    this.commandManager.execute(
      new InsertBarCommand(
        this._trackElement.track.score,
        barIndex,
        masterBarData
      )
    );

    this._trackElement.update();
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

    this.commandManager.execute(
      new RemoveBarCommand(this._trackElement.track.score, barIndex)
    );

    this._trackElement.update();
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

//     this._trackElement.measure();

//     return applyRes;
//   }

//   // ==== TOO AFRAID TO COMPLETELY DELETE ====
//   // =========================================
