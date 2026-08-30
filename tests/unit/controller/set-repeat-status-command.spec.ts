import { SetRepeatStatusCommand } from "../../../src/notation/controller/editor/command";
import { BarRepeatStatus } from "../../../src/notation/model";
import { createScoreGraph } from "../model/helpers";

describe("SetRepeatStatusCommand", () => {
  test("execute, undo, and redo update repeat status", () => {
    const { masterBar, track } = createScoreGraph();
    const command = new SetRepeatStatusCommand(
      masterBar,
      { status: BarRepeatStatus.End, enabled: true, repeatCount: 2 },
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

  test("targets all track bars whose repeat validity can change", () => {
    const { score, masterBar, track, bar } = createScoreGraph();
    const secondStaff = track.insertStaff(1).staves[0];
    score.appendMasterBar();
    const command = new SetRepeatStatusCommand(
      masterBar,
      { status: BarRepeatStatus.End, enabled: true, repeatCount: 2 },
      track
    );

    expect(command.affectedModels).toEqual([
      { masterBarIndex: 0, modelUUID: bar.uuid },
      {
        masterBarIndex: 1,
        modelUUID: track.staves[0].bars[1].uuid,
      },
      { masterBarIndex: 0, modelUUID: secondStaff.bars[0].uuid },
      { masterBarIndex: 1, modelUUID: secondStaff.bars[1].uuid },
    ]);
  });

  test("sets repeat statuses independently", () => {
    const { masterBar, track } = createScoreGraph();
    const startCommand = new SetRepeatStatusCommand(
      masterBar,
      { status: BarRepeatStatus.Start, enabled: true },
      track
    );
    startCommand.execute();

    const endCommand = new SetRepeatStatusCommand(
      masterBar,
      { status: BarRepeatStatus.End, enabled: true, repeatCount: 2 },
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

  test("setting an existing boundary leaves it set", () => {
    const { masterBar, track } = createScoreGraph();
    masterBar.isRepeatStart = true;
    const command = new SetRepeatStatusCommand(
      masterBar,
      { status: BarRepeatStatus.Start, enabled: true },
      track
    );

    command.execute();

    expect(masterBar.isRepeatStart).toBe(true);
  });

  test("uses the supplied repeat count when enabling an end boundary", () => {
    const { masterBar } = createScoreGraph();

    masterBar.setRepeatStatus({
      status: BarRepeatStatus.End,
      enabled: true,
      repeatCount: 4,
    });

    expect(masterBar.isRepeatEnd).toBe(true);
    expect(masterBar.repeatCount).toBe(4);
  });

  test("updates the repeat count when the bar is already a repeat end", () => {
    const { masterBar, track } = createScoreGraph();
    masterBar.setRepeatStatus({
      status: BarRepeatStatus.End,
      enabled: true,
      repeatCount: 6,
    });
    const command = new SetRepeatStatusCommand(
      masterBar,
      { status: BarRepeatStatus.End, enabled: true, repeatCount: 5 },
      track
    );

    command.execute();

    expect(masterBar.isRepeatEnd).toBe(true);
    expect(masterBar.repeatCount).toBe(5);

    command.undo();
    expect(masterBar.isRepeatEnd).toBe(true);
    expect(masterBar.repeatCount).toBe(6);
  });

  test("clears and restores an existing repeat end", () => {
    const { masterBar, track } = createScoreGraph();
    masterBar.setRepeatStatus({
      status: BarRepeatStatus.End,
      enabled: true,
      repeatCount: 3,
    });
    const command = new SetRepeatStatusCommand(
      masterBar,
      { status: BarRepeatStatus.End, enabled: false },
      track
    );

    command.execute();

    expect(masterBar.isRepeatEnd).toBe(false);
    expect(masterBar.repeatCount).toBeNull();

    command.undo();
    expect(masterBar.isRepeatEnd).toBe(true);
    expect(masterBar.repeatCount).toBe(3);

    command.redo();
    expect(masterBar.isRepeatEnd).toBe(false);
    expect(masterBar.repeatCount).toBeNull();
  });

  test("clears a start without changing the end", () => {
    const { masterBar, track } = createScoreGraph();
    masterBar.setRepeatStatus({ status: BarRepeatStatus.Start, enabled: true });
    masterBar.setRepeatStatus({
      status: BarRepeatStatus.End,
      enabled: true,
      repeatCount: 4,
    });
    const command = new SetRepeatStatusCommand(
      masterBar,
      { status: BarRepeatStatus.Start, enabled: false },
      track
    );

    command.execute();

    expect(masterBar.isRepeatStart).toBe(false);
    expect(masterBar.isRepeatEnd).toBe(true);
    expect(masterBar.repeatCount).toBe(4);

    command.undo();
    expect(masterBar.isRepeatStart).toBe(true);
    expect(masterBar.isRepeatEnd).toBe(true);
    expect(masterBar.repeatCount).toBe(4);
  });
});
