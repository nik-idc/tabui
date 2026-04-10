import {
  BarRepeatStatus,
  DEFAULT_MASTER_BAR,
  Guitar,
} from "../../src/notation/model";
import { AppendBarCommand } from "../../src/notation/controller/editor/command";
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

describe("AppendBarCommand", () => {
  test("execute, undo, and redo keep master bars and staff bars aligned", () => {
    const { score } = createMultiTrackScore();
    const command = new AppendBarCommand(score, {
      ...DEFAULT_MASTER_BAR,
      tempo: 160,
      repeatStatus: BarRepeatStatus.End,
    });

    command.execute();
    expect(score.masterBars).toHaveLength(2);
    expect(score.masterBars[1].tempo).toBe(160);
    expect(getStaffBarCounts(score)).toEqual([[2, 2], [2]]);
    expect(command.appendResult?.index).toBe(1);

    command.undo();
    expect(score.masterBars).toHaveLength(1);
    expect(getStaffBarCounts(score)).toEqual([[1, 1], [1]]);

    command.redo();
    expect(score.masterBars).toHaveLength(2);
    expect(score.masterBars[1].tempo).toBe(160);
    expect(getStaffBarCounts(score)).toEqual([[2, 2], [2]]);
  });
});
