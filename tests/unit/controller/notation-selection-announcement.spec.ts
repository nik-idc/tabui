import {
  captureSelectionCursor,
  formatNotationSelection,
  notationSelectionsEqual,
} from "../../../src/notation/accessibility/notation-selection-announcement";
import { SelectionManager } from "../../../src/notation/controller/selection/selection-manager";
import {
  AccentType,
  AccentOptions,
  BeatGuitarTechniqueType,
  DEFAULT_MASTER_BAR,
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
        "Track Guitar, Staff 1, voice 1, 3 beats selected, " +
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
      "Track Guitar, Staff 1, voice 1, 1 beat selected, " +
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
      "Track Guitar, Staff 1, voice 1, Bar 1, 4/4, 120 BPM, " +
        "Beat 1, half, String 1, empty."
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
