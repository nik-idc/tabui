import {
  NoteDuration,
  GuitarNote,
  BarRepeatStatus,
  TechniqueType,
  BendTechniqueOptions,
  MasterBarData,
  TupletSettings,
  DEFAULT_MASTER_BAR,
  GuitarTechniqueType,
} from "@/notation/model";
import { TrackElement } from "../element";
import { BeatElement } from "../element/beat/beat-element";
import { NoteElement } from "../element/note/note-element";
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
  Command,
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
    this._selectionManager = new SelectionManager(this._trackElement.track);
  }

  private applyCommandUpdate(command: unknown): boolean {
    if (
      command instanceof SetTechniqueCommand &&
      command.executed &&
      command.isTechniqueLabelVerticalUpdate
    ) {
      this._trackElement.update("Vertical", {
        affectedModelUUIDs: command.affectedModelUUIDs,
      });
      return true;
    }

    if (
      command instanceof SetTempoCommand &&
      command.executed &&
      command.isTempoVisibilityVerticalUpdate
    ) {
      this._trackElement.update("Vertical", {
        affectedModelUUIDs: command.affectedModelUUIDs,
      });
      return true;
    }

    return false;
  }

  public executeCommand<T extends Command>(command: T): T {
    const executedCommand = this.commandManager.execute(command) as T;
    this.applyCommandUpdate(executedCommand);
    return executedCommand;
  }

  public undoCommand(): boolean {
    const command = this.commandManager.undo();
    return this.applyCommandUpdate(command);
  }

  public redoCommand(): boolean {
    const command = this.commandManager.redo();
    return this.applyCommandUpdate(command);
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

    this.executeCommand(new AppendBeatCommand(selectedNote.bar));

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

    this.executeCommand(
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

    this.executeCommand(new SetFretCommand(selectedNote.note, newFret));

    this._trackElement.update();
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
    this.executeCommand(new SetDotsCommand(selection, newDots));

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

    this.executeCommand(new SetDurationCommand(selection, newDuration));

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
    this.executeCommand(new SetTupletCommand(selection, settings));

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

    const nextBar = selectedNote.staff.getNextBar(selectedNote.bar);
    const command = this.executeCommand(
      new SetTempoCommand(selectedNote.bar.masterBar, newTempo, [
        selectedNote.bar.uuid,
        ...(nextBar !== null ? [nextBar.uuid] : []),
      ])
    );

    if (!command.isTempoVisibilityVerticalUpdate) {
      this._trackElement.update();
    }
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

    this.executeCommand(
      new SetTimeSigCommand(
        selectedNote.staff.track.score,
        selectedNote.bar.masterBar,
        beatsCount,
        duration
      )
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

    this.executeCommand(
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

    const command = this.executeCommand(
      new SetTechniqueCommand(selectionNotes, type, bendOptions)
    );

    if (command.executed && !command.isTechniqueLabelVerticalUpdate) {
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
  }

  /**
   * Clears selected element
   */
  public clearSelectedNote(): void {
    this._selectionManager.clearSelectedNote();
  }

  /**
   * Syncs selection to current runtime structure after structural changes.
   */
  public syncSelection(): void {
    this._selectionManager.syncSelection();
  }

  /**
   * Selects beat
   * @param beatElement Beat element
   */
  public selectBeat(beatElement: BeatElement): void {
    this._selectionManager.selectBeat(beatElement.beat);
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
        this.executeCommand(
          new InsertBeatsCommand(
            selectedNote.bar,
            selectedNote.beatIndex,
            clipboard
          )
        );
      } else {
        // Replace currently selected
        this.executeCommand(new ReplaceBeatsCommand(selectionBeats, clipboard));
        this.clearSelection();
      }
    } else if (clipboard !== undefined) {
      if (selectedNote === undefined) {
        throw Error(
          "Attempting to paste a note value but selected element is undefined"
        );
      }

      // Set note value if selected is a note element
      this.executeCommand(
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
    this.executeCommand(
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
    this.executeCommand(
      new AppendBarCommand(this._trackElement.track.score, masterBarData)
    );

    this._trackElement.update();
  }

  /**
   * Prepends a bar to the track and all the score tracks
   * @param bar Bar to prepend
   */
  public prependBar(masterBarData: MasterBarData = DEFAULT_MASTER_BAR): void {
    this.executeCommand(
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

    this.executeCommand(
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

    this.executeCommand(
      new RemoveBarCommand(this._trackElement.track.score, barIndex)
    );

    this._trackElement.update();
  }

  public get selectionManager(): SelectionManager {
    return this._selectionManager;
  }
}
