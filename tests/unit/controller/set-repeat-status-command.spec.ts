import { SetRepeatStatusCommand } from "../../../src/notation/controller/editor/command";
import { BarRepeatStatus } from "../../../src/notation/model";
import { createScoreGraph } from "../model/helpers";

describe("SetRepeatStatusCommand", () => {
  test("execute, undo, and redo update repeat status", () => {
    const { masterBar, track } = createScoreGraph();
    const command = new SetRepeatStatusCommand(
      masterBar,
      BarRepeatStatus.End,
      track
    );

    command.execute();
    expect(masterBar.isRepeatEnd).toBe(true);
    expect(masterBar.repeatCount).toBe(2);

    command.undo();
    expect(masterBar.isRepeatEnd).toBe(false);
    expect(masterBar.repeatCount).toBeNull();

    command.redo();
    expect(masterBar.isRepeatEnd).toBe(true);
    expect(masterBar.repeatCount).toBe(2);
  });

  test("targets all staff bars for the affected master bar", () => {
    const { masterBar, track, bar } = createScoreGraph();
    const secondStaff = track.insertStaff(1).staves[0];
    const command = new SetRepeatStatusCommand(
      masterBar,
      BarRepeatStatus.End,
      track
    );

    expect(command.affectedModels).toEqual([
      { masterBarIndex: 0, modelUUID: bar.uuid },
      { masterBarIndex: 0, modelUUID: secondStaff.bars[0].uuid },
    ]);
  });

  test("toggles repeat boundaries independently", () => {
    const { masterBar, track } = createScoreGraph();
    const startCommand = new SetRepeatStatusCommand(
      masterBar,
      BarRepeatStatus.Start,
      track
    );
    startCommand.execute();

    const endCommand = new SetRepeatStatusCommand(
      masterBar,
      BarRepeatStatus.End,
      track
    );
    endCommand.execute();

    expect(masterBar.isRepeatStart).toBe(true);
    expect(masterBar.isRepeatEnd).toBe(true);
    expect(masterBar.repeatCount).toBe(2);

    endCommand.undo();
    expect(masterBar.isRepeatStart).toBe(true);
    expect(masterBar.isRepeatEnd).toBe(false);
  });

  test("uses the supplied repeat count when enabling an end boundary", () => {
    const { masterBar } = createScoreGraph();

    masterBar.toggleRepeatBoundary(BarRepeatStatus.End, 4);

    expect(masterBar.isRepeatEnd).toBe(true);
    expect(masterBar.repeatCount).toBe(4);
  });
});
