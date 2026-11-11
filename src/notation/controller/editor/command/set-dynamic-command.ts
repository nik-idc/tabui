import {
  Beat,
  BeatSnapshot,
  Dynamic,
  DynamicDirection,
  ScoreEditor,
} from "../../../model";
import { BeatPosition } from "../../../model/editor/score-editor";
import { Command, AffectedModel, getAffectedModelsFromBeats } from "./command";

/** Kinds of dynamic edit. */
export enum DynamicEditKind {
  /** Set one dynamic on every beat. */
  Set = "set",
  /** Move each beat one level from its own dynamic. */
  Shift = "shift",
}

/** A dynamic edit: one dynamic to set, or a direction to shift one level. */
export type DynamicEdit =
  | { kind: DynamicEditKind.Set; dynamic: Dynamic }
  | { kind: DynamicEditKind.Shift; direction: DynamicDirection };

/** Applies the edit through the matching ScoreEditor method; true if any beat changed. */
function applyDynamicEdit(beats: Beat[], edit: DynamicEdit): boolean {
  switch (edit.kind) {
    case DynamicEditKind.Set:
      return ScoreEditor.setDynamic(beats, edit.dynamic);
    case DynamicEditKind.Shift:
      return ScoreEditor.shiftDynamics(beats, edit.direction);
  }
}

/** Sets or shifts the dynamic of selected beats, rests included. */
export class SetDynamicCommand implements Command {
  /** Fixed beat positions, resolved against live content when executed. */
  private _targets: BeatPosition[];
  /** Dynamic edit captured when the command is created. */
  private _edit: DynamicEdit;
  /** Original beat content for undo. */
  private _before: BeatSnapshot[] = [];
  /** Completed beat content for redo without running edit rules again. */
  private _after: BeatSnapshot[] = [];
  /** True if execution changed at least one beat. */
  private _executed = false;

  /**
   * Creates the command without changing content.
   * @param targets Fixed beat positions; duplicates are skipped.
   * @param edit Dynamic to set, or the direction to shift one level.
   */
  constructor(targets: BeatPosition[], edit: DynamicEdit) {
    this._targets = targets.map((p) => ({ ...p }));
    this._edit = { ...edit };
  }

  /** Saves the target beats, applies the edit, and saves the result for redo. */
  execute(): void {
    const beats = [...new Set(ScoreEditor.resolveBeatPositions(this._targets))];
    this._before = ScoreEditor.snapshotBeatNotes(beats);
    this._executed = applyDynamicEdit(beats, this._edit);
    this._after = ScoreEditor.snapshotBeatNotes(beats);
  }

  /** Restores the original beat content. */
  undo(): void {
    if (!this._executed) {
      return;
    }
    ScoreEditor.restoreBeatSnapshots(this._before);
  }

  /** Restores the completed edit without running edit rules again. */
  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }
    ScoreEditor.restoreBeatSnapshots(this._after);
  }

  /** True if execution changed at least one beat. */
  public get executed(): boolean {
    return this._executed;
  }

  public get affectedModels(): AffectedModel[] {
    return getAffectedModelsFromBeats(
      ScoreEditor.resolveBeatPositions(
        this._before.length > 0 ? this._before : this._targets
      )
    );
  }
}
