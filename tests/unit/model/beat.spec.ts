import {
  Beat,
  Guitar,
  GuitarNote,
  GuitarTechniqueType,
  NoteDuration,
  NoteValue,
} from "../../../src/notation/model";
import { createBarWithBeats, createBeat } from "./helpers";

describe("Beat model", () => {
  function expectNotes(beat: Beat<Guitar>) {
    if (beat.notes === null) {
      throw Error("Expected beat to have notes");
    }

    return beat.notes;
  }

  test("compare uses tuplet settings value equality", () => {
    const { beats } = createBarWithBeats([
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
    ]);

    expect(beats[0].compare(beats[1])).toBe(true);
  });

  test("setNote rejects index equal to notes length", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const beat = beats[0];
    const notes = expectNotes(beat);

    expect(() => beat.setNote(notes.length, notes[0])).toThrow(Error);
  });

  test("setNote replaces note at a valid index", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const beat = beats[0];
    const sourceBeat = createBeat(bar, NoteDuration.Quarter);
    const sourceNotes = expectNotes(sourceBeat);
    const note = sourceNotes[0] as GuitarNote;
    note.fret = 3;

    const result = beat.setNote(0, note);

    expect(result.index).toBe(0);
    expect(result.notes).toHaveLength(1);
    expect((expectNotes(beat)[0] as GuitarNote).fret).toBe(3);
    expect(expectNotes(beat)[0].beat).toBe(beat);
  });

  test("can represent a real rest beat", () => {
    const { bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }

    const restBeat = new Beat<Guitar>(
      voiceBar,
      voiceBar.trackContext,
      null,
      NoteDuration.Half
    );

    expect(restBeat.notes).toBeNull();
    expect(restBeat.hasNotes()).toBe(false);
    expect(restBeat.isRest()).toBe(true);
  });

  test("rest beat deep copy preserves rest state and duration", () => {
    const { bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }

    const restBeat = new Beat<Guitar>(
      voiceBar,
      voiceBar.trackContext,
      null,
      NoteDuration.Half
    );
    const copy = restBeat.deepCopy();

    expect(copy).not.toBe(restBeat);
    expect(copy.isRest()).toBe(true);
    expect(copy.baseDuration).toBe(NoteDuration.Half);
    expect(copy.compare(restBeat)).toBe(true);
  });

  test("deep copy owns copied notes and techniques", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const sourceBeat = beats[0];
    const sourceNote = expectNotes(sourceBeat)[0] as GuitarNote;
    sourceNote.fret = 5;
    sourceNote.setTechnique(GuitarTechniqueType.Vibrato);

    const copy = sourceBeat.deepCopy();
    const copiedNote = expectNotes(copy)[0] as GuitarNote;

    expect(copiedNote).not.toBe(sourceNote);
    expect(copiedNote.beat).toBe(copy);
    expect(sourceNote.beat).toBe(sourceBeat);
    expect(copiedNote.hasTechnique(GuitarTechniqueType.Vibrato)).toBe(true);
    expect(copiedNote.techniques[0].note).toBe(copiedNote);
  });

  test("derived fret from note and octave clamps to the instrument maximum", () => {
    const { beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const note = expectNotes(beats[0])[0] as GuitarNote;

    note.octave = 8;
    note.noteValue = NoteValue.C;

    expect(note.fret).toBe(note.trackContext.instrument.fretsCount);
  });
});
