import {
  BeatGuitarTechniqueType,
  BeatSnapshot,
  ScoreEditor,
  type SetBeatTechniqueOptions,
} from "../../../model";
import { BeatPosition } from "../../../model/editor/score-editor";
import { Command, AffectedModel, getAffectedModelsFromBeats } from "./command";

/** Adds, replaces, or removes a beat-level technique on selected beats. */
export class SetBeatTechniqueCommand implements Command {
  /** Fixed beat positions, resolved against live content when executed. */
  private _targets: BeatPosition[];
  /** Beat technique type to set or remove. */
  private _type: BeatGuitarTechniqueType;
  /** Technique settings captured when the command is created; no options removes the technique when every target has it. */
  private _options: SetBeatTechniqueOptions;
  /** Original beat content for undo. */
  private _before: BeatSnapshot[] = [];
  /** Completed beat content for redo without running edit rules again. */
  private _after: BeatSnapshot[] = [];
  /** True if execution changed at least one beat. */
  private _executed = false;

  /**
   * Creates the command without changing content.
   * @param targets Fixed beat positions; rests and duplicates are skipped.
   * @param type Beat technique type.
   * @param options Technique settings; omit them to remove the technique when every target beat has it.
   */
  constructor(
    targets: BeatPosition[],
    type: BeatGuitarTechniqueType,
    options: SetBeatTechniqueOptions = {}
  ) {
    this._targets = targets.map((p) => ({ ...p }));
    this._type = type;
    this._options = { ...options };
  }

  /** Saves eligible beats, applies the edit, and saves the result for redo. */
  execute(): void {
    const beats = ScoreEditor.getBeatTechniqueBeats(this._targets);
    this._before = ScoreEditor.snapshotBeatNotes(beats);
    this._executed = ScoreEditor.setBeatTechnique(
      beats,
      this._type,
      this._options
    );
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
