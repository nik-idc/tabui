import {
  captureSelectionCursor,
  captureSelectionText,
  formatActiveDynamic,
  formatNotationSelection,
  formatSelectionRecap,
  notationSelectionsEqual,
} from "../../../src/notation/accessibility/notation-selection-announcement";
import { SelectionManager } from "../../../src/notation/controller/selection/selection-manager";
import {
  AccentType,
  AccentOptions,
  BeatGuitarTechniqueType,
  DEFAULT_MASTER_BAR,
  Dynamic,
  GuitarNote,
  GuitarTechniqueType,
  NoteDuration,
  ScoreEditor,
  STROKE_ALIGNMENT_FALLS_ON_TIME,
  STROKE_DURATION_EIGHTH,
  STROKE_DURATION_SIXTEENTH,
  StrokeDirection,
  StrokeOptions,
} from "../../../src/notation/model";
import { createBeat, createScoreGraph } from "../model/helpers";
import { required } from "../required";

/** Builds a real selection model with two two-beat bars. */
function createSelection() {
  const { score, track, staff } = createScoreGraph();
  track.name = "Guitar";
  score.appendMasterBar(DEFAULT_MASTER_BAR);
  for (const bar of staff.bars) {
    const voice = required(bar.getVoiceBar(1));
    voice.beats.splice(
      0,
      voice.beats.length,
      createBeat(voice, NoteDuration.Half),
      createBeat(voice, NoteDuration.Half)
    );
  }
  return {
    selection: new SelectionManager(track),
    beats: staff.getBeatsSeq(1),
  };
}

describe("notation selection announcements", () => {
  test.each([false, true])(
    "normalizes cross-bar bounds, backward=%s",
    (backward) => {
      const { selection, beats } = createSelection();
      selection.selectBeat(beats[backward ? 3 : 1]);
      selection.selectBeat(beats[backward ? 1 : 3]);
      expect(formatNotationSelection(selection)).toBe(
        "3 beats selected, " +
          "bar 1 beat 2 to bar 2 beat 2, anchor " +
          (backward
            ? "bar 2 beat 2, active end bar 1 beat 2."
            : "bar 1 beat 2, active end bar 2 beat 2.")
      );
    }
  );

  test("uses singular wording when contracting to the anchor", () => {
    const { selection, beats } = createSelection();
    selection.selectBeat(beats[2]);
    selection.selectBeat(beats[3]);
    selection.selectBeat(beats[2]);
    expect(formatNotationSelection(selection)).toBe(
      "1 beat selected, " +
        "bar 2 beat 1 to bar 2 beat 1, anchor bar 2 beat 1, active end bar 2 beat 1."
    );
  });

  test("announces full cursor context on leaving a range, then concise arrows", () => {
    const { selection, beats } = createSelection();
    selection.selectBeat(beats[0]);
    selection.selectBeat(beats[3]);
    const range = captureSelectionCursor(selection.selectionCursor);
    selection.clearRange();
    const cursor = required(captureSelectionCursor(selection.selectionCursor));
    expect(formatNotationSelection(selection, range)).toBe(
      "Track Guitar, Bar 1, 4/4, 120 BPM, " + "Beat 1, half, String 1, empty."
    );
    selection.selectBeatCursor(beats[1], 0);
    const next = required(captureSelectionCursor(selection.selectionCursor));
    expect(formatNotationSelection(selection, cursor)).toBe(
      "Beat 2, half, String 1, empty."
    );
    selection.selectBeatCursor(beats[1], 1);
    expect(formatNotationSelection(selection, next)).toBe("String 2, empty.");
  });

  test.each([
    {
      name: "down stroke",
      options: {
        direction: StrokeDirection.Down,
        duration: STROKE_DURATION_SIXTEENTH,
      },
      text: "down stroke, duration 16th note",
    },
    {
      name: "up stroke between note values that falls on time",
      options: {
        direction: StrokeDirection.Up,
        duration: STROKE_DURATION_EIGHTH + 100,
        alignment: STROKE_ALIGNMENT_FALLS_ON_TIME,
      },
      text: "up stroke, duration between 8th note and quarter note, falls on time",
    },
    {
      name: "early stroke",
      options: {
        direction: StrokeDirection.Down,
        duration: STROKE_DURATION_EIGHTH,
        alignment: 40,
      },
      text: "down stroke, duration 8th note, 40% before the beat",
    },
  ])(
    "announces the stroke with the beat, not the string: $name",
    ({ options, text }) => {
      const { selection, beats } = createSelection();
      ScoreEditor.setBeatTechnique([beats[1]], BeatGuitarTechniqueType.Stroke, {
        strokeOptions: new StrokeOptions(options),
      });
      selection.selectBeatCursor(beats[0], 0);
      const previous = captureSelectionCursor(selection.selectionCursor);
      selection.selectBeatCursor(beats[1], 0);
      const onBeat = captureSelectionCursor(selection.selectionCursor);
      expect(formatNotationSelection(selection, previous)).toBe(
        `Beat 2, half, ${text}, String 1, empty.`
      );
      selection.selectBeatCursor(beats[1], 1);
      expect(formatNotationSelection(selection, onBeat)).toBe(
        "String 2, empty."
      );
    }
  );

  test("recaps the score, track, and cursor in full", () => {
    const { selection, beats } = createSelection();
    const track = beats[0].voiceBar.bar.staff.track;
    track.score.name = "Song";
    track.score.artist = "Band";
    selection.selectBeatCursor(beats[1], 0);
    expect(formatSelectionRecap(selection)).toBe(
      "Song by Band. Track Guitar, 1 of 1. Staff 1 of 1, voice 1. " +
        "Bar 1 of 2, 4/4, 120 BPM. Beat 2 of 2, half, mezzo forte. " +
        "String 1, empty."
    );
  });

  test("recaps a range without a title, and with no selection says nothing", () => {
    const { selection, beats } = createSelection();
    const score = beats[0].voiceBar.bar.staff.track.score;
    score.name = "";
    score.artist = "";
    expect(formatSelectionRecap(selection)).toBeUndefined();
    selection.selectBeat(beats[0]);
    selection.selectBeat(beats[2]);
    expect(formatSelectionRecap(selection)).toBe(
      "Track Guitar, 1 of 1. Staff 1 of 1, voice 1. " +
        "3 beats selected, bar 1 beat 1 to bar 2 beat 1, active end bar 2 beat 1."
    );
  });

  test("names the staff only when the track has more than one", () => {
    const { selection, beats } = createSelection();
    const track = beats[0].voiceBar.bar.staff.track;
    track.insertStaff(1);
    selection.selectBeatCursor(beats[0], 0);
    expect(formatNotationSelection(selection)).toBe(
      "Track Guitar, Staff 1, Bar 1, 4/4, 120 BPM, Beat 1, half, String 1, empty."
    );
  });

  test("names voice 1 only when another voice has beats", () => {
    const { selection, beats } = createSelection();
    const bar = beats[0].voiceBar.bar;
    bar.insertVoiceBar(2);
    selection.selectBeatCursor(beats[0], 0);
    expect(formatNotationSelection(selection)).toBe(
      "Track Guitar, voice 1, Bar 1, 4/4, 120 BPM, Beat 1, half, String 1, empty."
    );
    const position = captureSelectionCursor(selection.selectionCursor);
    selection.selectBeatCursor(beats[2], 0);
    expect(formatNotationSelection(selection, position)).toBe(
      "Bar 2, 4/4, 120 BPM, Voice 1, Beat 1, half, String 1, empty."
    );
  });

  test("reads only what an edit changed when the cursor stays in place", () => {
    const { selection, beats } = createSelection();
    selection.selectBeatCursor(beats[0], 0);
    const position = captureSelectionCursor(selection.selectionCursor);
    const text = captureSelectionText(selection);
    const track = beats[0].voiceBar.bar.staff.track;

    track.name = "Lead";
    expect(formatNotationSelection(selection, position, text)).toBeUndefined();

    beats[0].dots = 1;
    expect(formatNotationSelection(selection, position, text)).toBe(
      "Beat 1, half, 1 dot, String 1, empty."
    );

    beats[0].voiceBar.bar.masterBar.tempo = 90;
    expect(formatNotationSelection(selection, position, text)).toBe(
      "Bar 1, 4/4, 90 BPM, Beat 1, half, 1 dot, String 1, empty."
    );
  });

  test("names a dynamic only on the beat where it changes, also across bars", () => {
    const { selection, beats } = createSelection();
    beats[1].dynamic = Dynamic.Forte;
    beats[2].dynamic = Dynamic.Forte;
    beats[3].dynamic = Dynamic.Piano;
    const announce = (index: number) => {
      selection.selectBeatCursor(beats[index], 0);
      return formatNotationSelection(selection);
    };

    expect(announce(0)).not.toContain("forte");
    expect(announce(1)).toContain("Beat 2, half, forte, String 1");
    // Bar 2 beat 1 keeps forte from bar 1, so it is not named again.
    expect(announce(2)).not.toContain("forte");
    expect(announce(3)).toContain("Beat 2, half, piano, String 1");
  });

  test("speaks an edited dynamic even when navigation text would not name it", () => {
    const { selection, beats } = createSelection();
    beats[0].dynamic = Dynamic.Forte;
    selection.selectBeatCursor(beats[1], 0);
    expect(formatActiveDynamic(selection)).toBe("Dynamic mezzo forte");

    // The edit makes beat 2 match beat 1, so navigation text drops it.
    beats[1].dynamic = Dynamic.Forte;
    expect(formatNotationSelection(selection)).not.toContain("forte");
    expect(formatActiveDynamic(selection)).toBe("Dynamic forte");

    // A range speaks its active end.
    beats[3].dynamic = Dynamic.Piano;
    selection.selectBeat(beats[1]);
    selection.selectBeat(beats[3]);
    expect(formatActiveDynamic(selection)).toBe("Dynamic piano");
  });

  test("announces a heavy accent on its string", () => {
    const { selection, beats } = createSelection();
    const note = required(beats[0].notes)[1] as GuitarNote;
    note.setFret(5);
    note.setTechnique(
      GuitarTechniqueType.Accent,
      new AccentOptions({ kind: AccentType.Heavy })
    );
    selection.selectBeatCursor(beats[0], 0);
    const previous = captureSelectionCursor(selection.selectionCursor);
    selection.selectBeatCursor(beats[0], 1);
    expect(formatNotationSelection(selection, previous)).toBe(
      "String 2, fret 5, heavy accent."
    );
  });

  test("does not invent an active endpoint for an absent or incomplete range", () => {
    const { selection, beats } = createSelection();
    expect(formatNotationSelection(selection)).toBeUndefined();
    expect(
      formatNotationSelection({
        selectionCursor: undefined,
        selectionAsBeats: beats,
        selectionEndBeat: undefined,
      })
    ).toBeUndefined();
  });

  test("preserves cursor slot equality including absent cursors", () => {
    const { selection, beats } = createSelection();
    selection.selectBeatCursor(beats[0], 0);
    const first = captureSelectionCursor(selection.selectionCursor);
    expect(notationSelectionsEqual(undefined, undefined)).toBe(true);
    expect(notationSelectionsEqual(first, undefined)).toBe(false);
    expect(notationSelectionsEqual(undefined, first)).toBe(false);
    beats[0].dots = 1;
    expect(
      notationSelectionsEqual(
        first,
        captureSelectionCursor(selection.selectionCursor)
      )
    ).toBe(true);
    selection.selectBeatCursor(beats[0], 1);
    expect(
      notationSelectionsEqual(
        first,
        captureSelectionCursor(selection.selectionCursor)
      )
    ).toBe(false);
    selection.selectBeatCursor(beats[1], 0);
    expect(
      notationSelectionsEqual(
        first,
        captureSelectionCursor(selection.selectionCursor)
      )
    ).toBe(false);
  });

  test("retains the previous position when the same cursor moves", () => {
    const { selection, beats } = createSelection();
    selection.selectBeatCursor(beats[0], 0);
    const cursor = required(selection.selectionCursor);
    const previous = captureSelectionCursor(cursor);
    cursor.moveRight(false);
    cursor.moveDown();
    expect(formatNotationSelection(selection, previous)).toBe(
      "Beat 2, half, String 2, empty."
    );
    expect(
      notationSelectionsEqual(previous, captureSelectionCursor(cursor))
    ).toBe(false);
  });
});
