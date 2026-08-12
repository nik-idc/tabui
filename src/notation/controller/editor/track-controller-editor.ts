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
  ScoreEditor,
  Score,
  Track,
  MusicInstrument,
  TrackInstrumentChangeMode,
} from "../../model";
import { TrackElement } from "../element";
import { BeatElement } from "../element/beat/beat-element";
import { NoteElement } from "../element/note/note-element";
import { TabNoteElement } from "../element/note/tab-note-element";
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
  SetRestCommand,
  RemoveBeatsCommand,
  PrependBarCommand,
  InsertBarCommand,
  RemoveBarsCommand,
  Command,
  AffectedModel,
} from "./command";

/**
 * Class responsible for managing editing & element state
 */
export class TrackControllerEditor {
  editingEnabled: boolean;
  /** Command manager */
  private readonly _commandManager: CommandManager;

  /** Track element */
  private _trackElement: TrackElement;
  /** Selection manager */
  private _selectionManager: SelectionManager;

  /**
   * Class responsible for managing editing & element state
   * @param trackElement Track element
   */
  constructor(trackElement: TrackElement, editingEnabled: boolean = true) {
    this.editingEnabled = editingEnabled;
    this._commandManager = new CommandManager();

    this._trackElement = trackElement;
    this._selectionManager = new SelectionManager(this._trackElement.track);
  }

  private getAffectedMasterBarIndices(
    affectedModels: AffectedModel[]
  ): number[] | null {
    if (affectedModels.length === 0) {
      return null;
    }

    const masterBarIndices = Array.from(
      new Set(affectedModels.map((model) => model.masterBarIndex))
    ).sort((a, b) => a - b);

    return masterBarIndices;
  }

  private applyCommandUpdate(command: Command | undefined): void {
    if (command === undefined) {
      return;
    }

    const masterBarIndices = this.getAffectedMasterBarIndices(
      command.affectedModels
    );
    if (masterBarIndices === null) {
      return;
    }
    this._trackElement.update({ affectedMasterBarIndices: masterBarIndices });
  }

  public executeCommand<T extends Command>(command: T): T {
    if (!this.editingEnabled) {
      return command;
    }
    const executedCommand = this._commandManager.execute(command) as T;
    this.applyCommandUpdate(executedCommand);
    return executedCommand;
  }

  public undoCommand(): void {
    if (!this.editingEnabled) {
      return;
    }
    const command = this._commandManager.undo();
    this.applyCommandUpdate(command);
  }

  public redoCommand(): void {
    if (!this.editingEnabled) {
      return;
    }
    const command = this._commandManager.redo();
    this.applyCommandUpdate(command);
  }

  public setScoreName(score: Score, name: string): boolean {
    if (!this.editingEnabled) {
      return false;
    }
    score.name = name;
    return true;
  }

  public setMasterVolume(score: Score, volume: number): boolean {
    if (!this.editingEnabled) {
      return false;
    }
    score.masterVolume = volume;
    return true;
  }

  public setMasterPan(score: Score, pan: number): boolean {
    if (!this.editingEnabled) {
      return false;
    }
    score.masterPan = pan;
    return true;
  }

  public addTrack(
    score: Score,
    instrument: MusicInstrument,
    name: string
  ): Track | undefined {
    if (!this.editingEnabled) {
      return undefined;
    }
    return score.addTrack(instrument, name).tracks[0];
  }

  public removeTrack(score: Score, track: Track): Track | undefined {
    if (!this.editingEnabled) {
      return undefined;
    }
    return score.removeTrack(score.tracks.indexOf(track));
  }

  public moveTrack(track: Track, targetIndex: number): boolean {
    if (!this.editingEnabled) {
      return false;
    }
    track.score.moveTrack(track, targetIndex);
    return true;
  }

  public setTrackName(track: Track, name: string): boolean {
    if (!this.editingEnabled) {
      return false;
    }
    track.name = name;
    return true;
  }

  public setTrackVolume(track: Track, volume: number): boolean {
    if (!this.editingEnabled) {
      return false;
    }
    track.volume = volume;
    return true;
  }

  public setTrackPan(track: Track, pan: number): boolean {
    if (!this.editingEnabled) {
      return false;
    }
    track.pan = pan;
    return true;
  }

  public toggleTrackMuted(track: Track): boolean {
    if (!this.editingEnabled) {
      return false;
    }
    track.muted = !track.muted;
    return true;
  }

  public toggleTrackSoloed(track: Track): boolean {
    if (!this.editingEnabled) {
      return false;
    }
    track.soloed = !track.soloed;
    return true;
  }

  public setTrackInstrument(
    track: Track,
    instrument: MusicInstrument,
    mode: TrackInstrumentChangeMode
  ): boolean {
    if (!this.editingEnabled) {
      return false;
    }
    track.setInstrument(instrument, mode);
    return true;
  }

  /**
   * Selectes note using note element
   * @param noteElement
   */
  public selectNoteElement(noteElement: NoteElement): void {
    // Kinda weird idk - why not just selectNote?
    if (noteElement instanceof TabNoteElement && !noteElement.hasBackingNote) {
      this._selectionManager.selectBeatCursor(
        noteElement.beatElement.beat,
        noteElement.stringNumber - 1
      );
      return;
    }

    if (noteElement.note === null) {
      return;
    }

    this._selectionManager.selectNote(noteElement.note);
  }

  /**
   * Selects first note
   */
  public selectFirstNote(): void {
    const firstBar = this._trackElement.track.staves[0].bars[0];
    const firstBeat = firstBar.getVoiceBar(1)?.beats[0];
    if (firstBeat === undefined) {
      return;
    }

    const firstNote = firstBeat.notes?.[0];
    if (firstNote !== undefined) {
      this._selectionManager.selectNote(firstNote);
      return;
    }

    this._selectionManager.selectBeatCursor(firstBeat, 0);
  }

  private selectBeatCursor(beat: Beat): void {
    const noteIndex = this._selectionManager.selectedNote?.noteIndex ?? 0;
    this._selectionManager.selectBeatCursor(beat, noteIndex);
  }

  private selectedBeatIs(beat: Beat): boolean {
    return this._selectionManager.selectionAsBeats[0] === beat;
  }

  /** Selects the first beat in the first bar of the active voice. */
  public selectFirstBar(): boolean {
    const selectedBar = this.getSelectedBar();
    const firstBar = selectedBar.staff.bars[0];
    const activeVoiceNumber = this._selectionManager.activeVoiceNumber;
    const firstBeat = firstBar.getVoiceBar(activeVoiceNumber)?.beats[0];

    if (firstBeat !== undefined && !this.selectedBeatIs(firstBeat)) {
      this.selectBeatCursor(firstBeat);
      return true;
    }

    return false;
  }

  /** Selects the first beat in the previous bar of the active voice. */
  public selectPreviousBar(): boolean {
    const selectedBar = this.getSelectedBar();
    const previousBar = selectedBar.staff.getPrevBar(selectedBar);
    const previousBeat = previousBar?.getVoiceBar(
      this._selectionManager.activeVoiceNumber
    )?.beats[0];

    if (previousBeat !== undefined && !this.selectedBeatIs(previousBeat)) {
      this.selectBeatCursor(previousBeat);
      return true;
    }

    return false;
  }

  /** Selects the first beat in the next bar of the active voice. */
  public selectNextBar(): boolean {
    const selectedBar = this.getSelectedBar();
    const nextBar = selectedBar.staff.getNextBar(selectedBar);
    const activeVoiceNumber = this._selectionManager.activeVoiceNumber;
    const nextBeat = nextBar?.getVoiceBar(activeVoiceNumber)?.beats[0];

    if (nextBeat !== undefined && !this.selectedBeatIs(nextBeat)) {
      this.selectBeatCursor(nextBeat);
      return true;
    }

    return false;
  }

  /** Selects the first beat in the last bar of the active voice. */
  public selectLastBar(): boolean {
    const selectedBar = this.getSelectedBar();
    const lastBar = selectedBar.staff.bars[selectedBar.staff.bars.length - 1];
    const activeVoiceNumber = this._selectionManager.activeVoiceNumber;
    const firstBeat = lastBar.getVoiceBar(activeVoiceNumber)?.beats[0];

    if (firstBeat !== undefined && !this.selectedBeatIs(firstBeat)) {
      this.selectBeatCursor(firstBeat);
      return true;
    }

    return false;
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

  private updateInsertedVoiceBar(bar: Bar, voiceNumber: VoiceNumber): boolean {
    if (!ScoreEditor.ensureVoiceBar(bar, voiceNumber)) {
      return false;
    }

    const affectedModels: AffectedModel[] = [
      {
        masterBarIndex: bar.staff.track.score.masterBars.indexOf(bar.masterBar),
        modelUUID: bar.uuid,
      },
    ];
    const masterBarIndices = this.getAffectedMasterBarIndices(affectedModels);
    if (masterBarIndices !== null) {
      this._trackElement.update({ affectedMasterBarIndices: masterBarIndices });
    }
    return true;
  }

  /**
   * Moves selected note left
   */
  private moveSelectedNoteLeft(): void {
    const selectedNote = this._selectionManager.selectedNote;
    if (selectedNote === undefined) {
      throw Error("Can't move left, selected note is undefined");
    }

    this._selectionManager.moveSelectedNoteLeft(this.editingEnabled);
    if (!this.editingEnabled) {
      return;
    }
    this.updateInsertedVoiceBar(
      selectedNote.bar,
      this._selectionManager.activeVoiceNumber
    );
  }

  /**
   * Moves selected note right
   */
  private moveSelectedNoteRight(): void {
    const selectedNote = this._selectionManager.selectedNote;
    if (selectedNote === undefined) {
      throw Error("Can't move right, selected note is undefined");
    }

    const moveRightResult = this._selectionManager.moveSelectedNoteRight(
      this.editingEnabled
    );
    this.handleMoveRight(moveRightResult);
    if (!this.editingEnabled) {
      return;
    }
    this.updateInsertedVoiceBar(
      selectedNote.bar,
      this._selectionManager.activeVoiceNumber
    );
  }

  /**
   * Move selected note in specified direction
   * @param direction Move direction
   */
  public moveSelectedNote(direction: SelectedMoveDirection): void {
    switch (direction) {
      case SelectedMoveDirection.Left:
        this.moveSelectedNoteLeft();
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
    if (!this.editingEnabled) {
      return;
    }
    const selectedNote = this._selectionManager.selectedNote;
    if (selectedNote === undefined) {
      throw Error("Selected note is undefined");
    }
    this.executeCommand(
      new SetFretCommand(selectedNote.beat, selectedNote.noteIndex + 1, newFret)
    );
  }

  /**
   * Set dots
   * @param newDots New dots count
   */
  public setDots(newDots: number): void {
    if (!this.editingEnabled) {
      return;
    }
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
    if (!this.editingEnabled) {
      return;
    }
    const selection = this._selectionManager.selectionAsBeats;
    if (selection.length === 0) {
      throw Error("Selection length = 0");
    }

    this.executeCommand(new SetDurationCommand(selection, newDuration));
  }

  public setSelectedBeatRest(): void {
    if (!this.editingEnabled) {
      return;
    }
    const selection = this._selectionManager.selectionAsBeats;
    if (selection.length === 0) {
      throw Error("Selection length is 0");
    }

    const newRestState = !selection.every((beat) => beat.isRest());

    this.executeCommand(new SetRestCommand(selection, newRestState));
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
    if (!this.editingEnabled) {
      return;
    }
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
    if (!this.editingEnabled) {
      return;
    }
    const selectedNote = this._selectionManager.selectedNote;
    if (selectedNote === undefined) {
      return;
    }

    if (selectedNote.bar.masterBar.tempo === newTempo) {
      return;
    }

    const nextBar = selectedNote.staff.getNextBar(selectedNote.bar);
    const masterBarIndex = selectedNote.bar.staff.bars.indexOf(
      selectedNote.bar
    );
    this.executeCommand(
      new SetTempoCommand(selectedNote.bar.masterBar, newTempo, [
        { masterBarIndex, modelUUID: selectedNote.bar.uuid },
        ...(nextBar !== null
          ? [{ masterBarIndex: masterBarIndex + 1, modelUUID: nextBar.uuid }]
          : []),
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
    if (!this.editingEnabled) {
      return;
    }
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
    if (!this.editingEnabled) {
      return;
    }
    const selectedNote = this._selectionManager.selectedNote;
    if (selectedNote === undefined) {
      throw Error(
        "Set selected bar repeat status called when selected note undefined"
      );
    }

    this.executeCommand(
      new SetRepeatStatusCommand(
        selectedNote.bar.masterBar,
        status,
        selectedNote.staff.track
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
    if (!this.editingEnabled) {
      return;
    }
    const selectedNote = this._selectionManager.selectedNote;
    const selectionNotes =
      selectedNote && selectedNote.note !== null
        ? [selectedNote.note]
        : this._selectionManager.selectionAsBeats.flatMap((b) => b.notes ?? []);

    if (selectionNotes.length === 0) {
      return;
    }

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
    if (!this.editingEnabled) {
      return;
    }
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
            clipboard,
            this._selectionManager.activeVoiceNumber
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

      this.executeCommand(
        new SetNoteCommand(
          selectedNote.beat,
          selectedNote.noteIndex + 1,
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
    if (!this.editingEnabled) {
      return;
    }
    const noteIndex = this._selectionManager.selectedNote?.noteIndex ?? 0;
    const selectionBeats = this._selectionManager.selectionAsBeats;
    const firstBeat = selectionBeats[0];
    const selectedBar = firstBeat.voiceBar.bar;
    const previousBeat = firstBeat.voiceBar.bar.staff.getPrevBeat(firstBeat);

    this.executeCommand(new RemoveBeatsCommand(selectionBeats));
    const targetBeat = this.getBeatAfterRemoval(
      selectedBar,
      previousBeat,
      firstBeat.voiceBar.voiceNumber
    );
    this._selectionManager.clearSelection();
    this._selectionManager.selectBeatCursor(targetBeat, noteIndex);
  }

  private getBeatAfterRemoval(
    selectedBar: Bar,
    previousBeat: Beat | null,
    removedVoiceNumber: VoiceNumber
  ): Beat {
    const removedVoiceBar = selectedBar.getVoiceBar(removedVoiceNumber);
    if (removedVoiceBar !== null && previousBeat !== null) {
      return previousBeat;
    } else if (removedVoiceBar !== null) {
      return removedVoiceBar.beats[0];
    }

    const remainingVoiceBars = selectedBar.voiceBarsAsArray;
    const lowerVoiceBar = remainingVoiceBars
      .filter((voiceBar) => voiceBar.voiceNumber < removedVoiceNumber)
      .at(-1);
    if (lowerVoiceBar !== undefined) {
      return lowerVoiceBar.beats[0];
    }

    const firstRemainingBeat = remainingVoiceBars[0]?.beats[0];
    if (firstRemainingBeat === undefined) {
      throw Error("Cannot find target beat after deletion");
    }

    return firstRemainingBeat;
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
    const noteIndex = this._selectionManager.selectedNote?.noteIndex ?? 0;
    const selectedBar = this.getSelectedBar();
    let voiceBar = selectedBar.getVoiceBar(voiceNumber);
    if (voiceBar === null && !this.editingEnabled) {
      return;
    }
    const voiceBarInserted = voiceBar === null;
    if (voiceBar === null) {
      voiceBar = selectedBar.insertVoiceBar(voiceNumber);
    }

    const targetBeat = voiceBar.beats[0];

    this._selectionManager.activeVoiceNumber = voiceNumber;
    this._selectionManager.clearSelection();
    this._selectionManager.selectBeatCursor(targetBeat, noteIndex);

    if (!voiceBarInserted) {
      return;
    }

    const affectedModels: AffectedModel[] = [
      {
        masterBarIndex: selectedBar.staff.track.score.masterBars.indexOf(
          selectedBar.masterBar
        ),
        modelUUID: selectedBar.uuid,
      },
    ];
    const masterBarIndices = this.getAffectedMasterBarIndices(affectedModels);
    if (masterBarIndices !== null) {
      this._trackElement.update({ affectedMasterBarIndices: masterBarIndices });
    }
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
    this._selectionManager.selectBeatCursor(insertedBeat, noteIndex);
  }

  public insertBeatBeforeSelected(): void {
    if (!this.editingEnabled) {
      return;
    }
    const noteIndex = this._selectionManager.selectedNote?.noteIndex ?? 0;
    const firstBeat = this._selectionManager.selectionAsBeats[0];
    const insertIndex = firstBeat.voiceBar.beats.indexOf(firstBeat);

    const command = this.executeCommand(
      new InsertBeatCommand(firstBeat.voiceBar, insertIndex)
    );
    this.selectInsertedBeat(command, noteIndex);
  }

  public insertBeatAfterSelected(): void {
    if (!this.editingEnabled) {
      return;
    }
    const noteIndex = this._selectionManager.selectedNote?.noteIndex ?? 0;
    const selectionBeats = this._selectionManager.selectionAsBeats;
    const lastBeat = selectionBeats[selectionBeats.length - 1];
    const insertIndex = lastBeat.voiceBar.beats.indexOf(lastBeat) + 1;

    const command = this.executeCommand(
      new InsertBeatCommand(lastBeat.voiceBar, insertIndex)
    );
    this.selectInsertedBeat(command, noteIndex);
  }

  public removeSelectedBeat(): void {
    if (!this.editingEnabled) {
      return;
    }
    const noteIndex = this._selectionManager.selectedNote?.noteIndex ?? 0;
    const selectionBeats = this._selectionManager.selectionAsBeats;
    const firstBeat = selectionBeats[0];
    const selectedBar = firstBeat.voiceBar.bar;
    const previousBeat = firstBeat.voiceBar.bar.staff.getPrevBeat(firstBeat);

    this.executeCommand(new RemoveBeatsCommand(selectionBeats));
    const targetBeat = this.getBeatAfterRemoval(
      selectedBar,
      previousBeat,
      firstBeat.voiceBar.voiceNumber
    );
    this._selectionManager.clearSelection();
    this._selectionManager.selectBeatCursor(targetBeat, noteIndex);
  }

  /**
   * Appends a bar to the track and all the score tracks
   * @param bar Bar to append
   */
  public appendBar(masterBarData: MasterBarData = DEFAULT_MASTER_BAR): void {
    if (!this.editingEnabled) {
      return;
    }
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
    if (!this.editingEnabled) {
      return;
    }
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
    if (!this.editingEnabled) {
      return;
    }
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
    if (!this.editingEnabled) {
      return;
    }
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
    this._selectionManager.selectBeatCursor(firstBeat, 0);
  }

  public insertBarBeforeSelected(): void {
    if (!this.editingEnabled) {
      return;
    }
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
    if (!this.editingEnabled) {
      return;
    }
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
    if (!this.editingEnabled) {
      return;
    }
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
    this._selectionManager.selectBeatCursor(selectedTargetBeat, 0);
  }

  public get selectionManager(): SelectionManager {
    return this._selectionManager;
  }
}
