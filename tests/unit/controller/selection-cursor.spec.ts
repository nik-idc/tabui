import {
  MoveRightResult,
  SelectionCursor,
} from "../../../src/notation/controller/selection/selection-cursor";
import { DEFAULT_MASTER_BAR, Score } from "../../../src/notation/model";
import { createScoreGraph } from "../model/helpers";

describe("SelectionCursor", () => {
  test("can represent a cursor on a rest beat lane", () => {
    const score = new Score();
    const bar = score.tracks[0].staves[0].bars[0];
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    const beat = voiceBar.beats[0];
    const selectionCursor = new SelectionCursor(beat, 2);

    expect(beat.isRest()).toBe(true);
    expect(selectionCursor.beat).toBe(beat);
    expect(selectionCursor.note).toBeNull();
    expect(selectionCursor.noteIndex).toBe(2);
  });

  test("moveRight advances to the next beat slot when adding a beat from seed state", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    const selectionCursor = new SelectionCursor(voiceBar.beats[0], 0);

    const result = selectionCursor.moveRight();

    expect(result.result).toBe(MoveRightResult.AddedBeat);
    expect(result.addedBar).toBe(false);
    expect(selectionCursor.bar).toBe(bar);
    expect(selectionCursor.beatIndex).toBe(1);
  });

  test("moveLeft from the very first beat keeps selection in place", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    const beat = voiceBar.beats[0];
    const selectionCursor = new SelectionCursor(beat, 0);

    selectionCursor.moveLeft();

    expect(selectionCursor.barIndex).toBe(0);
    expect(selectionCursor.beatIndex).toBe(0);
  });

  test("moveLeft from first beat of next bar jumps to previous bar last beat", () => {
    const { score, bar } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);

    const previousVoice = bar.getVoiceBar(1);
    const nextVoice = bar.staff.bars[1].getVoiceBar(1);
    if (previousVoice === null || nextVoice === null) {
      throw Error("Expected voice 1 bars");
    }
    previousVoice.appendBeats();
    previousVoice.appendBeats();
    const selectionCursor = new SelectionCursor(nextVoice.beats[0], 2);

    expect(selectionCursor.barIndex).toBe(1);

    selectionCursor.moveLeft();

    expect(selectionCursor.barIndex).toBe(0);
    expect(selectionCursor.beatIndex).toBe(2);
    expect(selectionCursor.beat).toBe(previousVoice.beats[2]);
    expect(selectionCursor.noteIndex).toBe(2);
    expect(selectionCursor.bar).toBe(bar);
  });

  test("moveRight from full final bar requests a new bar and selects it after insertion", () => {
    const { score, bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    const selectionCursor = new SelectionCursor(voiceBar.beats[0], 2);

    voiceBar.appendBeats();
    voiceBar.appendBeats();
    voiceBar.appendBeats();

    selectionCursor.moveRight();
    selectionCursor.moveRight();
    selectionCursor.moveRight();
    const result = selectionCursor.moveRight();

    expect(result.result).toBe(MoveRightResult.AddedBar);
    expect(result.addedBar).toBe(true);

    score.appendMasterBar(DEFAULT_MASTER_BAR);
    selectionCursor.afterAddedBar();

    const nextBar = bar.staff.bars[1];
    expect(selectionCursor.bar).toBe(nextBar);
    expect(selectionCursor.beat).toBe(nextBar.getVoiceBar(1)?.beats[0]);
    expect(selectionCursor.beatIndex).toBe(0);
    expect(selectionCursor.noteIndex).toBe(2);
  });

  test("moveRight from full bar moves to the next existing bar", () => {
    const { score, bar } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    const selectionCursor = new SelectionCursor(voiceBar.beats[0], 0);

    voiceBar.appendBeats();
    voiceBar.appendBeats();
    voiceBar.appendBeats();

    selectionCursor.moveRight();
    selectionCursor.moveRight();
    selectionCursor.moveRight();
    const result = selectionCursor.moveRight();

    expect(result.result).toBe(MoveRightResult.Nothing);
    expect(result.addedBar).toBe(false);
    expect(selectionCursor.barIndex).toBe(1);
    expect(selectionCursor.beatIndex).toBe(0);
  });

  test("view-only moveRight selects the closest existing voice", () => {
    const { score, bar } = createScoreGraph();
    const voiceBar = bar.insertVoiceBar(3);
    score.appendMasterBar(DEFAULT_MASTER_BAR, 1);
    const nextBar = bar.staff.bars[1];
    nextBar.removeVoiceBar(3);
    nextBar.insertVoiceBar(4);
    voiceBar.appendBeats();
    voiceBar.appendBeats();
    voiceBar.appendBeats();
    const selectionCursor = new SelectionCursor(voiceBar.beats[3], 0);

    selectionCursor.moveRight(false);

    expect(selectionCursor.bar).toBe(nextBar);
    expect(selectionCursor.voiceNumber).toBe(4);
    expect(nextBar.getVoiceBar(3)).toBeNull();
  });

  test("view-only sparse voice ties prefer the lower voice number", () => {
    const { score, bar } = createScoreGraph();
    const voiceBar = bar.insertVoiceBar(3);
    score.appendMasterBar(DEFAULT_MASTER_BAR, 2);
    const nextBar = bar.staff.bars[1];
    nextBar.removeVoiceBar(3);
    nextBar.insertVoiceBar(4);
    voiceBar.appendBeats();
    voiceBar.appendBeats();
    voiceBar.appendBeats();
    const selectionCursor = new SelectionCursor(voiceBar.beats[3], 0);

    selectionCursor.moveRight(false);

    expect(selectionCursor.voiceNumber).toBe(2);
  });

  test("view-only moveLeft selects the closest existing voice", () => {
    const { score, bar } = createScoreGraph();
    bar.insertVoiceBar(1);
    bar.insertVoiceBar(4);
    score.appendMasterBar(DEFAULT_MASTER_BAR, 3);
    const nextBar = bar.staff.bars[1];
    const voiceBar = nextBar.getVoiceBar(3);
    if (voiceBar === null) {
      throw Error("Expected voice 3 bar");
    }
    const selectionCursor = new SelectionCursor(voiceBar.beats[0], 0);

    selectionCursor.moveLeft(false);

    expect(selectionCursor.bar).toBe(bar);
    expect(selectionCursor.voiceNumber).toBe(4);
    expect(bar.getVoiceBar(3)).toBeNull();
  });

  test("view-only moveRight does not grow the final bar", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    const selectionCursor = new SelectionCursor(voiceBar.beats[0], 0);

    const result = selectionCursor.moveRight(false);

    expect(result.result).toBe(MoveRightResult.Nothing);
    expect(voiceBar.beats).toHaveLength(1);
    expect(selectionCursor.beatIndex).toBe(0);
  });

  test("moveUp and moveDown wrap between first and last note indices", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    const selectionCursor = new SelectionCursor(voiceBar.beats[0], 0);

    selectionCursor.moveUp();
    expect(selectionCursor.noteIndex).toBe(5);

    selectionCursor.moveDown();
    expect(selectionCursor.noteIndex).toBe(0);
  });

  test("syncToStructure clamps stale bar and beat indices after structural shrink", () => {
    const { score, bar } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const secondBar = bar.staff.bars[1];
    const secondVoiceBar = secondBar.getVoiceBar(1);
    if (secondVoiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    secondVoiceBar.appendBeats();
    secondVoiceBar.appendBeats();

    const selectionCursor = new SelectionCursor(secondVoiceBar.beats[2], 0);

    score.removeMasterBar(1);
    selectionCursor.syncToStructure();
    expect(selectionCursor.barIndex).toBe(0);

    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    voiceBar.appendBeats();
    voiceBar.appendBeats();
    selectionCursor.moveRight();
    selectionCursor.moveRight();
    voiceBar.removeBeat(2);
    voiceBar.removeBeat(1);

    selectionCursor.syncToStructure();
    expect(selectionCursor.beatIndex).toBe(0);
  });
});
