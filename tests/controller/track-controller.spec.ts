import { TrackController } from "../../src/notation/controller/track-controller";
import { AppendBeatCommand } from "../../src/notation/controller/editor/command/append-beat-command";
import { BarElement } from "../../src/notation/controller/element/bar/bar-element";
import { BeatElement } from "../../src/notation/controller/element/beat/beat-element";
import {
  BendTechniqueOptions,
  BendType,
  DEFAULT_MASTER_BAR,
  GuitarNote,
  GuitarTechniqueType,
  NoteDuration,
  NoteValue,
  Score,
} from "../../src/notation/model";
import { SelectedMoveDirection } from "../../src/notation/controller/selection/selected-note";
import {
  createBarWithBeats,
  createBeat,
  createScoreGraph,
} from "../model/helpers";
import { ensureLayoutConfigured } from "./helpers";

function getBeatElements(controller: TrackController) {
  const beatElements: BeatElement[] = [];

  for (const trackLine of controller.trackElement.trackLineElements) {
    for (const staffLine of trackLine.staffLineElements) {
      for (const styleLine of staffLine.styleLinesAsArray) {
        for (const barElement of styleLine.barElements) {
          beatElements.push(...barElement.beatElements);
        }
      }
    }
  }

  return beatElements;
}

function getBeatElement(
  controller: TrackController,
  barIndex: number,
  beatIndex: number
) {
  return getBeatElements(controller)[barIndex + beatIndex];
}

function setBarDurations(
  controller: TrackController,
  barIndex: number,
  durations: NoteDuration[]
) {
  const bar = controller.trackElement.track.staves[0].bars[barIndex];
  const beats = durations.map((duration) => createBeat(bar, duration));
  bar.beats.splice(0, bar.beats.length, ...beats);
  bar.rebuildTiming();
}

jest.mock("../../src/player", () => ({
  ScorePlayer: class {
    public isPlaying = false;
    public isLooped = false;
    public currentBeat = undefined;
    public setCurrentBeat(): void {}
    public setLoopSection(): void {}
    public start(): void {}
    public stop(): void {}
    public toggleLoop(): void {}
  },
}));

describe("TrackController", () => {
  beforeAll(() => {
    ensureLayoutConfigured();
  });

  test("moving right from the seed beat appends a second beat", () => {
    const { track, bar } = createScoreGraph();
    const controller = new TrackController(track);

    controller.moveSelectedNote(SelectedMoveDirection.Right);
    controller.trackElement.update();

    expect(bar.beats).toHaveLength(2);
    expect(controller.selectedNote?.bar).toBe(bar);
    expect(controller.selectedNote?.beatIndex).toBe(1);
  });

  test("switching to an existing voice does not update elements", () => {
    const { track } = createScoreGraph();
    const controller = new TrackController(track);
    const updateSpy = jest.spyOn(controller.trackElement, "update");

    controller.setActiveVoiceNumber(1);

    expect(controller.activeVoiceNumber).toBe(1);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  test("switching to a new voice updates only the affected line vertically", () => {
    const { track, bar } = createScoreGraph();
    const controller = new TrackController(track);
    const updateSpy = jest.spyOn(controller.trackElement, "update");

    controller.setActiveVoiceNumber(2);

    expect(controller.activeVoiceNumber).toBe(2);
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledWith(0, 0, { depth: "elements" });
  });

  test("moving right into a missing active voice bar updates elements", () => {
    const { score, track } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const controller = new TrackController(track);
    controller.setActiveVoiceNumber(2);
    const secondBar = track.staves[0].bars[1];
    const updateSpy = jest.spyOn(controller.trackElement, "update");

    controller.moveSelectedNote(SelectedMoveDirection.Right);
    controller.moveSelectedNote(SelectedMoveDirection.Right);
    controller.moveSelectedNote(SelectedMoveDirection.Right);
    controller.moveSelectedNote(SelectedMoveDirection.Right);

    expect(secondBar.getVoiceBar(2)).not.toBeNull();
    expect(controller.selectedNote?.bar).toBe(secondBar);
    expect(updateSpy).toHaveBeenCalledWith(0, 0, { depth: "elements" });
    expect(
      controller.trackElement.getBeatElement(controller.selectedNote!.beat)
    ).toBeDefined();
  });

  test("moving left into a missing active voice bar updates elements", () => {
    const { score, track } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const secondBar = track.staves[0].bars[1];
    const secondVoiceBar = secondBar.insertVoiceBar(2);
    const controller = new TrackController(track);
    controller.trackElement.update();
    const secondVoiceBeatElement = controller.trackElement.getBeatElement(
      secondVoiceBar.beats[0]
    );
    if (secondVoiceBeatElement === undefined) {
      throw Error("Second voice beat element not found");
    }
    controller.selectNoteElement(secondVoiceBeatElement.noteElements[0]);
    const updateSpy = jest.spyOn(controller.trackElement, "update");
    const firstBar = track.staves[0].bars[0];

    controller.moveSelectedNote(SelectedMoveDirection.Left);

    expect(firstBar.getVoiceBar(2)).not.toBeNull();
    expect(controller.selectedNote?.bar).toBe(firstBar);
    expect(updateSpy).toHaveBeenCalledWith(0, 0, { depth: "elements" });
    expect(
      controller.trackElement.getBeatElement(controller.selectedNote!.beat)
    ).toBeDefined();
  });

  test("redo on TrackController redoes the previously undone command", () => {
    const { track, bar } = createScoreGraph();
    const controller = new TrackController(track);

    controller.moveSelectedNote(SelectedMoveDirection.Right);
    expect(bar.beats).toHaveLength(2);

    controller.undo();
    expect(bar.beats).toHaveLength(1);

    controller.redo();
    expect(bar.beats).toHaveLength(2);
  });

  test("append beat undo removes the appended beat", () => {
    const { track, bar } = createScoreGraph();
    const controller = new TrackController(track);

    controller.moveSelectedNote(SelectedMoveDirection.Right);
    expect(bar.beats).toHaveLength(2);

    controller.undo();
    expect(bar.beats).toHaveLength(1);
  });

  test("insert beat before selected inserts and selects the new beat", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
    ]);
    const controller = new TrackController(track);
    const secondBeatUUID = bar.beats[1].uuid;

    controller.moveSelectedNote(SelectedMoveDirection.Right);
    controller.insertBeatBeforeSelected();

    expect(bar.beats).toHaveLength(3);
    expect(bar.beats[2].uuid).toBe(secondBeatUUID);
    expect(controller.selectedNote?.beat).toBe(bar.beats[1]);
  });

  test("insert beat after selected inserts and selects the new beat", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
    ]);
    const controller = new TrackController(track);
    const secondBeatUUID = bar.beats[1].uuid;

    controller.insertBeatAfterSelected();

    expect(bar.beats).toHaveLength(3);
    expect(bar.beats[2].uuid).toBe(secondBeatUUID);
    expect(controller.selectedNote?.beat).toBe(bar.beats[1]);
  });

  test("remove selected beat deletes current beat and clears selection", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
    ]);
    const controller = new TrackController(track);
    const secondBeatUUID = bar.beats[1].uuid;

    controller.removeSelectedBeat();

    expect(bar.beats).toHaveLength(1);
    expect(bar.beats[0].uuid).toBe(secondBeatUUID);
    expect(controller.selectedNote?.beat).toBe(bar.beats[0]);
  });

  test("remove selected last beat keeps cursor on replacement rest", () => {
    const score = new Score();
    const track = score.tracks[0];
    const bar = track.staves[0].bars[0];
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const controller = new TrackController(track);

    controller.removeSelectedBeat();

    expect(voiceBar.beats).toHaveLength(1);
    expect(voiceBar.beats[0].isRest()).toBe(true);
    expect(controller.selectedNote).not.toBeUndefined();
    expect(controller.selectedNote?.beat).toBe(voiceBar.beats[0]);
    expect(controller.selectedNote?.note).toBeNull();
  });

  test("insert bar before selected note inserts and selects the new bar", () => {
    const { track, score } = createScoreGraph();
    const controller = new TrackController(track);
    const originalUUID = score.masterBars[0].uuid;

    controller.insertBarBeforeSelected();

    expect(score.masterBars).toHaveLength(2);
    expect(score.masterBars[1].uuid).toBe(originalUUID);
    expect(controller.selectionBeats).toHaveLength(0);
    expect(controller.selectedNote?.beat).toBe(
      track.staves[0].bars[0].beats[0]
    );
  });

  test("insert bar after selected note inserts and selects the new bar", () => {
    const { track, score } = createScoreGraph();
    const controller = new TrackController(track);
    const originalUUID = score.masterBars[0].uuid;

    controller.insertBarAfterSelected();

    expect(score.masterBars).toHaveLength(2);
    expect(score.masterBars[0].uuid).toBe(originalUUID);
    expect(controller.selectionBeats).toHaveLength(0);
    expect(controller.selectedNote?.beat).toBe(
      track.staves[0].bars[1].beats[0]
    );
  });

  test("insert beat before active selection inserts before first selected beat", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Sixteenth },
    ]);
    const controller = new TrackController(track);
    const beatElements = getBeatElements(controller);
    const originalUUIDs = bar.beats.map((beat) => beat.uuid);

    controller.selectBeat(beatElements[1]);
    controller.selectBeat(beatElements[2]);
    controller.insertBeatBeforeSelected();

    expect(bar.beats).toHaveLength(4);
    expect(bar.beats[0].uuid).toBe(originalUUIDs[0]);
    expect(bar.beats[2].uuid).toBe(originalUUIDs[1]);
    expect(bar.beats[3].uuid).toBe(originalUUIDs[2]);
    expect(controller.selectionBeats).toHaveLength(0);
    expect(controller.selectedNote?.beat).toBe(bar.beats[1]);
  });

  test("insert beat after active selection inserts after last selected beat", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Sixteenth },
    ]);
    const controller = new TrackController(track);
    const beatElements = getBeatElements(controller);
    const originalUUIDs = bar.beats.map((beat) => beat.uuid);

    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[1]);
    controller.insertBeatAfterSelected();

    expect(bar.beats).toHaveLength(4);
    expect(bar.beats[0].uuid).toBe(originalUUIDs[0]);
    expect(bar.beats[1].uuid).toBe(originalUUIDs[1]);
    expect(bar.beats[3].uuid).toBe(originalUUIDs[2]);
    expect(controller.selectionBeats).toHaveLength(0);
    expect(controller.selectedNote?.beat).toBe(bar.beats[2]);
  });

  test("remove active selection selects the beat before selection", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Sixteenth },
      { baseDuration: NoteDuration.ThirtySecond },
    ]);
    const controller = new TrackController(track);
    const beatElements = getBeatElements(controller);
    const beforeSelectionUUID = bar.beats[0].uuid;
    const afterSelectionUUID = bar.beats[3].uuid;

    controller.selectBeat(beatElements[1]);
    controller.selectBeat(beatElements[2]);
    controller.removeSelectedBeat();

    expect(bar.beats).toHaveLength(2);
    expect(bar.beats[0].uuid).toBe(beforeSelectionUUID);
    expect(bar.beats[1].uuid).toBe(afterSelectionUUID);
    expect(controller.selectionBeats).toHaveLength(0);
    expect(controller.selectedNote?.beat).toBe(bar.beats[0]);
  });

  test("insert bar before active selection inserts before first selected bar", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar({
      tempo: 120,
      beatsCount: 4,
      duration: NoteDuration.Quarter,
      repeatStatus: 0,
      repeatCount: null,
    });
    const controller = new TrackController(track);
    controller.trackElement.update();
    const originalUUIDs = score.masterBars.map((bar) => bar.uuid);

    controller.selectBeat(getBeatElement(controller, 0, 0));
    controller.selectBeat(getBeatElement(controller, 1, 0));
    controller.insertBarBeforeSelected();

    expect(score.masterBars.length).toBeGreaterThanOrEqual(3);
    expect(score.masterBars[1].uuid).toBe(originalUUIDs[0]);
    expect(controller.selectionBeats).toHaveLength(0);
    expect(controller.selectedNote?.beat).toBe(
      track.staves[0].bars[0].beats[0]
    );
  });

  test("insert bar after active selection inserts after last selected bar", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar({
      tempo: 120,
      beatsCount: 4,
      duration: NoteDuration.Quarter,
      repeatStatus: 0,
      repeatCount: null,
    });
    const controller = new TrackController(track);
    controller.trackElement.update();
    const originalUUIDs = score.masterBars.map((bar) => bar.uuid);

    controller.selectBeat(getBeatElement(controller, 0, 0));
    controller.selectBeat(getBeatElement(controller, 1, 0));
    controller.insertBarAfterSelected();

    expect(score.masterBars.length).toBeGreaterThanOrEqual(3);
    expect(score.masterBars[0].uuid).toBe(originalUUIDs[0]);
    expect(score.masterBars[1].uuid).toBe(originalUUIDs[1]);
    expect(controller.selectionBeats).toHaveLength(0);
    expect(controller.selectedNote?.beat).toBe(
      track.staves[0].bars[2].beats[0]
    );
  });

  test("remove selected bar removes the current bar and selects the previous bar", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar({
      tempo: 120,
      beatsCount: 4,
      duration: NoteDuration.Quarter,
      repeatStatus: 0,
      repeatCount: null,
    });
    const controller = new TrackController(track);
    controller.trackElement.update();
    const firstBarFirstBeat = track.staves[0].bars[0].beats[0];

    controller.selectBeat(getBeatElement(controller, 1, 0));
    controller.removeSelectedBar();

    expect(score.masterBars).toHaveLength(1);
    expect(controller.selectionBeats).toHaveLength(0);
    expect(controller.selectedNote?.beat).toBe(firstBarFirstBeat);
  });

  test("remove active selection removes all touched bars in order", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar({
      tempo: 120,
      beatsCount: 4,
      duration: NoteDuration.Quarter,
      repeatStatus: 0,
      repeatCount: null,
    });
    score.appendMasterBar({
      tempo: 120,
      beatsCount: 4,
      duration: NoteDuration.Quarter,
      repeatStatus: 0,
      repeatCount: null,
    });
    const controller = new TrackController(track);
    controller.trackElement.update();

    controller.selectBeat(getBeatElement(controller, 0, 0));
    controller.selectBeat(getBeatElement(controller, 1, 0));
    controller.removeSelectedBar();

    expect(score.masterBars).toHaveLength(1);
    expect(controller.selectionBeats).toHaveLength(0);
    expect(controller.selectedNote?.beat).toBe(
      track.staves[0].bars[0].beats[0]
    );
  });

  test("remove active selection removes contiguous middle bars by original index", () => {
    const { track, score } = createScoreGraph();

    for (let i = 0; i < 6; i++) {
      score.appendMasterBar({
        tempo: 120,
        beatsCount: 4,
        duration: NoteDuration.Quarter,
        repeatStatus: 0,
        repeatCount: null,
      });
    }

    const originalUUIDs = score.masterBars.map((bar) => bar.uuid);
    const controller = new TrackController(track);
    controller.trackElement.update();

    controller.selectBeat(getBeatElement(controller, 2, 0));
    controller.selectBeat(getBeatElement(controller, 3, 0));
    controller.selectBeat(getBeatElement(controller, 4, 0));
    controller.removeSelectedBar();

    expect(score.masterBars.map((bar) => bar.uuid)).toEqual([
      originalUUIDs[0],
      originalUUIDs[1],
      originalUUIDs[5],
      originalUUIDs[6],
    ]);
    expect(controller.selectionBeats).toHaveLength(0);
    expect(controller.selectedNote?.beat).toBe(
      track.staves[0].bars[1].beats[0]
    );
  });

  test("remove all selected beats can leave a true empty voice bar", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
    ]);
    const controller = new TrackController(track);
    const beatElements = getBeatElements(controller);

    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[1]);
    controller.removeSelectedBeat();

    expect(bar.beats).toHaveLength(0);
    expect(controller.selectionBeats).toHaveLength(0);
  });

  test("undo works for a directly executed append-beat command", () => {
    const { track, bar } = createScoreGraph();
    const controller = new TrackController(track);

    controller.commandManager.execute(new AppendBeatCommand(bar));
    expect(bar.beats).toHaveLength(2);

    controller.undo();
    expect(bar.beats).toHaveLength(1);
  });

  test("setDuration changes only the selected note beat", () => {
    const { track, bar } = createScoreGraph();
    const controller = new TrackController(track);

    controller.setDuration(NoteDuration.Eighth);

    expect(bar.beats[0].baseDuration).toBe(NoteDuration.Eighth);
    expect(bar.beats[0].fullDurationTicks).toBe(bar.tickResolution / 8);
    expect(bar.actualTicks).toBe(bar.tickResolution / 8);
  });

  test("setDuration changes every beat in the selected range", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const controller = new TrackController(track);
    const beatElements = getBeatElements(controller);

    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[2]);
    controller.setDuration(NoteDuration.Eighth);

    expect(bar.beats.slice(0, 3).map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Eighth,
      NoteDuration.Eighth,
      NoteDuration.Eighth,
    ]);
    expect(bar.beats[3].baseDuration).toBe(NoteDuration.Quarter);
    expect(bar.beats.slice(0, 3).map((beat) => beat.fullDurationTicks)).toEqual(
      [bar.tickResolution / 8, bar.tickResolution / 8, bar.tickResolution / 8]
    );
    expect(bar.beats[1].startTick).toBe(bar.beats[0].endTick);
    expect(bar.beats[2].startTick).toBe(bar.beats[1].endTick);
    expect(bar.actualTicks).toBe((bar.tickResolution * 5) / 8);
  });

  test("paste over beat selection inserts clipboard at selection start", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar();
    score.appendMasterBar();
    const controller = new TrackController(track);

    setBarDurations(controller, 0, [
      NoteDuration.ThirtySecond,
      NoteDuration.Sixteenth,
      NoteDuration.Eighth,
    ]);
    setBarDurations(controller, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    setBarDurations(controller, 2, [NoteDuration.Half, NoteDuration.Half]);
    controller.trackElement.update();
    const beatElements = getBeatElements(controller);

    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[2]);
    controller.copy();
    controller.clearSelection();
    controller.selectBeat(beatElements[3]);
    controller.selectBeat(beatElements[4]);
    controller.paste();

    expect(
      track.staves[0].bars[1].beats.map((beat) => beat.baseDuration)
    ).toEqual([
      NoteDuration.ThirtySecond,
      NoteDuration.Sixteenth,
      NoteDuration.Eighth,
    ]);
    expect(
      track.staves[0].bars[2].beats.map((beat) => beat.baseDuration)
    ).toEqual([NoteDuration.Half, NoteDuration.Half]);
    expect(controller.selectionBeats).toHaveLength(0);
  });

  test("paste underfill removes remaining selected beats until rests exist", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar();
    score.appendMasterBar();
    const controller = new TrackController(track);

    setBarDurations(controller, 0, [NoteDuration.Sixteenth]);
    setBarDurations(controller, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    setBarDurations(controller, 2, [NoteDuration.Half, NoteDuration.Half]);
    controller.trackElement.update();
    const beatElements = getBeatElements(controller);

    controller.selectBeat(beatElements[0]);
    controller.copy();
    controller.clearSelection();
    controller.selectBeat(beatElements[1]);
    controller.selectBeat(beatElements[4]);
    controller.paste();

    expect(
      track.staves[0].bars[1].beats.map((beat) => beat.baseDuration)
    ).toEqual([NoteDuration.Sixteenth]);
    expect(track.staves[0].bars[2].beats).toHaveLength(0);
  });

  test("undo restores beats removed by multi-bar paste replacement", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar();
    score.appendMasterBar();
    const controller = new TrackController(track);

    setBarDurations(controller, 0, [
      NoteDuration.ThirtySecond,
      NoteDuration.Sixteenth,
      NoteDuration.Eighth,
    ]);
    setBarDurations(controller, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    setBarDurations(controller, 2, [NoteDuration.Half, NoteDuration.Half]);
    controller.trackElement.update();
    const beatElements = getBeatElements(controller);

    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[2]);
    controller.copy();
    controller.clearSelection();
    controller.selectBeat(beatElements[3]);
    controller.selectBeat(beatElements[4]);
    controller.paste();
    controller.undo();

    expect(
      track.staves[0].bars[1].beats.map((beat) => beat.baseDuration)
    ).toEqual([NoteDuration.Quarter, NoteDuration.Quarter]);
    expect(
      track.staves[0].bars[2].beats.map((beat) => beat.baseDuration)
    ).toEqual([NoteDuration.Half, NoteDuration.Half]);

    controller.redo();
    expect(track.staves[0].bars[1].beats).toHaveLength(3);
  });

  test("paste keeps long clipboard content in the target bar", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar();
    const controller = new TrackController(track);

    setBarDurations(
      controller,
      0,
      Array.from({ length: 64 }, () => NoteDuration.ThirtySecond)
    );
    setBarDurations(controller, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    controller.trackElement.update();
    const beatElements = getBeatElements(controller);

    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[63]);
    controller.copy();
    controller.clearSelection();
    controller.selectBeat(beatElements[64]);
    controller.selectBeat(beatElements[65]);
    controller.paste();

    expect(score.masterBars).toHaveLength(2);
    expect(track.staves[0].bars[1].beats).toHaveLength(64);
    expect(track.staves[0].bars[1].checkDurationsFit()).toBe(false);
  });

  test("paste handles source and target beat selections made right-to-left", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar();
    score.appendMasterBar();
    const controller = new TrackController(track);

    setBarDurations(controller, 0, [
      NoteDuration.ThirtySecond,
      NoteDuration.Sixteenth,
      NoteDuration.Eighth,
    ]);
    setBarDurations(controller, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    setBarDurations(controller, 2, [NoteDuration.Half, NoteDuration.Half]);
    controller.trackElement.update();
    const beatElements = getBeatElements(controller);

    controller.selectBeat(beatElements[2]);
    controller.selectBeat(beatElements[0]);
    controller.copy();
    controller.clearSelection();
    controller.selectBeat(beatElements[4]);
    controller.selectBeat(beatElements[3]);
    controller.paste();

    expect(
      track.staves[0].bars[1].beats.map((beat) => beat.baseDuration)
    ).toEqual([
      NoteDuration.ThirtySecond,
      NoteDuration.Sixteenth,
      NoteDuration.Eighth,
    ]);
  });

  test("paste over same-bar selection inserts clipboard at selection start", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar();
    const controller = new TrackController(track);

    setBarDurations(
      controller,
      0,
      Array.from({ length: 8 }, () => NoteDuration.Eighth)
    );
    setBarDurations(controller, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    controller.trackElement.update();
    const beatElements = getBeatElements(controller);

    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[7]);
    controller.copy();
    controller.clearSelection();
    controller.selectBeat(beatElements[8]);
    controller.selectBeat(beatElements[9]);
    controller.paste();

    expect(track.staves[0].bars[1].beats).toHaveLength(10);
    expect(
      track.staves[0].bars[1].beats.map((beat) => beat.baseDuration)
    ).toEqual([
      ...Array.from({ length: 8 }, () => NoteDuration.Eighth),
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    expect(track.staves[0].bars[1].checkDurationsFit()).toBe(false);
  });

  test("redo reapplies replace paste after undo", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar();
    const controller = new TrackController(track);

    setBarDurations(
      controller,
      0,
      Array.from({ length: 8 }, () => NoteDuration.Eighth)
    );
    setBarDurations(controller, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    controller.trackElement.update();
    const beatElements = getBeatElements(controller);

    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[7]);
    controller.copy();
    controller.clearSelection();
    controller.selectBeat(beatElements[8]);
    controller.selectBeat(beatElements[9]);
    controller.paste();
    controller.undo();
    controller.redo();

    expect(track.staves[0].bars[1].beats).toHaveLength(10);
    expect(
      track.staves[0].bars[1].beats.map((beat) => beat.baseDuration)
    ).toEqual([
      ...Array.from({ length: 8 }, () => NoteDuration.Eighth),
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
  });

  test("paste at note selection inserts locally into selected bar", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar();
    const controller = new TrackController(track);

    setBarDurations(controller, 0, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    setBarDurations(controller, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    controller.trackElement.update();
    const beatElements = getBeatElements(controller);

    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[3]);
    controller.copy();
    controller.clearSelection();
    controller.selectNoteElement(beatElements[4].noteElements[0]);
    controller.paste();

    expect(score.masterBars).toHaveLength(2);
    expect(track.staves[0].bars[1].beats).toHaveLength(8);
    expect(track.staves[0].bars[1].checkDurationsFit()).toBe(false);
  });

  test("undo restores local paste without creating bars", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar();
    const controller = new TrackController(track);

    setBarDurations(
      controller,
      0,
      Array.from({ length: 64 }, () => NoteDuration.ThirtySecond)
    );
    setBarDurations(controller, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    controller.trackElement.update();
    const beatElements = getBeatElements(controller);

    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[63]);
    controller.copy();
    controller.clearSelection();
    controller.selectBeat(beatElements[64]);
    controller.selectBeat(beatElements[65]);
    controller.paste();
    controller.undo();

    expect(score.masterBars).toHaveLength(2);
    expect(
      track.staves[0].bars[1].beats.map((beat) => beat.baseDuration)
    ).toEqual([NoteDuration.Quarter, NoteDuration.Quarter]);
  });

  test("paste copies playable guitar notes without invalid intermediate state", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar();
    const controller = new TrackController(track);

    setBarDurations(controller, 0, [NoteDuration.ThirtySecond]);
    setBarDurations(controller, 1, [NoteDuration.Quarter]);
    const sourceNote = track.staves[0].bars[0].beats[0].notes[0] as GuitarNote;
    sourceNote.octave = 5;
    sourceNote.noteValue = NoteValue.A;
    controller.trackElement.update();
    const beatElements = getBeatElements(controller);

    controller.selectBeat(beatElements[0]);
    controller.copy();
    controller.clearSelection();
    controller.selectBeat(beatElements[1]);
    controller.paste();

    const pastedNote = track.staves[0].bars[1].beats[0].notes[0];
    expect(pastedNote.noteValue).toBe(NoteValue.A);
    expect(pastedNote.octave).toBe(5);
  });

  test("moving right enough to split the last bar onto a new line marks that bar updated", () => {
    // NOTE: Takes too long because of unoptimized TrackElement.update
    const { score, track, staff } = createScoreGraph();
    for (let i = 0; i < 40; i++) {
      score.appendMasterBar({
        tempo: 120,
        beatsCount: 4,
        duration: NoteDuration.Quarter,
        repeatStatus: 0,
        repeatCount: null,
      });
    }

    const controller = new TrackController(track);
    controller.trackElement.update();

    const lastBar = staff.bars[staff.bars.length - 1];
    while (controller.selectedNote?.bar !== lastBar) {
      controller.moveSelectedNote(SelectedMoveDirection.Right);
    }

    const initialLineCount = controller.trackElement.trackLineElements.length;

    while (
      controller.trackElement.trackLineElements.length === initialLineCount
    ) {
      controller.moveSelectedNote(SelectedMoveDirection.Right);
    }

    const secondLastLine =
      controller.trackElement.trackLineElements[
        controller.trackElement.trackLineElements.length - 2
      ];
    const movedBarElement =
      secondLastLine.staffLineElements[0].styleLinesAsArray[0].barElements[
        secondLastLine.staffLineElements[0].styleLinesAsArray[0].barElements
          .length - 1
      ];
    const movedBarIdentity = movedBarElement.getStableIdentity();

    const diff = controller.trackElement.elementDiff;
    expect(
      diff.added.get(BarElement)?.has(movedBarIdentity) ||
        diff.updated.get(BarElement)?.has(movedBarIdentity)
    ).toBe(true);
  });

  test("vibrato apply undo redo uses vertical update behavior", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 80; i++) {
      score.appendMasterBar({
        tempo: 120,
        beatsCount: 4,
        duration: NoteDuration.Quarter,
        repeatStatus: 0,
        repeatCount: null,
      });
    }

    const controller = new TrackController(track);
    controller.trackElement.update();

    const secondLine = controller.trackElement.trackLineElements[1];
    const initialY = secondLine.boundingBox.y;

    controller.setTechnique(GuitarTechniqueType.Vibrato);
    expect(
      controller.trackElement.trackLineElements[1].boundingBox.y
    ).toBeGreaterThan(initialY);

    controller.undo();
    expect(
      controller.trackElement.trackLineElements[1].boundingBox.y
    ).toBeCloseTo(initialY);

    controller.redo();
    expect(
      controller.trackElement.trackLineElements[1].boundingBox.y
    ).toBeGreaterThan(initialY);
  });

  test("tempo visibility apply undo redo uses vertical update behavior", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 120; i++) {
      score.appendMasterBar({
        tempo: 120,
        beatsCount: 4,
        duration: NoteDuration.Quarter,
        repeatStatus: 0,
        repeatCount: null,
      });
    }

    const controller = new TrackController(track);
    controller.trackElement.update();

    const secondLine = controller.trackElement.trackLineElements[1];
    const thirdLine = controller.trackElement.trackLineElements[2];
    const firstNoteOnSecondLine =
      secondLine.staffLineElements[0].styleLinesAsArray[0].barElements[0]
        .beatElements[0].noteElements[0];
    const initialThirdLineY = thirdLine.boundingBox.y;

    controller.selectNoteElement(firstNoteOnSecondLine);
    controller.setSelectedBarTempo(160);
    expect(
      controller.trackElement.trackLineElements[2].boundingBox.y
    ).toBeGreaterThan(initialThirdLineY);

    controller.undo();
    expect(
      controller.trackElement.trackLineElements[2].boundingBox.y
    ).toBeCloseTo(initialThirdLineY);

    controller.redo();
    expect(
      controller.trackElement.trackLineElements[2].boundingBox.y
    ).toBeGreaterThan(initialThirdLineY);
  });
});
