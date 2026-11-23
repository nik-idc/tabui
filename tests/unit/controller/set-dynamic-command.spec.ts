import {
  DynamicEditKind,
  RemoveBeatsCommand,
  SetDynamicCommand,
} from "../../../src/notation/controller/editor/command";
import {
  Beat,
  Dynamic,
  DynamicDirection,
  NoteDuration,
  ScoreEditor,
} from "../../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";

function positions(beats: Beat[]) {
  return beats.map((b) => ScoreEditor.getBeatPosition(b));
}

describe("SetDynamicCommand", () => {
  test("undo restores each beat's own dynamic, rests included, and redo reapplies", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    beats[0].dynamic = Dynamic.Piano;
    beats[1].makeRest();
    const command = new SetDynamicCommand(positions(beats), {
      kind: DynamicEditKind.Shift,
      direction: DynamicDirection.Louder,
    });

    command.execute();
    const after = beats.map((b) => b.dynamic);

    command.undo();
    expect(beats.map((b) => b.dynamic)).toEqual([
      Dynamic.Piano,
      Dynamic.MezzoForte,
    ]);
    expect(beats[1].isRest()).toBe(true);

    command.redo();
    expect(beats.map((b) => b.dynamic)).toEqual(after);
  });

  test("redo uses saved positions after an earlier undo replaced the beat object", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const setDynamic = new SetDynamicCommand(positions([beats[1]]), {
      kind: DynamicEditKind.Set,
      dynamic: Dynamic.Fortissimo,
    });
    setDynamic.execute();
    const remove = new RemoveBeatsCommand([beats[1]]);
    remove.execute();

    // Undoing the removal restores a copy that keeps the ff dynamic.
    remove.undo();
    const restored = beats[0].voiceBar.beats[1];
    expect(restored).not.toBe(beats[1]);
    expect(restored.dynamic).toBe(Dynamic.Fortissimo);

    setDynamic.undo();
    expect(restored.dynamic).toBe(Dynamic.MezzoForte);

    setDynamic.redo();
    expect(beats[0].voiceBar.beats[1].dynamic).toBe(Dynamic.Fortissimo);
  });
});
