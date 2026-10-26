import { ShiftPitchCommand } from "../../../src/notation/controller/editor/command";
import {
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteValue,
} from "../../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";
import { required } from "../required";

function playableNotes(beats: ReturnType<typeof createBarWithBeats>["beats"]) {
  return beats.map((beat) => {
    const note = required(beat.notes)[0];
    if (!(note instanceof GuitarNote)) throw Error("Expected guitar note");
    return note;
  });
}

describe("ShiftPitchCommand", () => {
  test("shifts across an octave and restores fixed snapshots on undo and redo", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: 1 / 4 },
      { baseDuration: 1 / 4 },
    ]);
    const notes = playableNotes(beats);
    notes[0].setFret(7); // B2 on the default low E string.
    const initialOctave = notes[0].octave as number;
    const command = new ShiftPitchCommand(notes[0], 1);

    command.execute();
    expect(notes[0].noteValue).toBe(NoteValue.C);
    expect(notes[0].octave).toBe(initialOctave + 1);
    expect(notes[0].fret).toBe(8);
    command.undo();
    expect((required(notes[0].beat.notes)[0] as GuitarNote).fret).toBe(7);
    command.redo();
    expect((required(notes[0].beat.notes)[0] as GuitarNote).fret).toBe(8);
  });

  test("shifts chords and ranges while skipping dead and empty slots", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: 1 / 4 },
      { baseDuration: 1 / 4 },
    ]);
    for (const beat of beats) beat.makeBeatWithNotes();
    const first = playableNotes([beats[0]])[0];
    const second = playableNotes([beats[1]])[0];
    first.setFret(4);
    second.setFret(-1);
    const chordNote = required(beats[0].notes)[1] as GuitarNote;
    chordNote.setFret(8);

    new ShiftPitchCommand(beats, 2).execute();

    expect(first.fret).toBe(6);
    expect(chordNote.fret).toBe(10);
    expect(second.fret).toBe(-1);
  });

  test.each([-1, 1])("rejects an atomic fret boundary shift (%s)", (delta) => {
    const { beats } = createBarWithBeats([
      { baseDuration: 1 / 4 },
      { baseDuration: 1 / 4 },
    ]);
    const notes = playableNotes(beats);
    const max = notes[1].trackContext.instrument.fretsCount;
    notes[0].setFret(delta < 0 ? 0 : max);
    notes[1].setFret(delta < 0 ? 4 : max - 1);
    const command = new ShiftPitchCommand(beats, delta);

    expect(() => command.execute()).not.toThrow();
    expect(notes[0].fret).toBe(delta < 0 ? 0 : max);
    expect(notes[1].fret).toBe(delta < 0 ? 4 : max - 1);
  });

  test("preserves a three-note tie chain when all members shift together", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: 1 / 4 },
      { baseDuration: 1 / 4 },
      { baseDuration: 1 / 4 },
    ]);
    const notes = playableNotes(beats);
    for (const note of notes) note.setFret(5);
    notes[1].addTechnique(
      new GuitarTechnique(notes[1], GuitarTechniqueType.Tie)
    );
    notes[2].addTechnique(
      new GuitarTechnique(notes[2], GuitarTechniqueType.Tie)
    );

    new ShiftPitchCommand(beats, 3).execute();

    expect(notes.map((note) => note.fret)).toEqual([8, 8, 8]);
    expect(notes[1].hasTechnique(GuitarTechniqueType.Tie)).toBe(true);
    expect(notes[2].hasTechnique(GuitarTechniqueType.Tie)).toBe(true);
  });

  test.each([0, 1, 2])(
    "shifts the complete tie chain when selecting member %s",
    (selectedIndex) => {
      const { beats } = createBarWithBeats([
        { baseDuration: 1 / 4 },
        { baseDuration: 1 / 4 },
        { baseDuration: 1 / 4 },
      ]);
      const notes = playableNotes(beats);
      for (const note of notes) note.setFret(5);
      notes[1].addTechnique(
        new GuitarTechnique(notes[1], GuitarTechniqueType.Tie)
      );
      notes[2].addTechnique(
        new GuitarTechnique(notes[2], GuitarTechniqueType.Tie)
      );
      const command = new ShiftPitchCommand(notes[selectedIndex], 1);

      command.execute();
      expect(notes.map((note) => note.fret)).toEqual([6, 6, 6]);
      expect(notes[1].hasTechnique(GuitarTechniqueType.Tie)).toBe(true);
      expect(notes[2].hasTechnique(GuitarTechniqueType.Tie)).toBe(true);
      command.undo();
      const restoredNotes = playableNotes(beats);
      expect(restoredNotes[1].hasTechnique(GuitarTechniqueType.Tie)).toBe(true);
      command.redo();
      expect(playableNotes(beats).map((note) => note.fret)).toEqual([6, 6, 6]);
    }
  );

  test("does not raise tied notes above the maximum fret", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: 1 / 4 },
      { baseDuration: 1 / 4 },
      { baseDuration: 1 / 4 },
    ]);
    const notes = playableNotes(beats);
    const max = notes[0].trackContext.instrument.fretsCount;
    for (const note of notes) note.setFret(max);
    notes[1].addTechnique(
      new GuitarTechnique(notes[1], GuitarTechniqueType.Tie)
    );
    notes[2].addTechnique(
      new GuitarTechnique(notes[2], GuitarTechniqueType.Tie)
    );

    new ShiftPitchCommand(notes[0], 1).execute();

    expect(notes.map((note) => note.fret)).toEqual([max, max, max]);
  });
});
