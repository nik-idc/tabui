import {
  Beat,
  BeatRemovalOutput,
  BeatSnapshot,
  ScoreEditor,
} from "../../../model";
import { Command, AffectedModel, getAffectedModelsFromBeats } from "./command";

type RemoveBeatsBefore = {
  removals: BeatRemovalOutput[];
  neighborSnapshots: BeatSnapshot[];
} | null;

/**
 * Remove beats command
 */
export class RemoveBeatsCommand implements Command {
  /** Beats to be removeed */
  private _beatsToRemove: Beat[];
  private _affectedModels: AffectedModel[];
  /** Fixed removed content with restoration metadata and non-overlapping boundary notes. */
  private _before: RemoveBeatsBefore = null;
  /** Fixed surviving content after removal for deterministic redo. */
  private _after: BeatSnapshot[] = [];

  /**
   * Remove beats command
   * @param beatsToRemove Beats to be removeed
   */
  constructor(beatsToRemove: Beat[]) {
    this._beatsToRemove = beatsToRemove;
    this._affectedModels = getAffectedModelsFromBeats(beatsToRemove);
  }

  /**
   * Execute add beat command
   */
  execute(): void {
    const affected = ScoreEditor.getNoteEditBeats(this._beatsToRemove);
    const neighbors = affected.filter((b) => !this._beatsToRemove.includes(b));
    const neighborSnapshots = ScoreEditor.snapshotBeatNotes(neighbors);
    this._affectedModels = getAffectedModelsFromBeats(affected);
    const removals = ScoreEditor.removeBeats(this._beatsToRemove);
    this._before = {
      removals: removals.map((o) => ({
        ...o,
        removed: {
          ...o.removed,
          beats: o.removed.beats.map((b) => b.deepCopy()),
        },
      })),
      neighborSnapshots,
    };
    this._beatsToRemove = [];
    this._after = ScoreEditor.snapshotBeatNotes(
      ScoreEditor.getLiveBeats(neighbors)
    );
  }

  /**
   * Undo add beat command, i.e. delete added beat
   */
  undo(): void {
    if (this._before === null) {
      return;
    }

    ScoreEditor.undoBeatRemovals(this._before.removals);
    ScoreEditor.restoreBeatSnapshots(this._before.neighborSnapshots);
  }

  /**
   * Redo, i.e. restore bar state to before execute
   */
  redo(): void {
    if (this._before === null) {
      return;
    }

    const savedRemovals = this._before.removals;
    const removals = ScoreEditor.redoBeatRemovals(savedRemovals);
    this._before.removals = removals.map((o, i) => ({
      ...o,
      removed: savedRemovals[i].removed,
    }));
    ScoreEditor.restoreBeatSnapshots(this._after);
  }

  public get affectedModels(): AffectedModel[] {
    return this._affectedModels;
  }
}
