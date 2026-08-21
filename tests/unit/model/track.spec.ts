import {
  ElectricGuitarTone,
  Guitar,
  GuitarNote,
  parseTuning,
  parseTuningStrSimple,
  Score,
  StringInstrumentType,
  Track,
  TrackInstrumentChangeMode,
} from "../../../src/notation/model";
import { createScoreGraph } from "./helpers";

describe("Track model", () => {
  test("new Track creates one default staff", () => {
    const track = new Track(new Score(), new Guitar(), "Guitar");

    expect(track.staves).toHaveLength(1);
    expect(track.staves[0].track).toBe(track);
    expect(track.staves[0].bars).toHaveLength(1);
  });

  test("removeStaff rejects index equal to current length", () => {
    const track = new Track(new Score(), new Guitar(), "Guitar");

    expect(() => track.removeStaff(track.staves.length)).toThrow(Error);
  });

  test("removeStaff keeps one default staff when removing the last staff", () => {
    const track = new Track(new Score(), new Guitar(), "Guitar");

    const outputs = track.removeStaff(0);

    expect(outputs).toHaveLength(2);
    expect(track.staves).toHaveLength(1);
    expect(track.staves[0].track).toBe(track);
    expect(track.staves[0].bars).toHaveLength(track.score.masterBars.length);
  });

  test("insertStaff aligns bars with master bars", () => {
    const score = new Score();
    score.appendMasterBar();
    const track = new Track(score, new Guitar(), "Guitar");

    const result = track.insertStaff(track.staves.length);

    expect(result.staves).toHaveLength(1);
    expect(result.staves[0].bars).toHaveLength(score.masterBars.length);
  });

  test("setInstrument updates the track context instrument", () => {
    const track = new Track(new Score(), new Guitar(), "Guitar");
    const instrument = new Guitar(
      StringInstrumentType.ElectricGuitar,
      ElectricGuitarTone.Overdrive
    );

    track.setInstrument(instrument);

    expect(track.context.instrument).toBe(instrument);
    expect(track.staves[0].trackContext.instrument).toBe(instrument);
  });

  test("setInstrument keeps frets and recalculates pitch by default", () => {
    const { track, bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected test bar to include voice 1");
    }
    const beat = voiceBar.beats[0];
    const note = new GuitarNote(beat, beat.trackContext, 6, 3);
    beat.makeBeatWithNotes();
    const [storedNote] = beat.setNote(0, note).notes as GuitarNote[];

    track.setInstrument(
      new Guitar(
        StringInstrumentType.ElectricGuitar,
        ElectricGuitarTone.Clean,
        "Drop D",
        6,
        parseTuning("E B G D A D")
      )
    );

    expect(storedNote.fret).toBe(3);
    expect(storedNote.getNoteStr()).toBe("F2");
  });

  test("setInstrument transpose mode keeps pitch and recalculates fret", () => {
    const { track, bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected test bar to include voice 1");
    }
    const beat = voiceBar.beats[0];
    const note = new GuitarNote(beat, beat.trackContext, 6, 3);
    beat.makeBeatWithNotes();
    const [storedNote] = beat.setNote(0, note).notes as GuitarNote[];

    track.setInstrument(
      new Guitar(
        StringInstrumentType.ElectricGuitar,
        ElectricGuitarTone.Clean,
        "Drop D",
        6,
        parseTuning("E B G D A D")
      ),
      TrackInstrumentChangeMode.Transpose
    );

    expect(storedNote.getNoteStr()).toBe("G2");
    expect(storedNote.fret).toBe(5);
  });

  test("setInstrument transpose mode handles conventional tuning input order", () => {
    const { track, bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected test bar to include voice 1");
    }
    const beat = voiceBar.beats[0];
    beat.makeBeatWithNotes();
    const note = new GuitarNote(beat, beat.trackContext, 6, 3);
    const [storedNote] = beat.setNote(0, note).notes as GuitarNote[];
    const originalPitch = storedNote.getNoteStr();

    track.setInstrument(
      new Guitar(
        StringInstrumentType.ElectricGuitar,
        ElectricGuitarTone.Clean,
        "Drop D",
        6,
        parseTuningStrSimple("D A D G B E")
      ),
      TrackInstrumentChangeMode.Transpose
    );

    expect(storedNote.getNoteStr()).toBe(originalPitch);
    expect(storedNote.fret).toBe(5);
  });
});
