import { TrackController } from "../../src/notation/controller/track-controller";
import { AppendBeatCommand } from "../../src/notation/controller/editor/command/append-beat-command";
import { BarElement } from "../../src/notation/controller/element/bar/bar-element";
import {
  BendTechniqueOptions,
  BendType,
  GuitarTechniqueType,
  NoteDuration,
} from "../../src/notation/model";
import { SelectedMoveDirection } from "../../src/notation/controller/selection/selected-note";
import { createBarWithBeats, createScoreGraph } from "../model/helpers";
import { ensureLayoutConfigured } from "./helpers";

function getBeatElements(controller: TrackController) {
  return controller.trackElement.trackLineElements[0].staffLineElements[0]
    .styleLinesAsArray[0].barElements[0].beatElements;
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

  test("remove all selected beats leaves and selects a seed beat", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
    ]);
    const controller = new TrackController(track);
    const beatElements = getBeatElements(controller);

    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[1]);
    controller.removeSelectedBeat();

    expect(bar.beats).toHaveLength(1);
    expect(bar.beats[0].isEmpty()).toBe(true);
    expect(controller.selectionBeats).toHaveLength(0);
    expect(controller.selectedNote?.beat).toBe(bar.beats[0]);
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
