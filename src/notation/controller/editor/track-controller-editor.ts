import {
  Beat,
  NoteDuration,
  GuitarNote,
  Bar,
  BarRepeatStatus,
  TechniqueType,
  BendTechniqueOptions,
  MasterBarData,
  TupletSettings,
  DEFAULT_MASTER_BAR,
  GuitarTechniqueType,
  VoiceNumber,
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
  InsertBeatCommand,
  ReplaceBeatsCommand,
  SetNoteCommand,
  RemoveBeatsCommand,
  PrependBarCommand,
  InsertBarCommand,
  RemoveBarsCommand,
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

  private applyCommandUpdate(command: Command | undefined): void {
    if (command === undefined) {
      return;
    }

    this._trackElement.update(command.updateRequest);
  }

  public executeCommand<T extends Command>(command: T): T {
    const executedCommand = this.commandManager.execute(command) as T;
    this.applyCommandUpdate(executedCommand);
    return executedCommand;
  }

  public undoCommand(): void {
    const command = this.commandManager.undo();
    this.applyCommandUpdate(command);
  }

  public redoCommand(): void {
    const command = this.commandManager.redo();
    this.applyCommandUpdate(command);
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

    this.executeCommand(new AppendBeatCommand(selectedNote.voiceBar));
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
        selectedNote.bar.masterBar.barData,
        selectedNote.voiceBar.voiceNumber
      )
    );
    selectedNote.afterAddedBar();
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
    this.executeCommand(
      new SetTempoCommand(selectedNote.bar.masterBar, newTempo, [
        selectedNote.bar.uuid,
        ...(nextBar !== null ? [nextBar.uuid] : []),
      ])
    );
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

    const masterBarIndex = selectedNote.staff.track.score.masterBars.indexOf(
      selectedNote.bar.masterBar
    );
    this.executeCommand(
      new SetRepeatStatusCommand(
        selectedNote.bar.masterBar,
        status,
        masterBarIndex
      )
    );
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

    this.executeCommand(
      new SetTechniqueCommand(selectionNotes, type, bendOptions)
    );
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
            selectedNote.bar.staff,
            selectedNote.beat,
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
  }

  /**
   * Delete selected beats
   */
  public deleteSelectedBeats(): void {
    this.executeCommand(
      new RemoveBeatsCommand(this._selectionManager.selectionBeats)
    );
    this.clearSelection();
  }

  private getSelectedNoteIndex(): number {
    return this._selectionManager.selectedNote?.noteIndex ?? 0;
  }

  private selectBeatModel(beat: Beat, noteIndex: number): void {
    this._selectionManager.selectNote(beat.notes[noteIndex]);
  }

  private getSelectedBar(): Bar {
    const selectedNote = this._selectionManager.selectedNote;
    if (selectedNote !== undefined) {
      return selectedNote.bar;
    }

    const selectedBeat = this._selectionManager.selectionAsBeats[0];
    if (selectedBeat === undefined) {
      throw Error("Selected bar is undefined");
    }

    return selectedBeat.voiceBar.bar;
  }

  public setActiveVoiceNumber(voiceNumber: VoiceNumber): void {
    const noteIndex = this.getSelectedNoteIndex();
    const selectedBar = this.getSelectedBar();
    const voiceBar =
      selectedBar.getVoiceBar(voiceNumber) ??
      selectedBar.insertVoiceBar(voiceNumber);
    const targetBeat = voiceBar.beats[0];

    this._selectionManager.activeVoiceNumber = voiceNumber;
    this._selectionManager.clearSelection();
    this.selectBeatModel(targetBeat, noteIndex);
    this._trackElement.updateFull();
  }

  private selectInsertedBeat(
    command: InsertBeatCommand,
    noteIndex: number
  ): void {
    const insertedBeat = command.insertBeatResult?.beats[0];
    if (insertedBeat === undefined) {
      throw Error("Cannot select inserted beat before command executes");
    }

    this._selectionManager.clearSelection();
    this.selectBeatModel(insertedBeat, noteIndex);
  }

  public insertBeatBeforeSelected(): void {
    const noteIndex = this.getSelectedNoteIndex();
    const firstBeat = this._selectionManager.selectionAsBeats[0];
    const insertIndex = firstBeat.voiceBar.beats.indexOf(firstBeat);

    const command = this.executeCommand(
      new InsertBeatCommand(firstBeat.voiceBar, insertIndex)
    );
    this.selectInsertedBeat(command, noteIndex);
  }

  public insertBeatAfterSelected(): void {
    const noteIndex = this.getSelectedNoteIndex();
    const selectionBeats = this._selectionManager.selectionAsBeats;
    const lastBeat = selectionBeats[selectionBeats.length - 1];
    const insertIndex = lastBeat.voiceBar.beats.indexOf(lastBeat) + 1;

    const command = this.executeCommand(
      new InsertBeatCommand(lastBeat.voiceBar, insertIndex)
    );
    this.selectInsertedBeat(command, noteIndex);
  }

  public removeSelectedBeat(): void {
    const noteIndex = this.getSelectedNoteIndex();
    const selectionBeats = this._selectionManager.selectionAsBeats;
    const firstBeat = selectionBeats[0];
    const previousBeat = firstBeat.voiceBar.bar.staff.getPrevBeat(firstBeat);

    this.executeCommand(new RemoveBeatsCommand(selectionBeats));
    const targetBeat = previousBeat ?? firstBeat.voiceBar.beats[0];
    this._selectionManager.clearSelection();
    this.selectBeatModel(targetBeat, noteIndex);
  }

  /**
   * Appends a bar to the track and all the score tracks
   * @param bar Bar to append
   */
  public appendBar(masterBarData: MasterBarData = DEFAULT_MASTER_BAR): void {
    this.executeCommand(
      new AppendBarCommand(
        this._trackElement.track.score,
        masterBarData,
        this._selectionManager.activeVoiceNumber
      )
    );
  }

  /**
   * Prepends a bar to the track and all the score tracks
   * @param bar Bar to prepend
   */
  public prependBar(masterBarData: MasterBarData = DEFAULT_MASTER_BAR): void {
    this.executeCommand(
      new PrependBarCommand(
        this._trackElement.track.score,
        masterBarData,
        this._selectionManager.activeVoiceNumber
      )
    );
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
        masterBarData,
        this._selectionManager.activeVoiceNumber
      )
    );
  }

  /**
   * Removes bar from the score
   * @param barIndex Index of the bar to remove
   */
  public removeBar(barIndex: number): void {
    if (
      barIndex < 0 ||
      barIndex >= this._trackElement.track.score.masterBars.length
    ) {
      throw Error(`Invalid bar index: '${barIndex}'`);
    }

    this.executeCommand(
      new RemoveBarsCommand(this._trackElement.track.score, barIndex)
    );
  }

  private getSelectedBarForInsert(isInsertBefore: boolean): Bar {
    if (isInsertBefore) {
      return this.getSelectedBar();
    }

    const selectionBeats = this._selectionManager.selectionAsBeats;
    const selectedBeat = selectionBeats[selectionBeats.length - 1];
    if (selectedBeat === undefined) {
      throw Error("Selected bar is undefined");
    }

    return selectedBeat.voiceBar.bar;
  }

  private selectFirstBeatInBar(bar: Bar): void {
    const activeVoiceNumber = this._selectionManager.activeVoiceNumber;
    const firstBeat = bar.voiceBars[activeVoiceNumber]?.beats[0];
    if (firstBeat === undefined) {
      throw Error("Can't select first beat in empty bar");
    }

    this._selectionManager.clearSelection();
    this.selectBeatModel(firstBeat, 0);
  }

  public insertBarBeforeSelected(): void {
    const selectedBar = this.getSelectedBarForInsert(true);
    const insertIndex = selectedBar.staff.track.score.masterBars.indexOf(
      selectedBar.masterBar
    );

    this.executeCommand(
      new InsertBarCommand(
        selectedBar.staff.track.score,
        insertIndex,
        DEFAULT_MASTER_BAR,
        this._selectionManager.activeVoiceNumber
      )
    );
    this.selectFirstBeatInBar(selectedBar.staff.bars[insertIndex]);
  }

  public insertBarAfterSelected(): void {
    const selectedBar = this.getSelectedBarForInsert(false);
    const insertIndex = selectedBar.staff.track.score.masterBars.indexOf(
      selectedBar.masterBar
    );

    this.executeCommand(
      new InsertBarCommand(
        selectedBar.staff.track.score,
        insertIndex + 1,
        DEFAULT_MASTER_BAR,
        this._selectionManager.activeVoiceNumber
      )
    );
    this.selectFirstBeatInBar(selectedBar.staff.bars[insertIndex + 1]);
  }

  public removeSelectedBar(): void {
    const selectedBeats = this._selectionManager.selectionAsBeats;
    const selectedNote = this._selectionManager.selectedNote;
    const score = this._trackElement.track.score;
    const bars =
      selectedBeats.length > 0
        ? selectedBeats.map((beat) => beat.voiceBar.bar)
        : selectedNote !== undefined
          ? [selectedNote.bar]
          : [];
    const selectedBarIndices = Array.from(
      new Set(
        bars
          .map((bar) => score.masterBars.indexOf(bar.masterBar))
          .filter((index) => index >= 0)
      )
    ).sort((a, b) => a - b);

    if (selectedBarIndices.length === 0) {
      throw Error("Selected bar is undefined");
    }

    const removableBarIndices =
      selectedBarIndices.length >= score.masterBars.length
        ? selectedBarIndices.slice(0, score.masterBars.length - 1)
        : selectedBarIndices;

    if (removableBarIndices.length === 0) {
      this._selectionManager.clearSelection();
      this.selectFirstNote();
      return;
    }

    const firstRemovedBarIndex = removableBarIndices[0];
    const selectedStaff = bars[0].staff;

    this.executeCommand(new RemoveBarsCommand(score, removableBarIndices));

    const activeVoiceNumber = this._selectionManager.activeVoiceNumber;
    // Anchor bar - bar **before** the first removed bar. Thus it is the last bar
    // whose index hasn't changed after the removal. Hence - anchor
    const anchorBar = selectedStaff.bars[firstRemovedBarIndex - 1];
    const anchorVoiceBar = anchorBar?.getVoiceBar(activeVoiceNumber);
    const beatIndex = (anchorVoiceBar?.beats.length ?? 1) - 1;
    const selectedTargetBeat =
      firstRemovedBarIndex > 0
        ? anchorVoiceBar?.beats[beatIndex]
        : selectedStaff.bars[0].getVoiceBar(1)?.beats[0];
    if (selectedTargetBeat === undefined) {
      throw Error("Can't select target beat in empty voice slot");
    }
    this._selectionManager.clearSelection();
    this.selectBeatModel(selectedTargetBeat, 0);
  }

  public get selectionManager(): SelectionManager {
    return this._selectionManager;
  }
}
