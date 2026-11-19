import { TrackElement } from "../../../src/notation/controller/element/track-element";
import {
  AccentType,
  AccentOptions,
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
import { TabBeatElement } from "../../../src/notation/controller/element/beat/tab-beat-element";
import { TabNoteSlotElement } from "../../../src/notation/controller/element/note/tab-note-slot-element";
import { SetTechniqueCommand } from "../../../src/notation/controller/editor/command";
import {
  isNotationContainer,
  isNotationElement,
} from "../../../src/notation/controller/element/notation-element";
import { createBarWithBeats, createScoreGraph } from "../model/helpers";
import { TEST_LAYOUT_DIMENSIONS } from "./helpers";
import { EditorLayoutDimensions } from "../../../src/notation/controller/editor-layout-dimensions";
import { required } from "../required";
import { TrackController } from "../../../src/notation/controller/track-controller";

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

function parseVibratoPath(svgPath: string): {
  start: [number, number];
  segments: Array<[number, number, number, number, number, number]>;
} {
  const start = svgPath.match(/M\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/);
  if (start === null) {
    throw Error(`Failed to parse vibrato path: ${svgPath}`);
  }
  const segments = Array.from(
    svgPath.matchAll(
      /C\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g
    ),
    (match) => match.slice(1).map(Number)
  );

  return {
    start: [Number(start[1]), Number(start[2])],
    segments: segments.map((segment) => [
      segment[0],
      segment[1],
      segment[2],
      segment[3],
      segment[4],
      segment[5],
    ]),
  };
}

function bendOptions(): BendTechniqueOptions {
  return new BendTechniqueOptions({
    type: BendType.Bend,
    bendPitch: 1,
    bendDuration: 1,
  });
}

function techGapOf(element: TrackElement): TechGapContainer {
  return element.trackLineElements[0].staffLineContainers[0]
    .styleLinesAsArray[0].techGapContainer;
}

function accent(kind: AccentType): AccentOptions {
  return new AccentOptions({ kind });
}

/** Labels on the Accent row for one beat. */
function accentRowLabels(element: TrackElement, beatIndex: number) {
  const beat =
    element.trackLineElements[0].staffLineContainers[0].styleLinesAsArray[0]
      .barElements[0].beatElements[beatIndex];
  return required(techGapOf(element).techGapLines[5]).labelElements.filter(
    (l) => l.beatElement === beat
  );
}

describe("TrackElement techniques", () => {
  test("inserting an empty beat at a bar boundary refreshes the following Palm Mute label", () => {
    const { score, track, bar, staff } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    for (const current of [bar, staff.bars[1]]) {
      const beat = current.voiceBarsAsArray[0].beats[0];
      beat.makeBeatWithNotes();
      const note = required(beat.notes)[current === bar ? 0 : 1] as GuitarNote;
      note.setFret(5);
      note.setTechnique(GuitarTechniqueType.PalmMute);
    }
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    controller.trackElement.update();
    const texts = () =>
      controller.trackElement.trackLineElements
        .flatMap((l) => l.drawableNotationElements)
        .filter(
          (v): v is GuitarTechniqueLabelElement =>
            v instanceof GuitarTechniqueLabelElement
        )
        .map((v) => v.textDescriptors?.map((d) => d.text));
    expect(texts()).toEqual([["P.M."], []]);
    controller.insertBeatAfterSelected();
    expect(texts()).toEqual([["P.M."], ["P.M."]]);
    controller.undo();
    expect(texts()).toEqual([["P.M."], []]);
    controller.redo();
    expect(texts()).toEqual([["P.M."], ["P.M."]]);
  });

  test.each([GuitarTechniqueType.LetRing, GuitarTechniqueType.PalmMute])(
    "continues %s labels when the marking moves to another string",
    (type) => {
      const { track, beats } = createBarWithBeats([
        { baseDuration: NoteDuration.Quarter },
        { baseDuration: NoteDuration.Quarter },
      ]);
      const previous = required(beats[0].notes)[1] as GuitarNote;
      const current = required(beats[1].notes)[0] as GuitarNote;
      previous.setFret(5);
      current.setFret(7);
      previous.setTechnique(type);
      current.setTechnique(type);

      const element = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
      element.update();

      const labels = element.trackLineElements
        .flatMap((line) => line.drawableNotationElements)
        .filter(
          (value): value is GuitarTechniqueLabelElement =>
            value instanceof GuitarTechniqueLabelElement &&
            value.technique.type === type
        );
      expect(labels).toHaveLength(2);
      expect(
        labels[0].textDescriptors?.map((descriptor) => descriptor.text)
      ).toEqual([type === GuitarTechniqueType.LetRing ? "L.R." : "P.M."]);
      expect(labels[1].textDescriptors).toEqual([]);
      const continuationPaths = required(labels[1].pathDescriptors);
      expect(continuationPaths).toHaveLength(1);
      expect(continuationPaths[0].d).not.toBe("");
      expect(continuationPaths[0].attrs?.["stroke-dasharray"]).toBe("4 3");
    }
  );

  test("shows a separate Tap label on each tapped beat without a passage", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    for (const beat of beats) {
      const note = required(beat.notes)[0] as GuitarNote;
      note.setFret(5);
      note.setTechnique(GuitarTechniqueType.Tap);
    }

    const element = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    element.update();

    const labels = element.trackLineElements
      .flatMap((l) => l.drawableNotationElements)
      .filter(
        (v): v is GuitarTechniqueLabelElement =>
          v instanceof GuitarTechniqueLabelElement
      );
    expect(labels.map((v) => v.textDescriptors?.map((d) => d.text))).toEqual([
      ["T"],
      ["T"],
    ]);
    expect(labels.map((v) => v.pathDescriptors)).toEqual([[], []]);
  });

  test("orders label rows as Vibrato, Tap, Accent, then Bend", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const notes = required(beats[0].notes) as GuitarNote[];
    for (const note of notes) {
      note.setFret(5);
    }
    notes[0].setTechnique(GuitarTechniqueType.Bend, bendOptions());
    notes[1].setTechnique(
      GuitarTechniqueType.Accent,
      accent(AccentType.Normal)
    );
    notes[2].setTechnique(GuitarTechniqueType.Tap);
    notes[3].setTechnique(GuitarTechniqueType.Vibrato);

    const element = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    element.update();

    const rowTypes = techGapOf(element)
      .techGapLinesAsArray.flatMap((l) => l.labelElements)
      .map((l) => l.technique.type);
    expect(rowTypes).toEqual([
      GuitarTechniqueType.Vibrato,
      GuitarTechniqueType.Tap,
      GuitarTechniqueType.Accent,
      GuitarTechniqueType.Bend,
    ]);
  });

  test("draws one accent mark for a beat with accents on two strings", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const notes = required(beats[0].notes) as GuitarNote[];
    for (const note of notes.slice(0, 2)) {
      note.setFret(5);
      note.setTechnique(GuitarTechniqueType.Accent, accent(AccentType.Normal));
    }

    const element = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    element.update();

    expect(accentRowLabels(element, 0)).toHaveLength(1);
  });

  test.each([
    [AccentType.Normal, AccentType.Heavy],
    [AccentType.Heavy, AccentType.Normal],
  ])(
    "shows only the heavy accent when strings 1 and 2 have kinds %s and %s",
    (first, second) => {
      const { track, beats } = createBarWithBeats([
        { baseDuration: NoteDuration.Quarter },
      ]);
      const notes = required(beats[0].notes) as GuitarNote[];
      notes[0].setFret(5);
      notes[0].setTechnique(GuitarTechniqueType.Accent, accent(first));
      notes[1].setFret(5);
      notes[1].setTechnique(GuitarTechniqueType.Accent, accent(second));

      const element = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
      element.update();

      const labels = accentRowLabels(element, 0);
      expect(labels).toHaveLength(1);
      // "^" ends to the right of its start; ">" ends at its start x.
      const path = required(labels[0].pathDescriptors)[0].d;
      const [x1, , x2] = parsePathEndpoints(path);
      expect(x2).toBeGreaterThan(x1);
    }
  );

  test("an empty slot breaks Palm Mute labels and dead notes can start a new label", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const first = required(beats[0].notes)[0] as GuitarNote;
    const last = required(beats[2].notes)[0] as GuitarNote;
    first.setFret(5);
    last.setFret(-1);
    first.setTechnique(GuitarTechniqueType.PalmMute);
    last.setTechnique(GuitarTechniqueType.PalmMute);
    const element = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    element.update();
    const labels = element.trackLineElements
      .flatMap((l) => l.drawableNotationElements)
      .filter(
        (v): v is GuitarTechniqueLabelElement =>
          v instanceof GuitarTechniqueLabelElement
      );
    expect(labels.map((v) => v.textDescriptors?.map((d) => d.text))).toEqual([
      ["P.M."],
      ["P.M."],
    ]);
    expect(labels.map((v) => v.beatElement.beat)).toEqual([beats[0], beats[2]]);
  });

  test("removing a source refreshes distant empty-slot labels even when their row stays occupied", () => {
    const { score, track, bar, staff } = createScoreGraph();
    for (let i = 0; i < 12; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }
    const source = required(
      bar.voiceBarsAsArray[0].beats[0].notes
    )[0] as GuitarNote;
    source.setFret(5);
    source.setTechnique(GuitarTechniqueType.LetRing);
    for (const nextBar of staff.bars.slice(1)) {
      const beat = nextBar.voiceBarsAsArray[0].beats[0];
      beat.makeBeatWithNotes();
      (required(beat.notes)[0] as GuitarNote).setTechnique(
        GuitarTechniqueType.LetRing
      );
    }
    const otherBeat = staff.bars[12].voiceBarsAsArray[0].beats[0];
    otherBeat.makeBeatWithNotes();
    const other = required(otherBeat.notes)[1] as GuitarNote;
    other.setFret(3);
    other.setTechnique(GuitarTechniqueType.PalmMute);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    controller.trackElement.update();
    controller.removeSelectedBeat();
    const labels = controller.trackElement.trackLineElements
      .flatMap((l) => l.drawableNotationElements)
      .filter(
        (v): v is GuitarTechniqueLabelElement =>
          v instanceof GuitarTechniqueLabelElement
      );
    expect(
      labels.some((v) => v.technique.type === GuitarTechniqueType.LetRing)
    ).toBe(false);
    expect(
      labels.some((v) => v.technique.type === GuitarTechniqueType.PalmMute)
    ).toBe(true);
  });

  test("reserves and renders marked empty slots when the source line is not materialized", () => {
    const { score, track, bar } = createScoreGraph();
    for (let i = 0; i < 12; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }
    const baseline = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    const baselineHeight = baseline.trackLineElements[1].boundingBox.height;
    const beat = bar.voiceBarsAsArray[0].beats[0];
    const source = required(beat.notes)[0] as GuitarNote;
    source.setFret(5);
    source.setTechnique(GuitarTechniqueType.LetRing);
    for (const nextBar of bar.staff.bars.slice(1)) {
      const next = nextBar.voiceBarsAsArray[0].beats[0];
      next.makeBeatWithNotes();
      (required(next.notes)[0] as GuitarNote).setTechnique(
        GuitarTechniqueType.LetRing
      );
    }
    const element = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    const predictedHeight = element.trackLineElements[1].boundingBox.height;
    expect(predictedHeight).toBe(
      baselineHeight + TEST_LAYOUT_DIMENSIONS.techLabelHeight
    );
    element.update({
      lineRange: { startLineIndex: 1, endLineIndex: 1 },
      dematerializeOutsideRange: { startLineIndex: 1, endLineIndex: 1 },
    });
    expect(element.getBeatElement(beat)).toBeUndefined();
    const labels = element.trackLineElements[1].drawableNotationElements.filter(
      (v): v is GuitarTechniqueLabelElement =>
        v instanceof GuitarTechniqueLabelElement
    );
    expect(labels.length).toBeGreaterThan(0);
    expect(
      labels.every(
        (v) =>
          v.technique.note.beat === v.beatElement.beat &&
          v.beatElement.beat !== beat
      )
    ).toBe(true);
    expect(labels[0].textDescriptors?.map((d) => d.text)).toEqual(["L.R."]);
    expect(element.trackLineElements[1].boundingBox.height).toBe(
      predictedHeight
    );
  });

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
    firstNote.setFret(5);
    nextNote.setFret(7);
    firstNote.addTechnique(
      new GuitarTechnique(firstNote, GuitarTechniqueType.Slide)
    );

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const firstBeatElement =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements[0].beatElements[0];
    const firstNoteElement = firstBeatElement
      .noteElements[0] as TabNoteSlotElement;
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
      firstNoteElement.boundingBox.width - firstNoteElement.selectionRect.width
    );
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
    firstNote.setFret(7);
    nextNote.setFret(5);
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

  test.each([8, 16, 32])(
    "anchors harmonics to the selection left edge at text size %s",
    (textSize) => {
      const { track, beats } = createBarWithBeats([
        { baseDuration: NoteDuration.Quarter },
      ]);
      const note = required(beats[0].notes)[0] as GuitarNote;
      note.setFret(24);
      note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.LetRing));
      note.addTechnique(
        new GuitarTechnique(note, GuitarTechniqueType.NaturalHarmonic)
      );
      const dimensions = new EditorLayoutDimensions({
        width: 1200,
        noteTextSize: textSize,
        timeSigTextSize: 48,
        tempoTextSize: 24,
        durationsHeight: 30,
        horizontalPadding: 12,
      });
      const trackElement = new TrackElement(track, dimensions);
      trackElement.update();
      const element = required(trackElement.getBeatElement(beats[0]))
        .noteElements[0] as TabNoteSlotElement;
      const harmonic = required(
        element.techniqueElements.find(
          (candidate) =>
            candidate.technique.type === GuitarTechniqueType.NaturalHarmonic
        )
      );
      const numbers = parsePathNumbers(required(harmonic.pathDescriptors)[0].d);
      const right = Math.max(
        ...numbers.filter((_value, index) => index % 2 === 0)
      );
      expect(element.globalCoords.x + right).toBeCloseTo(
        element.selectionRect.left
      );
    }
  );

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
    sourceSlideNote.setFret(5);
    sourceLegatoNote.setFret(7);
    targetSlideNote.setFret(8);
    targetLegatoNote.setFret(4);
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
        targetNoteElement.selectionRect.left - sourceNoteElement.globalCoords.x;

      expect(startX).toBeCloseTo(
        sourceNoteElement.selectionRect.right - sourceNoteElement.globalCoords.x
      );
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
    sourceSlideNote.setFret(5);
    sourceLegatoNote.setFret(7);
    targetSlideNote.setFret(8);
    targetLegatoNote.setFret(4);
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
    const targetBeatElement = required(trackElement.getBeatElement(targetBeat));
    expect(sourceBeatElement.owningTrackLineElement).not.toBe(
      targetBeatElement.owningTrackLineElement
    );
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
    firstNote.setFret(5);
    nextNote.setFret(7);
    firstNote.addTechnique(
      new GuitarTechnique(firstNote, GuitarTechniqueType.Slide)
    );

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    expect(
      required(trackElement.getBeatElement(beats[0])).noteElements[0]
        .techniqueElements[0].pathDescriptors
    ).toHaveLength(1);
    nextNote.setFret(null);
    trackElement.update();

    const firstBeatElement =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements[0].beatElements[0];
    expect(
      firstBeatElement.noteElements[0].techniqueElements[0].pathDescriptors
    ).toBeUndefined();
  });

  test("adding an inline slide updates its path and supports undo and redo", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const note = beats[0].notes?.[0];
    const nextNote = beats[1].notes?.[0];
    if (!(note instanceof GuitarNote) || !(nextNote instanceof GuitarNote)) {
      throw Error("Expected guitar notes in test beats");
    }
    note.setFret(5);
    nextNote.setFret(7);

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    expect(
      required(trackElement.getBeatElement(beats[0])).noteElements[0]
        .techniqueElements
    ).toHaveLength(0);

    const command = new SetTechniqueCommand(
      ScoreEditor.getTechniqueTargetsForNotes([note]),
      GuitarTechniqueType.Slide
    );
    command.execute();
    trackElement.update();

    const noteElement = required(trackElement.getBeatElement(beats[0]))
      .noteElements[0];
    const techniqueElement = required(noteElement.techniqueElements[0]);

    expect(command.affectedModels).toEqual([
      { masterBarIndex: 0, modelUUID: note.uuid },
    ]);
    expect(noteElement.techniqueElements).toHaveLength(1);
    expect(techniqueElement.technique.type).toBe(GuitarTechniqueType.Slide);
    const path = required(techniqueElement.pathDescriptors)[0].d;
    const [startX, , endX] = parseLinePath(path);
    const target = required(trackElement.getBeatElement(beats[1]))
      .noteElements[0] as TabNoteSlotElement;
    expect(startX + noteElement.globalCoords.x).toBeCloseTo(
      (noteElement as TabNoteSlotElement).selectionRect.right
    );
    expect(endX + noteElement.globalCoords.x).toBeCloseTo(
      target.selectionRect.left
    );
    expect(
      trackElement.trackLineElements[0].ownedNotationNodes.some(
        (element) => element === techniqueElement
      )
    ).toBe(true);
    command.undo();
    trackElement.update();
    expect(
      required(trackElement.getBeatElement(beats[0])).noteElements[0]
        .techniqueElements
    ).toHaveLength(0);

    command.redo();
    trackElement.update();
    const restored = required(trackElement.getBeatElement(beats[0]))
      .noteElements[0].techniqueElements;
    expect(restored).toHaveLength(1);
    expect(required(restored[0].pathDescriptors)[0].d).toBe(path);
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
    vibratoNote.setFret(5);
    palmMuteNote.setFret(5);
    bendNote.setFret(5);

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
    const lines = ([1, 2, 6] as const).map((v) =>
      required(techGap.techGapLines[v])
    );
    expect(techGap.boundingBox.height).toBe(
      TEST_LAYOUT_DIMENSIONS.techLabelHeight * 3
    );
    for (const [index, line] of lines.entries()) {
      expect(line.boundingBox.height).toBe(
        TEST_LAYOUT_DIMENSIONS.techLabelHeight
      );
      expect(line.labelElements).toHaveLength(1);
      const label = line.labelElements[0];
      expect(label.technique.note).toBe(
        [vibratoNote, palmMuteNote, bendNote][index]
      );
      expect(label.globalBoundingBox.right).toBeCloseTo(
        label.beatElement.globalBoundingBox.right
      );
      if (index > 0) {
        expect(line.boundingBox.y).toBeCloseTo(
          lines[index - 1].boundingBox.bottom
        );
        expect(label.globalCoords.y).toBeGreaterThan(
          lines[index - 1].labelElements[0].globalCoords.y
        );
      }
    }
    expect(lines[0].labelElements[0].pathDescriptors).toHaveLength(1);
    expect(
      lines[1].labelElements[0].textDescriptors?.map((v) => v.text)
    ).toEqual(["P.M."]);
    expect(
      lines[2].labelElements[0].textDescriptors?.map((v) => v.text)
    ).toEqual(["full"]);
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
    holdNote.setFret(5);
    releaseNote.setFret(5);
    prebendBendNote.setFret(5);
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
      required(
        bendElements.find(
          (element) => element.technique.bendOptions?.type === type
        )
      );

    expect(bendElements).toHaveLength(3);
    expect(elementFor(BendType.Hold).pathDescriptors).toEqual([]);
    // The glyph ends at x=22.2 in a 46.8px beat, the last in its bar. With no
    // next note, curves end by x=44.3 (box right plus 3px attack padding,
    // minus a 3px gap and a 2.5px half arrow), so each of two segments is
    // 11.05px.
    // Strings 2 and 3 start 36px and 60px below the technique row.
    const release = required(elementFor(BendType.Release).pathDescriptors);
    const prebend = required(elementFor(BendType.PrebendBend).pathDescriptors);
    expect(release).toHaveLength(2);
    expect(prebend).toHaveLength(4);
    expect(release[0].d).toContain(" C ");
    expect(prebend[0].d).toContain(" l ");
    expect(prebend[2].d).toContain(" C ");
    const expectedPaths = [
      [release[0], [22.2, -24, 44.3, -30, 44.3, 6, 44.3, 12]],
      [prebend[0], [33.25, 12, 0, -60]],
      [prebend[2], [33.25, -48, 44.3, -48, 44.3, -54, 44.3, -54]],
    ] as const;
    for (const [descriptor, expected] of expectedPaths) {
      const numbers = parsePathNumbers(descriptor.d);
      expect(numbers).toHaveLength(expected.length);
      for (const [index, value] of expected.entries()) {
        expect(numbers[index]).toBeCloseTo(value);
      }
    }
    for (const [descriptor, x, y, tipY] of [
      [release[1], 44.3, 12, 4],
      [prebend[1], 33.25, -48, -4],
      [prebend[3], 44.3, -54, -4],
    ] as const) {
      const numbers = parsePathNumbers(descriptor.d);
      expect(numbers).toHaveLength(10);
      expect(numbers[0]).toBeCloseTo(x);
      expect(numbers[1]).toBeCloseTo(y);
      expect(numbers.slice(2)).toEqual([
        2.5,
        0,
        -2.5,
        tipY,
        -2.5,
        -tipY,
        2.5,
        0,
      ]);
    }
  });

  test("keeps hold text aligned with bend pitches at the same font size across beat widths", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Half },
      { baseDuration: NoteDuration.SixtyFourth },
    ]);
    for (const [index, beat] of beats.entries()) {
      const note = beat.notes?.[0];
      if (!(note instanceof GuitarNote)) {
        throw Error("Expected guitar note in test beat");
      }
      note.setFret(5);
      note.addTechnique(
        new GuitarTechnique(
          note,
          GuitarTechniqueType.Bend,
          new BendTechniqueOptions(
            index === 2
              ? { type: BendType.Bend, bendPitch: 1, bendDuration: 1 }
              : { type: BendType.Hold, holdPitch: 1, bendDuration: 1 }
          )
        )
      );
    }

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const styleLine =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0];
    const barElement = styleLine.barElements[0];
    const labels = required(
      styleLine.techGapContainer.techGapLines[6]
    ).labelElements;

    expect(labels).toHaveLength(3);
    expect(new Set(labels.map((l) => l.boundingBox.width)).size).toBe(3);
    const pitchText = required(labels[2].textDescriptors?.[0]);
    expect(pitchText.text).toBe("full");
    for (const label of labels.slice(0, 2)) {
      if (!(label instanceof GuitarTechniqueLabelElement)) {
        throw Error("Expected a guitar technique label");
      }
      const descriptor = required(label.textDescriptors?.[0]);

      expect(descriptor.text).toBe("hold");
      expect(descriptor.attrs?.y).toBe(pitchText.attrs?.y);
      expect(Number(descriptor.attrs?.x)).toBe(label.boundingBox.width / 2);
      expect(Number(descriptor.attrs?.["font-size"])).toBe(
        TEST_LAYOUT_DIMENSIONS.noteTextSize
      );
      expect(descriptor.attrs?.textLength).toBeUndefined();
      expect(descriptor.attrs?.["text-anchor"]).toBe("middle");
      expect(descriptor.attrs?.lengthAdjust).toBeUndefined();
      expect(label.barLocalBoundingBox.x).toBeGreaterThanOrEqual(0);
      expect(label.barLocalBoundingBox.right).toBeLessThanOrEqual(
        barElement.boundingBox.width
      );
      expect(label.lineLocalBoundingBox.right).toBeLessThanOrEqual(
        TEST_LAYOUT_DIMENSIONS.width
      );
    }
  });

  test("predicts two technique rows before materializing the line", () => {
    const { track, bar } = createScoreGraph();
    const baselineHeight = new TrackElement(track, TEST_LAYOUT_DIMENSIONS)
      .height;
    const beat = bar.voiceBarsAsArray[0].beats[0];
    const vibratoNote = beat.notes?.[0];
    const palmMuteNote = beat.notes?.[1];
    if (
      !(vibratoNote instanceof GuitarNote) ||
      !(palmMuteNote instanceof GuitarNote)
    ) {
      throw Error("Expected guitar notes in test beat");
    }
    vibratoNote.setFret(5);
    palmMuteNote.setFret(5);

    vibratoNote.addTechnique(
      new GuitarTechnique(vibratoNote, GuitarTechniqueType.Vibrato)
    );
    palmMuteNote.addTechnique(
      new GuitarTechnique(palmMuteNote, GuitarTechniqueType.PalmMute)
    );

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    const predictedHeight =
      trackElement.trackLineElements[0].boundingBox.height;
    expect(predictedHeight).toBe(
      baselineHeight + 2 * TEST_LAYOUT_DIMENSIONS.techLabelHeight
    );
    expect(trackElement.materializedLineIndices.size).toBe(0);

    trackElement.update();

    expect(trackElement.trackLineElements[0].skeletonLine.finalLineHeight).toBe(
      predictedHeight
    );
    expect(trackElement.trackLineElements[0].boundingBox.height).toBe(
      predictedHeight
    );
  });

  test("update materializes only demanded line range", () => {
    const { score, track, bar } = createScoreGraph();
    for (let i = 0; i < 12; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const secondLineBefore = trackElement.trackLineElements[1];
    const note = bar.voiceBarsAsArray[0].beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.setFret(5);
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

    expect(trackElement.trackLineElements[1].staffLineContainers).toEqual([]);
    expect([...trackElement.materializedLineIndices]).toEqual([0]);
    expect(
      trackElement.getBeatElement(secondLineBeatElement.beat)
    ).toBeUndefined();
    expect(firstLineAfter.skeletonLine.finalLineHeight).toBe(
      firstLineAfter.boundingBox.height
    );
    expect(firstLineTechGap.boundingBox.height).toBe(
      TEST_LAYOUT_DIMENSIONS.techLabelHeight
    );
    const label = required(firstLineTechGap.techGapLines[1]?.labelElements[0]);
    expect(label.technique).toBe(note.techniques[0]);
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

  test("adding and removing a label expands and collapses the technique gap", () => {
    const { track, bar } = createScoreGraph();
    const note = bar.voiceBarsAsArray[0].beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.setFret(5);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const beforeTechGap =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].techGapContainer;
    expect(beforeTechGap.boundingBox.height).toBe(0);

    const command = new SetTechniqueCommand(
      ScoreEditor.getTechniqueTargetsForNotes([note]),
      GuitarTechniqueType.Vibrato
    );
    command.execute();
    trackElement.update();

    const afterTechGap =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].techGapContainer;
    expect(afterTechGap.boundingBox.height).toBe(
      TEST_LAYOUT_DIMENSIONS.techLabelHeight
    );
    expect(required(afterTechGap.techGapLines[1]).labelElements).toHaveLength(
      1
    );

    command.undo();
    trackElement.update();
    const clearedGap =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].techGapContainer;
    expect(clearedGap.boundingBox.height).toBe(0);
    expect(required(clearedGap.techGapLines[1]).labelElements).toEqual([]);
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
    vibratoNote.setFret(5);
    bendNote.setFret(5);

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
    const line1 = required(techGap.techGapLines[1]);
    const bendLine = required(techGap.techGapLines[6]);

    expect(techGap.boundingBox.height).toBe(
      TEST_LAYOUT_DIMENSIONS.techLabelHeight * 2
    );
    expect(required(techGap.techGapLines[2]).labelElements).toEqual([]);
    expect(line1.labelElements).toHaveLength(1);
    expect(bendLine.labelElements).toHaveLength(1);
    expect(bendLine.boundingBox.y).toBeCloseTo(line1.boundingBox.bottom);
  });

  test("joins adjacent mixed-duration vibratos smoothly", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.SixtyFourth },
      { baseDuration: NoteDuration.Eighth, dots: 1 },
      {
        baseDuration: NoteDuration.Quarter,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
      {
        baseDuration: NoteDuration.Quarter,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
    ]);
    const notes: GuitarNote[] = [];
    for (const beat of beats) {
      const note = beat.notes?.[0];
      if (!(note instanceof GuitarNote)) {
        throw Error("Expected guitar note in test beat");
      }
      note.setFret(5);
      notes.push(note);
    }
    notes[0].addTechnique(
      new GuitarTechnique(notes[0], GuitarTechniqueType.Vibrato)
    );
    notes[2].addTechnique(
      new GuitarTechnique(notes[2], GuitarTechniqueType.Vibrato)
    );

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const initialLabels = required(
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].techGapContainer.techGapLines[1]
    ).labelElements;
    expect(initialLabels).toHaveLength(2);
    const initialFirstPath = required(initialLabels[0].pathDescriptors)[0].d;

    notes[1].addTechnique(
      new GuitarTechnique(notes[1], GuitarTechniqueType.Vibrato)
    );
    trackElement.update();
    const labels = required(
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].techGapContainer.techGapLines[1]
    ).labelElements;
    expect(labels).toHaveLength(3);
    const vibratos = labels.map((label) =>
      parseVibratoPath(required(label.pathDescriptors)[0].d)
    );
    const interiorWidths = vibratos.flatMap((vibrato) =>
      vibrato.segments.slice(1, -1).map((segment, index) => {
        const previousEndX = vibrato.segments[index][4];
        return segment[4] - previousEndX;
      })
    );
    const endpointYs = vibratos.flatMap((vibrato) =>
      vibrato.segments.map((segment) => segment[5])
    );
    const vibratoHeight = Math.max(...endpointYs) - Math.min(...endpointYs);
    const finalFirstPath = required(labels[0].pathDescriptors)[0].d;

    expect(finalFirstPath).toBe(initialFirstPath);
    // The standard layout has 2px half-waves and a 4px peak-to-peak height.
    expect(interiorWidths.length).toBeGreaterThan(0);
    for (const width of interiorWidths) {
      expect(width).toBeCloseTo(2, 5);
    }
    expect(vibratoHeight).toBeCloseTo(4);
    for (const vibrato of vibratos) {
      expect(vibrato.segments.length).toBeGreaterThan(1);
    }
    for (let i = 0; i < labels.length - 1; i++) {
      const left = vibratos[i];
      const right = vibratos[i + 1];
      const leftEnd = left.segments[left.segments.length - 1];
      const rightFirst = right.segments[0];
      const leftOrigin = labels[i].descriptorOriginLineLocal;
      const rightOrigin = labels[i + 1].descriptorOriginLineLocal;
      const leftOriginX = leftOrigin.x;
      const rightOriginX = rightOrigin.x;
      const leftEndX = leftOriginX + leftEnd[4];
      const rightStartX = rightOriginX + right.start[0];
      const incomingSlope =
        (leftEnd[5] - leftEnd[3]) / (leftEnd[4] - leftEnd[2]);
      const outgoingSlope =
        (rightFirst[1] - right.start[1]) / (rightFirst[0] - right.start[0]);

      expect(leftEndX).toBeCloseTo(rightStartX);
      expect(leftOrigin.y + leftEnd[5]).toBeCloseTo(
        rightOrigin.y + right.start[1]
      );
      expect(incomingSlope).toBeCloseTo(outgoingSlope);
    }
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
      [179.6],
    ],
    [
      "Prebend",
      new BendTechniqueOptions({
        type: BendType.Prebend,
        prebendPitch: 0.5,
      }),
      [1],
      ["½"],
      [169.2],
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
      [172.233, 179.6],
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
      [168.55, 179.6],
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
      [179.6],
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
      [168.55, 179.6],
    ],
    [
      "Bend/Release to zero",
      new BendTechniqueOptions({
        type: BendType.BendAndRelease,
        bendPitch: 1,
        releasePitch: 0,
        bendDuration: 1,
      }),
      [1],
      ["full"],
      [172.233],
    ],
    [
      "Prebend/Release to zero",
      new BendTechniqueOptions({
        type: BendType.PrebendAndRelease,
        prebendPitch: 1,
        releasePitch: 0,
        bendDuration: 1,
      }),
      [1],
      ["full"],
      [168.55],
    ],
    [
      "Release to zero",
      new BendTechniqueOptions({
        type: BendType.Release,
        releasePitch: 0,
        bendDuration: 1,
      }),
      [],
      [],
      [],
    ],
  ])(
    "centers %s pitch labels on their inline curve endpoints",
    (_, options, arrowIndexes, expectedTexts, expectedXs) => {
      const { track, beats } = createBarWithBeats([
        { baseDuration: NoteDuration.Quarter },
        { baseDuration: NoteDuration.Quarter },
      ]);
      const note = beats[1].notes?.[0];
      if (!(note instanceof GuitarNote)) {
        throw Error("Expected guitar note in test beat");
      }
      note.setFret(5);
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
        styleLine.techGapContainer.techGapLines[6]?.labelElements[0];
      if (
        !(bendElement instanceof GuitarTechniqueElement) ||
        !(bendLabel instanceof GuitarTechniqueLabelElement)
      ) {
        throw Error("Expected bend element and label in test beat");
      }
      const textDescriptors = bendLabel.textDescriptors ?? [];
      const actualTexts = textDescriptors.map((descriptor) => descriptor.text);

      // This quarter beat starts at bar x=135.3 and has a 46.8px slot. The
      // glyph's right edge is x=157.5. It is the last beat, so with no next
      // note curves must end by x=179.6 (box right plus 3px attack padding,
      // minus a 3px gap and a 2.5px half arrow). Segments shrink from 11.7px
      // to 11.05px (two) or 7.37px (three).
      expect(beatElement.barLocalCoords.x).toBeCloseTo(135.3);
      expect(beatElement.boundingBox.width).toBeCloseTo(46.8);
      expect(actualTexts).toEqual(expectedTexts);
      expect(bendLabel.pathDescriptors).toEqual([]);
      for (let i = 0; i < arrowIndexes.length; i++) {
        const arrowPath = required(bendElement.pathDescriptors)[arrowIndexes[i]]
          .d;
        const numbers = parsePathNumbers(arrowPath);
        expect(numbers).toHaveLength(10);
        const arrowLocalX = numbers[0];
        const labelLocalX = Number(textDescriptors[i]?.attrs?.x);
        const arrowX = bendElement.pathOriginBarLocal.x + arrowLocalX;
        const labelX = bendLabel.descriptorOriginBarLocal.x + labelLocalX;

        expect(textDescriptors[i]?.attrs?.["text-anchor"]).toBe("middle");
        expect(arrowX).toBeCloseTo(expectedXs[i]);
        expect(labelX).toBeCloseTo(expectedXs[i]);
        expect(labelX).toBeCloseTo(arrowX);
      }
    }
  );

  test("keeps a bend/release curve and arrow clear of the next two-digit fret", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    for (const beat of beats) {
      (required(beat.notes)[0] as GuitarNote).setFret(12);
    }
    const note = required(beats[0].notes)[0] as GuitarNote;
    note.addTechnique(
      new GuitarTechnique(
        note,
        GuitarTechniqueType.Bend,
        new BendTechniqueOptions({
          type: BendType.BendAndRelease,
          bendPitch: 1,
          releasePitch: 0,
          bendDuration: 1,
        })
      )
    );
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const firstBeat = required(trackElement.getBeatElement(beats[0]));
    const nextBeat = required(trackElement.getBeatElement(beats[1]));
    const bend = firstBeat.noteElements[0].techniqueElements[0];
    if (!(bend instanceof GuitarTechniqueElement)) {
      throw Error("Expected bend element");
    }
    const paths = required(bend.pathDescriptors);
    const curveEndX = required(parsePathNumbers(paths[2].d).at(-2));
    const arrowXs = parsePathNumbers(paths[3].d);
    const arrowX = arrowXs[0];
    const arrowHalfWidth = arrowXs[2];
    const nextNote = nextBeat.noteElements[0];
    if (!(nextNote instanceof TabNoteSlotElement)) {
      throw Error("Expected tab note slot");
    }
    const nextFretLeft = nextNote.globalCoords.x + nextNote.textRect.left;
    expect(curveEndX).toBeCloseTo(arrowX);
    expect(bend.pathOrigin.x + arrowX + arrowHalfWidth).toBeLessThan(
      nextFretLeft
    );
  });

  test("a bend before a rest matches a bend before a note of equal duration", () => {
    const bendOptions = new BendTechniqueOptions({
      type: BendType.Bend,
      bendPitch: 1,
      bendDuration: 1,
    });
    const getBendArrowX = (isNextBeatRest: boolean): number => {
      // A full bar of eighths keeps beat boxes narrow, so the next fret
      // limits the bend instead of the quarter-box segment cap.
      const { track, beats } = createBarWithBeats(
        Array.from({ length: 8 }, () => ({
          baseDuration: NoteDuration.Eighth,
        }))
      );
      const note = required(beats[0].notes)[0] as GuitarNote;
      note.setFret(5);
      note.addTechnique(
        new GuitarTechnique(note, GuitarTechniqueType.Bend, bendOptions)
      );
      if (isNextBeatRest) {
        beats[1].makeRest();
      } else {
        (required(beats[1].notes)[0] as GuitarNote).setFret(5);
      }

      const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
      trackElement.update();
      const beatElement = required(trackElement.getBeatElement(beats[0]));
      const bend = beatElement.noteElements[0].techniqueElements[0];
      if (!(bend instanceof GuitarTechniqueElement)) {
        throw Error("Expected bend element");
      }
      return parsePathNumbers(required(bend.pathDescriptors)[1].d)[0];
    };

    const arrowXBeforeNote = getBendArrowX(false);
    const arrowXBeforeRest = getBendArrowX(true);

    expect(arrowXBeforeRest).toBeCloseTo(arrowXBeforeNote);
  });

  test("a bend on the last beat ends inside the bar's voice content", () => {
    const { track, beats } = createBarWithBeats(
      Array.from({ length: 8 }, () => ({
        baseDuration: NoteDuration.Eighth,
      }))
    );
    const lastBeat = required(beats.at(-1));
    const note = required(lastBeat.notes)[0] as GuitarNote;
    note.setFret(5);
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

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const beatElement = required(trackElement.getBeatElement(lastBeat));
    const bend = beatElement.noteElements[0].techniqueElements[0];
    if (!(bend instanceof GuitarTechniqueElement)) {
      throw Error("Expected bend element");
    }
    const arrowXs = parsePathNumbers(required(bend.pathDescriptors)[1].d);
    const arrowRight = bend.pathOrigin.x + arrowXs[0] + arrowXs[2];
    const voiceContentRight =
      beatElement.globalBoundingBox.right +
      TEST_LAYOUT_DIMENSIONS.rhythmAttackPadding;

    // The bend may use the attack padding after the last box. The arrow ends
    // one 3px gap before the content edge, so it stays before the barline.
    expect(arrowRight).toBeCloseTo(voiceContentRight - 3);
    expect(voiceContentRight).toBeLessThanOrEqual(
      beatElement.barElement.barRightBorderLineGlobal.x
    );
  });

  test("no-op update preserves technique label identities and geometry", () => {
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
    vibratoNote.setFret(5);
    bendNote.setFret(5);

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
    const line1Label = required(techGap.techGapLines[1]?.labelElements[0]);
    const bendLineLabel = required(techGap.techGapLines[6]?.labelElements[0]);
    const beforeLabels = [line1Label, bendLineLabel].map((v) => ({
      identity: v.getStableIdentity(),
      technique: v.technique,
      bounds: v.globalBoundingBox,
    }));
    expect(beforeLabels.map((v) => v.technique)).toEqual([
      vibratoNote.techniques[0],
      bendNote.techniques[0],
    ]);

    trackElement.update();

    const nextTechGap =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].techGapContainer;

    const nextLabels = [
      required(nextTechGap.techGapLines[1]?.labelElements[0]),
      required(nextTechGap.techGapLines[6]?.labelElements[0]),
    ];
    expect(
      nextLabels.map((v) => ({
        identity: v.getStableIdentity(),
        technique: v.technique,
        bounds: v.globalBoundingBox,
      }))
    ).toEqual(beforeLabels);
    expect(nextTechGap.boundingBox.height).toBe(
      2 * TEST_LAYOUT_DIMENSIONS.techLabelHeight
    );
  });

  test("ownedNotationNodes includes technique gap subtree nodes", () => {
    const { track, bar } = createScoreGraph();
    const note = bar.voiceBarsAsArray[0].beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.setFret(5);

    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.Vibrato));

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update({
      lineRange: { startLineIndex: 0, endLineIndex: 0 },
    });

    const line = trackElement.trackLineElements[0];
    const techGap =
      line.staffLineContainers[0].styleLinesAsArray[0].techGapContainer;
    const gapLines = techGap.techGapLinesAsArray;
    const label = required(techGap.techGapLines[1]?.labelElements[0]);
    expect(label.technique).toBe(note.techniques[0]);

    expect(
      line.ownedNotationNodes.filter((v) => v instanceof TechGapContainer)
    ).toEqual([techGap]);
    expect(
      line.ownedNotationNodes.filter((v) => v instanceof TechGapLineContainer)
    ).toEqual(gapLines);
    expect(
      line.ownedNotationNodes.filter(
        (v) => v instanceof GuitarTechniqueLabelElement
      )
    ).toEqual([label]);
    expect(
      line.drawableNotationElements.filter(
        (v) => v instanceof GuitarTechniqueLabelElement
      )
    ).toEqual([label]);

    for (const container of [techGap, ...gapLines]) {
      expect(isNotationContainer(container)).toBe(true);
      expect(isNotationElement(container)).toBe(false);
      expect(container.owningTrackLineElement).toBe(line);
      expect(line.drawableNotationElements).not.toContain(container);
    }
    expect(isNotationElement(label)).toBe(true);
    expect(isNotationContainer(label)).toBe(false);
    expect(label.owningTrackLineElement).toBe(line);
  });

  test("ownedNotationNodes updates after line rematerialization", () => {
    const { track, bar } = createScoreGraph();
    const note = bar.voiceBarsAsArray[0].beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.setFret(5);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

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

    const line = trackElement.trackLineElements[0];
    const techniques = line.ownedNotationNodes.filter(
      (v) => v instanceof GuitarTechniqueElement
    );
    expect(techniques).toHaveLength(1);
    const technique = required(techniques[0]);
    expect(technique.technique).toBe(note.techniques[0]);
    expect(technique.owningTrackLineElement).toBe(line);
    expect(line.drawableNotationElements).toContain(technique);

    note.removeTechnique(GuitarTechniqueType.NaturalHarmonic);
    trackElement.update({ lineRange: { startLineIndex: 0, endLineIndex: 0 } });

    const nextLine = trackElement.trackLineElements[0];
    expect(nextLine.ownedNotationNodes).not.toContain(technique);
    expect(
      nextLine.ownedNotationNodes.filter(
        (v) => v instanceof GuitarTechniqueElement
      )
    ).toEqual([]);
    expect(nextLine.drawableNotationElements).not.toContain(technique);
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
    vibratoNote.setFret(5);
    palmMuteNote.setFret(5);

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
    const vibratoLine = required(techGap.techGapLines[1]);
    const palmMuteLine = required(techGap.techGapLines[2]);
    const vibratoLabel = required(vibratoLine.labelElements[0]);
    const palmMuteLabel = required(palmMuteLine.labelElements[0]);

    expect(vibratoLabel.technique.note).toBe(vibratoNote);
    expect(palmMuteLabel.technique.note).toBe(palmMuteNote);
    expect(vibratoLine.boundingBox.height).toBe(
      TEST_LAYOUT_DIMENSIONS.techLabelHeight
    );
    expect(palmMuteLine.boundingBox.height).toBe(
      TEST_LAYOUT_DIMENSIONS.techLabelHeight
    );
    expect(palmMuteLine.boundingBox.y).toBeCloseTo(
      vibratoLine.boundingBox.bottom
    );
    expect(palmMuteLabel.globalCoords.y).toBeGreaterThan(
      vibratoLabel.globalCoords.y
    );
  });

  test("palm mute label stays centered on its note after justified width recalculation", () => {
    const { score, track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    for (let i = 0; i < 12; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const firstVoiceBar = track.staves[0].bars[0].getVoiceBar(1);
    if (firstVoiceBar === null) {
      throw Error("Expected voice 1 in first bar");
    }
    const palmMuteNote = beats[1].notes?.[0];
    if (!(palmMuteNote instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    palmMuteNote.setFret(5);
    palmMuteNote.addTechnique(
      new GuitarTechnique(palmMuteNote, GuitarTechniqueType.PalmMute)
    );

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const originalBeat = required(trackElement.getBeatElement(beats[1]));
    const originalX = originalBeat.barLocalCoords.x;
    const originalWidth = originalBeat.boundingBox.width;

    firstVoiceBar.beats[0].baseDuration = NoteDuration.Eighth;
    firstVoiceBar.rebuildTiming();
    trackElement.update();

    const beatElement = required(trackElement.getBeatElement(beats[1]));
    const palmMuteLabel = required(
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].techGapContainer.techGapLines[2]?.labelElements[0]
    );
    const descriptor = required(palmMuteLabel.textDescriptors?.[0]);
    const textX =
      palmMuteLabel.descriptorOriginBarLocal.x + Number(descriptor.attrs?.x);
    const noteElement = beatElement.noteElements[0] as TabNoteSlotElement;
    const noteCenterX =
      noteElement.selectionRect.x +
      noteElement.selectionRect.width / 2 -
      beatElement.barElement.globalCoords.x;

    expect(descriptor.text).toBe("P.M.");
    expect(beatElement.barLocalCoords.x).not.toBeCloseTo(originalX);
    expect(beatElement.boundingBox.width).not.toBeCloseTo(originalWidth);
    expect(descriptor.attrs?.["text-anchor"]).toBe("middle");
    expect(textX).toBeCloseTo(noteCenterX);
    expect(palmMuteLabel.globalBoundingBox.right).toBeCloseTo(
      beatElement.globalBoundingBox.right
    );
  });

  test("starts a label at the beat attack and ends it at the beat box right", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const note = required(beats[0].notes)[0] as GuitarNote;
    note.setFret(5);
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.PalmMute));

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();
    const beatElement = trackElement.getBeatElement(beats[0]);
    if (!(beatElement instanceof TabBeatElement)) {
      throw Error("Expected tab beat element");
    }
    const label = required(
      trackElement.trackLineElements[0].staffLineContainers[0].styleLinesAsArray[0].techGapContainer.techGapLinesAsArray.find(
        (v) => v.labelElements.length > 0
      )?.labelElements[0]
    );

    // The label must not start inside the empty beat technique slot.
    expect(label.globalBoundingBox.x).toBeCloseTo(beatElement.attackXGlobal);
    expect(label.globalBoundingBox.right).toBeCloseTo(
      beatElement.globalBoundingBox.right
    );
  });

  test("per-slot Let Ring renders shared labels through marked empty slots", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const notes = [
      required(beats[0].notes)[0],
      required(beats[0].notes)[1],
      required(beats[1].notes)[0],
    ] as GuitarNote[];
    for (const [index, note] of notes.entries()) {
      note.setFret(index === 2 ? null : 5);
      note.setTechnique(GuitarTechniqueType.LetRing);
    }

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const labels = required(
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].techGapContainer.techGapLines[3]
    ).labelElements;

    expect(labels).toHaveLength(2);
    expect(labels.map((v) => v.beatElement.beat)).toEqual(beats);
    expect(labels.map((v) => v.textDescriptors?.map((d) => d.text))).toEqual([
      ["L.R."],
      [],
    ]);
    const slot = labels[1].beatElement.noteElements[0] as TabNoteSlotElement;
    expect(slot.noteText).toBe("");
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
    note.setFret(5);
    const noteArray = [note];

    score.masterBars[secondLineStartIndex].tempo = 121;
    secondLineVoiceBar.rebuildTiming();
    trackElement.update();

    ScoreEditor.setTechniqueForNotes(noteArray, GuitarTechniqueType.Vibrato);
    trackElement.update();
    ScoreEditor.setTechniqueForNotes(noteArray, GuitarTechniqueType.PalmMute);
    trackElement.update();
    ScoreEditor.setTechniqueForNotes(noteArray, GuitarTechniqueType.Vibrato);
    trackElement.update();
    const afterRemovalGap =
      trackElement.trackLineElements[1].staffLineContainers[0]
        .styleLinesAsArray[0].techGapContainer;
    expect(required(afterRemovalGap.techGapLines[1]).labelElements).toEqual([]);
    expect(
      required(afterRemovalGap.techGapLines[2]).labelElements
    ).toHaveLength(1);
    expect(afterRemovalGap.boundingBox.height).toBe(
      TEST_LAYOUT_DIMENSIONS.techLabelHeight
    );

    ScoreEditor.setTechniqueForNotes(noteArray, GuitarTechniqueType.Vibrato);
    trackElement.update();

    const secondLineStyle =
      trackElement.trackLineElements[1].staffLineContainers[0]
        .styleLinesAsArray[0];
    const line1 = secondLineStyle.techGapContainer.techGapLines[1];
    const line2 = secondLineStyle.techGapContainer.techGapLines[2];
    const vibratoLabel = required(line1?.labelElements[0]);
    const palmMuteLabel = required(line2?.labelElements[0]);

    expect(vibratoLabel.technique.note).toBe(note);
    expect(palmMuteLabel.technique.note).toBe(note);
    expect(vibratoLabel.globalCoords.y).toBeLessThan(
      palmMuteLabel.globalCoords.y
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
