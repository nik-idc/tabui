import {
  Bar,
  DEFAULT_MASTER_BAR,
  Guitar,
  Score,
} from "../../../src/notation/model";
import { PrependBarCommand } from "../../../src/notation/controller/editor/command";
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

describe("PrependBarCommand", () => {
  test("execute, undo, and redo prepend and restore the same structural slot", () => {
    const { score, masterBar } = createMultiTrackScore();
    const staves = score.tracks.flatMap((v) => v.staves);
    const originalBars = staves.map((v) => [...v.bars]);
    const command = new PrependBarCommand(score, {
      ...DEFAULT_MASTER_BAR,
      tempo: 90,
      isRepeatStart: true,
      isRepeatEnd: false,
    });

    command.execute();
    expect(score.masterBars).toHaveLength(2);
    expect(score.masterBars[0].tempo).toBe(90);
    expect(score.masterBars[1]).toBe(masterBar);
    const addedMasterBar = score.masterBars[0];
    const addedBars = staves.map((v) => v.bars[0]);
    const expectedBars = originalBars.map((v, i) => [addedBars[i], v[0]]);
    expectStaffBars(score, expectedBars);
    expect(addedMasterBar.isRepeatStart).toBe(true);
    expect(command.prependResult?.index).toBe(0);
    expect(command.affectedModels).toEqual([
      { masterBarIndex: 0, modelUUID: addedMasterBar.uuid },
    ]);

    command.undo();
    expect(score.masterBars).toHaveLength(1);
    expect(score.masterBars[0]).toBe(masterBar);
    expectStaffBars(score, originalBars);

    command.redo();
    expect(score.masterBars).toHaveLength(2);
    expect(score.masterBars[0].tempo).toBe(90);
    expect(score.masterBars[0]).toBe(addedMasterBar);
    expect(score.masterBars[1]).toBe(masterBar);
    expectStaffBars(score, expectedBars);
  });
});
