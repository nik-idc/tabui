import { SetRestCommand } from "../../src/notation/controller/editor/command";
import { GuitarNote, NoteDuration } from "../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";

describe("SetRestCommand", () => {
  test("execute converts a note beat to a rest and preserves rhythm", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Eighth, dots: 1 },
    ]);
    const beat = beats[0];
    const note = beat.notes![0] as GuitarNote;
    note.fret = 7;
    const command = new SetRestCommand([beat], true);

    command.execute();

    expect(beat.isRest()).toBe(true);
    expect(beat.notes).toBeNull();
    expect(beat.baseDuration).toBe(NoteDuration.Eighth);
    expect(beat.dots).toBe(1);
  });

  test("undo restores previous notes and redo restores rest", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const beat = beats[0];
    const note = beat.notes![0] as GuitarNote;
    note.fret = 5;
    const command = new SetRestCommand([beat], true);

    command.execute();
    command.undo();

    expect(beat.isRest()).toBe(false);
    expect((beat.notes![0] as GuitarNote).fret).toBe(5);

    command.redo();

    expect(beat.isRest()).toBe(true);
    expect(beat.notes).toBeNull();
  });

  test("execute converts a rest beat to an empty note beat", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const beat = beats[0];
    beat.makeRest();
    const command = new SetRestCommand([beat], false);

    command.execute();

    expect(beat.isRest()).toBe(false);
    expect(beat.hasNotes()).toBe(true);

    command.undo();

    expect(beat.isRest()).toBe(true);
  });

  test("setting the current rest state is a no-op", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const beat = beats[0];

    const noteCommand = new SetRestCommand([beat], false);
    noteCommand.execute();
    expect(beat.isRest()).toBe(false);

    beat.makeRest();

    const restCommand = new SetRestCommand([beat], true);
    restCommand.execute();
    expect(beat.isRest()).toBe(true);
  });

  test("execute applies rest state to multiple beats", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
    ]);
    (beats[0].notes![0] as GuitarNote).fret = 2;
    (beats[1].notes![0] as GuitarNote).fret = 4;
    const command = new SetRestCommand(beats, true);

    command.execute();

    expect(beats.every((beat) => beat.isRest())).toBe(true);

    command.undo();

    expect(beats.every((beat) => !beat.isRest())).toBe(true);
    expect((beats[0].notes![0] as GuitarNote).fret).toBe(2);
    expect((beats[1].notes![0] as GuitarNote).fret).toBe(4);
  });
});
