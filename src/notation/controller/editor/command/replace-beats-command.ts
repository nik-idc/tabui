import {
  Beat,
  BeatSnapshot,
  BeatRemovalOutput,
  BeatRestoreSnapshot,
  ScoreEditor,
  BeatPosition,
} from "../../../model";
import { Command, AffectedModel, getAffectedModelsFromBeats } from "./command";

type ReplaceBeatsBefore = {
  beatSnapshots: BeatRestoreSnapshot[];
  neighborSnapshots: BeatSnapshot[];
};
type ReplaceBeatsAfter = { beats: Beat[]; neighborSnapshots: BeatSnapshot[] };

/**
 * Replaces selected beats with clipboard beats using the current permissive
 * model. This intentionally allows underfilled/overfilled bars; future
 * rhythm-aware replacement should wait for explicit rests/gaps in the model.
 */
export class ReplaceBeatsCommand implements Command {
  private _beatsToReplace: Beat[];
  /** Clipboard input, released after the installed content is saved. */
  private _newBeats: Beat[];
  /** Positions of current replacement content after later history can replace its beat objects. */
  private _currentPositions: BeatPosition[] = [];
  /** Fallback-rest insertions to discard on undo; removed content lives only in _before. */
  private _removalInsertions: Pick<BeatRemovalOutput, "inserted">[] = [];
  private _executed: boolean = false;
  private _affectedModels: AffectedModel[];
  /** Original removed content and non-overlapping surviving boundary notes. */
  private _before: ReplaceBeatsBefore = {
    beatSnapshots: [],
    neighborSnapshots: [],
  };
  /** Fixed installed content and surviving boundary notes for redo. */
  private _after: ReplaceBeatsAfter = { beats: [], neighborSnapshots: [] };

  constructor(beatsToReplace: Beat[], newBeats: Beat[]) {
    this._beatsToReplace = beatsToReplace;
    this._newBeats = newBeats;
    this._affectedModels = getAffectedModelsFromBeats(beatsToReplace);
  }

  execute(): void {
    if (this._executed) {
      throw Error("ReplaceBeatsCommand attempted to execute twice");
    }

    const affected = ScoreEditor.getNoteEditBeats(this._beatsToReplace);
    const neighbors = affected.filter((b) => !this._beatsToReplace.includes(b));
    this._before = {
      beatSnapshots: this._beatsToReplace.map((b) => ({
        voiceBar: b.voiceBar,
        index: b.voiceBar.beats.indexOf(b),
        beat: b.deepCopy(),
      })),
      neighborSnapshots: ScoreEditor.snapshotBeatNotes(neighbors),
    };
    this._affectedModels = getAffectedModelsFromBeats(affected);
    const output = ScoreEditor.replaceBeats(
      this._beatsToReplace,
      this._newBeats
    );
    this._beatsToReplace = [];
    this._newBeats = [];
    this._removalInsertions = output.removalOutputs.map((o) => ({
      inserted: o.inserted,
    }));
    this._after = {
      beats: output.insertedBeats.map((b) => b.deepCopy()),
      neighborSnapshots: ScoreEditor.snapshotBeatNotes(
        ScoreEditor.getLiveBeats(neighbors)
      ),
    };
    this._currentPositions = output.insertedBeats.map((b) =>
      ScoreEditor.getBeatPosition(b)
    );
    this._executed = true;
  }

  undo(): void {
    if (!this._executed) {
      return;
    }

    const restoredBeats = ScoreEditor.restoreBeats(
      this._before.beatSnapshots,
      ScoreEditor.resolveBeatPositions(this._currentPositions),
      this._removalInsertions
    );
    ScoreEditor.restoreBeatSnapshots(this._before.neighborSnapshots);
    this._currentPositions = restoredBeats.map((b) =>
      ScoreEditor.getBeatPosition(b)
    );
  }

  redo(): void {
    if (!this._executed) {
      return;
    }

    const output = ScoreEditor.replaceBeats(
      ScoreEditor.resolveBeatPositions(this._currentPositions),
      this._after.beats,
      true
    );
    this._removalInsertions = output.removalOutputs.map((o) => ({
      inserted: o.inserted,
    }));
    ScoreEditor.restoreBeatSnapshots(this._after.neighborSnapshots);
    this._currentPositions = output.insertedBeats.map((b) =>
      ScoreEditor.getBeatPosition(b)
    );
  }

  public get affectedModels(): AffectedModel[] {
    return this._affectedModels;
  }
}

// Deferred duration-aware replacement direction:
//
// We attempted a replacement model where selected beats represented a rhythmic
// time range. Clipboard shorter than the selection removed the remaining
// selected duration; clipboard longer than the selection overwrote following
// beats and could create bars at score end. This exposed too many edge cases for
// the current liberal model because TabUI does not yet model rests/gaps and does
// not require bars to be rhythmically complete.
//
// The future version should be built only after that model decision is made. A
// plausible design is:
//
// - Replacement is delete-selected-beats plus the same overwrite-insert primitive
//   used by `InsertBeatsCommand`.
// - Command state should include `anchorStaff`, optional `anchorBeat`, clipboard
//   snapshots, removed selected beats, overwritten following beats, inserted
//   beats, filler/rest beats, and created bar identities.
// - `anchorBeat` must be optional because replacement can start at the first beat
//   of a staff.
// - Underfilled bars should be represented explicitly by rests/gaps or by a
//   well-defined invalid-rhythm state; do not synthesize arbitrary tuplets just
//   to force completion.
// - Tuplet completion should respect existing tuplet context. For example, if a
//   bar already contains a tuplet, generated rest/filler content may use that
//   tuplet context, but the command should not invent unrelated exotic tuplets.
// - Undo should restore removed beats to their original bars and positions, not
//   call the same replacement operation with old snapshots. Multi-bar selection
//   undo is exactly where that shortcut breaks.
