import { Beat, BeatSnapshot, ScoreEditor } from "../../../model";
import { Command, AffectedModel, getAffectedModelsFromBeats } from "./command";

/** Changes one fret and saves neighboring technique changes as fixed beat content. */
export class SetFretCommand implements Command {
  /** Original content for undo. */
  private _before: BeatSnapshot[] = [];
  /** Completed content for redo. */
  private _after: BeatSnapshot[] = [];
  /** Whether the command has run. */
  private _executed = false;

  constructor(
    /** Beat owning the edited string slot. */
    private _beat: Beat,
    /** One-based string selected for the edit. */
    private _stringNumber: number,
    /** Requested fret, or null to clear the slot. */
    private _newFret: number | null
  ) {}

  execute(): void {
    this._before = ScoreEditor.snapshotBeatNotes(
      ScoreEditor.getNoteEditBeats([this._beat], this._stringNumber)
    );
    ScoreEditor.setFret(this._beat, this._stringNumber, this._newFret);
    this._after = ScoreEditor.snapshotBeatNotes(
      ScoreEditor.resolveBeatPositions(this._before)
    );
    this._executed = true;
  }

  undo(): void {
    if (this._executed) {
      ScoreEditor.restoreBeatSnapshots(this._before);
    }
  }

  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }
    ScoreEditor.restoreBeatSnapshots(this._after);
  }

  public get affectedModels(): AffectedModel[] {
    const beats =
      this._before.length > 0
        ? ScoreEditor.resolveBeatPositions(this._before)
        : [this._beat];
    const previous = beats[0].voiceBar.bar.staff.getPrevBeat(beats[0]);
    return getAffectedModelsFromBeats([
      ...beats,
      ...(previous === null ? [] : [previous]),
    ]);
  }
}
