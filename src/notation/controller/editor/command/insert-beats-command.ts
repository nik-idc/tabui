import {
  Beat,
  BeatSnapshot,
  BeatPosition,
  ScoreEditor,
  Staff,
  VoiceNumber,
} from "../../../model";
import {
  Command,
  AffectedModel,
  getAffectedModelsFromMasterBars,
} from "./command";

type AfterInsert = { beats: Beat[]; neighborSnapshots: BeatSnapshot[] };

/**
 * Inserts clipboard beats locally after an anchor beat. This intentionally does
 * not distribute overflow or fill rhythmic gaps until TabUI has real rests/gaps.
 */
export class InsertBeatsCommand implements Command {
  private _anchorStaff: Staff;
  /** Stable anchor position for redo after later edits replace the anchor beat. */
  private _anchorPosition: BeatPosition | undefined;
  /** Clipboard input, released after the installed content is saved. */
  private _beatsToInsert: Beat[];
  private _voiceNumber: VoiceNumber;
  private _executed: boolean = false;
  /** Live positions of inserted content, even after later history replaces its beats. */
  private _insertedPositions: BeatPosition[] = [];
  /** Original boundary content, saved before insertion shifts its positions. */
  private _before: BeatSnapshot[] = [];
  /** Fixed installed content and surviving boundary notes for redo. */
  private _after: AfterInsert = { beats: [], neighborSnapshots: [] };

  constructor(
    anchorStaff: Staff,
    anchorBeat: Beat | undefined,
    beatsToInsert: Beat[],
    voiceNumber: VoiceNumber = 1
  ) {
    this._anchorStaff = anchorStaff;
    this._anchorPosition =
      anchorBeat === undefined
        ? undefined
        : ScoreEditor.getBeatPosition(anchorBeat);
    this._beatsToInsert = beatsToInsert;
    this._voiceNumber = voiceNumber;
  }

  private getInsertionPosition(): { barIndex: number; beatIndex: number } {
    if (this._anchorPosition === undefined) {
      return { barIndex: 0, beatIndex: 0 };
    }

    return {
      barIndex: this._anchorStaff.bars.indexOf(
        this._anchorPosition.voiceBar.bar
      ),
      beatIndex: this._anchorPosition.index + 1,
    };
  }

  execute(): void {
    if (this._executed) {
      throw Error("InsertBeatsCommand attempted to execute twice");
    }

    const { barIndex, beatIndex } = this.getInsertionPosition();
    const voiceBar = this._anchorStaff.bars[barIndex].getVoiceBar(
      this._voiceNumber
    );
    if (voiceBar === null) {
      throw Error("Cannot insert beats into an empty voice slot");
    }

    const affected = ScoreEditor.getInsertionEditBeats(voiceBar, beatIndex);
    this._before = ScoreEditor.snapshotBeatNotes(affected);
    const insertedBeats = ScoreEditor.insertBeats(
      voiceBar,
      beatIndex,
      this._beatsToInsert
    );
    this._executed = true;
    this._after = {
      beats: insertedBeats.map((b) => b.deepCopy()),
      neighborSnapshots: ScoreEditor.snapshotBeatNotes(affected),
    };
    this._beatsToInsert = [];
    this._insertedPositions = insertedBeats.map((b) =>
      ScoreEditor.getBeatPosition(b)
    );
  }

  undo(): void {
    if (!this._executed) {
      return;
    }

    ScoreEditor.removeBeats(
      ScoreEditor.resolveBeatPositions(this._insertedPositions)
    );
    ScoreEditor.restoreBeatSnapshots(this._before);
  }

  redo(): void {
    if (!this._executed) {
      return;
    }

    const { barIndex, beatIndex } = this.getInsertionPosition();
    const voiceBar = this._anchorStaff.bars[barIndex].getVoiceBar(
      this._voiceNumber
    );
    if (voiceBar === null) {
      throw Error("Cannot insert beats into an empty voice slot");
    }

    const insertedBeats = ScoreEditor.insertBeats(
      voiceBar,
      beatIndex,
      this._after.beats,
      true
    );
    this._insertedPositions = insertedBeats.map((b) =>
      ScoreEditor.getBeatPosition(b)
    );
    ScoreEditor.restoreBeatSnapshots(this._after.neighborSnapshots);
  }

  public get affectedModels(): AffectedModel[] {
    const affectedBar =
      this._anchorPosition?.voiceBar.bar ?? this._anchorStaff.bars[0];

    return [
      ...getAffectedModelsFromMasterBars(
        this._anchorStaff.track.score,
        this._before.map((s) => s.voiceBar.bar.masterBar)
      ),
      {
        masterBarIndex: this._anchorStaff.track.score.masterBars.indexOf(
          affectedBar.masterBar
        ),
        modelUUID: affectedBar.masterBar.uuid,
      },
    ];
  }
}

// Deferred duration-aware insertion direction:
//
// We attempted to make paste insertion behave musically by treating clipboard
// beats as a duration stream. That approach would fill the current bar first,
// then overwrite or create following bars as needed. It was abandoned for now
// because TabUI currently allows underfilled/overfilled bars and has no explicit
// rest/gap model. Making paste strict while add/remove beat controls remain
// permissive creates inconsistent editing behavior and fragile undo/redo state.
//
// If/when the model introduces rests/gaps and a clear complete-bar invariant,
// revisit insertion with this shape:
//
// - Command state should use `anchorStaff` plus optional `anchorBeat` so
//   insertion at the start of a staff is representable.
// - The core model operation should be one overwrite-insert primitive shared by
//   insertion and replacement.
// - It should use exact tick/rational math, never floating-point duration
//   comparisons.
// - It should respect existing tuplet context rather than invent arbitrary
//   tuplets. MuseScore-like behavior decomposes gaps into rests and handles
//   tuplets within existing tuplet context.
// - If a touched bar is underfilled, the future rest/gap model should determine
//   whether to complete it, leave a gap, or surface invalid rhythm explicitly.
// - Undo/redo should track inserted beats, overwritten beats, filler/rest beats,
//   and any created bars by stable identity, not recompute broad duration ranges
//   from stale indices.
