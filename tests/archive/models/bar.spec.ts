import { Bar, Beat, NoteDuration, TabWindow } from "../../src/index";
import { Guitar, GuitarNote, Note } from "../../src/index";

const stringsCount = 6;
const fretCount = 24;
const guitar = new Guitar(
  stringsCount,
  [Note.E, Note.B, Note.G, Note.D, Note.A, Note.E],
  fretCount
);
const tempo = 120;
const beatsCount = 4;
const duration = NoteDuration.Quarter;

describe("Bar Model Tests", () => {
  test("Bar calculate durations fit test", () => {
    const beats = [
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
    ];
    const bar = new Bar(guitar, tempo, beatsCount, duration, beats);
    expect(bar.durationsFit).toBe(true);

    bar.appendBeat();
    expect(bar.durationsFit).toBe(false);
  });

  test("Bar insert empty beat test", () => {
    const beats = [
      new Beat(guitar, NoteDuration.Eighth),
      new Beat(guitar, NoteDuration.Eighth),
      new Beat(guitar, NoteDuration.Eighth),
      new Beat(guitar, NoteDuration.Eighth),
    ];
    const bar = new Bar(guitar, tempo, beatsCount, duration, beats);

    const insertIndex = 2;
    bar.insertEmptyBeat(insertIndex);
    expect(bar.beats[insertIndex].duration).toBe(NoteDuration.Quarter);

    bar.prependBeat();
    expect(bar.beats[0].duration).toBe(NoteDuration.Quarter);

    bar.appendBeat();
    expect(bar.beats[bar.beats.length - 1].duration).toBe(NoteDuration.Quarter);
  });

  test("Bar insert at invalid index test", () => {
    const beats = [
      new Beat(guitar, NoteDuration.Eighth),
      new Beat(guitar, NoteDuration.Eighth),
      new Beat(guitar, NoteDuration.Eighth),
      new Beat(guitar, NoteDuration.Eighth),
    ];
    const bar = new Bar(guitar, tempo, beatsCount, duration, beats);

    let insertIndex = -1;
    let insertError: Error | undefined;
    try {
      bar.insertEmptyBeat(insertIndex);
    } catch (error) {
      insertError = error;
    } finally {
      expect(insertError).toBeInstanceOf(Error);
    }

    insertIndex = 2500;
    try {
      bar.insertEmptyBeat(insertIndex);
    } catch (error) {
      insertError = error;
    } finally {
      expect(insertError).toBeInstanceOf(Error);
    }
  });

  test("Bar remove beat test", () => {
    const beats = [
      new Beat(guitar, NoteDuration.Whole),
      new Beat(guitar, NoteDuration.Half),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Eighth),
    ];
    const bar = new Bar(guitar, tempo, beatsCount, duration, beats);

    bar.removeBeat(3);
    expect(bar.beats[bar.beats.length - 1].duration).toBe(NoteDuration.Quarter);
  });

  test("Bar remove beat at invalid index test", () => {
    const beats = [
      new Beat(guitar, NoteDuration.Whole),
      new Beat(guitar, NoteDuration.Half),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Eighth),
    ];
    const bar = new Bar(guitar, tempo, beatsCount, duration, beats);

    let insertIndex = -1;
    let insertError: Error | undefined;
    try {
      bar.removeBeat(insertIndex);
    } catch (error) {
      insertError = error;
    } finally {
      expect(insertError).toBeInstanceOf(Error);
    }

    insertIndex = 2500;
    try {
      bar.removeBeat(insertIndex);
    } catch (error) {
      insertError = error;
    } finally {
      expect(insertError).toBeInstanceOf(Error);
    }
  });

  test("Bar insert beats test", () => {
    const beats = [
      new Beat(guitar, NoteDuration.Eighth),
      new Beat(guitar, NoteDuration.Eighth),
      new Beat(guitar, NoteDuration.Eighth),
      new Beat(guitar, NoteDuration.Eighth),
    ];
    const beatsToInsert = [
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
    ];
    const bar = new Bar(guitar, tempo, beatsCount, duration, beats);

    const insertIndex = 1;

    bar.insertBeats(insertIndex, beatsToInsert);
    for (let i = 2; i < 6; i++) {
      expect(bar.beats[i].duration).toBe(NoteDuration.Sixteenth);
    }
    expect(bar.durationsFit).toBe(false);
  });

  test("Bar change beat duration test", () => {
    const beatTest = new Beat(guitar, NoteDuration.Quarter);
    const beats = [
      beatTest,
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
    ];
    const bar = new Bar(guitar, tempo, beatsCount, duration, beats);

    expect(bar.durationsFit).toBe(true);
    bar.changeBeatDuration(beatTest, NoteDuration.Eighth);
    expect(beatTest.duration).toBe(NoteDuration.Eighth);
    expect(bar.durationsFit).toBe(false);
  });

  test("Bar change beats", () => {
    const beats = [
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
    ];
    const bar = new Bar(guitar, tempo, beatsCount, duration, beats);

    expect(bar.durationsFit).toBe(true);
    bar.beatsCount = 5;
    expect(bar.durationsFit).toBe(false);
  });

  test("Bar change beats invalid value", () => {
    const beats = [
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
    ];
    const bar = new Bar(guitar, tempo, beatsCount, duration, beats);

    let setBeatsCountError: Error | undefined;
    let prevBeatsCount = bar.beatsCount;
    try {
      bar.beatsCount = -1;
    } catch (error) {
      setBeatsCountError = error;
    } finally {
      expect(bar.beatsCount).toBe(prevBeatsCount);
      expect(bar.durationsFit).toBe(true);
      expect(setBeatsCountError).toBeInstanceOf(Error);
    }

    prevBeatsCount = bar.beatsCount;
    try {
      bar.beatsCount = 2500;
    } catch (error) {
      setBeatsCountError = error;
    } finally {
      expect(bar.beatsCount).toBe(prevBeatsCount);
      expect(bar.durationsFit).toBe(true);
      expect(setBeatsCountError).toBeInstanceOf(Error);
    }
  });

  test("Bar change tempo invalid value test", () => {
    const beats = [
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
    ];
    const bar = new Bar(guitar, tempo, beatsCount, duration, beats);

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
    const beats = [
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
    ];
    const barObj = {
      guitar: guitar,
      _beatsCount: 4,
      duration: 1 / 4,
      beats: beats,
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
    const beats = [
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
    ];
    const barObj = {
      _beatsCount: 4,
      duration: 1 / 4,
      beats: beats,
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
