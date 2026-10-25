import {
  Bar,
  DEFAULT_MASTER_BAR,
  Guitar,
  NoteDuration,
  Score,
} from "../../../src/notation/model";
import { InsertBarCommand } from "../../../src/notation/controller/editor/command";
import { createScoreGraph } from "../model/helpers";

function createMultiTrackScore() {
  const graph = createScoreGraph();
  graph.track.insertStaff(1);
  graph.score.addTrack(new Guitar(), "Track 2");
  graph.score.appendMasterBar(DEFAULT_MASTER_BAR);
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

describe("InsertBarCommand", () => {
  test("execute, undo, and redo insert at the requested index across all staves", () => {
    const { score } = createMultiTrackScore();
    const originalMasterBars = [...score.masterBars];
    const staves = score.tracks.flatMap((v) => v.staves);
    const originalBars = staves.map((v) => [...v.bars]);
    const command = new InsertBarCommand(score, 1, {
      ...DEFAULT_MASTER_BAR,
      beatsCount: 3,
      duration: NoteDuration.Eighth,
    });

    command.execute();
    expect(score.masterBars).toHaveLength(3);
    expect(score.masterBars[0]).toBe(originalMasterBars[0]);
    expect(score.masterBars[2]).toBe(originalMasterBars[1]);
    expect(score.masterBars[1].beatsCount).toBe(3);
    expect(score.masterBars[1].duration).toBe(NoteDuration.Eighth);
    const addedMasterBar = score.masterBars[1];
    const addedBars = staves.map((v) => v.bars[1]);
    const expectedBars = originalBars.map((v, i) => [v[0], addedBars[i], v[1]]);
    expectStaffBars(score, expectedBars);
    expect(command.insertResult?.index).toBe(1);
    expect(command.affectedModels).toEqual([
      { masterBarIndex: 1, modelUUID: addedMasterBar.uuid },
      { masterBarIndex: 2, modelUUID: originalMasterBars[1].uuid },
    ]);

    command.undo();
    expect(score.masterBars).toHaveLength(2);
    expect(score.masterBars[0]).toBe(originalMasterBars[0]);
    expect(score.masterBars[1]).toBe(originalMasterBars[1]);
    expectStaffBars(score, originalBars);

    command.redo();
    expect(score.masterBars).toHaveLength(3);
    expect(score.masterBars[1].beatsCount).toBe(3);
    expect(score.masterBars[0]).toBe(originalMasterBars[0]);
    expect(score.masterBars[1]).toBe(addedMasterBar);
    expect(score.masterBars[2]).toBe(originalMasterBars[1]);
    expect(score.masterBars[1].duration).toBe(NoteDuration.Eighth);
    expectStaffBars(score, expectedBars);
  });
});
