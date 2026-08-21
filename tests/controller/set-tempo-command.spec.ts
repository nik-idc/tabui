import { SetTempoCommand } from "../../src/notation/controller/editor/command";
import { createScoreGraph } from "../model/helpers";

describe("SetTempoCommand", () => {
  test("execute, undo, and redo update the selected master bar tempo", () => {
    const { masterBar } = createScoreGraph();
    const command = new SetTempoCommand(masterBar, 180, []);

    command.execute();
    expect(masterBar.tempo).toBe(180);

    command.undo();
    expect(masterBar.tempo).toBe(120);

    command.redo();
    expect(masterBar.tempo).toBe(180);
  });

  test("tempo command can carry vertical-update metadata", () => {
    const { bar, masterBar } = createScoreGraph();
    const command = new SetTempoCommand(masterBar, 180, [
      { masterBarIndex: 0, modelUUID: bar.uuid },
    ]);

    expect(command.affectsTempoVisibility).toBe(true);
    expect(command.affectedModels).toEqual([
      { masterBarIndex: 0, modelUUID: bar.uuid },
    ]);
  });
});
