import { SetRepeatStatusCommand } from "../../src/notation/controller/editor/command";
import { BarRepeatStatus } from "../../src/notation/model";
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
    expect(masterBar.repeatStatus).toBe(BarRepeatStatus.End);
    expect(masterBar.repeatCount).toBe(2);

    command.undo();
    expect(masterBar.repeatStatus).toBe(BarRepeatStatus.None);
    expect(masterBar.repeatCount).toBeNull();

    command.redo();
    expect(masterBar.repeatStatus).toBe(BarRepeatStatus.End);
    expect(masterBar.repeatCount).toBe(2);
  });

  test("redo before execute throws", () => {
    const { masterBar, track } = createScoreGraph();
    const command = new SetRepeatStatusCommand(
      masterBar,
      BarRepeatStatus.Start,
      track
    );

    expect(() => command.redo()).toThrow("Redo called before execute");
  });

  test("uses a targeted update request for affected bars", () => {
    const { masterBar, track, bar } = createScoreGraph();
    const command = new SetRepeatStatusCommand(
      masterBar,
      BarRepeatStatus.End,
      track
    );

    expect(command.updateRequest).toEqual({
      updateType: "Targeted",
      affectedModelUUIDs: [bar.uuid],
    });
  });

  test("targets all staff bars for the affected master bar", () => {
    const { masterBar, track, bar } = createScoreGraph();
    const secondStaff = track.insertStaff(1).staves[0];
    const command = new SetRepeatStatusCommand(
      masterBar,
      BarRepeatStatus.End,
      track
    );

    expect(command.updateRequest).toEqual({
      updateType: "Targeted",
      affectedModelUUIDs: [bar.uuid, secondStaff.bars[0].uuid],
    });
  });
});
