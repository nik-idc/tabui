import { TrackController } from "../../src/notation/controller/track-controller";
import { AppendBeatCommand } from "../../src/notation/controller/editor/command/append-beat-command";
import { BarElement } from "../../src/notation/controller/element/bar/bar-element";
import { NoteDuration } from "../../src/notation/model";
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

    const diff = controller.trackElement.getElementDiff();
    expect(
      diff.added.get(BarElement)?.has(movedBarIdentity) ||
        diff.updated.get(BarElement)?.has(movedBarIdentity)
    ).toBe(true);
  });
});
