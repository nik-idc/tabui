import { RemoveBarCommand } from "../../src/notation/controller/editor/command";
import { DEFAULT_MASTER_BAR, Guitar } from "../../src/notation/model";
import { createScoreGraph } from "../model/helpers";

function createMultiTrackScore() {
  const graph = createScoreGraph();
  graph.track.insertStaff(1);
  graph.score.addTrack(new Guitar(), "Track 2");
  graph.score.appendMasterBar({ ...DEFAULT_MASTER_BAR, tempo: 140 });
  graph.score.appendMasterBar({ ...DEFAULT_MASTER_BAR, tempo: 160 });
  return graph;
}

function getStaffBarCounts(
  score: ReturnType<typeof createScoreGraph>["score"]
) {
  return score.tracks.map((track) =>
    track.staves.map((staff) => staff.bars.length)
  );
}

describe("RemoveBarCommand", () => {
  test("execute, undo, and redo remove and restore the requested bar index", () => {
    const { score } = createMultiTrackScore();
    const originalUUIDs = score.masterBars.map((bar) => bar.uuid);
    const originalTempos = score.masterBars.map((bar) => bar.tempo);
    const command = new RemoveBarCommand(score, 1);

    command.execute();
    expect(score.masterBars).toHaveLength(2);
    expect(score.masterBars.map((bar) => bar.uuid)).toEqual([
      originalUUIDs[0],
      originalUUIDs[2],
    ]);
    expect(getStaffBarCounts(score)).toEqual([[2, 2], [2]]);
    expect(command.removeResult?.index).toBe(1);

    command.undo();
    expect(score.masterBars).toHaveLength(3);
    expect(score.masterBars.map((bar) => bar.tempo)).toEqual(originalTempos);
    expect(getStaffBarCounts(score)).toEqual([[3, 3], [3]]);

    command.redo();
    expect(score.masterBars.map((bar) => bar.uuid)).toEqual([
      originalUUIDs[0],
      originalUUIDs[2],
    ]);
  });
});
