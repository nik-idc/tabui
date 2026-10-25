import { RemoveBarsCommand } from "../../../src/notation/controller/editor/command";
import {
  Bar,
  DEFAULT_MASTER_BAR,
  Guitar,
  GuitarNote,
  NoteDuration,
  Score,
} from "../../../src/notation/model";
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

describe("RemoveBarsCommand", () => {
  test("execute, undo, and redo remove and restore the requested bar index", () => {
    const { score } = createMultiTrackScore();
    const originalUUIDs = score.masterBars.map((bar) => bar.uuid);
    const originalTempos = score.masterBars.map((bar) => bar.tempo);
    const originalMasterBars = [...score.masterBars];
    const originalBars = score.tracks.flatMap((v) =>
      v.staves.map((s) => [...s.bars])
    );
    const remainingBars = originalBars.map((v) => [v[0], v[2]]);
    const removedBeat = originalBars[2][1].getVoiceBar(1)?.beats[0];
    if (removedBeat === undefined) {
      throw Error("Expected a beat in the removed bar");
    }
    removedBeat.makeBeatWithNotes();
    const removedNote = removedBeat.notes?.[0];
    if (!(removedNote instanceof GuitarNote)) {
      throw Error("Expected a guitar note in the removed bar");
    }
    removedNote.fret = 9;
    removedBeat.baseDuration = NoteDuration.Eighth;
    removedBeat.dots = 1;
    const command = new RemoveBarsCommand(score, 1);

    command.execute();
    expect(score.masterBars).toHaveLength(2);
    expect(score.masterBars.map((bar) => bar.uuid)).toEqual([
      originalUUIDs[0],
      originalUUIDs[2],
    ]);
    expectStaffBars(score, remainingBars);
    expect(command.removeResult?.index).toBe(1);

    command.undo();
    expect(score.masterBars).toHaveLength(3);
    expect(score.masterBars.map((bar) => bar.tempo)).toEqual(originalTempos);
    originalMasterBars.forEach((v, i) => expect(score.masterBars[i]).toBe(v));
    expectStaffBars(score, originalBars);
    const restoredBeat =
      score.tracks[1].staves[0].bars[1].getVoiceBar(1)?.beats[0];
    expect(restoredBeat).toBe(removedBeat);
    expect(restoredBeat?.notes?.[0]).toEqual(
      expect.objectContaining({ fret: 9 })
    );
    expect(restoredBeat?.baseDuration).toBe(NoteDuration.Eighth);
    expect(restoredBeat?.dots).toBe(1);

    command.redo();
    expect(score.masterBars.map((bar) => bar.uuid)).toEqual([
      originalUUIDs[0],
      originalUUIDs[2],
    ]);
    expectStaffBars(score, remainingBars);
  });

  test("execute, undo, and redo remove each requested original bar index once", () => {
    const { score } = createMultiTrackScore(7);
    const originalUUIDs = score.masterBars.map((bar) => bar.uuid);
    const originalMasterBars = [...score.masterBars];
    const originalBars = score.tracks.flatMap((v) =>
      v.staves.map((s) => [...s.bars])
    );
    const remainingBars = originalBars.map((v) => [v[0], v[1], v[5], v[6]]);
    const command = new RemoveBarsCommand(score, [4, 2, 3, 2]);

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
    expectStaffBars(score, remainingBars);

    command.undo();
    expect(score.masterBars.map((bar) => bar.uuid)).toEqual(originalUUIDs);
    originalMasterBars.forEach((v, i) => expect(score.masterBars[i]).toBe(v));
    expectStaffBars(score, originalBars);

    command.redo();
    expect(score.masterBars.map((bar) => bar.uuid)).toEqual([
      originalUUIDs[0],
      originalUUIDs[1],
      originalUUIDs[5],
      originalUUIDs[6],
    ]);
    expectStaffBars(score, remainingBars);
  });

  test("affected models identify removed bars and the newly joined boundary", () => {
    const { score } = createMultiTrackScore(5);
    const removedUUIDs = score.masterBars.slice(1, 4).map((bar) => bar.uuid);
    const command = new RemoveBarsCommand(score, [1, 2, 3]);

    command.execute();

    expect(command.affectedModels).toEqual([
      { masterBarIndex: 1, modelUUID: score.masterBars[1].uuid },
      { masterBarIndex: 1, modelUUID: removedUUIDs[0] },
      { masterBarIndex: 2, modelUUID: removedUUIDs[1] },
      { masterBarIndex: 3, modelUUID: removedUUIDs[2] },
    ]);
  });
});
