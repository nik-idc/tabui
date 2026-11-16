import type { TrackController } from "../../../src/notation/controller/track-controller";
import { SelectedMoveDirection } from "../../../src/notation/controller/selection/selection-cursor";
import {
  Beat,
  BendTechniqueOptions,
  BendType,
  DEFAULT_MASTER_BAR,
  GuitarNote,
  GuitarTechniqueType,
  NoteDuration,
} from "../../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";
import { createTestTrackController } from "./helpers";

const SLIDE = GuitarTechniqueType.Slide;
const LEGATO = GuitarTechniqueType.Legato;
const BEND = GuitarTechniqueType.Bend;

/** String 1 of a beat, given a fret first when one is passed. */
function string1(beat: Beat, fret?: number | null): GuitarNote {
  beat.makeBeatWithNotes();
  const note = beat.notes?.[0];
  if (!(note instanceof GuitarNote)) {
    throw Error("Expected a guitar note");
  }
  if (fret !== undefined) {
    note.setFret(fret);
  }
  return note;
}

/** One bar of quarter beats with the given frets on string 1. */
function setup(frets: number[]): {
  controller: TrackController;
  notes: GuitarNote[];
} {
  const { track, beats } = createBarWithBeats(
    frets.map(() => ({ baseDuration: NoteDuration.Quarter }))
  );
  const notes = beats.map((beat, i) => string1(beat, frets[i]));
  return { controller: createTestTrackController(track), notes };
}

describe("technique validity after note edits", () => {
  test("a source fret equal to the target removes the slide; undo restores it", () => {
    const { controller, notes } = setup([2, 4]);
    controller.setTechnique(SLIDE);
    expect(notes[0].hasTechnique(SLIDE)).toBe(true);

    controller.setSelectedNoteFret(4);
    expect(string1(notes[0].beat).hasTechnique(SLIDE)).toBe(false);

    controller.undo();
    expect(string1(notes[0].beat).fret).toBe(2);
    expect(string1(notes[0].beat).hasTechnique(SLIDE)).toBe(true);
  });

  test.each([
    { target: 2, slide: false, legato: false },
    { target: -1, slide: false, legato: false },
    { target: null, slide: false, legato: false },
    { target: 0, slide: false, legato: true },
    { target: 7, slide: true, legato: true },
  ])(
    "changing the target to $target leaves slide $slide and legato $legato",
    ({ target, slide, legato }) => {
      const { controller, notes } = setup([2, 4, 2, 4]);
      controller.setTechnique(SLIDE);
      controller.moveSelectedNote(SelectedMoveDirection.Right);
      controller.moveSelectedNote(SelectedMoveDirection.Right);
      controller.setTechnique(LEGATO);
      expect(notes[0].hasTechnique(SLIDE)).toBe(true);
      expect(notes[2].hasTechnique(LEGATO)).toBe(true);

      // Edit the targets: beat 2 for the slide, beat 4 for the legato.
      controller.moveSelectedNote(SelectedMoveDirection.Left);
      controller.setSelectedNoteFret(target);
      controller.moveSelectedNote(SelectedMoveDirection.Right);
      controller.moveSelectedNote(SelectedMoveDirection.Right);
      controller.setSelectedNoteFret(target);

      const live = notes.map((n) => string1(n.beat));
      expect(live[0].hasTechnique(SLIDE)).toBe(slide);
      expect(live[2].hasTechnique(LEGATO)).toBe(legato);

      controller.undo();
      controller.undo();
      expect(string1(notes[0].beat).hasTechnique(SLIDE)).toBe(true);
      expect(string1(notes[2].beat).hasTechnique(LEGATO)).toBe(true);
    }
  );

  test.each([
    { target: 0, slide: false, legato: true },
    { target: -1, slide: false, legato: false },
    { target: null, slide: false, legato: false },
    { target: 5, slide: true, legato: true },
  ])(
    "a target of $target allows slide $slide and legato $legato",
    ({ target, slide, legato }) => {
      const { controller, notes } = setup([3, 0]);
      string1(notes[1].beat, target);
      expect(controller.canSetTechnique(SLIDE)).toBe(slide);
      expect(controller.canSetTechnique(LEGATO)).toBe(legato);
    }
  );

  test("an open string cannot be bent, and moving a bent note to 0 removes the bend", () => {
    const bendOptions = new BendTechniqueOptions({
      type: BendType.Bend,
      bendPitch: 1,
      bendDuration: 1,
    });
    const open = setup([0]);
    expect(open.notes[0].isTechniqueApplicable(BEND)).toBe(false);

    const { controller, notes } = setup([5]);
    controller.setTechnique(BEND, { bendOptions });
    expect(notes[0].hasTechnique(BEND)).toBe(true);
    controller.setSelectedNoteFret(0);
    expect(string1(notes[0].beat).hasTechnique(BEND)).toBe(false);
    controller.undo();
    expect(string1(notes[0].beat).hasTechnique(BEND)).toBe(true);
  });

  test("tying the target to the source removes the slide; undo restores it", () => {
    const { controller, notes } = setup([2, 4]);
    controller.setTechnique(SLIDE);
    controller.moveSelectedNote(SelectedMoveDirection.Right);

    // The tie gives the target the source's fret.
    controller.setTechnique(GuitarTechniqueType.Tie);
    expect(string1(notes[1].beat).fret).toBe(2);
    expect(string1(notes[0].beat).hasTechnique(SLIDE)).toBe(false);

    controller.undo();
    expect(string1(notes[1].beat).fret).toBe(4);
    expect(string1(notes[0].beat).hasTechnique(SLIDE)).toBe(true);
  });

  test("inserting a beat inside a slide removes it; undo restores it", () => {
    const { controller, notes } = setup([2, 4]);
    controller.setTechnique(SLIDE);

    controller.insertBeatAfterSelected();
    expect(string1(notes[0].beat).hasTechnique(SLIDE)).toBe(false);

    controller.undo();
    expect(string1(notes[0].beat).hasTechnique(SLIDE)).toBe(true);
  });

  test("a slide across a bar line is checked against the next bar", () => {
    const { track, score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Whole },
    ]);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const source = string1(beats[0], 2);
    const nextBeat = track.staves[0].bars[1].getVoiceBar(1)?.beats[0];
    if (nextBeat === undefined) {
      throw Error("Expected a beat in bar 2");
    }
    string1(nextBeat, 4);
    const controller = createTestTrackController(track);
    controller.setTechnique(SLIDE);
    expect(source.hasTechnique(SLIDE)).toBe(true);

    controller.moveSelectionByBar(SelectedMoveDirection.Right);
    controller.setSelectedNoteFret(2);
    expect(string1(beats[0]).hasTechnique(SLIDE)).toBe(false);
    controller.undo();
    expect(string1(beats[0]).hasTechnique(SLIDE)).toBe(true);
  });
});
