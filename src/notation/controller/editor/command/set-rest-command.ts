import { Beat, Note } from "@/notation/model";
import { Command, CommandUpdateRequest } from "./command";

type BeatRestSnapshot = {
  beat: Beat;
  oldRestState: boolean;
  oldNotes: Note[] | null;
};

/** Sets a beat to an explicit rest while preserving its rhythm properties. */
export class SetRestCommand implements Command {
  private _snapshots: BeatRestSnapshot[];
  private _newRestState: boolean;
  private _executed: boolean = false;

  constructor(beats: Beat[], newRestState: boolean) {
    if (beats.length === 0) {
      throw Error("Cannot set rest state for an empty beat selection");
    }

    this._newRestState = newRestState;
    this._snapshots = beats.map((beat) => ({
      beat,
      oldRestState: beat.isRest(),
      oldNotes: beat.notes?.map((note) => note.deepCopy()) ?? null,
    }));
  }

  private applyRestState(
    snapshot: BeatRestSnapshot,
    restStateToApply: boolean
  ): void {
    if (restStateToApply) {
      snapshot.beat.makeRest();
      return;
    }

    snapshot.beat.makeBeatWithNotes();
    if (snapshot.oldNotes === null) {
      return;
    }

    for (let i = 0; i < snapshot.oldNotes.length; i++) {
      snapshot.beat.setNote(i, snapshot.oldNotes[i]);
    }
  }

  execute(): void {
    for (const snapshot of this._snapshots) {
      this.applyRestState(snapshot, this._newRestState);
    }
    this._executed = true;
  }

  undo(): void {
    if (!this._executed) {
      return;
    }

    for (const snapshot of this._snapshots) {
      this.applyRestState(snapshot, snapshot.oldRestState);
    }
  }

  redo(): void {
    if (!this._executed) {
      throw Error("Redo called before execute");
    }

    for (const snapshot of this._snapshots) {
      this.applyRestState(snapshot, this._newRestState);
    }
  }

  public get updateRequest(): CommandUpdateRequest {
    // TODO(rests): This is really bad. Likely will need
    // to switch "Targeted" updates to be multi-affected-model
    if (this._snapshots.length > 1) {
      return { updateType: "Full" };
    }

    return {
      updateType: "Targeted",
      affectedModelUUID: this._snapshots[0].beat.uuid,
    };
  }
}
