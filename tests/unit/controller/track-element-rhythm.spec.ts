import { TrackElement } from "../../../src/notation/controller/element/track-element";
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
    const { track, beats } = createBarWithBeats([
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

    let expectedX = beatElements[0].boundingBox.x;
    for (let i = 0; i < beatElements.length; i++) {
      expect(beatElements[i].boundingBox.x).toBeCloseTo(expectedX);
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

    const rects = trackElement.getSelectionRects([beats[0], beats[1]]);
    expect(rects).toHaveLength(1);
    const firstSelectedX =
      firstSelected.barElement.globalCoords.x +
      firstSelected.barLocalBoundingBox.x;
    expect(rects[0].x).toBeLessThan(firstSelectedX);
    if (!(lastSelected instanceof TabBeatElement)) {
      throw Error("Expected tab beat element");
    }
    expect(rects[0].right).toBeCloseTo(
      lastSelected.getGlobalVisualBounds().right
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
    if (beatElement === undefined) {
      throw Error("Expected beat element");
    }
    const noteElement = beatElement.noteElements.find(
      (element) => element.note === note
    );
    if (!(noteElement instanceof TabNoteSlotElement)) {
      throw Error("Expected note element");
    }

    const rects = trackElement.getSelectionRects([beats[0]]);

    expect(rects).toHaveLength(1);
    expect(rects[0].x).toBeCloseTo(noteElement.textRectGlobal.x);
    expect(rects[0].right).toBeCloseTo(
      (beatElement as TabBeatElement).getGlobalVisualBounds().right
    );
  });

  test("keeps dotted and tuplet beat widths positive", () => {
    const { track, beats } = createBarWithBeats([
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

    const firstLineStyle =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0];
    const lastBarOnFirstLine =
      firstLineStyle.barElements[firstLineStyle.barElements.length - 1];
    expect(lastBarOnFirstLine.boundingBox.right).toBeCloseTo(
      TEST_LAYOUT_DIMENSIONS.WIDTH
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
      score.appendMasterBar({
        ...DEFAULT_MASTER_BAR,
        beatsCount: 32,
        duration: NoteDuration.SixtyFourth,
      });
      fillBarWithDenseSixtyFourthBeats(
        track.staves[0].bars[track.staves[0].bars.length - 1],
        64
      );
    }

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    expect(() => trackElement.update()).not.toThrow();
    expect(trackElement.trackLineElements.length).toBeGreaterThan(1);

    for (const trackLine of trackElement.trackLineElements) {
      const styleLine = trackLine.staffLineContainers[0].styleLinesAsArray[0];
      const lastBar = styleLine.barElements[styleLine.barElements.length - 1];
      expect(lastBar.boundingBox.right).toBeLessThanOrEqual(
        TEST_LAYOUT_DIMENSIONS.WIDTH
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

    secondLineFirstBar.insertVoiceBar(2);
    trackElement.update();

    expect(trackElement.trackLineElements[0].boundingBox.height).toBeCloseTo(
      firstLineHeightBefore
    );
    expect(
      trackElement.trackLineElements[1].boundingBox.height
    ).toBeGreaterThan(secondLineHeightBefore);
  });

  test("preserves tuplet clearance in rhythm rows without tuplets", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const secondVoice = bar.insertVoiceBar(2);
    secondVoice.beats.push(createBeat(secondVoice, NoteDuration.Quarter));
    secondVoice.rebuildTiming();
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const trackLineElement = trackElement.trackLineElements[0];
    const staffLineContainer = trackLineElement.staffLineContainers[0];
    const styleLineContainer = staffLineContainer.styleLinesAsArray[0];
    const barElement = styleLineContainer.barElements[0];
    const notationNodes = barElement.refreshOwnedNotationNodes();
    const row = notationNodes.find((n) => n instanceof VoiceBarRhythmContainer);
    if (!(row instanceof VoiceBarRhythmContainer)) {
      throw Error("Expected rhythm row");
    }

    expect(row.boundingBox.height).toBe(
      TEST_LAYOUT_DIMENSIONS.DURATIONS_HEIGHT +
        TEST_LAYOUT_DIMENSIONS.TUPLET_RECT_HEIGHT
    );
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
    const rowsByBar = styleLineContainer.barElements.map((barElement) => {
      const nodes = barElement.refreshOwnedNotationNodes();
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
    const firstBarRows = rowsByBar[0];
    const secondBarRows = rowsByBar[1];
    if (firstBarRows === undefined || secondBarRows === undefined) {
      throw Error("Expected two rendered bars");
    }

    for (const rows of rowsByBar) {
      expect(rows.firstVoiceRow.boundingBox.bottom).toBeCloseTo(
        rows.thirdVoiceRow.boundingBox.y
      );
    }
    expect(firstBarRows.firstVoiceRow.boundingBox.y).toBeCloseTo(
      secondBarRows.firstVoiceRow.boundingBox.y
    );
    expect(firstBarRows.firstVoiceRow.boundingBox.height).toBeCloseTo(
      secondBarRows.firstVoiceRow.boundingBox.height
    );
    expect(firstBarRows.thirdVoiceRow.boundingBox.y).toBeCloseTo(
      secondBarRows.thirdVoiceRow.boundingBox.y
    );
    expect(firstBarRows.thirdVoiceRow.boundingBox.height).toBeCloseTo(
      secondBarRows.thirdVoiceRow.boundingBox.height
    );
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
      if (layoutMode === TabUILayoutMode.Wrapped && lines.length < 2) {
        throw Error("Expected wrapped fixture to produce multiple lines");
      }

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

          const firstLabelY =
            firstVoiceTuplet.incompleteTextsCoordsBarLocal?.[0].y;
          const thirdLabelY =
            thirdVoiceTuplet.incompleteTextsCoordsBarLocal?.[0].y;
          if (firstLabelY === undefined || thirdLabelY === undefined) {
            throw Error("Expected incomplete tuplet label coordinates");
          }
          expect(
            firstLabelY + dimensions.TEMPO_TEXT_SIZE / 2
          ).toBeLessThanOrEqual(firstVoiceRow.boundingBox.bottom);
          expect(
            thirdLabelY + dimensions.TEMPO_TEXT_SIZE / 2
          ).toBeLessThanOrEqual(thirdVoiceRow.boundingBox.bottom);
        }
      }
    }
  );

  test("invalid beam group ids do not suppress standalone duration flags", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.ThirtySecond },
      { baseDuration: NoteDuration.ThirtySecond },
      { baseDuration: NoteDuration.ThirtySecond },
      { baseDuration: NoteDuration.ThirtySecond },
      { baseDuration: NoteDuration.ThirtySecond },
    ]);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }

    expect(voiceBar.beamingGroups.length).toBeGreaterThan(0);

    voiceBar.beats[3].beamGroupId = voiceBar.beamingGroups.length;
    voiceBar.beats[4].beamGroupId = voiceBar.beamingGroups.length;
    voiceBar.beats[3].lastInBeamGroup = false;
    voiceBar.beats[4].lastInBeamGroup = false;

    trackElement.update();

    const beatRhythmElements = getRhythmElements(trackElement);

    expect(beatRhythmElements[0].durationFlagLines).toBeUndefined();
    expect(beatRhythmElements[1].durationFlagLines).toBeUndefined();
    expect(beatRhythmElements[2].durationFlagLines).toBeUndefined();
    expect(beatRhythmElements[3].durationFlagLines).toHaveLength(3);
    expect(beatRhythmElements[4].durationFlagLines).toHaveLength(3);
  });

  test("standalone flag spacing matches beam level spacing", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.ThirtySecond },
    ]);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    voiceBar.beats[0].beamGroupId = null;
    voiceBar.beats[0].lastInBeamGroup = false;
    trackElement.update();

    const beatElement = getRhythmElements(trackElement)[0];

    expect(beatElement.durationFlagLines).toHaveLength(3);
    expect(
      beatElement.durationFlagLines![0].y - beatElement.durationFlagLines![1].y
    ).toBeCloseTo(TEST_LAYOUT_DIMENSIONS.DURATION_FLAG_HEIGHT * 2);
    expect(
      beatElement.durationFlagLines![1].y - beatElement.durationFlagLines![2].y
    ).toBeCloseTo(TEST_LAYOUT_DIMENSIONS.DURATION_FLAG_HEIGHT * 2);
  });

  test("beamed dotted beats lift dots to account for beam levels", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.ThirtySecond, dots: 1 },
      { baseDuration: NoteDuration.ThirtySecond, dots: 1 },
    ]);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    voiceBar.rebuildTiming();
    trackElement.update();

    const beatElement = getRhythmElements(trackElement)[0];
    const dot = beatElement.dot1CircleBarLocal;

    expect(beatElement.durationFlagLines).toBeUndefined();
    expect(dot).toBeDefined();
    expect(dot!.centerY).toBeLessThan(
      beatElement.voiceBarRhythmContainer.boundingBox.y +
        TEST_LAYOUT_DIMENSIONS.DURATIONS_HEIGHT
    );
  });

  test("standalone dotted beats place dots above the top flag", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.ThirtySecond, dots: 1 },
    ]);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    voiceBar.beats[0].beamGroupId = null;
    voiceBar.beats[0].lastInBeamGroup = false;
    trackElement.update();

    const beatElement = getRhythmElements(trackElement)[0];
    const topFlagY = beatElement.durationFlagLinesBarLocal![2].y;

    expect(beatElement.dot1CircleBarLocal).toBeDefined();
    expect(beatElement.dot1CircleBarLocal!.centerY).toBeCloseTo(
      topFlagY - TEST_LAYOUT_DIMENSIONS.DOT_DIAMETER
    );
  });
});
