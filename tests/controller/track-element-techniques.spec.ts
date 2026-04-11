import { TrackElement } from "../../src/notation/controller/element/track-element";
import {
  BendTechniqueOptions,
  BendType,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteDuration,
} from "../../src/notation/model";
import { EditorLayoutDimensions } from "../../src/notation/controller/editor-layout-dimensions";
import { createBarWithBeats, createScoreGraph } from "../model/helpers";
import { ensureLayoutConfigured } from "./helpers";

function parseLinePath(svgPath: string): [number, number, number, number] {
  const match = svgPath.match(
    /m\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+L\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/
  );
  if (match === null) {
    throw new Error(`Failed to parse line path: ${svgPath}`);
  }

  return match.slice(1).map(Number) as [number, number, number, number];
}

describe("TrackElement techniques", () => {
  beforeAll(() => {
    ensureLayoutConfigured();
  });

  test("creates an inline slide path between two fretted notes with ascending slope for lower-to-higher notes", () => {
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
    const slideElement = firstNoteElement.techniqueElements[0];
    const [startX, startY, endX, endY] = parseLinePath(
      slideElement.pathDescriptors?.[0]?.d ?? ""
    );

    expect(firstNoteElement.techniqueElements).toHaveLength(1);
    expect(slideElement.pathDescriptors).toHaveLength(1);
    expect(slideElement.pathDescriptors?.[0]?.d).toBeDefined();
    expect(slideElement.pathDescriptors?.[0]?.d).not.toBe("");
    expect(endX).toBeGreaterThan(startX);
    expect(startY).toBeGreaterThan(endY);
    expect(startX).toBeGreaterThan(firstNoteElement.boundingBox.x);
    expect(endX - startX).toBeCloseTo(
      firstNoteElement.boundingBox.width - EditorLayoutDimensions.NOTE_TEXT_SIZE
    );
  });

  test("creates a descending slide path for higher-to-lower notes", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);

    const firstNote = beats[0].notes[0] as GuitarNote;
    const nextNote = beats[1].notes[0] as GuitarNote;
    firstNote.fret = 7;
    nextNote.fret = 5;
    firstNote.addTechnique(
      new GuitarTechnique(firstNote, GuitarTechniqueType.Slide)
    );

    const trackElement = new TrackElement(track);
    trackElement.update();

    const firstBeatElement =
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].barElements[0].beatElements[0];
    const firstNoteElement = firstBeatElement.noteElements[0];
    const slideElement = firstNoteElement.techniqueElements[0];
    const [startX, startY, endX, endY] = parseLinePath(
      slideElement.pathDescriptors?.[0]?.d ?? ""
    );

    expect(endX).toBeGreaterThan(startX);
    expect(startY).toBeLessThan(endY);
  });

  test("creates labels on all technique gap lines with stacked non-overlapping geometry", () => {
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

    expect(techGap.boundingBox.height).toBe(
      EditorLayoutDimensions.TECH_LABEL_HEIGHT * 3
    );
    expect(line1).not.toBeNull();
    expect(line2).not.toBeNull();
    expect(line3).not.toBeNull();
    expect(line2?.boundingBox.y).toBeCloseTo(line1?.boundingBox.bottom ?? 0);
    expect(line3?.boundingBox.y).toBeCloseTo(line2?.boundingBox.bottom ?? 0);
    expect(line1?.boundingBox.height).toBe(
      EditorLayoutDimensions.TECH_LABEL_HEIGHT
    );
    expect(line2?.boundingBox.height).toBe(
      EditorLayoutDimensions.TECH_LABEL_HEIGHT
    );
    expect(line3?.boundingBox.height).toBe(
      EditorLayoutDimensions.TECH_LABEL_HEIGHT
    );
    expect(line1?.labelElements).toHaveLength(1);
    expect(line2?.labelElements).toHaveLength(1);
    expect(line3?.labelElements).toHaveLength(1);
    expect(
      (line1?.labelElements[0].pathDescriptors?.length ?? 0) +
        (line1?.labelElements[0].textDescriptors?.length ?? 0)
    ).toBeGreaterThan(0);
    expect(
      (line2?.labelElements[0].pathDescriptors?.length ?? 0) +
        (line2?.labelElements[0].textDescriptors?.length ?? 0)
    ).toBeGreaterThan(0);
    expect(
      (line3?.labelElements[0].pathDescriptors?.length ?? 0) +
        (line3?.labelElements[0].textDescriptors?.length ?? 0)
    ).toBeGreaterThan(0);
    expect(line1?.labelElements[0].boundingBox.width).toBeCloseTo(
      line1?.labelElements[0].beatElement.boundingBox.width ?? 0
    );
    expect(line2?.labelElements[0].boundingBox.width).toBeCloseTo(
      line2?.labelElements[0].beatElement.boundingBox.width ?? 0
    );
    expect(line3?.labelElements[0].boundingBox.width).toBeCloseTo(
      line3?.labelElements[0].beatElement.boundingBox.width ?? 0
    );
    expect(line1?.labelElements[0].globalCoords.x).toBeCloseTo(
      line1?.labelElements[0].beatElement.globalCoords.x ?? 0
    );
  });

  test("creates a bend inline element path and matching line-3 label geometry", () => {
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
    const bendElement = noteElement.techniqueElements[0];
    const bendLabel = line3?.labelElements[0];
    expect(noteElement.techniqueElements).toHaveLength(1);
    expect(bendElement.pathDescriptors).toBeDefined();
    expect(bendElement.pathDescriptors).toHaveLength(2);
    expect(line3?.labelElements).toHaveLength(1);
    expect(bendLabel?.boundingBox.width).toBeCloseTo(
      beatElement.boundingBox.width
    );
    expect(bendLabel?.globalCoords.x).toBeCloseTo(beatElement.globalCoords.x);
    expect(bendLabel?.globalCoords.y).toBeCloseTo(line3?.globalCoords.y ?? 0);
  });
});
