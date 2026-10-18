import { Beat, MasterBar, Score } from "../../../model";

export type AffectedModel = {
  masterBarIndex: number;
  modelUUID: number;
};

/** Includes edited master bars and their successors, whose change labels may differ. */
export function getAffectedModelsFromMasterBars(
  score: Score,
  bars: MasterBar[]
): AffectedModel[] {
  const targets = new Set(bars);
  return score.masterBars.flatMap((bar, index) =>
    targets.has(bar) || targets.has(score.masterBars[index - 1])
      ? [{ masterBarIndex: index, modelUUID: bar.uuid }]
      : []
  );
}

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
  /** Explicit false means execution made no edit and must not enter history. */
  readonly executed?: boolean;
  execute(): void;
  undo(): void;
  redo(): void;
  readonly affectedModels: AffectedModel[];
}
