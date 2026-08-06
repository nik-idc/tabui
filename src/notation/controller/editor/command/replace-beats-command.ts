import {
  Beat,
  BeatRemovalOutput,
  BeatRestoreSnapshot,
  Score,
  ScoreEditor,
} from "../../../model";
import { Command, AffectedModel, getAffectedModelsFromBeats } from "./command";

/**
 * Replaces selected beats with clipboard beats using the current permissive
 * model. This intentionally allows underfilled/overfilled bars; future
 * rhythm-aware replacement should wait for explicit rests/gaps in the model.
 */
export class ReplaceBeatsCommand implements Command {
  private _beatsToReplace: Beat[];
  private _newBeats: Beat[];
  private _oldBeatSnapshots: BeatRestoreSnapshot[];
  private _currentBeats: Beat[];
  private _removalOutputs: BeatRemovalOutput[];
  private _executed: boolean = false;
  private _affectedModels: AffectedModel[];

  constructor(beatsToReplace: Beat[], newBeats: Beat[]) {
    this._beatsToReplace = beatsToReplace;
    this._newBeats = newBeats;
    this._oldBeatSnapshots = beatsToReplace.map((beat) => ({
      voiceBar: beat.voiceBar,
      index: beat.voiceBar.beats.indexOf(beat),
      beat: beat.deepCopy(),
    }));
    this._currentBeats = beatsToReplace;
    this._removalOutputs = [];
    this._affectedModels = getAffectedModelsFromBeats(beatsToReplace);
  }

  execute(): void {
    if (this._executed) {
      throw Error("ReplaceBeatsCommand attempted to execute twice");
    }

    const output = ScoreEditor.replaceBeats(
      this._beatsToReplace,
      this._newBeats
    );
    this._currentBeats = output.insertedBeats;
    this._removalOutputs = output.removalOutputs;
    this._executed = true;
  }

  undo(): void {
    if (!this._executed) {
      return;
    }

    ScoreEditor.discardBeatRemovalInsertions(this._removalOutputs);
    ScoreEditor.prepareBeatRestore(this._currentBeats);
    this._currentBeats = ScoreEditor.restoreBeats(this._oldBeatSnapshots);
  }

  redo(): void {
    if (!this._executed) {
      return;
    }

    const output = ScoreEditor.replaceBeats(this._currentBeats, this._newBeats);
    this._currentBeats = output.insertedBeats;
    this._removalOutputs = output.removalOutputs;
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
