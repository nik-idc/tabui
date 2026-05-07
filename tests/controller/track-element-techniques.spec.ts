import { TrackElement } from "../../src/notation/controller/element/track-element";
import {
  DEFAULT_MASTER_BAR,
  BendTechniqueOptions,
  BendType,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteDuration,
  ScoreEditor,
} from "../../src/notation/model";
import { EditorLayoutDimensions } from "../../src/notation/controller/editor-layout-dimensions";
import { TechGapElement } from "../../src/notation/controller/element/staff/tech-gap-element";
import { TechGapLineElement } from "../../src/notation/controller/element/staff/tech-gap-line-element";
import { GuitarTechniqueLabelElement } from "../../src/notation/controller/element/technique/guitar-technique/guitar-technique-label-element";
import { GuitarTechniqueElement } from "../../src/notation/controller/element/technique/guitar-technique/guitar-technique-element";
import { SetTechniqueCommand } from "../../src/notation/controller/editor/command";
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

  test("targeted inline technique update adds technique element diff", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const note = beats[0].notes[0] as GuitarNote;
    note.fret = 5;
    (beats[1].notes[0] as GuitarNote).fret = 7;

    const trackElement = new TrackElement(track);
    trackElement.update();

    const command = new SetTechniqueCommand([note], GuitarTechniqueType.Slide);
    command.execute();
    trackElement.update(command.updateRequest);

    const noteElement = trackElement.findCorrespondingBeatElement(beats[0])
      ?.noteElements[0];
    const techniqueElement = noteElement?.techniqueElements[0];

    expect(command.updateRequest.updateType).toBe("Targeted");
    expect(noteElement?.techniqueElements).toHaveLength(1);
    expect(techniqueElement).toBeInstanceOf(GuitarTechniqueElement);
    expect(
      trackElement.trackLineElements[0].ownedNotationElements.some(
        (element) => element === techniqueElement
      )
    ).toBe(true);
    expect(
      trackElement.elementDiff.added
        .get(GuitarTechniqueElement)
        ?.has(techniqueElement?.getStableIdentity() ?? "")
    ).toBe(true);
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

  test("no-op update rebuilds technique gap shells", () => {
    const { track, bar } = createScoreGraph();
    const vibratoNote = bar.beats[0].notes[0] as GuitarNote;
    const bendNote = bar.beats[0].notes[2] as GuitarNote;

    vibratoNote.addTechnique(
      new GuitarTechnique(vibratoNote, GuitarTechniqueType.Vibrato)
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
    const line3 = techGap.techGapLines[3];
    const line1Label = line1?.labelElements[0];
    const line3Label = line3?.labelElements[0];
    const line1LabelIdentity = line1Label?.getStableIdentity();
    const line3LabelIdentity = line3Label?.getStableIdentity();

    trackElement.update();

    const nextTechGap =
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].techGapElement;

    expect(nextTechGap).not.toBe(techGap);
    expect(nextTechGap.techGapLines[1]).not.toBe(line1);
    expect(nextTechGap.techGapLines[3]).not.toBe(line3);
    expect(nextTechGap.techGapLines[1]?.labelElements[0]).not.toBe(line1Label);
    expect(nextTechGap.techGapLines[3]?.labelElements[0]).not.toBe(line3Label);
    expect(
      nextTechGap.techGapLines[1]?.labelElements[0]?.getStableIdentity()
    ).toBe(line1LabelIdentity);
    expect(
      nextTechGap.techGapLines[3]?.labelElements[0]?.getStableIdentity()
    ).toBe(line3LabelIdentity);
  });

  test("ownedNotationElements includes technique gap subtree elements", () => {
    const { track, bar } = createScoreGraph();
    const note = bar.beats[0].notes[0] as GuitarNote;

    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.Vibrato));

    const trackElement = new TrackElement(track);
    trackElement.update();

    const ownedElements =
      trackElement.trackLineElements[0].ownedNotationElements;

    expect(
      ownedElements.some((element) => element instanceof TechGapElement)
    ).toBe(true);
    expect(
      ownedElements.some((element) => element instanceof TechGapLineElement)
    ).toBe(true);
    expect(
      ownedElements.some(
        (element) => element instanceof GuitarTechniqueLabelElement
      )
    ).toBe(true);
  });

  test("adding a second technique gap line preserves distinct label y positions", () => {
    const { track, bar } = createScoreGraph();
    const vibratoNote = bar.beats[0].notes[0] as GuitarNote;
    const palmMuteNote = bar.beats[0].notes[1] as GuitarNote;

    palmMuteNote.addTechnique(
      new GuitarTechnique(palmMuteNote, GuitarTechniqueType.PalmMute)
    );

    const trackElement = new TrackElement(track);
    trackElement.update();

    vibratoNote.addTechnique(
      new GuitarTechnique(vibratoNote, GuitarTechniqueType.Vibrato)
    );
    trackElement.update();

    const techGap =
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].techGapElement;
    const vibratoLine = techGap.techGapLines[1];
    const palmMuteLine = techGap.techGapLines[2];
    const vibratoLabel = vibratoLine?.labelElements[0];
    const palmMuteLabel = palmMuteLine?.labelElements[0];

    expect(vibratoLine).not.toBeNull();
    expect(palmMuteLine).not.toBeNull();
    expect(vibratoLabel).toBeDefined();
    expect(palmMuteLabel).toBeDefined();
    expect(vibratoLine?.boundingBox.height).toBe(
      EditorLayoutDimensions.TECH_LABEL_HEIGHT
    );
    expect(palmMuteLine?.boundingBox.height).toBe(
      EditorLayoutDimensions.TECH_LABEL_HEIGHT
    );
    expect(palmMuteLine?.boundingBox.y).toBeCloseTo(
      vibratoLine?.boundingBox.bottom ?? 0
    );
    expect(palmMuteLabel?.globalCoords.y).toBeGreaterThan(
      vibratoLabel?.globalCoords.y ?? 0
    );
  });

  test("palm mute label stays centered after justified width recalculation", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 40; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const palmMuteNote = track.staves[0].bars[0].beats[0]
      .notes[0] as GuitarNote;
    palmMuteNote.addTechnique(
      new GuitarTechnique(palmMuteNote, GuitarTechniqueType.PalmMute)
    );

    const trackElement = new TrackElement(track);
    trackElement.update();

    track.staves[0].bars[0].beats[0].baseDuration = NoteDuration.Eighth;
    track.staves[0].bars[0].rebuildTiming();
    trackElement.update();

    const beatElement =
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].barElements[0].beatElements[0];
    const palmMuteLabel =
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].techGapElement.techGapLines[2]?.labelElements[0];
    const descriptorX = Number(
      palmMuteLabel?.textDescriptors?.[0]?.attrs?.x ?? 0
    );
    const descriptorAnchor =
      palmMuteLabel?.textDescriptors?.[0]?.attrs?.["text-anchor"];

    expect(palmMuteLabel).toBeDefined();
    expect(descriptorAnchor).toBe("start");
    expect(
      (palmMuteLabel?.globalCoords.x ?? 0) +
        descriptorX +
        EditorLayoutDimensions.NOTE_TEXT_SIZE
    ).toBeCloseTo(
      beatElement.globalCoords.x + beatElement.boundingBox.width / 2,
      1
    );
  });

  test("re-adding vibrato after removal keeps palm mute label registered and separated", () => {
    const { score, track, staff } = createScoreGraph();
    for (let i = 0; i < 40; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const trackElement = new TrackElement(track);
    trackElement.update();

    const secondLineStartIndex =
      trackElement.trackLineElements[1].trackLineData[0].masterBarIndex;
    const note = staff.bars[secondLineStartIndex].beats[0]
      .notes[0] as GuitarNote;
    const noteArray = [note];

    score.masterBars[secondLineStartIndex].tempo = 121;
    staff.bars[secondLineStartIndex].rebuildTiming();
    trackElement.update();

    ScoreEditor.setTechniqueNotes(noteArray, GuitarTechniqueType.Vibrato);
    trackElement.update();
    ScoreEditor.setTechniqueNotes(noteArray, GuitarTechniqueType.PalmMute);
    trackElement.update();
    ScoreEditor.setTechniqueNotes(noteArray, GuitarTechniqueType.Vibrato);
    trackElement.update();
    ScoreEditor.setTechniqueNotes(noteArray, GuitarTechniqueType.Vibrato);
    trackElement.update();

    const secondLineStyle =
      trackElement.trackLineElements[1].staffLineElements[0]
        .styleLinesAsArray[0];
    const line1 = secondLineStyle.techGapElement.techGapLines[1];
    const line2 = secondLineStyle.techGapElement.techGapLines[2];
    const vibratoLabel = line1?.labelElements[0];
    const palmMuteLabel = line2?.labelElements[0];

    expect(vibratoLabel).toBeDefined();
    expect(palmMuteLabel).toBeDefined();
    expect(vibratoLabel?.globalCoords.y).toBeLessThan(
      palmMuteLabel?.globalCoords.y ?? 0
    );
    expect(
      Array.from(trackElement.elementRegistryByIdentity.values()).filter(
        (element) =>
          element instanceof GuitarTechniqueLabelElement &&
          (element.technique.type === GuitarTechniqueType.Vibrato ||
            element.technique.type === GuitarTechniqueType.PalmMute)
      )
    ).toHaveLength(2);
  });
});
