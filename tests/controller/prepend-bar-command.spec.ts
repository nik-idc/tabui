import {
  BarRepeatStatus,
  DEFAULT_MASTER_BAR,
  Guitar,
} from "../../src/notation/model";
import { PrependBarCommand } from "../../src/notation/controller/editor/command";
import { createScoreGraph } from "../model/helpers";

function createMultiTrackScore() {
  const graph = createScoreGraph();
  graph.track.insertStaff(1);
  graph.score.addTrack(new Guitar(), "Track 2");
  return graph;
}

function getStaffBarCounts(
  score: ReturnType<typeof createScoreGraph>["score"]
) {
  return score.tracks.map((track) =>
    track.staves.map((staff) => staff.bars.length)
  );
}

describe("PrependBarCommand", () => {
  test("execute, undo, and redo prepend and restore the same structural slot", () => {
    const { score, masterBar } = createMultiTrackScore();
    const originalFirstUUID = masterBar.uuid;
    const command = new PrependBarCommand(score, {
      ...DEFAULT_MASTER_BAR,
      tempo: 90,
      repeatStatus: BarRepeatStatus.Start,
    });

    command.execute();
    expect(score.masterBars).toHaveLength(2);
    expect(score.masterBars[0].tempo).toBe(90);
    expect(score.masterBars[1].uuid).toBe(originalFirstUUID);
    expect(getStaffBarCounts(score)).toEqual([[2, 2], [2]]);
    expect(command.prependResult?.index).toBe(0);

    command.undo();
    expect(score.masterBars).toHaveLength(1);
    expect(score.masterBars[0].uuid).toBe(originalFirstUUID);

    command.redo();
    expect(score.masterBars).toHaveLength(2);
    expect(score.masterBars[0].tempo).toBe(90);
    expect(score.masterBars[1].uuid).toBe(originalFirstUUID);
  });
});
