import { RemoveBeatsCommand } from "../../src/notation/controller/editor/command";
import { NoteDuration } from "../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";

describe("RemoveBeatsCommand", () => {
  test("execute removes selected beats and undo restores them in place", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Sixteenth },
    ]);
    const command = new RemoveBeatsCommand([beats[1]]);

    command.execute();
    expect(bar.beats).toHaveLength(2);
    expect(bar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Sixteenth,
    ]);

    command.undo();
    expect(bar.beats).toHaveLength(3);
    expect(bar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Eighth,
      NoteDuration.Sixteenth,
    ]);

    command.redo();
    expect(bar.beats).toHaveLength(2);
    expect(bar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Sixteenth,
    ]);
  });

  test("removing all beats restores the seed-beat invariant", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const command = new RemoveBeatsCommand(beats);

    command.execute();
    expect(bar.beats).toHaveLength(1);
    expect(bar.beats[0].isEmpty()).toBe(true);

    command.undo();
    expect(bar.beats).toHaveLength(1);
    expect(bar.beats[0].baseDuration).toBe(NoteDuration.Quarter);
    expect(bar.beats[0].isEmpty()).toBe(true);
  });
});
