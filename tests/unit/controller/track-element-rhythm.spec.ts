import { TrackElement } from "../../../src/notation/controller/element/track-element";
import { BeamSegmentElement } from "../../../src/notation/controller/element/bar/beam-segment-element";
import { TabBeatRhythmElement } from "../../../src/notation/controller/element/beat/tab-beat-rhythm-element";
import { BarTupletGroupElement } from "../../../src/notation/controller/element/bar/bar-tuplet-group-element";
import { VoiceBarRhythmContainer } from "../../../src/notation/controller/element/bar/voice-bar-rhythm-container";
import {
  TabBeatElement,
  TabNoteSlotElement,
} from "../../../src/notation/controller";
import { TabUILayoutMode } from "../../../src/config/tabui-config";
import {
  Bar,
  DEFAULT_MASTER_BAR,
  Guitar,
  GuitarNote,
  NoteDuration,
  VoiceBar,
} from "../../../src/notation/model";
import {
  createBarWithBeats,
  createBeat,
  createScoreGraph,
} from "../model/helpers";
import { createTestLayoutDimensions, TEST_LAYOUT_DIMENSIONS } from "./helpers";

function fillBarWithDenseSixtyFourthBeats(
  bar: Bar<Guitar>,
  count: number
): void {
  const voiceBar = bar.getVoiceBar(1);
  if (voiceBar === null) {
    throw Error("Expected voice 1 bar");
  }
  const beats = Array.from({ length: count }, () =>
    createBeat(voiceBar, NoteDuration.SixtyFourth)
  );
  voiceBar.beats.splice(0, voiceBar.beats.length, ...beats);
  voiceBar.computeBarTupletGroups();
  voiceBar.rebuildTiming();
}

function getRhythmElements(trackElement: TrackElement): TabBeatRhythmElement[] {
  return trackElement.trackLineElements[0].staffLineContainers[0].styleLinesAsArray[0].barElements[0]
    .refreshOwnedNotationNodes()
    .filter(
      (element): element is TabBeatRhythmElement =>
        element instanceof TabBeatRhythmElement
    );
}

function setTripletBeats(voiceBar: VoiceBar<Guitar>, count: number): void {
  const beats = Array.from({ length: count }, () =>
    createBeat(voiceBar, NoteDuration.Eighth, 0, {
      normalCount: 3,
      tupletCount: 2,
    })
  );
  voiceBar.beats.splice(0, voiceBar.beats.length, ...beats);
  voiceBar.rebuildTiming();
}

describe("TrackElement rhythm", () => {
  test("lays out beat x positions from start gap and beat widths", () => {
    const { track } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Sixteenth },
    ]);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    trackElement.update();

    const barElement =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements[0];

    const beatElements = barElement.beatElements;
    expect(beatElements).toHaveLength(3);

    // The configured 12px attack padding separates notes from the start gap.
    let expectedX = 12;
    for (let i = 0; i < beatElements.length; i++) {
      expect(beatElements[i].boundingBox.x).toBeCloseTo(expectedX);
      expect(beatElements[i].barLocalBoundingBox.x).toBeCloseTo(
        barElement.startGap.right + expectedX
      );
      expect(beatElements[i].boundingBox.width).toBeGreaterThan(0);
      expectedX += beatElements[i].boundingBox.width;
    }
  });

  test("selection rect spans selected contiguous beats", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    trackElement.update();

    const barElement =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements[0];
    const firstSelected = barElement.beatElements[0];
    const lastSelected = barElement.beatElements[1];
    const unselected = barElement.beatElements[2];

    const rects = trackElement.getSelectionRects([beats[0], beats[1]]);
    expect(rects).toHaveLength(1);
    if (
      !(firstSelected instanceof TabBeatElement) ||
      !(lastSelected instanceof TabBeatElement) ||
      !(unselected instanceof TabBeatElement)
    ) {
      throw Error("Expected tab beat element");
    }
    // A 12px note label extends 6px left of its attack column.
    expect(rects[0].x).toBeCloseTo(firstSelected.attackXGlobal - 6);
    expect(rects[0].width).toBeCloseTo(
      firstSelected.boundingBox.width + lastSelected.boundingBox.width
    );
    expect(rects[0].right).toBeGreaterThan(lastSelected.attackXGlobal);
    expect(rects[0].right).toBeLessThan(unselected.attackXGlobal);
    expect(rects[0].y).toBeCloseTo(barElement.globalCoords.y);
    expect(rects[0].height).toBeCloseTo(
      barElement.notationStyleLineContainer.staffLineContainer.boundingBox
        .height
    );
  });

  test("selection rect covers left-extending tab note text", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    beats[0].makeBeatWithNotes();
    const note = beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note");
    }
    note.fret = 3;
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    trackElement.update();

    const beatElement = trackElement.getBeatElement(beats[0]);
    if (!(beatElement instanceof TabBeatElement)) {
      throw Error("Expected tab beat element");
    }
    const noteElement = beatElement.noteElements.find(
      (element) => element.note === note
    );
    if (!(noteElement instanceof TabNoteSlotElement)) {
      throw Error("Expected note element");
    }

    const rects = trackElement.getSelectionRects([beats[0]]);

    expect(rects).toHaveLength(1);
    expect(noteElement.textRectGlobal.x).toBeLessThan(
      beatElement.attackXGlobal
    );
    expect(rects[0].x).toBeCloseTo(noteElement.textRectGlobal.x);
    expect(rects[0].width).toBeCloseTo(beatElement.boundingBox.width);
    expect(rects[0].right).toBeGreaterThan(noteElement.textRectGlobal.right);
  });

  test("keeps dotted and tuplet beat widths positive", () => {
    const { track } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth, dots: 1 },
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
    ]);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    trackElement.update();

    const beatElements =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements[0].beatElements;

    expect(beatElements).toHaveLength(3);
    expect(
      beatElements.every((beatElement) => beatElement.boundingBox.width > 0)
    ).toBe(true);
  });

  test("justifies wrapped non-final lines to full width while keeping beats contiguous", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 12; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    expect(trackElement.trackLineElements.length).toBeGreaterThan(1);
    const firstLineStyle =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0];
    const lastBarOnFirstLine =
      firstLineStyle.barElements[firstLineStyle.barElements.length - 1];
    expect(lastBarOnFirstLine.boundingBox.right).toBeCloseTo(
      TEST_LAYOUT_DIMENSIONS.width
    );

    for (const barElement of firstLineStyle.barElements) {
      for (let i = 1; i < barElement.beatElements.length; i++) {
        expect(barElement.beatElements[i].boundingBox.x).toBeCloseTo(
          barElement.beatElements[i - 1].boundingBox.right
        );
      }
      expect(barElement.boundingBox.width).toBeGreaterThan(0);
    }
  });

  test("dense 64th-note bars build without overflowing line width", () => {
    const { score, track } = createScoreGraph();
    fillBarWithDenseSixtyFourthBeats(track.staves[0].bars[0], 64);

    for (let i = 0; i < 8; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
      fillBarWithDenseSixtyFourthBeats(
        track.staves[0].bars[track.staves[0].bars.length - 1],
        64
      );
    }

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    trackElement.update();
    expect(trackElement.trackLineElements.length).toBeGreaterThan(1);

    for (const trackLine of trackElement.trackLineElements) {
      const styleLine = trackLine.staffLineContainers[0].styleLinesAsArray[0];
      const lastBar = styleLine.barElements[styleLine.barElements.length - 1];
      for (const barElement of styleLine.barElements) {
        expect(barElement.beatElements).toHaveLength(64);
        for (const beatElement of barElement.beatElements) {
          expect(beatElement.boundingBox.width).toBeGreaterThan(0);
        }
      }
      expect(lastBar.boundingBox.right).toBeLessThanOrEqual(
        TEST_LAYOUT_DIMENSIONS.width
      );
    }
  });

  test("rhythm row height depends on voices present on the rendered line", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 12; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    expect(trackElement.trackLineElements.length).toBeGreaterThan(1);

    const firstLineHeightBefore =
      trackElement.trackLineElements[0].boundingBox.height;
    const secondLineHeightBefore =
      trackElement.trackLineElements[1].boundingBox.height;
    const secondLineFirstBarIndex =
      trackElement.trackLineElements[1].trackLineBars[0].masterBarIndex;
    const secondLineFirstBar = track.staves[0].bars[secondLineFirstBarIndex];

    const secondVoice = secondLineFirstBar.insertVoiceBar(2);
    secondVoice.replaceBeats([createBeat(secondVoice, NoteDuration.Quarter)]);
    trackElement.update();

    expect(trackElement.trackLineElements[0].boundingBox.height).toBeCloseTo(
      firstLineHeightBefore
    );
    expect(trackElement.trackLineElements[1].boundingBox.height).toBeCloseTo(
      secondLineHeightBefore + 60
    );

    secondVoice.replaceBeats([]);
    trackElement.update();

    expect(trackElement.trackLineElements[0].boundingBox.height).toBeCloseTo(
      firstLineHeightBefore
    );
    expect(trackElement.trackLineElements[1].boundingBox.height).toBeCloseTo(
      secondLineHeightBefore
    );

    secondLineFirstBar.removeVoiceBar(2);
    trackElement.update();

    expect(trackElement.trackLineElements[0].boundingBox.height).toBeCloseTo(
      firstLineHeightBefore
    );
    expect(trackElement.trackLineElements[1].boundingBox.height).toBeCloseTo(
      secondLineHeightBefore
    );
  });

  test("preserves tuplet clearance in rhythm rows without tuplets", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const secondVoice = bar.insertVoiceBar(2);
    secondVoice.beats.splice(
      0,
      secondVoice.beats.length,
      createBeat(secondVoice, NoteDuration.Quarter)
    );
    secondVoice.rebuildTiming();
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const trackLineElement = trackElement.trackLineElements[0];
    const staffLineContainer = trackLineElement.staffLineContainers[0];
    const styleLineContainer = staffLineContainer.styleLinesAsArray[0];
    const barElement = styleLineContainer.barElements[0];
    const notationNodes = barElement.refreshOwnedNotationNodes();
    const rows = notationNodes.filter(
      (n): n is VoiceBarRhythmContainer => n instanceof VoiceBarRhythmContainer
    );
    expect(rows.map((r) => r.voiceNumber)).toEqual([1, 2]);
    // Each row reserves 30px for durations and 30px for tuplets.
    expect(rows.map((r) => r.boundingBox.height)).toEqual([60, 60]);
  });

  test("aligns sparse voice rows across bars on one staff line", () => {
    const { score, track, staff, bar } = createBarWithBeats([]);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const firstVoice = bar.getVoiceBar(1);
    const secondBar = staff.bars[1];
    if (firstVoice === null || secondBar === undefined) {
      throw Error("Expected test voice bars");
    }
    setTripletBeats(firstVoice, 3);
    setTripletBeats(secondBar.insertVoiceBar(3), 2);

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const trackLineElement = trackElement.trackLineElements[0];
    const staffLineContainer = trackLineElement.staffLineContainers[0];
    const styleLineContainer = staffLineContainer.styleLinesAsArray[0];
    expect(styleLineContainer.barElements).toHaveLength(2);
    const rowsByBar = styleLineContainer.barElements.map((barElement) => {
      const nodes = barElement.refreshOwnedNotationNodes();
      expect(
        nodes
          .filter((n) => n instanceof VoiceBarRhythmContainer)
          .map((n) => n.voiceNumber)
      ).toEqual([1, 3]);
      const firstVoiceRow = nodes.find(
        (n) => n instanceof VoiceBarRhythmContainer && n.voiceNumber === 1
      );
      const thirdVoiceRow = nodes.find(
        (n) => n instanceof VoiceBarRhythmContainer && n.voiceNumber === 3
      );
      if (
        !(firstVoiceRow instanceof VoiceBarRhythmContainer) ||
        !(thirdVoiceRow instanceof VoiceBarRhythmContainer)
      ) {
        throw Error("Expected voice 1 and voice 3 rhythm rows");
      }

      return { firstVoiceRow, thirdVoiceRow };
    });
    for (const rows of rowsByBar) {
      // Six 24px note lanes, then 69px per row including label clearance.
      expect(rows.firstVoiceRow.boundingBox.y).toBe(144);
      expect(rows.firstVoiceRow.boundingBox.height).toBe(69);
      expect(rows.thirdVoiceRow.boundingBox.y).toBe(213);
      expect(rows.thirdVoiceRow.boundingBox.height).toBe(69);
    }
  });

  test.each([TabUILayoutMode.Wrapped, TabUILayoutMode.SingleLine])(
    "keeps same-position cross-voice incomplete tuplets clear in %s layout",
    (layoutMode) => {
      const { score, track, staff, bar } = createBarWithBeats([]);
      score.appendMasterBar(DEFAULT_MASTER_BAR);
      const bars = [bar, staff.bars[1]];
      for (const targetBar of bars) {
        const firstVoice = targetBar.getVoiceBar(1);
        if (firstVoice === null) {
          throw Error("Expected voice 1 bar");
        }
        setTripletBeats(firstVoice, 2);
        setTripletBeats(targetBar.insertVoiceBar(3), 2);
      }

      const dimensions = createTestLayoutDimensions();
      dimensions.setWidth(150);
      const trackElement = new TrackElement(
        track,
        dimensions,
        undefined,
        layoutMode
      );
      trackElement.update();

      const lines = trackElement.trackLineElements;
      expect(lines).toHaveLength(
        layoutMode === TabUILayoutMode.Wrapped ? 2 : 1
      );
      expect(lines.flatMap((l) => [...l.allBarElements()])).toHaveLength(2);

      for (const line of lines) {
        for (const barElement of line.allBarElements()) {
          const nodes = barElement.refreshOwnedNotationNodes();
          const firstVoiceTuplet = nodes.find(
            (n) => n instanceof BarTupletGroupElement && n.voiceNumber === 1
          );
          const thirdVoiceTuplet = nodes.find(
            (n) => n instanceof BarTupletGroupElement && n.voiceNumber === 3
          );
          const firstVoiceRow = nodes.find(
            (n) => n instanceof VoiceBarRhythmContainer && n.voiceNumber === 1
          );
          const thirdVoiceRow = nodes.find(
            (n) => n instanceof VoiceBarRhythmContainer && n.voiceNumber === 3
          );
          if (
            !(firstVoiceTuplet instanceof BarTupletGroupElement) ||
            !(thirdVoiceTuplet instanceof BarTupletGroupElement) ||
            !(firstVoiceRow instanceof VoiceBarRhythmContainer) ||
            !(thirdVoiceRow instanceof VoiceBarRhythmContainer)
          ) {
            throw Error("Expected voice 1 and voice 3 tuplets and rhythm rows");
          }

          for (const [tuplet, row] of [
            [firstVoiceTuplet, firstVoiceRow],
            [thirdVoiceTuplet, thirdVoiceRow],
          ] as const) {
            const labels = tuplet.incompleteTextsCoordsBarLocal;
            expect(labels).toHaveLength(2);
            if (labels === undefined) {
              throw Error("Expected incomplete tuplet labels");
            }
            for (let i = 0; i < labels.length; i++) {
              const beat = tuplet.beatElements[i];
              const rhythm = nodes.find(
                (n) => n instanceof TabBeatRhythmElement && n.beat === beat.beat
              );
              if (!(rhythm instanceof TabBeatRhythmElement)) {
                throw Error("Expected beat rhythm");
              }
              const stem = rhythm.durationStemLineBarLocal;
              if (stem === undefined) {
                throw Error("Expected duration stem");
              }

              // Label, stem, and row bounds all use bar-local coordinates.
              expect(labels[i].x).toBeCloseTo(beat.attackXBarLocal);
              expect(
                labels[i].y - dimensions.tempoTextSize / 2
              ).toBeGreaterThan(stem.y2);
              expect(
                labels[i].y + dimensions.tempoTextSize / 2
              ).toBeLessThanOrEqual(row.boundingBox.bottom);
            }
          }
        }
      }
    }
  );

  test("beamed beats hide standalone flags while an isolated beat keeps them", () => {
    const { track } = createBarWithBeats([
      { baseDuration: NoteDuration.ThirtySecond },
      { baseDuration: NoteDuration.ThirtySecond },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.ThirtySecond },
    ]);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    trackElement.update();

    const beatRhythmElements = getRhythmElements(trackElement);

    expect(beatRhythmElements).toHaveLength(4);
    expect(beatRhythmElements[0].durationFlagLines).toBeUndefined();
    expect(beatRhythmElements[1].durationFlagLines).toBeUndefined();
    expect(beatRhythmElements[2].durationFlagLines).toBeUndefined();
    expect(beatRhythmElements[3].durationFlagLines).toHaveLength(3);
  });

  test("standalone flag spacing matches beam level spacing", () => {
    const { track } = createBarWithBeats([
      { baseDuration: NoteDuration.ThirtySecond },
    ]);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    trackElement.update();

    const beatElement = getRhythmElements(trackElement)[0];

    expect(beatElement.durationFlagLines).toHaveLength(3);
    const flagLines = beatElement.durationFlagLines;
    if (flagLines === undefined) throw Error("Expected duration flag lines");
    expect(flagLines[0].y - flagLines[1].y).toBeCloseTo(
      TEST_LAYOUT_DIMENSIONS.durationFlagHeight * 2
    );
    expect(flagLines[1].y - flagLines[2].y).toBeCloseTo(
      TEST_LAYOUT_DIMENSIONS.durationFlagHeight * 2
    );
  });

  test("beamed dotted beats keep the whole dot above the top beam", () => {
    const { track } = createBarWithBeats([
      { baseDuration: NoteDuration.ThirtySecond, dots: 1 },
      { baseDuration: NoteDuration.ThirtySecond, dots: 1 },
    ]);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    trackElement.update();

    const beatElement = getRhythmElements(trackElement)[0];
    const dot = beatElement.dot1CircleBarLocal;
    const beam = beatElement.owningBarElement
      .refreshOwnedNotationNodes()
      .find((e): e is BeamSegmentElement => e instanceof BeamSegmentElement);
    if (beam === undefined) throw Error("Expected beam segment");
    expect(beam.longRectsBarLocal).toHaveLength(3);
    const topBeamY = Math.min(...beam.longRectsBarLocal.map((r) => r.y));

    expect(beatElement.durationFlagLines).toBeUndefined();
    expect(dot).toBeDefined();
    if (dot === undefined) throw Error("Expected duration dot");
    // Dot and beam are both bar-local, including the same rhythm row origin.
    expect(dot.centerY + dot.diameter / 2).toBeLessThan(topBeamY);
  });

  test("standalone dotted beats place dots above the top flag", () => {
    const { track } = createBarWithBeats([
      { baseDuration: NoteDuration.ThirtySecond, dots: 1 },
    ]);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    trackElement.update();

    const beatElement = getRhythmElements(trackElement)[0];
    const flagLines = beatElement.durationFlagLinesBarLocal;
    if (flagLines === undefined)
      throw Error("Expected bar-local duration flag lines");
    const topFlagY = flagLines[2].y;

    expect(beatElement.dot1CircleBarLocal).toBeDefined();
    const dot = beatElement.dot1CircleBarLocal;
    if (dot === undefined) throw Error("Expected duration dot");
    expect(dot.centerY).toBeCloseTo(
      topFlagY - TEST_LAYOUT_DIMENSIONS.dotDiameter
    );
  });
});
