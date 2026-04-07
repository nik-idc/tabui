import {
  DEFAULT_MASTER_BAR,
  Guitar,
  NoteDuration,
} from "../../src/notation/model";
import { InsertBarCommand } from "../../src/notation/controller/editor/command";
import { createScoreGraph } from "../model/helpers";

function createMultiTrackScore() {
  const graph = createScoreGraph();
  graph.track.insertStaff(1);
  graph.score.addTrack(new Guitar(), "Track 2");
  graph.score.appendMasterBar(DEFAULT_MASTER_BAR);
  return graph;
}

function getStaffBarCounts(
  score: ReturnType<typeof createScoreGraph>["score"]
) {
  return score.tracks.map((track) =>
    track.staves.map((staff) => staff.bars.length)
  );
}

describe("InsertBarCommand", () => {
  test("execute, undo, and redo insert at the requested index across all staves", () => {
    const { score } = createMultiTrackScore();
    const originalUUIDs = score.masterBars.map((bar) => bar.uuid);
    const command = new InsertBarCommand(score, 1, {
      ...DEFAULT_MASTER_BAR,
      beatsCount: 3,
      duration: NoteDuration.Eighth,
    });

    command.execute();
    expect(score.masterBars).toHaveLength(3);
    expect(score.masterBars[0].uuid).toBe(originalUUIDs[0]);
    expect(score.masterBars[2].uuid).toBe(originalUUIDs[1]);
    expect(score.masterBars[1].beatsCount).toBe(3);
    expect(score.masterBars[1].duration).toBe(NoteDuration.Eighth);
    expect(getStaffBarCounts(score)).toEqual([[3, 3], [3]]);
    expect(command.insertResult?.index).toBe(1);

    command.undo();
    expect(score.masterBars.map((bar) => bar.uuid)).toEqual(originalUUIDs);

    command.redo();
    expect(score.masterBars).toHaveLength(3);
    expect(score.masterBars[1].beatsCount).toBe(3);
    expect(score.masterBars[2].uuid).toBe(originalUUIDs[1]);
  });
});
