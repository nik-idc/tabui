import { Beat, ScoreEditor, Staff, VoiceNumber } from "../../../model";
import { Command, AffectedModel } from "./command";

/**
 * Inserts clipboard beats locally after an anchor beat. This intentionally does
 * not distribute overflow or fill rhythmic gaps until TabUI has real rests/gaps.
 */
export class InsertBeatsCommand implements Command {
  private _anchorStaff: Staff;
  private _anchorBeat: Beat | undefined;
  private _beatsToInsert: Beat[];
  private _voiceNumber: VoiceNumber;
  private _insertedBeats: Beat[] = [];
  private _executed: boolean = false;

  constructor(
    anchorStaff: Staff,
    anchorBeat: Beat | undefined,
    beatsToInsert: Beat[],
    voiceNumber: VoiceNumber = 1
  ) {
    this._anchorStaff = anchorStaff;
    this._anchorBeat = anchorBeat;
    this._beatsToInsert = beatsToInsert;
    this._voiceNumber = voiceNumber;
  }

  private getInsertionPosition(): { barIndex: number; beatIndex: number } {
    if (this._anchorBeat === undefined) {
      return { barIndex: 0, beatIndex: 0 };
    }

    return {
      barIndex: this._anchorStaff.bars.indexOf(this._anchorBeat.voiceBar.bar),
      beatIndex: this._anchorBeat.voiceBar.beats.indexOf(this._anchorBeat) + 1,
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

    this._insertedBeats = ScoreEditor.insertBeats(
      voiceBar,
      beatIndex,
      this._beatsToInsert
    );
    this._executed = true;
  }

  undo(): void {
    if (!this._executed) {
      return;
    }

    ScoreEditor.removeBeats(this._insertedBeats);
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

    this._insertedBeats = ScoreEditor.insertBeats(
      voiceBar,
      beatIndex,
      this._beatsToInsert
    );
  }

  public get affectedModels(): AffectedModel[] {
    const affectedBar =
      this._anchorBeat?.voiceBar.bar ?? this._anchorStaff.bars[0];

    return [
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
