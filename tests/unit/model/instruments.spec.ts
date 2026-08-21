import {
  BarRepeatStatus,
  DEFAULT_BASS_GUITARS,
  DEFAULT_OTHER_STRING,
  Guitar,
  GuitarNote,
  NoteDuration,
  NoteValue,
  getNoteFrequency,
  getDefaultTuningStrSimple,
  shiftNoteValue,
  shiftTuningWhole,
  shiftTuningString,
} from "../../../src/notation/model";
import {
  BassGuitarTone,
  OtherStringTone,
} from "../../../src/notation/model/instrument/instrument-tone";
import { DEFAULT_TUNINGS } from "../../../src/notation/model/instrument/guitar/default-tunings";
import { createScoreGraph } from "./helpers";

describe("Default instruments", () => {
  test("rejects tuning that does not match the string count", () => {
    expect(() => new Guitar(undefined, undefined, undefined, 6, [])).toThrow(
      "Guitar tuning length must match string count"
    );
  });

  test("uses the first supported default tuning for the string count", () => {
    const guitar = new Guitar(undefined, undefined, undefined, 4);

    expect(guitar.tuning).toEqual(
      DEFAULT_BASS_GUITARS[BassGuitarTone.Clean].tuning
    );
    expect(guitar.tuning).toHaveLength(guitar.stringsCount);
  });

  test("ukulele default has four strings with matching tuning", () => {
    const ukulele = DEFAULT_OTHER_STRING[OtherStringTone.Ukulele];

    if (!(ukulele instanceof Guitar)) {
      throw Error("Expected ukulele to be a Guitar");
    }
    expect(ukulele.stringsCount).toBe(4);
    expect(ukulele.tuning).toEqual(DEFAULT_TUNINGS[4].UkuleleStandard);
  });

  test("guitar fret pitches stay chromatic across octave boundaries", () => {
    const { bar } = createScoreGraph({
      tempo: 120,
      beatsCount: 4,
      duration: NoteDuration.Quarter,
      repeatStatus: BarRepeatStatus.None,
      repeatCount: null,
    });
    const beat = bar.getVoiceBar(1)!.beats[0];
    const expectedNotes = [
      [NoteValue.E, 2],
      [NoteValue.F, 2],
      [NoteValue.FSharp, 2],
      [NoteValue.G, 2],
      [NoteValue.GSharp, 2],
      [NoteValue.A, 2],
      [NoteValue.ASharp, 2],
      [NoteValue.B, 2],
      [NoteValue.C, 3],
    ] as const;

    for (let fret = 0; fret < expectedNotes.length; fret++) {
      const note = new GuitarNote(beat, beat.trackContext, 6, fret);
      const [noteValue, octave] = expectedNotes[fret];

      expect(note.noteValue).toBe(noteValue);
      expect(note.octave).toBe(octave);
    }

    const fret0 = new GuitarNote(beat, beat.trackContext, 6, 0);
    const fret12 = new GuitarNote(beat, beat.trackContext, 6, 12);
    const fret24 = new GuitarNote(beat, beat.trackContext, 6, 24);

    expect(getNoteFrequency(fret12)).toBeCloseTo(getNoteFrequency(fret0) * 2);
    expect(getNoteFrequency(fret24)).toBeCloseTo(getNoteFrequency(fret0) * 4);
  });

  test("simple tuning shift helpers preserve conventional string order", () => {
    expect(shiftNoteValue(NoteValue.E, 1)).toBe(NoteValue.F);
    expect(shiftNoteValue(NoteValue.E, -1)).toBe(NoteValue.DSharp);
    expect(shiftTuningString("E A D G B E", 0, 1)).toBe("F A D G B E");
    expect(shiftTuningString("E A D G B E", 5, -1)).toBe("E A D G B D#");
    expect(shiftTuningWhole("E A D G B E", 1)).toBe("F A# D# G# C F");
  });

  test("default simple tuning strings use conventional string order", () => {
    const expectedTunings = [
      "E",
      "E B",
      "E B G",
      "E A D G",
      "G D G B D",
      "E A D G B E",
      "B E A D G B E",
      "F# B E A D G B E",
      "C# F# B E A D G B E",
      "G# C# F# B E A D G B E",
      "D# G# C# F# B E A D G B E",
      "A# D# G# C# F# B E A D G B E",
    ];

    for (let stringCount = 1; stringCount <= 12; stringCount++) {
      expect(getDefaultTuningStrSimple(stringCount)).toBe(
        expectedTunings[stringCount - 1]
      );
    }

    expect(getDefaultTuningStrSimple(13)).toBeNull();
  });
});
