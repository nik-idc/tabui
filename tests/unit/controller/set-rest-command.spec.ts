import { SetRestCommand } from "../../../src/notation/controller/editor/command";
import {
  GuitarNote,
  NoteDuration,
  NoteValue,
} from "../../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";
import { required } from "../required";

describe("SetRestCommand", () => {
  test("execute converts a note beat to a rest and preserves rhythm", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Eighth, dots: 1 },
    ]);
    const beat = beats[0];
    const note = required(beat.notes)[0] as GuitarNote;
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
    const note = required(beat.notes)[0] as GuitarNote;
    note.fret = 5;
    const command = new SetRestCommand([beat], true);

    command.execute();
    command.undo();

    expect(beat.isRest()).toBe(false);
    expect((required(beat.notes)[0] as GuitarNote).fret).toBe(5);

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

    function expectEmptyNoteLanes() {
      expect(beat.isRest()).toBe(false);
      expect(beat.hasNotes()).toBe(true);
      const notes = required(beat.notes) as GuitarNote[];
      expect(notes).toHaveLength(6);
      expect(notes.map((n) => n.stringNum)).toEqual([1, 2, 3, 4, 5, 6]);
      for (const note of notes) {
        expect(note.fret).toBeNull();
        expect(note.noteValue).toBe(NoteValue.None);
        expect(note.octave).toBeNull();
        expect(note.techniques).toEqual([]);
        expect(note.beat).toBe(beat);
      }
    }

    command.execute();
    expectEmptyNoteLanes();

    command.undo();

    expect(beat.isRest()).toBe(true);
    expect(beat.notes).toBeNull();

    command.redo();
    expectEmptyNoteLanes();
  });

  test("execute, undo, and redo preserve an existing rest", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Eighth, dots: 1 },
    ]);
    const beat = beats[0];
    beat.makeRest();
    const command = new SetRestCommand([beat], true);

    command.execute();
    expect(beat.isRest()).toBe(true);

    command.undo();
    expect(beat.isRest()).toBe(true);

    command.redo();
    expect(beat.isRest()).toBe(true);
    expect(beat.baseDuration).toBe(NoteDuration.Eighth);
    expect(beat.dots).toBe(1);
  });

  test("execute applies rest state to multiple beats", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
    ]);
    (required(beats[0].notes)[0] as GuitarNote).fret = 2;
    (required(beats[1].notes)[0] as GuitarNote).fret = 4;
    const command = new SetRestCommand(beats, true);

    command.execute();

    expect(beats.every((beat) => beat.isRest())).toBe(true);

    command.undo();

    expect(beats.every((beat) => !beat.isRest())).toBe(true);
    expect((required(beats[0].notes)[0] as GuitarNote).fret).toBe(2);
    expect((required(beats[1].notes)[0] as GuitarNote).fret).toBe(4);
  });
});
