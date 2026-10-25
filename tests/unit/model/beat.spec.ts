import {
  Beat,
  Guitar,
  GuitarNote,
  GuitarTechniqueType,
  NoteDuration,
  NoteValue,
  Score,
  MusicInstrument,
} from "../../../src/notation/model";
import { createBarWithBeats, createBeat } from "./helpers";

describe("Beat model", () => {
  test("invalid tuplets reject earlier changes and leave existing rhythm and timing intact", () => {
    const score = new Score();
    const voice = score.tracks[0].staves[0].bars[0].ensureVoiceBar(1);
    const beat = voice.beats[0];
    Beat.updateRhythm([
      { beat, dots: 1, tupletSettings: { normalCount: 3, tupletCount: 2 } },
    ]);
    expect(() =>
      Beat.updateRhythm([
        { beat, duration: NoteDuration.Half, dots: 2, tupletSettings: null },
        {
          beat,
          duration: NoteDuration.Eighth,
          dots: 0,
          tupletSettings: { normalCount: 0, tupletCount: 2 },
        },
      ])
    ).toThrow("outside the supported range");
    expect(beat.baseDuration).toBe(NoteDuration.Quarter);
    expect(beat.dots).toBe(1);
    expect(beat.tupletSettings).toEqual({ normalCount: 3, tupletCount: 2 });
    expect([beat.startTick, beat.endTick]).toEqual([0, 2]);
    expect(voice.getActualBarDuration()).toBe(0.25);
  });

  test("invalid dots reject the whole batch before changing written or derived rhythm", () => {
    const score = new Score();
    const bar = score.tracks[0].staves[0].bars[0];
    const first = bar.ensureVoiceBar(1);
    const second = bar.ensureVoiceBar(2);
    expect(() =>
      Beat.updateRhythm([
        { beat: first.beats[0], duration: NoteDuration.Half, dots: 1 },
        { beat: second.beats[0], duration: NoteDuration.Eighth, dots: 3 },
      ])
    ).toThrow("invalid dots value");
    for (const voice of [first, second]) {
      const beat = voice.beats[0];
      expect(beat.baseDuration).toBe(NoteDuration.Quarter);
      expect(beat.dots).toBe(0);
      expect([beat.startTick, beat.endTick]).toEqual([0, 1]);
      expect(voice.getActualBarDuration()).toBe(0.25);
    }
  });

  test("explicit updates retain omitted fields and never toggle matching values", () => {
    const score = new Score();
    const voice = score.tracks[0].staves[0].bars[0].ensureVoiceBar(1);
    const beat = voice.beats[0];
    const settings = { normalCount: 3, tupletCount: 2 };
    Beat.updateRhythm([
      {
        beat,
        duration: NoteDuration.Eighth,
        dots: 1,
        tupletSettings: settings,
      },
    ]);
    Beat.updateRhythm([{ beat, dots: 1, tupletSettings: settings }]);
    settings.normalCount = 5;
    expect(beat.baseDuration).toBe(NoteDuration.Eighth);
    expect(beat.dots).toBe(1);
    expect(beat.tupletSettings).toEqual({ normalCount: 3, tupletCount: 2 });
    expect(voice.getActualBarDuration()).toBe(0.125);
    Beat.updateRhythm([{ beat, tupletSettings: null }]);
    expect(voice.tupletGroups).toEqual([]);
    expect(voice.getActualBarDuration()).toBe(0.1875);
  });

  test("applies explicit rhythm across voices and rebuilds their complete timing", () => {
    const score = new Score();
    const bar = score.tracks[0].staves[0].bars[0];
    const first = bar.ensureVoiceBar(1);
    const second = bar.ensureVoiceBar(2);
    first.insertBeats(1, [
      new Beat(first, first.trackContext),
      new Beat(first, first.trackContext),
    ]);
    const settings = { normalCount: 3, tupletCount: 2 };
    Beat.updateRhythm([
      ...first.beats.map((beat) => ({
        beat,
        duration: NoteDuration.Eighth,
        dots: 0,
        tupletSettings: settings,
      })),
      {
        beat: second.beats[0],
        duration: NoteDuration.Half,
        dots: 1,
        tupletSettings: null,
      },
    ]);
    expect(first.getActualBarDuration()).toBe(0.25);
    expect(first.tickResolution).toBe(24);
    expect(first.beats.map((b) => [b.startTick, b.endTick])).toEqual([
      [0, 2],
      [2, 4],
      [4, 6],
    ]);
    expect(first.tupletGroups).toHaveLength(1);
    expect(first.tupletGroups[0].complete).toBe(true);
    expect(first.beats.map((b) => b.beamGroupId)).toEqual([0, 0, 0]);
    expect(first.beats[2].lastInBeamGroup).toBe(true);
    expect(second.getActualBarDuration()).toBe(0.75);
    expect(first.beats[0].tupletSettings).not.toBe(settings);
    expect(first.beats[0].tupletSettings).not.toBe(
      first.beats[1].tupletSettings
    );
  });

  test("deepCopy adapts note lanes to a smaller destination instrument", () => {
    const score = new Score();
    const sourceVoice = score.tracks[0].staves[0].bars[0].ensureVoiceBar(1);
    const source = new Beat(sourceVoice, sourceVoice.trackContext);
    const note = expectNotes(source)[0] as GuitarNote;
    note.fret = 5;
    source.tupletSettings = { normalCount: 3, tupletCount: 2 };
    const track = score.addTrack(
      new Guitar(undefined, undefined, "Bass", 4),
      "Bass"
    ).tracks[0];
    const target = track.staves[0].bars[0].ensureVoiceBar(1);

    const copy = source.deepCopy(target);

    expect(copy.notes).toHaveLength(4);
    expect(copy.trackContext).toBe(target.trackContext);
    expect(copy.tupletSettings).toEqual({ normalCount: 3, tupletCount: 2 });
    expect(copy.tupletSettings).not.toBe(source.tupletSettings);
    expect((expectNotes(copy)[0] as GuitarNote).fret).toBe(5);
  });

  test("deepCopy keeps empty destination lanes and local dead-note markings", () => {
    const score = new Score();
    const smallTrack = score.addTrack(
      new Guitar(undefined, undefined, "Bass", 4),
      "Bass"
    ).tracks[0];
    const sourceVoice = smallTrack.staves[0].bars[0].ensureVoiceBar(1);
    const source = new Beat(
      sourceVoice,
      sourceVoice.trackContext,
      [],
      NoteDuration.Eighth,
      2
    );
    const dead = expectNotes(source)[0] as GuitarNote;
    dead.fret = -1;
    dead.setTechnique(GuitarTechniqueType.PalmMute);
    const marker = expectNotes(source)[1] as GuitarNote;
    marker.setTechnique(GuitarTechniqueType.LetRing);
    const target = score.tracks[0].staves[0].bars[0].ensureVoiceBar(1);

    const copy = source.deepCopy(target);
    const copiedDead = expectNotes(copy)[0] as GuitarNote;
    const copiedMarker = expectNotes(copy)[1] as GuitarNote;

    expect(copy.notes).toHaveLength(6);
    expect(copy.baseDuration).toBe(NoteDuration.Eighth);
    expect(copy.dots).toBe(2);
    expect(copiedDead.trackContext).toBe(target.trackContext);
    expect(copiedDead.fret).toBe(-1);
    expect(copiedDead.hasTechnique(GuitarTechniqueType.PalmMute)).toBe(true);
    expect(copiedMarker.fret).toBeNull();
    expect(copiedMarker.hasTechnique(GuitarTechniqueType.LetRing)).toBe(true);
    expect(copiedMarker.hasTechnique(GuitarTechniqueType.PalmMute)).toBe(false);
    expect((expectNotes(copy)[4] as GuitarNote).fret).toBeNull();
    expect(expectNotes(copy)[4].techniques).toEqual([]);
    copiedDead.removeTechnique(GuitarTechniqueType.PalmMute);
    expect(dead.hasTechnique(GuitarTechniqueType.PalmMute)).toBe(true);
  });

  function expectNotes<I extends MusicInstrument>(beat: Beat<I>) {
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
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 5, tupletCount: 4 },
      },
    ]);

    expect(beats[0].compare(beats[1])).toBe(true);
    expect(beats[0].compare(beats[2])).toBe(false);
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
    expect(copiedNote.techniques[0]).not.toBe(sourceNote.techniques[0]);
    expect(copiedNote.techniques[0].note).toBe(copiedNote);
    expect(sourceNote.techniques[0].note).toBe(sourceNote);
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
