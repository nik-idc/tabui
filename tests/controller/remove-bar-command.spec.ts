import { RemoveBarsCommand } from "../../src/notation/controller/editor/command";
import { DEFAULT_MASTER_BAR, Guitar, Score } from "../../src/notation/model";
import { createScoreGraph } from "../model/helpers";

function createMultiTrackScore(masterBarCount = 3) {
  const graph = createScoreGraph();
  graph.track.insertStaff(1);
  graph.score.addTrack(new Guitar(), "Track 2");

  for (let i = 1; i < masterBarCount; i++) {
    graph.score.appendMasterBar({
      ...DEFAULT_MASTER_BAR,
      tempo: 120 + i * 20,
    });
  }

  return graph;
}

function getStaffBarCounts(score: Score) {
  return score.tracks.map((track) =>
    track.staves.map((staff) => staff.bars.length)
  );
}

describe("RemoveBarsCommand", () => {
  test("execute, undo, and redo remove and restore the requested bar index", () => {
    const { score } = createMultiTrackScore();
    const originalUUIDs = score.masterBars.map((bar) => bar.uuid);
    const originalTempos = score.masterBars.map((bar) => bar.tempo);
    const command = new RemoveBarsCommand(score, 1);

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

  test("execute, undo, and redo remove multiple requested bar indices", () => {
    const { score } = createMultiTrackScore(7);
    const originalUUIDs = score.masterBars.map((bar) => bar.uuid);
    const command = new RemoveBarsCommand(score, [2, 3, 4]);

    command.execute();
    expect(score.masterBars.map((bar) => bar.uuid)).toEqual([
      originalUUIDs[0],
      originalUUIDs[1],
      originalUUIDs[5],
      originalUUIDs[6],
    ]);
    expect(command.removeResults?.map((result) => result.index)).toEqual([
      2, 3, 4,
    ]);
    expect(command.removeResult?.index).toBe(2);

    command.undo();
    expect(score.masterBars.map((bar) => bar.uuid)).toEqual(originalUUIDs);

    command.redo();
    expect(score.masterBars.map((bar) => bar.uuid)).toEqual([
      originalUUIDs[0],
      originalUUIDs[1],
      originalUUIDs[5],
      originalUUIDs[6],
    ]);
  });

  test("update request includes removed master bar indices after execute", () => {
    const { score } = createMultiTrackScore(5);
    const removedUUIDs = score.masterBars.slice(1, 4).map((bar) => bar.uuid);
    const command = new RemoveBarsCommand(score, [1, 2, 3]);

    command.execute();

    expect(command.affectedModels).toEqual([
      { masterBarIndex: 1, modelUUID: removedUUIDs[0] },
      { masterBarIndex: 2, modelUUID: removedUUIDs[1] },
      { masterBarIndex: 3, modelUUID: removedUUIDs[2] },
    ]);
  });
});
