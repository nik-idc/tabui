import { TrackController } from "../../src/notation/controller/track-controller";
import { AppendBeatCommand } from "../../src/notation/controller/editor/command/append-beat-command";
import { SelectedMoveDirection } from "../../src/notation/controller/selection/selected-note";
import { createScoreGraph } from "../model/helpers";
import { ensureLayoutConfigured } from "./helpers";

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
});
