import { Beat, BeatSnapshot, GuitarNote, ScoreEditor } from "../../../model";
import type { BeatPosition, Note, NotePosition } from "../../../model";
import { AffectedModel, Command, getAffectedModelsFromBeats } from "./command";

/** Undoable atomic pitch shift for a beat selection or one note cursor. */
export class ShiftPitchCommand implements Command {
  /** Fixed target addresses prevent redo from re-reading a changed selection. */
  private readonly _targets: (BeatPosition | NotePosition)[];
  /** Complete content surrounding edited notes, including tie neighbors. */
  private _before: BeatSnapshot[] = [];
  /** Fixed post-edit content used by redo. */
  private _after: BeatSnapshot[] = [];
  /** Whether the command completed an edit. */
  private _executed = false;

  constructor(
    target: Beat[] | Note,
    /** Signed semitone distance applied by this command. */
    private readonly _semitones: number
  ) {
    if (!Number.isFinite(_semitones) || !Number.isInteger(_semitones)) {
      throw Error("Pitch shift must be an integer");
    }
    const values: (Beat | Note)[] = Array.isArray(target) ? target : [target];
    this._targets = values.map((value) =>
      value instanceof Beat
        ? ScoreEditor.getBeatPosition(value)
        : value instanceof GuitarNote
          ? {
              ...ScoreEditor.getBeatPosition(value.beat),
              stringNumber: value.stringNum,
            }
          : ScoreEditor.getBeatPosition(value.beat)
    );
  }

  execute(): void {
    const target = this.resolveTarget();
    if (
      target === null ||
      !ScoreEditor.canShiftPitch(target, this._semitones)
    ) {
      this._executed = false;
      return;
    }
    this._before = ScoreEditor.snapshotBeatNotes(
      ScoreEditor.getConnectedTieEditBeats(target)
    );
    ScoreEditor.applyShift(target, this._semitones);
    this._after = ScoreEditor.snapshotBeatNotes(
      ScoreEditor.resolveBeatPositions(this._before)
    );
    this._executed = true;
  }

  private resolveTarget(): Beat[] | Note | null {
    if (this._targets.length === 0) {
      return null;
    }
    if ("stringNumber" in this._targets[0]) {
      const position = this._targets[0];
      const beat = ScoreEditor.resolveBeatPosition(position);
      return beat.notes?.[position.stringNumber - 1] ?? null;
    }
    return this._targets.map((position) =>
      ScoreEditor.resolveBeatPosition(position)
    );
  }

  /** Reports whether execution produced an edit that belongs in history. */
  get executed(): boolean {
    return this._executed;
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

  get affectedModels(): AffectedModel[] {
    if (!this._executed && this._before.length === 0) {
      return [];
    }
    return getAffectedModelsFromBeats(
      this._before.length > 0
        ? ScoreEditor.resolveBeatPositions(this._before)
        : this._targets.map((target) => ScoreEditor.resolveBeatPosition(target))
    );
  }
}
