import { SetRepeatStatusCommand } from "../../src/notation/controller/editor/command";
import { BarRepeatStatus } from "../../src/notation/model";
import { createScoreGraph } from "../model/helpers";

describe("SetRepeatStatusCommand", () => {
  test("execute, undo, and redo update repeat status", () => {
    const { masterBar } = createScoreGraph();
    const command = new SetRepeatStatusCommand(masterBar, BarRepeatStatus.End);

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
    const { masterBar } = createScoreGraph();
    const command = new SetRepeatStatusCommand(
      masterBar,
      BarRepeatStatus.Start
    );

    expect(() => command.redo()).toThrow("Redo called before execute");
  });
});
