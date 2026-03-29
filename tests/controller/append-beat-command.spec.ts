import { AppendBeatCommand } from "../../src/notation/controller/editor/command/append-beat-command";
import { createScoreGraph } from "../model/helpers";

describe("AppendBeatCommand", () => {
  test("undo removes the appended beat", () => {
    const { bar } = createScoreGraph();
    const command = new AppendBeatCommand(bar);

    command.execute();
    expect(bar.beats).toHaveLength(2);

    command.undo();
    expect(bar.beats).toHaveLength(1);
  });
});
