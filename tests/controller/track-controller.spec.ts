import { TrackController } from "../../src/notation/controller/track-controller";
import { AppendBeatCommand } from "../../src/notation/controller/editor/command/append-beat-command";
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

    controller.trackControllerEditor.moveSelectedNote(
      SelectedMoveDirection.Right
    );
    controller.trackElement.update();

    expect(bar.beats).toHaveLength(2);
    expect(
      controller.trackControllerEditor.selectionManager.selectedNote?.bar
    ).toBe(bar);
    expect(
      controller.trackControllerEditor.selectionManager.selectedNote?.beatIndex
    ).toBe(1);
  });

  test("redo on TrackController redoes the previously undone command", () => {
    const { track, bar } = createScoreGraph();
    const controller = new TrackController(track);

    controller.trackControllerEditor.moveSelectedNote(
      SelectedMoveDirection.Right
    );
    expect(bar.beats).toHaveLength(2);

    controller.undo();
    expect(bar.beats).toHaveLength(1);

    controller.redo();
    expect(bar.beats).toHaveLength(2);
  });

  test("append beat undo removes the appended beat", () => {
    const { track, bar } = createScoreGraph();
    const controller = new TrackController(track);

    controller.trackControllerEditor.moveSelectedNote(
      SelectedMoveDirection.Right
    );
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

    controller.trackControllerEditor.setDuration(NoteDuration.Eighth);

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

    controller.trackControllerEditor.selectBeat(beatElements[0]);
    controller.trackControllerEditor.selectBeat(beatElements[2]);
    controller.trackControllerEditor.setDuration(NoteDuration.Eighth);

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
});
