import { TrackElement } from "../../src/notation/controller/element/track-element";
import {
  BendTechniqueOptions,
  BendType,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteDuration,
} from "../../src/notation/model";
import { TabLayoutDimensions } from "../../src/notation/controller/tab-layout-dimensions";
import { createBarWithBeats, createScoreGraph } from "../model/helpers";
import { ensureLayoutConfigured } from "./helpers";

describe("TrackElement techniques", () => {
  beforeAll(() => {
    ensureLayoutConfigured();
  });

  test("creates an inline slide path between two fretted notes", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);

    const firstNote = beats[0].notes[0] as GuitarNote;
    const nextNote = beats[1].notes[0] as GuitarNote;
    firstNote.fret = 5;
    nextNote.fret = 7;
    firstNote.addTechnique(
      new GuitarTechnique(firstNote, GuitarTechniqueType.Slide)
    );

    const trackElement = new TrackElement(track);
    trackElement.update();

    const firstBeatElement =
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].barElements[0].beatElements[0];
    const firstNoteElement = firstBeatElement.noteElements[0];
    const slideElement = firstNoteElement.guitarTechniqueElements[0];

    expect(firstNoteElement.guitarTechniqueElements).toHaveLength(1);
    expect(slideElement.svgPath).toBeDefined();
    expect(slideElement.svgPath).not.toBe("");
  });

  test("creates labels on all technique gap lines", () => {
    const { track, bar } = createScoreGraph();
    const vibratoNote = bar.beats[0].notes[0] as GuitarNote;
    const palmMuteNote = bar.beats[0].notes[1] as GuitarNote;
    const bendNote = bar.beats[0].notes[2] as GuitarNote;

    vibratoNote.addTechnique(
      new GuitarTechnique(vibratoNote, GuitarTechniqueType.Vibrato)
    );
    palmMuteNote.addTechnique(
      new GuitarTechnique(palmMuteNote, GuitarTechniqueType.PalmMute)
    );
    bendNote.addTechnique(
      new GuitarTechnique(
        bendNote,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 1,
          bendDuration: 1,
        })
      )
    );

    const trackElement = new TrackElement(track);
    trackElement.update();

    const techGap =
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].techGapElement;
    const line1 = techGap.techGapLines[1];
    const line2 = techGap.techGapLines[2];
    const line3 = techGap.techGapLines[3];

    expect(techGap.rect.height).toBe(TabLayoutDimensions.TECH_LABEL_HEIGHT * 3);
    expect(line1).not.toBeNull();
    expect(line2).not.toBeNull();
    expect(line3).not.toBeNull();
    expect(line1?.labelElements).toHaveLength(1);
    expect(line2?.labelElements).toHaveLength(1);
    expect(line3?.labelElements).toHaveLength(1);
    expect(line1?.labelElements[0].svgPath).toBeDefined();
    expect(line2?.labelElements[0].svgPath).toBeDefined();
    expect(line3?.labelElements[0].svgPath).toBeDefined();
  });

  test("creates a bend inline element path", () => {
    const { track, bar } = createScoreGraph();
    const note = bar.beats[0].notes[0] as GuitarNote;

    note.addTechnique(
      new GuitarTechnique(
        note,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Bend,
          bendPitch: 1,
          bendDuration: 1,
        })
      )
    );
    const trackElement = new TrackElement(track);
    trackElement.update();

    const line3 =
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].techGapElement.techGapLines[3];

    expect(line3).not.toBeNull();
    const beatElement =
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].barElements[0].beatElements[0];
    const noteElement = beatElement.noteElements[0];
    const bendElement = noteElement.guitarTechniqueElements[0];
    expect(noteElement.guitarTechniqueElements).toHaveLength(1);
    expect(bendElement.svgPath).toBeDefined();
    expect(line3?.labelElements).toHaveLength(1);
  });
});
