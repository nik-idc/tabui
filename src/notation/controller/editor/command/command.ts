import { Beat, MasterBar, Score } from "@/notation/model";

export interface VerticalUpdateRequest {
  updateType: "Vertical";
  affectedModelUUIDs: number[];
}

export interface HorizontalUpdateRequest {
  updateType: "Horizontal";
  affectedMasterBarUUIDs?: number[];
  affectedMasterBarIndices: number[];
  firstAffectedMasterBarIndex: number;
  reason?: string;
}

export interface TargetedUpdateRequest {
  updateType: "Targeted";
  affectedModelUUID: number;
}

export interface FullUpdateRequest {
  updateType: "Full";
}

export type CommandUpdateRequest =
  | VerticalUpdateRequest
  | HorizontalUpdateRequest
  | TargetedUpdateRequest
  | FullUpdateRequest;

export function getMasterBarIndex(score: Score, masterBar: MasterBar): number {
  return score.masterBars.indexOf(masterBar);
}

export function getAffectedMasterBarIndicesFromBeats(beats: Beat[]): number[] {
  return Array.from(
    new Set(
      beats.map((beat) =>
        getMasterBarIndex(
          beat.voiceBar.bar.staff.track.score,
          beat.voiceBar.bar.masterBar
        )
      )
    )
  )
    .filter((masterBarIndex) => masterBarIndex >= 0)
    .sort((a, b) => a - b);
}

export function getAffectedMasterBarUUIDsFromBeats(beats: Beat[]): number[] {
  return Array.from(
    new Set(beats.map((beat) => beat.voiceBar.bar.masterBar.uuid))
  );
}

// Commands should own undo/redo state. Prefer ScoreEditor for structural model
// edits; direct model mutation is acceptable for simple local value changes.
export interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
  readonly updateRequest: CommandUpdateRequest;
}
