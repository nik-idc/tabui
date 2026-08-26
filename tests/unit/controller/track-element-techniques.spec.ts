import { TrackElement } from "../../../src/notation/controller/element/track-element";
import {
  DEFAULT_MASTER_BAR,
  BendTechniqueOptions,
  BendType,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteDuration,
  ScoreEditor,
} from "../../../src/notation/model";
import { TechGapContainer } from "../../../src/notation/controller/element/staff/tech-gap-container";
import { TechGapLineContainer } from "../../../src/notation/controller/element/staff/tech-gap-line-container";
import { GuitarTechniqueLabelElement } from "../../../src/notation/controller/element/technique/guitar-technique/guitar-technique-label-element";
import { GuitarTechniqueElement } from "../../../src/notation/controller/element/technique/guitar-technique/guitar-technique-element";
import { TabNoteSlotElement } from "../../../src/notation/controller/element/note/tab-note-slot-element";
import { SetTechniqueCommand } from "../../../src/notation/controller/editor/command";
import {
  isNotationContainer,
  isNotationElement,
} from "../../../src/notation/controller/element/notation-element";
import { createBarWithBeats, createScoreGraph } from "../model/helpers";
import { TEST_LAYOUT_DIMENSIONS } from "./helpers";

function parseLinePath(svgPath: string): [number, number, number, number] {
  const match = svgPath.match(
    /m\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+L\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/
  );
  if (match === null) {
    throw new Error(`Failed to parse line path: ${svgPath}`);
  }

  return match.slice(1).map(Number) as [number, number, number, number];
}

function parsePathNumbers(svgPath: string): number[] {
  return (svgPath.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
}

function parsePathEndpoints(svgPath: string): [number, number, number, number] {
  const numbers = parsePathNumbers(svgPath);
  if (numbers.length < 4) {
    throw new Error(`Failed to parse path endpoints: ${svgPath}`);
  }

  return [
    numbers[0],
    numbers[1],
    numbers[numbers.length - 2],
    numbers[numbers.length - 1],
  ];
}

describe("TrackElement techniques", () => {
  test("creates an inline slide path between two fretted notes with ascending slope for lower-to-higher notes", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);

    const firstNote = beats[0].notes?.[0];
    const nextNote = beats[1].notes?.[0];
    if (
      !(firstNote instanceof GuitarNote) ||
      !(nextNote instanceof GuitarNote)
    ) {
      throw Error("Expected guitar notes in test beats");
    }
    firstNote.fret = 5;
    nextNote.fret = 7;
    firstNote.addTechnique(
      new GuitarTechnique(firstNote, GuitarTechniqueType.Slide)
    );

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const firstBeatElement =
      trackElement.trackLineElements[0].staffLineContainers[0]
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
      firstNoteElement.boundingBox.width - TEST_LAYOUT_DIMENSIONS.NOTE_TEXT_SIZE
    );
  });

  test("anchors inline techniques to the note text rectangle", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const note = beats[0].notes?.[0];
    const nextNote = beats[1].notes?.[0];
    if (!(note instanceof GuitarNote) || !(nextNote instanceof GuitarNote)) {
      throw Error("Expected guitar notes in test beats");
    }
    note.fret = 5;
    nextNote.fret = 7;
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.Slide));

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const beatElements =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements[0].beatElements;
    const start = beatElements[0].noteElements[0] as TabNoteSlotElement;
    const end = beatElements[1].noteElements[0] as TabNoteSlotElement;
    const path = start.techniqueElements[0].pathDescriptors?.[0]?.d ?? "";
    const [startX, , endX] = parsePathEndpoints(path);
    const expectedEndX = end.textRectGlobal.left - start.globalCoords.x;

    expect(startX).toBeCloseTo(start.textRect.right);
    expect(endX).toBeCloseTo(expectedEndX);
  });

  test("creates a descending slide path for higher-to-lower notes", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);

    const firstNote = beats[0].notes?.[0];
    const nextNote = beats[1].notes?.[0];
    if (
      !(firstNote instanceof GuitarNote) ||
      !(nextNote instanceof GuitarNote)
    ) {
      throw Error("Expected guitar notes in test beats");
    }
    firstNote.fret = 7;
    nextNote.fret = 5;
    firstNote.addTechnique(
      new GuitarTechnique(firstNote, GuitarTechniqueType.Slide)
    );

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const firstBeatElement =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements[0].beatElements[0];
    const firstNoteElement = firstBeatElement.noteElements[0];
    const slideElement = firstNoteElement.techniqueElements[0];
    const [startX, startY, endX, endY] = parseLinePath(
      slideElement.pathDescriptors?.[0]?.d ?? ""
    );

    expect(endX).toBeGreaterThan(startX);
    expect(startY).toBeLessThan(endY);
  });

  test("connects slide and legato paths to the next beat across a bar boundary", () => {
    const { score, track, staff, bar } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const sourceBeat = bar.getVoiceBar(1)?.beats[0];
    const targetBeat = staff.bars[1].getVoiceBar(1)?.beats[0];
    if (sourceBeat === undefined || targetBeat === undefined) {
      throw Error("Expected beats on both sides of the bar boundary");
    }
    targetBeat.makeBeatWithNotes();
    const sourceSlideNote = sourceBeat.notes?.[0];
    const sourceLegatoNote = sourceBeat.notes?.[1];
    const targetSlideNote = targetBeat.notes?.[0];
    const targetLegatoNote = targetBeat.notes?.[1];
    if (
      !(sourceSlideNote instanceof GuitarNote) ||
      !(sourceLegatoNote instanceof GuitarNote) ||
      !(targetSlideNote instanceof GuitarNote) ||
      !(targetLegatoNote instanceof GuitarNote)
    ) {
      throw Error("Expected guitar notes on both sides of the bar boundary");
    }
    sourceSlideNote.fret = 5;
    sourceLegatoNote.fret = 7;
    targetSlideNote.fret = 8;
    targetLegatoNote.fret = 4;
    sourceSlideNote.addTechnique(
      new GuitarTechnique(sourceSlideNote, GuitarTechniqueType.Slide)
    );
    sourceLegatoNote.addTechnique(
      new GuitarTechnique(sourceLegatoNote, GuitarTechniqueType.Legato)
    );

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const sourceBeatElement = trackElement.getBeatElement(sourceBeat);
    const targetBeatElement = trackElement.getBeatElement(targetBeat);
    if (sourceBeatElement === undefined || targetBeatElement === undefined) {
      throw Error("Expected rendered beats on both sides of the bar boundary");
    }

    for (const stringIndex of [0, 1]) {
      const sourceNoteElement = sourceBeatElement.noteElements[
        stringIndex
      ] as TabNoteSlotElement;
      const targetNoteElement = targetBeatElement.noteElements[
        stringIndex
      ] as TabNoteSlotElement;
      const path =
        sourceNoteElement.techniqueElements[0].pathDescriptors?.[0]?.d ?? "";
      const [startX, , endX] = parsePathEndpoints(path);
      const expectedEndX =
        targetNoteElement.textRectGlobal.left -
        sourceNoteElement.globalCoords.x;

      expect(startX).toBeCloseTo(sourceNoteElement.textRect.right);
      expect(endX).toBeCloseTo(expectedEndX);
    }
  });

  test("extends slide and legato paths to the track line end before the next line", () => {
    const { score, track, staff } = createScoreGraph();
    for (let i = 0; i < 12; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const secondLineStartIndex =
      trackElement.trackLineElements[1].trackLineBars[0].masterBarIndex;
    const sourceBar = staff.bars[secondLineStartIndex - 1];
    const targetBar = staff.bars[secondLineStartIndex];
    const sourceBeat = sourceBar.getVoiceBar(1)?.beats.at(-1);
    const targetBeat = targetBar.getVoiceBar(1)?.beats[0];
    if (sourceBeat === undefined || targetBeat === undefined) {
      throw Error("Expected beats on both sides of the track line boundary");
    }
    sourceBeat.makeBeatWithNotes();
    targetBeat.makeBeatWithNotes();
    const sourceSlideNote = sourceBeat.notes?.[0];
    const sourceLegatoNote = sourceBeat.notes?.[1];
    const targetSlideNote = targetBeat.notes?.[0];
    const targetLegatoNote = targetBeat.notes?.[1];
    if (
      !(sourceSlideNote instanceof GuitarNote) ||
      !(sourceLegatoNote instanceof GuitarNote) ||
      !(targetSlideNote instanceof GuitarNote) ||
      !(targetLegatoNote instanceof GuitarNote)
    ) {
      throw Error("Expected notes on both sides of the track line boundary");
    }
    sourceSlideNote.fret = 5;
    sourceLegatoNote.fret = 7;
    targetSlideNote.fret = 8;
    targetLegatoNote.fret = 4;
    sourceSlideNote.addTechnique(
      new GuitarTechnique(sourceSlideNote, GuitarTechniqueType.Slide)
    );
    sourceLegatoNote.addTechnique(
      new GuitarTechnique(sourceLegatoNote, GuitarTechniqueType.Legato)
    );

    trackElement.update();

    const sourceBeatElement = trackElement.getBeatElement(sourceBeat);
    if (sourceBeatElement === undefined) {
      throw Error("Expected the source beat on the first track line");
    }
    for (const stringIndex of [0, 1]) {
      const sourceNoteElement = sourceBeatElement.noteElements[
        stringIndex
      ] as TabNoteSlotElement;
      const path =
        sourceNoteElement.techniqueElements[0].pathDescriptors?.[0]?.d ?? "";
      const [, , endX] = parsePathEndpoints(path);
      const expectedEndX =
        sourceNoteElement.owningTrackLineElement.lineLocalBoundingBox.right -
        sourceNoteElement.lineLocalCoords.x;

      expect(endX).toBeCloseTo(expectedEndX);
    }
  });

  test("clears an inline slide path when its target loses its fret", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const firstNote = beats[0].notes?.[0];
    const nextNote = beats[1].notes?.[0];
    if (
      !(firstNote instanceof GuitarNote) ||
      !(nextNote instanceof GuitarNote)
    ) {
      throw Error("Expected guitar notes in test beats");
    }
    firstNote.fret = 5;
    nextNote.fret = 7;
    firstNote.addTechnique(
      new GuitarTechnique(firstNote, GuitarTechniqueType.Slide)
    );

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    nextNote.fret = null;
    trackElement.update();

    const firstBeatElement =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements[0].beatElements[0];
    expect(
      firstBeatElement.noteElements[0].techniqueElements[0].pathDescriptors
    ).toBeUndefined();
  });

  test("targeted inline technique update adds technique element diff", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const note = beats[0].notes?.[0];
    const nextNote = beats[1].notes?.[0];
    if (!(note instanceof GuitarNote) || !(nextNote instanceof GuitarNote)) {
      throw Error("Expected guitar notes in test beats");
    }
    note.fret = 5;
    nextNote.fret = 7;

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const command = new SetTechniqueCommand([note], GuitarTechniqueType.Slide);
    command.execute();
    {
      trackElement.update();
    }

    const noteElement = trackElement.getBeatElement(beats[0])?.noteElements[0];
    const techniqueElement = noteElement?.techniqueElements[0];

    expect(command.affectedModels).toHaveLength(1);
    expect(noteElement?.techniqueElements).toHaveLength(1);
    expect(techniqueElement).toBeInstanceOf(GuitarTechniqueElement);
    expect(
      trackElement.trackLineElements[0].ownedNotationNodes.some(
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
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const beat = voiceBar.beats[0];
    const vibratoNote = beat.notes?.[0];
    const palmMuteNote = beat.notes?.[1];
    const bendNote = beat.notes?.[2];
    if (
      !(vibratoNote instanceof GuitarNote) ||
      !(palmMuteNote instanceof GuitarNote) ||
      !(bendNote instanceof GuitarNote)
    ) {
      throw Error("Expected guitar notes in test beat");
    }
    vibratoNote.fret = 5;
    palmMuteNote.fret = 5;
    bendNote.fret = 5;

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

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const techGap =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].techGapContainer;
    const line1 = techGap.techGapLines[1];
    const line2 = techGap.techGapLines[2];
    const line3 = techGap.techGapLines[3];

    expect(techGap.boundingBox.height).toBe(
      TEST_LAYOUT_DIMENSIONS.TECH_LABEL_HEIGHT * 3
    );
    expect(line1).not.toBeNull();
    expect(line2).not.toBeNull();
    expect(line3).not.toBeNull();
    expect(line2?.boundingBox.y).toBeCloseTo(line1?.boundingBox.bottom ?? 0);
    expect(line3?.boundingBox.y).toBeCloseTo(line2?.boundingBox.bottom ?? 0);
    expect(line1?.boundingBox.height).toBe(
      TEST_LAYOUT_DIMENSIONS.TECH_LABEL_HEIGHT
    );
    expect(line2?.boundingBox.height).toBe(
      TEST_LAYOUT_DIMENSIONS.TECH_LABEL_HEIGHT
    );
    expect(line3?.boundingBox.height).toBe(
      TEST_LAYOUT_DIMENSIONS.TECH_LABEL_HEIGHT
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
    expect(line1?.labelElements[0].globalCoords.x).toBeGreaterThanOrEqual(0);
  });

  test("renders Hold, Release, and Prebend/Bend inline elements", () => {
    const { track, bar } = createScoreGraph();
    const notes = bar.getVoiceBar(1)?.beats[0].notes;
    const holdNote = notes?.[0];
    const releaseNote = notes?.[1];
    const prebendBendNote = notes?.[2];
    if (
      !(holdNote instanceof GuitarNote) ||
      !(releaseNote instanceof GuitarNote) ||
      !(prebendBendNote instanceof GuitarNote)
    ) {
      throw Error("Expected guitar notes in test beat");
    }
    holdNote.fret = 5;
    releaseNote.fret = 5;
    prebendBendNote.fret = 5;
    holdNote.addTechnique(
      new GuitarTechnique(
        holdNote,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Hold,
          holdPitch: 1,
          bendDuration: 1,
        })
      )
    );
    releaseNote.addTechnique(
      new GuitarTechnique(
        releaseNote,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.Release,
          releasePitch: 0,
          bendDuration: 0.75,
        })
      )
    );
    prebendBendNote.addTechnique(
      new GuitarTechnique(
        prebendBendNote,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.PrebendBend,
          prebendPitch: 0.5,
          bendPitch: 1,
          bendDuration: 0.75,
        })
      )
    );

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const bendElements = trackElement.trackLineElements[0].ownedNotationNodes
      .filter((element) => element instanceof GuitarTechniqueElement)
      .filter((element) => element.technique.type === GuitarTechniqueType.Bend);
    const elementFor = (type: BendType) =>
      bendElements.find(
        (element) => element.technique.bendOptions?.type === type
      );

    expect(elementFor(BendType.Hold)?.pathDescriptors).toEqual([]);
    expect(elementFor(BendType.Release)?.pathDescriptors).toHaveLength(2);
    expect(elementFor(BendType.PrebendBend)?.pathDescriptors).toHaveLength(4);
  });

  test("constrains hold labels to adjacent short beat geometry", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.SixtyFourth },
      { baseDuration: NoteDuration.SixtyFourth },
      { baseDuration: NoteDuration.SixtyFourth },
    ]);
    for (const beat of beats) {
      const note = beat.notes?.[0];
      if (!(note instanceof GuitarNote)) {
        throw Error("Expected guitar note in test beat");
      }
      note.fret = 5;
      note.addTechnique(
        new GuitarTechnique(
          note,
          GuitarTechniqueType.Bend,
          new BendTechniqueOptions({
            type: BendType.Hold,
            holdPitch: 1,
            bendDuration: 1,
          })
        )
      );
    }

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const styleLine =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0];
    const barElement = styleLine.barElements[0];
    const labels = (styleLine.techGapContainer.techGapLines[3]?.labelElements ??
      []) as GuitarTechniqueLabelElement[];

    expect(labels).toHaveLength(3);
    for (const label of labels) {
      const descriptor = label.textDescriptors?.[0];
      const expectedX = `${label.boundingBox.width / 2}`;

      expect(descriptor?.attrs?.x).toBe(expectedX);
      expect(Number(descriptor?.attrs?.textLength)).toBe(
        label.boundingBox.width
      );
      expect(label.barLocalBoundingBox.x).toBeGreaterThanOrEqual(0);
      expect(label.barLocalBoundingBox.right).toBeLessThanOrEqual(
        barElement.boundingBox.width
      );
      expect(label.lineLocalBoundingBox.right).toBeLessThanOrEqual(
        TEST_LAYOUT_DIMENSIONS.WIDTH
      );
    }
  });

  test("track element skeleton line stores final line height", () => {
    const { track, bar } = createScoreGraph();
    const beat = bar.voiceBarsAsArray[0].beats[0];
    const vibratoNote = beat.notes?.[0];
    const palmMuteNote = beat.notes?.[1];
    if (
      !(vibratoNote instanceof GuitarNote) ||
      !(palmMuteNote instanceof GuitarNote)
    ) {
      throw Error("Expected guitar notes in test beat");
    }
    vibratoNote.fret = 5;
    palmMuteNote.fret = 5;

    vibratoNote.addTechnique(
      new GuitarTechnique(vibratoNote, GuitarTechniqueType.Vibrato)
    );
    palmMuteNote.addTechnique(
      new GuitarTechnique(palmMuteNote, GuitarTechniqueType.PalmMute)
    );

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    expect(trackElement.trackLineElements[0].skeletonLine.finalLineHeight).toBe(
      trackElement.trackLineElements[0].boundingBox.height
    );
  });

  test("update materializes only demanded line range", () => {
    const { score, track, bar } = createScoreGraph();
    for (let i = 0; i < 12; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const firstLineBefore = trackElement.trackLineElements[0];
    const secondLineBefore = trackElement.trackLineElements[1];
    const note = bar.voiceBarsAsArray[0].beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.fret = 5;
    const secondLineBeatElement =
      secondLineBefore.staffLineContainers[0].styleLinesAsArray[0]
        .barElements[0].beatElements[0];

    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.Vibrato));
    trackElement.update({
      lineRange: { startLineIndex: 0, endLineIndex: 0 },
      dematerializeOutsideRange: {
        startLineIndex: 0,
        endLineIndex: 0,
      },
    });

    const firstLineAfter = trackElement.trackLineElements[0];
    const firstLineTechGap =
      firstLineAfter.staffLineContainers[0].styleLinesAsArray[0]
        .techGapContainer;

    expect(firstLineAfter).not.toBe(firstLineBefore);
    expect(trackElement.trackLineElements[1]).not.toBe(secondLineBefore);
    expect(trackElement.trackLineElements[1].staffLineContainers).toEqual([]);
    expect(trackElement.materializedLineIndices.has(0)).toBe(true);
    expect(trackElement.materializedLineIndices.has(1)).toBe(false);
    expect(
      trackElement.getBeatElement(secondLineBeatElement.beat)
    ).toBeUndefined();
    expect(trackElement.elementDiff.added.size).toBeGreaterThan(0);
    expect(firstLineAfter.skeletonLine.finalLineHeight).toBe(
      firstLineAfter.boundingBox.height
    );
    expect(firstLineTechGap.boundingBox.height).toBe(
      TEST_LAYOUT_DIMENSIONS.TECH_LABEL_HEIGHT
    );
  });

  test("update rejects inverted non-empty line ranges", () => {
    const { track } = createScoreGraph();
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    expect(() =>
      trackElement.update({
        lineRange: { startLineIndex: 1, endLineIndex: 0 },
      })
    ).toThrow("Invalid track element update range");
  });

  test("targeted label technique update refreshes tech gap height facts", () => {
    const { track, bar } = createScoreGraph();
    const note = bar.voiceBarsAsArray[0].beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.fret = 5;
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const beforeTechGap =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].techGapContainer;
    expect(beforeTechGap.boundingBox.height).toBe(0);

    const command = new SetTechniqueCommand(
      [note],
      GuitarTechniqueType.Vibrato
    );
    command.execute();
    trackElement.update();

    const afterTechGap =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].techGapContainer;
    expect(afterTechGap.boundingBox.height).toBe(
      TEST_LAYOUT_DIMENSIONS.TECH_LABEL_HEIGHT
    );
  });

  test("non-contiguous technique rows still use compact label positions", () => {
    const { track, bar } = createScoreGraph();
    const beat = bar.voiceBarsAsArray[0].beats[0];
    const vibratoNote = beat.notes?.[0];
    const bendNote = beat.notes?.[1];
    if (
      !(vibratoNote instanceof GuitarNote) ||
      !(bendNote instanceof GuitarNote)
    ) {
      throw Error("Expected guitar notes in test beat");
    }
    vibratoNote.fret = 5;
    bendNote.fret = 5;

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

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const techGap =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].techGapContainer;
    const line1 = techGap.techGapLines[1];
    const line3 = techGap.techGapLines[3];

    expect(techGap.boundingBox.height).toBe(
      TEST_LAYOUT_DIMENSIONS.TECH_LABEL_HEIGHT * 2
    );
    expect(line3?.boundingBox.y).toBeCloseTo(line1?.boundingBox.bottom ?? 0);
  });

  test.each([
    [
      "Bend",
      new BendTechniqueOptions({
        type: BendType.Bend,
        bendPitch: 1,
        bendDuration: 1,
      }),
      [1],
      ["full"],
    ],
    [
      "Prebend",
      new BendTechniqueOptions({
        type: BendType.Prebend,
        prebendPitch: 0.5,
      }),
      [1],
      ["½"],
    ],
    [
      "Bend/Release",
      new BendTechniqueOptions({
        type: BendType.BendAndRelease,
        bendPitch: 1,
        releasePitch: 1,
        bendDuration: 1,
      }),
      [1, 3],
      ["full", "full"],
    ],
    [
      "Prebend/Release",
      new BendTechniqueOptions({
        type: BendType.PrebendAndRelease,
        prebendPitch: 1,
        releasePitch: 0.5,
        bendDuration: 1,
      }),
      [1, 3],
      ["full", "½"],
    ],
    [
      "Release",
      new BendTechniqueOptions({
        type: BendType.Release,
        releasePitch: 0.5,
        bendDuration: 1,
      }),
      [1],
      ["½"],
    ],
    [
      "Prebend/Bend",
      new BendTechniqueOptions({
        type: BendType.PrebendBend,
        prebendPitch: 0.5,
        bendPitch: 1,
        bendDuration: 1,
      }),
      [1, 3],
      ["½", "full"],
    ],
  ])(
    "centers %s pitch labels on their inline curve endpoints",
    (_, options, arrowIndexes, expectedTexts) => {
      const { track, beats } = createBarWithBeats([
        { baseDuration: NoteDuration.Quarter },
        { baseDuration: NoteDuration.Quarter },
      ]);
      const note = beats[1].notes?.[0];
      if (!(note instanceof GuitarNote)) {
        throw Error("Expected guitar note in test beat");
      }
      note.fret = 5;
      note.addTechnique(
        new GuitarTechnique(note, GuitarTechniqueType.Bend, options)
      );

      const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
      trackElement.update();
      const styleLine =
        trackElement.trackLineElements[0].staffLineContainers[0]
          .styleLinesAsArray[0];
      const beatElement = styleLine.barElements[0].beatElements[1];
      const bendElement = beatElement.noteElements[0].techniqueElements[0];
      const bendLabel =
        styleLine.techGapContainer.techGapLines[3]?.labelElements[0];
      if (
        !(bendElement instanceof GuitarTechniqueElement) ||
        !(bendLabel instanceof GuitarTechniqueLabelElement)
      ) {
        throw Error("Expected bend element and label in test beat");
      }
      const textDescriptors = bendLabel.textDescriptors ?? [];
      const actualTexts = textDescriptors.map((descriptor) => descriptor.text);

      expect(beatElement.barLocalCoords.x).toBeGreaterThan(0);
      expect(actualTexts).toEqual(expectedTexts);
      expect(bendLabel.pathDescriptors).toEqual([]);
      for (let i = 0; i < arrowIndexes.length; i++) {
        const arrowPath =
          bendElement.pathDescriptors?.[arrowIndexes[i]]?.d ?? "";
        const arrowLocalX = parsePathNumbers(arrowPath)[0];
        const labelLocalX = Number(textDescriptors[i]?.attrs?.x);
        const arrowX = bendElement.pathOriginBarLocal.x + arrowLocalX;
        const labelX = bendLabel.descriptorOriginBarLocal.x + labelLocalX;

        expect(textDescriptors[i]?.attrs?.["text-anchor"]).toBe("middle");
        expect(labelX).toBeCloseTo(arrowX);
      }
    }
  );

  test("no-op update rebuilds technique gap shells", () => {
    const { track, bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const beat = voiceBar.beats[0];
    const vibratoNote = beat.notes?.[0];
    const bendNote = beat.notes?.[2];
    if (
      !(vibratoNote instanceof GuitarNote) ||
      !(bendNote instanceof GuitarNote)
    ) {
      throw Error("Expected guitar notes in test beat");
    }
    vibratoNote.fret = 5;
    bendNote.fret = 5;

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

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const techGap =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].techGapContainer;
    const line1 = techGap.techGapLines[1];
    const line3 = techGap.techGapLines[3];
    const line1Label = line1?.labelElements[0];
    const line3Label = line3?.labelElements[0];
    const line1LabelIdentity = line1Label?.getStableIdentity();
    const line3LabelIdentity = line3Label?.getStableIdentity();

    trackElement.update();

    const nextTechGap =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].techGapContainer;

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

  test("ownedNotationNodes includes technique gap subtree nodes", () => {
    const { track, bar } = createScoreGraph();
    const note = bar.voiceBarsAsArray[0].beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.fret = 5;

    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.Vibrato));

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update({
      lineRange: { startLineIndex: 0, endLineIndex: 0 },
    });

    const ownedElements = trackElement.trackLineElements[0].ownedNotationNodes;

    expect(
      ownedElements.some((element) => element instanceof TechGapContainer)
    ).toBe(true);
    expect(
      ownedElements.some((element) => element instanceof TechGapLineContainer)
    ).toBe(true);
    expect(
      ownedElements.some(
        (element) => element instanceof GuitarTechniqueLabelElement
      )
    ).toBe(true);

    const drawableElements =
      trackElement.trackLineElements[0].drawableNotationElements;
    expect(
      drawableElements.some((element) => element instanceof TechGapContainer)
    ).toBe(false);
    expect(
      drawableElements.some(
        (element) => element instanceof TechGapLineContainer
      )
    ).toBe(false);
    expect(
      drawableElements.some(
        (element) => element instanceof GuitarTechniqueLabelElement
      )
    ).toBe(true);

    const techGapNode = ownedElements.find(
      (element) => element instanceof TechGapContainer
    );
    const labelNode = ownedElements.find(
      (element) => element instanceof GuitarTechniqueLabelElement
    );
    expect(techGapNode).toBeDefined();
    expect(labelNode).toBeDefined();
    if (techGapNode === undefined || labelNode === undefined) {
      throw Error("Expected technique gap and label nodes");
    }
    expect(isNotationContainer(techGapNode)).toBe(true);
    expect(isNotationElement(techGapNode)).toBe(false);
    expect(isNotationElement(labelNode)).toBe(true);
    expect(isNotationContainer(labelNode)).toBe(false);
  });

  test("ownedNotationNodes updates after line rematerialization", () => {
    const { track, bar } = createScoreGraph();
    const note = bar.voiceBarsAsArray[0].beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.fret = 5;
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    expect(
      trackElement.trackLineElements[0].ownedNotationNodes.some(
        (element) => element instanceof GuitarTechniqueElement
      )
    ).toBe(false);

    note.addTechnique(
      new GuitarTechnique(note, GuitarTechniqueType.NaturalHarmonic)
    );
    trackElement.update({
      lineRange: { startLineIndex: 0, endLineIndex: 0 },
    });

    expect(
      trackElement.trackLineElements[0].ownedNotationNodes.some(
        (element) => element instanceof GuitarTechniqueElement
      )
    ).toBe(true);
  });

  test("adding a second technique gap line preserves distinct label y positions", () => {
    const { track, bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const beat = voiceBar.beats[0];
    const vibratoNote = beat.notes?.[0];
    const palmMuteNote = beat.notes?.[1];
    if (
      !(vibratoNote instanceof GuitarNote) ||
      !(palmMuteNote instanceof GuitarNote)
    ) {
      throw Error("Expected guitar notes in test beat");
    }
    vibratoNote.fret = 5;
    palmMuteNote.fret = 5;

    palmMuteNote.addTechnique(
      new GuitarTechnique(palmMuteNote, GuitarTechniqueType.PalmMute)
    );

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    vibratoNote.addTechnique(
      new GuitarTechnique(vibratoNote, GuitarTechniqueType.Vibrato)
    );
    trackElement.update();

    const techGap =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].techGapContainer;
    const vibratoLine = techGap.techGapLines[1];
    const palmMuteLine = techGap.techGapLines[2];
    const vibratoLabel = vibratoLine?.labelElements[0];
    const palmMuteLabel = palmMuteLine?.labelElements[0];

    expect(vibratoLine).not.toBeNull();
    expect(palmMuteLine).not.toBeNull();
    expect(vibratoLabel).toBeDefined();
    expect(palmMuteLabel).toBeDefined();
    expect(vibratoLine?.boundingBox.height).toBe(
      TEST_LAYOUT_DIMENSIONS.TECH_LABEL_HEIGHT
    );
    expect(palmMuteLine?.boundingBox.height).toBe(
      TEST_LAYOUT_DIMENSIONS.TECH_LABEL_HEIGHT
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
    for (let i = 0; i < 12; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const firstVoiceBar = track.staves[0].bars[0].getVoiceBar(1);
    if (firstVoiceBar === null) {
      throw Error("Expected voice 1 in first bar");
    }
    const palmMuteNote = firstVoiceBar.beats[0].notes?.[0];
    if (!(palmMuteNote instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    palmMuteNote.fret = 5;
    palmMuteNote.addTechnique(
      new GuitarTechnique(palmMuteNote, GuitarTechniqueType.PalmMute)
    );

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    firstVoiceBar.beats[0].baseDuration = NoteDuration.Eighth;
    firstVoiceBar.rebuildTiming();
    trackElement.update();

    const beatElement =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements[0].beatElements[0];
    const palmMuteLabel =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].techGapContainer.techGapLines[2]
        ?.labelElements[0];
    const descriptorX = Number(
      palmMuteLabel?.textDescriptors?.[0]?.attrs?.x ?? 0
    );
    const descriptorAnchor =
      palmMuteLabel?.textDescriptors?.[0]?.attrs?.["text-anchor"];
    const expectedX = (palmMuteLabel?.boundingBox.width ?? 0) / 2;

    expect(palmMuteLabel).toBeDefined();
    expect(descriptorAnchor).toBe("middle");
    expect(descriptorX).toBeCloseTo(expectedX);
    expect(palmMuteLabel?.boundingBox.width).toBeCloseTo(
      beatElement.boundingBox.width
    );
  });

  test("let ring renders an LR label on each applied note", () => {
    const { track, bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    const note = voiceBar?.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.fret = 5;
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.LetRing));

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const label =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].techGapContainer.techGapLines[2]
        ?.labelElements[0];

    expect(label?.textDescriptors).toHaveLength(1);
    expect(label?.textDescriptors?.[0].text).toBe("LR");
  });

  test("re-adding vibrato after removal keeps palm mute label registered and separated", () => {
    const { score, track, staff } = createScoreGraph();
    for (let i = 0; i < 12; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const secondLineStartIndex =
      trackElement.trackLineElements[1].trackLineBars[0].masterBarIndex;
    const secondLineVoiceBar = staff.bars[secondLineStartIndex].getVoiceBar(1);
    if (secondLineVoiceBar === null) {
      throw Error("Expected voice 1 in second line bar");
    }
    const beat = secondLineVoiceBar.beats[0];
    beat.makeBeatWithNotes();
    const note = beat.notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.fret = 5;
    const noteArray = [note];

    score.masterBars[secondLineStartIndex].tempo = 121;
    secondLineVoiceBar.rebuildTiming();
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
      trackElement.trackLineElements[1].staffLineContainers[0]
        .styleLinesAsArray[0];
    const line1 = secondLineStyle.techGapContainer.techGapLines[1];
    const line2 = secondLineStyle.techGapContainer.techGapLines[2];
    const vibratoLabel = line1?.labelElements[0];
    const palmMuteLabel = line2?.labelElements[0];

    expect(vibratoLabel).toBeDefined();
    expect(palmMuteLabel).toBeDefined();
    expect(vibratoLabel?.globalCoords.y).toBeLessThan(
      palmMuteLabel?.globalCoords.y ?? 0
    );
    expect(
      trackElement.trackLineElements
        .flatMap((line) => line.ownedNotationNodes)
        .filter(
          (element) =>
            element instanceof GuitarTechniqueLabelElement &&
            (element.technique.type === GuitarTechniqueType.Vibrato ||
              element.technique.type === GuitarTechniqueType.PalmMute)
        )
    ).toHaveLength(2);
  });
});
