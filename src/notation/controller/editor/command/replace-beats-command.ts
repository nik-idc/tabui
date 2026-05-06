import { Bar, Beat, ScoreEditor } from "@/notation/model";
import {
  Command,
  CommandUpdateRequest,
  getAffectedMasterBarIndicesFromBeats,
  getAffectedMasterBarUUIDsFromBeats,
} from "./command";

type RemovedBeatSnapshot = {
  bar: Bar;
  index: number;
  beat: Beat;
};

/**
 * Replaces selected beats with clipboard beats using the current permissive
 * model. This intentionally allows underfilled/overfilled bars; future
 * rhythm-aware replacement should wait for explicit rests/gaps in the model.
 */
export class ReplaceBeatsCommand implements Command {
  private _beatsToReplace: Beat[];
  private _newBeats: Beat[];
  private _oldBeatSnapshots: RemovedBeatSnapshot[];
  private _originalBarBeatCounts: Map<Bar, number>;
  private _currentBeats: Beat[];
  private _executed: boolean = false;
  private _affectedMasterBarIndices: number[];
  private _affectedMasterBarUUIDs: number[];

  constructor(beatsToReplace: Beat[], newBeats: Beat[]) {
    this._beatsToReplace = beatsToReplace;
    this._newBeats = newBeats;
    this._oldBeatSnapshots = beatsToReplace.map((beat) => ({
      bar: beat.bar,
      index: beat.bar.beats.indexOf(beat),
      beat: beat.deepCopy(),
    }));
    this._originalBarBeatCounts = new Map(
      new Set(beatsToReplace.map((beat) => beat.bar))
        .values()
        .map((bar) => [bar, bar.beats.length])
    );
    this._currentBeats = beatsToReplace;
    this._affectedMasterBarIndices =
      getAffectedMasterBarIndicesFromBeats(beatsToReplace);
    this._affectedMasterBarUUIDs =
      getAffectedMasterBarUUIDsFromBeats(beatsToReplace);
  }

  execute(): void {
    if (this._executed) {
      throw Error("ReplaceBeatsCommand attempted to execute twice");
    }

    this._currentBeats = ScoreEditor.replaceBeats(
      this._beatsToReplace,
      this._newBeats
    );
    this._executed = true;
  }

  undo(): void {
    if (!this._executed) {
      return;
    }

    ScoreEditor.removeBeats(this._currentBeats);

    const restoredBeats: Beat[] = [];
    const bars = new Set(
      this._oldBeatSnapshots.map((snapshot) => snapshot.bar)
    );
    for (const bar of bars) {
      const barSnapshots = this._oldBeatSnapshots
        .filter((snapshot) => snapshot.bar === bar)
        .sort((a, b) => a.index - b.index);
      const index = Math.min(...barSnapshots.map((snapshot) => snapshot.index));
      const beats = barSnapshots.map((snapshot) => snapshot.beat);
      const removedWholeBar =
        barSnapshots.length === this._originalBarBeatCounts.get(bar);

      if (index === 0 && removedWholeBar && bar.isEmpty()) {
        bar.beats.splice(0, 1);
      }

      restoredBeats.push(...bar.insertBeats(index, beats));
    }

    this._currentBeats = restoredBeats;
  }

  redo(): void {
    if (!this._executed) {
      return;
    }

    this._currentBeats = ScoreEditor.replaceBeats(
      this._currentBeats,
      this._newBeats
    );
  }

  public get updateRequest(): CommandUpdateRequest {
    return {
      updateType: "Horizontal",
      affectedMasterBarUUIDs: this._affectedMasterBarUUIDs,
      affectedMasterBarIndices: this._affectedMasterBarIndices,
      firstAffectedMasterBarIndex: this._affectedMasterBarIndices[0] ?? 0,
      reason: "replace-beats",
    };
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
