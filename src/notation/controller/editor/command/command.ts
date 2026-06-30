import { Beat } from "@/notation/model";

export type AffectedModel = {
  masterBarIndex: number;
  modelUUID: number;
};

export function getAffectedModelsFromBeats(beats: Beat[]): AffectedModel[] {
  const affectedModels: AffectedModel[] = [];
  const seenBeatUUIDs = new Set<number>();

  for (const beat of beats) {
    const score = beat.voiceBar.bar.staff.track.score;
    const masterBarIndex = score.masterBars.indexOf(
      beat.voiceBar.bar.masterBar
    );
    if (masterBarIndex < 0) {
      continue;
    }

    if (seenBeatUUIDs.has(beat.uuid)) {
      continue;
    }

    seenBeatUUIDs.add(beat.uuid);
    affectedModels.push({ masterBarIndex, modelUUID: beat.uuid });
  }

  return affectedModels.sort((a, b) => a.masterBarIndex - b.masterBarIndex);
}

// Commands should own undo/redo state. Prefer ScoreEditor for structural model
// edits; direct model mutation is acceptable for simple local value changes.
export interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
  readonly affectedModels: AffectedModel[];
}
