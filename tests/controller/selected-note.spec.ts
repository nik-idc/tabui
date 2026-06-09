import {
  MoveRightResult,
  SelectedNote,
} from "../../src/notation/controller/selection/selected-note";
import { DEFAULT_MASTER_BAR } from "../../src/notation/model";
import { createScoreGraph } from "../model/helpers";

function getVoiceBar1(bar: ReturnType<typeof createScoreGraph>["bar"]) {
  const voiceBar = bar.getVoiceBar(1);
  if (voiceBar === null) {
    throw Error("Expected voice 1 in test bar");
  }

  return voiceBar;
}

describe("SelectedNote", () => {
  test("moveRight advances to the next beat slot when adding a beat from seed state", () => {
    const { bar } = createScoreGraph();
    const voiceBar = getVoiceBar1(bar);
    const selectedNote = new SelectedNote(voiceBar.beats[0].notes[0]);

    const result = selectedNote.moveRight();

    expect(result.result).toBe(MoveRightResult.AddedBeat);
    expect(result.addedBar).toBe(false);
    expect(selectedNote.bar).toBe(bar);
    expect(selectedNote.beatIndex).toBe(1);
  });

  test("moveLeft from the very first beat keeps selection in place", () => {
    const { bar } = createScoreGraph();
    const selectedNote = new SelectedNote(getVoiceBar1(bar).beats[0].notes[0]);

    selectedNote.moveLeft();

    expect(selectedNote.barIndex).toBe(0);
    expect(selectedNote.beatIndex).toBe(0);
  });

  test("moveLeft from first beat of next bar jumps to previous bar last beat", () => {
    const { score, bar } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);

    const secondBar = bar.staff.bars[1];
    const selectedNote = new SelectedNote(
      getVoiceBar1(secondBar).beats[0].notes[0]
    );

    selectedNote.moveLeft();

    expect(selectedNote.barIndex).toBe(0);
    expect(selectedNote.beatIndex).toBe(getVoiceBar1(bar).beats.length - 1);
    expect(selectedNote.bar).toBe(bar);
  });

  test("moveRight from full final bar requests adding a new bar", () => {
    const { bar } = createScoreGraph();
    const voiceBar = getVoiceBar1(bar);
    const selectedNote = new SelectedNote(voiceBar.beats[0].notes[0]);

    voiceBar.appendBeats();
    voiceBar.appendBeats();
    voiceBar.appendBeats();

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
    const voiceBar = getVoiceBar1(bar);
    const selectedNote = new SelectedNote(voiceBar.beats[0].notes[0]);

    voiceBar.appendBeats();
    voiceBar.appendBeats();
    voiceBar.appendBeats();

    selectedNote.moveRight();
    selectedNote.moveRight();
    selectedNote.moveRight();
    const result = selectedNote.moveRight();

    expect(result.result).toBe(MoveRightResult.Nothing);
    expect(result.addedBar).toBe(false);
    expect(selectedNote.barIndex).toBe(1);
    expect(selectedNote.beatIndex).toBe(0);
  });

  test("moveRight seeds selected voice when next bar has no voice slot", () => {
    const { score, bar } = createScoreGraph();
    const voiceBar = bar.insertVoiceBar(3);
    score.appendMasterBar(DEFAULT_MASTER_BAR, 1);
    const nextBar = bar.staff.bars[1];
    const selectedNote = new SelectedNote(voiceBar.beats[0].notes[0]);

    voiceBar.appendBeats();
    voiceBar.appendBeats();
    voiceBar.appendBeats();

    selectedNote.moveRight();
    selectedNote.moveRight();
    selectedNote.moveRight();
    const result = selectedNote.moveRight();

    expect(result.result).toBe(MoveRightResult.Nothing);
    expect(nextBar.getVoiceBar(3)).not.toBeNull();
    expect(selectedNote.bar).toBe(nextBar);
    expect(selectedNote.voiceBar).toBe(nextBar.getVoiceBar(3));
    expect(selectedNote.beatIndex).toBe(0);
  });

  test("moveUp and moveDown wrap between first and last note indices", () => {
    const { bar } = createScoreGraph();
    const selectedNote = new SelectedNote(getVoiceBar1(bar).beats[0].notes[0]);

    selectedNote.moveUp();
    expect(selectedNote.noteIndex).toBe(
      bar.trackContext.instrument.maxPolyphony - 1
    );

    selectedNote.moveDown();
    expect(selectedNote.noteIndex).toBe(0);
  });

  test("afterAddedBar throws if last move right was not AddedBar", () => {
    const { bar } = createScoreGraph();
    const selectedNote = new SelectedNote(getVoiceBar1(bar).beats[0].notes[0]);

    expect(() => selectedNote.afterAddedBar()).toThrow(
      "After added bar called when last move right result is not added bar"
    );
  });

  test("syncToStructure clamps stale bar and beat indices after structural shrink", () => {
    const { score, bar } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const secondBar = bar.staff.bars[1];
    const secondVoiceBar = getVoiceBar1(secondBar);
    secondVoiceBar.appendBeats();
    secondVoiceBar.appendBeats();

    const selectedNote = new SelectedNote(secondVoiceBar.beats[2].notes[0]);

    score.removeMasterBar(1);
    selectedNote.syncToStructure();
    expect(selectedNote.barIndex).toBe(0);

    const voiceBar = getVoiceBar1(bar);
    voiceBar.appendBeats();
    voiceBar.appendBeats();
    selectedNote.moveRight();
    selectedNote.moveRight();
    voiceBar.removeBeat(2);
    voiceBar.removeBeat(1);

    selectedNote.syncToStructure();
    expect(selectedNote.beatIndex).toBe(0);
  });
});
