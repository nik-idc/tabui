import {
  MoveRightResult,
  SelectedNote,
} from "../../src/notation/controller/selection/selected-note";
import { DEFAULT_MASTER_BAR } from "../../src/notation/model";
import { createScoreGraph } from "../model/helpers";

describe("SelectedNote", () => {
  test("moveRight advances to the next beat slot when adding a beat from seed state", () => {
    const { bar } = createScoreGraph();
    const selectedNote = new SelectedNote(bar.beats[0].notes[0]);

    const result = selectedNote.moveRight();

    expect(result.result).toBe(MoveRightResult.AddedBeat);
    expect(result.addedBar).toBe(false);
    expect(selectedNote.bar).toBe(bar);
    expect(selectedNote.beatIndex).toBe(1);
  });

  test("moveLeft from the very first beat keeps selection in place", () => {
    const { bar } = createScoreGraph();
    const selectedNote = new SelectedNote(bar.beats[0].notes[0]);

    selectedNote.moveLeft();

    expect(selectedNote.barIndex).toBe(0);
    expect(selectedNote.beatIndex).toBe(0);
  });

  test("moveLeft from first beat of next bar jumps to previous bar last beat", () => {
    const { score, bar } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);

    const secondBar = bar.staff.bars[1];
    const selectedNote = new SelectedNote(secondBar.beats[0].notes[0]);

    selectedNote.moveLeft();

    expect(selectedNote.barIndex).toBe(0);
    expect(selectedNote.beatIndex).toBe(bar.beats.length - 1);
    expect(selectedNote.bar).toBe(bar);
  });

  test("moveRight from full final bar requests adding a new bar", () => {
    const { bar } = createScoreGraph();
    const selectedNote = new SelectedNote(bar.beats[0].notes[0]);

    bar.appendBeats();
    bar.appendBeats();
    bar.appendBeats();

    selectedNote.moveRight();
    selectedNote.moveRight();
    selectedNote.moveRight();
    const result = selectedNote.moveRight();

    expect(result.result).toBe(MoveRightResult.AddedBar);
    expect(result.addedBar).toBe(true);
  });

  test("moveRight from full bar moves to the next existing bar", () => {
    const { score, bar } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const selectedNote = new SelectedNote(bar.beats[0].notes[0]);

    bar.appendBeats();
    bar.appendBeats();
    bar.appendBeats();

    selectedNote.moveRight();
    selectedNote.moveRight();
    selectedNote.moveRight();
    const result = selectedNote.moveRight();

    expect(result.result).toBe(MoveRightResult.Nothing);
    expect(result.addedBar).toBe(false);
    expect(selectedNote.barIndex).toBe(1);
    expect(selectedNote.beatIndex).toBe(0);
  });

  test("moveUp and moveDown wrap between first and last note indices", () => {
    const { bar } = createScoreGraph();
    const selectedNote = new SelectedNote(bar.beats[0].notes[0]);

    selectedNote.moveUp();
    expect(selectedNote.noteIndex).toBe(
      bar.trackContext.instrument.maxPolyphony - 1
    );

    selectedNote.moveDown();
    expect(selectedNote.noteIndex).toBe(0);
  });

  test("afterAddedBar throws if last move right was not AddedBar", () => {
    const { bar } = createScoreGraph();
    const selectedNote = new SelectedNote(bar.beats[0].notes[0]);

    expect(() => selectedNote.afterAddedBar()).toThrow(
      "After added bar called when last move right result is not added bar"
    );
  });

  test("syncToStructure clamps stale bar and beat indices after structural shrink", () => {
    const { score, bar } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const secondBar = bar.staff.bars[1];
    secondBar.appendBeats();
    secondBar.appendBeats();

    const selectedNote = new SelectedNote(secondBar.beats[2].notes[0]);

    score.removeMasterBar(1);
    selectedNote.syncToStructure();
    expect(selectedNote.barIndex).toBe(0);

    bar.appendBeats();
    bar.appendBeats();
    selectedNote.moveRight();
    selectedNote.moveRight();
    bar.removeBeat(2);
    bar.removeBeat(1);

    selectedNote.syncToStructure();
    expect(selectedNote.beatIndex).toBe(0);
  });
});
