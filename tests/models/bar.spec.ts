import { Bar, Chord, NoteDuration, TabWindow } from "../../src/index";
import { Guitar, GuitarNote, Note } from "../../src/index";

const stringsCount = 6;
const fretCount = 24;
const guitar = new Guitar(
  stringsCount,
  [Note.E, Note.B, Note.G, Note.D, Note.A, Note.E],
  fretCount
);
const tempo = 120;
const beats = 4;
const duration = NoteDuration.Quarter;

describe("Bar Model Tests", () => {
  test("Bar calculate durations fit test", () => {
    const chords = [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ];
    const bar = new Bar(guitar, tempo, beats, duration, chords);
    expect(bar.durationsFit).toBe(true);

    bar.appendChord();
    expect(bar.durationsFit).toBe(false);
  });

  test("Bar insert empty chord test", () => {
    const chords = [
      new Chord(guitar, NoteDuration.Eighth),
      new Chord(guitar, NoteDuration.Eighth),
      new Chord(guitar, NoteDuration.Eighth),
      new Chord(guitar, NoteDuration.Eighth),
    ];
    const bar = new Bar(guitar, tempo, beats, duration, chords);

    const insertIndex = 2;
    bar.insertEmptyChord(insertIndex);
    expect(bar.chords[insertIndex].duration).toBe(NoteDuration.Quarter);

    bar.prependChord();
    expect(bar.chords[0].duration).toBe(NoteDuration.Quarter);

    bar.appendChord();
    expect(bar.chords[bar.chords.length - 1].duration).toBe(
      NoteDuration.Quarter
    );
  });

  test("Bar insert at invalid index test", () => {
    const chords = [
      new Chord(guitar, NoteDuration.Eighth),
      new Chord(guitar, NoteDuration.Eighth),
      new Chord(guitar, NoteDuration.Eighth),
      new Chord(guitar, NoteDuration.Eighth),
    ];
    const bar = new Bar(guitar, tempo, beats, duration, chords);

    let insertIndex = -1;
    let insertError: Error | undefined;
    try {
      bar.insertEmptyChord(insertIndex);
    } catch (error) {
      insertError = error;
    } finally {
      expect(insertError).toBeInstanceOf(Error);
    }

    insertIndex = 2500;
    try {
      bar.insertEmptyChord(insertIndex);
    } catch (error) {
      insertError = error;
    } finally {
      expect(insertError).toBeInstanceOf(Error);
    }
  });

  test("Bar remove chord test", () => {
    const chords = [
      new Chord(guitar, NoteDuration.Whole),
      new Chord(guitar, NoteDuration.Half),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Eighth),
    ];
    const bar = new Bar(guitar, tempo, beats, duration, chords);

    bar.removeChord(3);
    expect(bar.chords[bar.chords.length - 1].duration).toBe(
      NoteDuration.Quarter
    );
  });

  test("Bar remove chord at invalid index test", () => {
    const chords = [
      new Chord(guitar, NoteDuration.Whole),
      new Chord(guitar, NoteDuration.Half),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Eighth),
    ];
    const bar = new Bar(guitar, tempo, beats, duration, chords);

    let insertIndex = -1;
    let insertError: Error | undefined;
    try {
      bar.removeChord(insertIndex);
    } catch (error) {
      insertError = error;
    } finally {
      expect(insertError).toBeInstanceOf(Error);
    }

    insertIndex = 2500;
    try {
      bar.removeChord(insertIndex);
    } catch (error) {
      insertError = error;
    } finally {
      expect(insertError).toBeInstanceOf(Error);
    }
  });

  test("Bar insert chords test", () => {
    const chords = [
      new Chord(guitar, NoteDuration.Eighth),
      new Chord(guitar, NoteDuration.Eighth),
      new Chord(guitar, NoteDuration.Eighth),
      new Chord(guitar, NoteDuration.Eighth),
    ];
    const chordsToInsert = [
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
    ];
    const bar = new Bar(guitar, tempo, beats, duration, chords);

    const insertIndex = 1;

    bar.insertChords(insertIndex, chordsToInsert);
    for (let i = 2; i < 6; i++) {
      expect(bar.chords[i].duration).toBe(NoteDuration.Sixteenth);
    }
    expect(bar.durationsFit).toBe(false);
  });

  test("Bar change chord duration test", () => {
    const chordTest = new Chord(guitar, NoteDuration.Quarter);
    const chords = [
      chordTest,
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ];
    const bar = new Bar(guitar, tempo, beats, duration, chords);

    expect(bar.durationsFit).toBe(true);
    bar.changeChordDuration(chordTest, NoteDuration.Eighth);
    expect(chordTest.duration).toBe(NoteDuration.Eighth);
    expect(bar.durationsFit).toBe(false);
  });

  test("Bar change beats", () => {
    const chords = [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ];
    const bar = new Bar(guitar, tempo, beats, duration, chords);

    expect(bar.durationsFit).toBe(true);
    bar.beats = 5;
    expect(bar.durationsFit).toBe(false);
  });

  test("Bar change beats invalid value", () => {
    const chords = [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ];
    const bar = new Bar(guitar, tempo, beats, duration, chords);

    let setBeatsError: Error | undefined;
    let prevBeats = bar.beats;
    try {
      bar.beats = -1;
    } catch (error) {
      setBeatsError = error;
    } finally {
      expect(bar.beats).toBe(prevBeats);
      expect(bar.durationsFit).toBe(true);
      expect(setBeatsError).toBeInstanceOf(Error);
    }

    prevBeats = bar.beats;
    try {
      bar.beats = 2500;
    } catch (error) {
      setBeatsError = error;
    } finally {
      expect(bar.beats).toBe(prevBeats);
      expect(bar.durationsFit).toBe(true);
      expect(setBeatsError).toBeInstanceOf(Error);
    }
  });

  test("Bar change tempo invalid value test", () => {
    const chords = [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ];
    const bar = new Bar(guitar, tempo, beats, duration, chords);

    let setTempoError: Error | undefined;
    let prevTempo = bar.tempo;
    try {
      bar.tempo = -98;
    } catch (error) {
      setTempoError = error;
    } finally {
      expect(bar.tempo).toBe(prevTempo);
      expect(setTempoError).toBeInstanceOf(Error);
    }

    prevTempo = bar.tempo;
    try {
      bar.tempo = 0;
    } catch (error) {
      setTempoError = error;
    } finally {
      expect(bar.tempo).toBe(prevTempo);
      expect(setTempoError).toBeInstanceOf(Error);
    }
  });

  test("Bar from valid object test", () => {
    const chords = [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ];
    const barObj = {
      guitar: guitar,
      _beats: 4,
      duration: 1 / 4,
      chords: chords,
      _durationsFit: true,
      _tempo: 120,
    };

    let parseError: Error | undefined;
    try {
      const bar = Bar.fromObject(barObj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBe(undefined);
    }
  });

  test("Bar from invalid object test", () => {
    const chords = [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ];
    const barObj = {
      _beats: 4,
      duration: 1 / 4,
      chords: chords,
      _durationsFit: true,
      _tempo: 120,
    };

    let parseError: Error | undefined;
    try {
      const bar = Bar.fromObject(barObj);
    } catch (error) {
      parseError = error;
    } finally {
      expect(parseError).toBeInstanceOf(Error);
    }
  });
});
