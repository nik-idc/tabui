import {
  Beat,
  Guitar,
  GuitarNote,
  NoteDuration,
  NoteValue,
} from "../../src/notation/model";
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

  test("exposes tick timing fields after bar rebuild", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth, dots: 1 },
    ]);

    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }
    voiceBar.rebuildTiming();

    expect(beats[0].startTick).toBe(0);
    expect(beats[0].endTick).toBe(beats[0].fullDurationTicks);
    expect(beats[1].startTick).toBe(beats[0].endTick);
    expect(beats[1].endTick).toBe(
      beats[1].startTick + beats[1].fullDurationTicks
    );
    expect(beats[0].baseDurationTicks).toBeGreaterThan(0);
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
