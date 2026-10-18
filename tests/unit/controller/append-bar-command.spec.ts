import {
  Bar,
  DEFAULT_MASTER_BAR,
  Guitar,
  Score,
} from "../../../src/notation/model";
import { AppendBarCommand } from "../../../src/notation/controller/editor/command";
import { createScoreGraph } from "../model/helpers";

function createMultiTrackScore() {
  const graph = createScoreGraph();
  graph.track.insertStaff(1);
  graph.score.addTrack(new Guitar(), "Track 2");
  return graph;
}

function expectStaffBars(score: Score, expectedBars: Bar[][]) {
  const staves = score.tracks.flatMap((v) => v.staves);
  expect(staves).toHaveLength(expectedBars.length);
  staves.forEach((s, i) => {
    expect(s.bars).toHaveLength(expectedBars[i].length);
    s.bars.forEach((b, j) => {
      expect(b).toBe(expectedBars[i][j]);
      expect(b.masterBar).toBe(score.masterBars[j]);
    });
  });
}

describe("AppendBarCommand", () => {
  test("execute, undo, and redo keep master bars and staff bars aligned", () => {
    const { score } = createMultiTrackScore();
    const originalMasterBar = score.masterBars[0];
    const staves = score.tracks.flatMap((v) => v.staves);
    const originalBars = staves.map((v) => [...v.bars]);
    const command = new AppendBarCommand(score, {
      ...DEFAULT_MASTER_BAR,
      tempo: 160,
      isRepeatStart: false,
      isRepeatEnd: true,
    });

    command.execute();
    expect(score.masterBars).toHaveLength(2);
    expect(score.masterBars[1].tempo).toBe(160);
    const addedMasterBar = score.masterBars[1];
    const addedBars = staves.map((v) => v.bars[1]);
    const expectedBars = originalBars.map((v, i) => [v[0], addedBars[i]]);
    expectStaffBars(score, expectedBars);
    expect(score.masterBars[0]).toBe(originalMasterBar);
    expect(addedMasterBar.isRepeatEnd).toBe(true);
    expect(command.appendResult?.index).toBe(1);
    expect(command.affectedModels).toEqual([
      { masterBarIndex: 1, modelUUID: addedMasterBar.uuid },
    ]);

    command.undo();
    expect(score.masterBars).toHaveLength(1);
    expect(score.masterBars[0]).toBe(originalMasterBar);
    expectStaffBars(score, originalBars);

    command.redo();
    expect(score.masterBars).toHaveLength(2);
    expect(score.masterBars[1].tempo).toBe(160);
    expect(score.masterBars[0]).toBe(originalMasterBar);
    expect(score.masterBars[1]).toBe(addedMasterBar);
    expectStaffBars(score, expectedBars);
  });
});
