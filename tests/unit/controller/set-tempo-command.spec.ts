import { SetTempoCommand } from "../../../src/notation/controller/editor/command";
import { createScoreGraph } from "../model/helpers";

describe("SetTempoCommand", () => {
  test("execute, undo, and redo update the selected master bar tempo", () => {
    const { score, masterBar } = createScoreGraph();
    const command = new SetTempoCommand(score, [masterBar], 180);

    command.execute();
    expect(masterBar.tempo).toBe(180);

    command.undo();
    expect(masterBar.tempo).toBe(120);

    command.redo();
    expect(masterBar.tempo).toBe(180);
  });

  test("tempo command reports affected bar anchors and tempo visibility", () => {
    const { score, masterBar } = createScoreGraph();
    const command = new SetTempoCommand(score, [masterBar], 180);

    expect(command.affectsTempoVisibility).toBe(true);
    expect(command.affectedModels).toEqual([
      { masterBarIndex: 0, modelUUID: masterBar.uuid },
    ]);
  });
});
