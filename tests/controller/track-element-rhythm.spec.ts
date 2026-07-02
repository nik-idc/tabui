import { TrackElement } from "../../src/notation/controller/element/track-element";
import { EditorLayoutDimensions } from "../../src/notation/controller/editor-layout-dimensions";
import {
  Bar,
  DEFAULT_MASTER_BAR,
  Guitar,
  NoteDuration,
} from "../../src/notation/model";
import {
  createBarWithBeats,
  createBeat,
  createScoreGraph,
} from "../model/helpers";
import { ensureLayoutConfigured } from "./helpers";

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

function getRhythmElements(trackElement: TrackElement): any[] {
  return trackElement.trackLineElements[0].staffLineElements[0].styleLinesAsArray[0].barElements[0]
    .refreshOwnedNotationElements()
    .filter((element) => element.constructor.name === "TabBeatRhythmElement");
}

describe("TrackElement rhythm", () => {
  beforeAll(() => {
    ensureLayoutConfigured();
  });

  test("lays out beat x positions from start gap and beat widths", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Sixteenth },
    ]);
    const trackElement = new TrackElement(track);

    trackElement.update();

    const barElement =
      trackElement.trackLineElements[0].staffLineElements[0]
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
    const trackElement = new TrackElement(track);

    trackElement.update();

    const barElement =
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].barElements[0];
    const firstSelected = barElement.beatElements[0];
    const lastSelected = barElement.beatElements[1];

    const rects = trackElement.getSelectionRects([beats[0], beats[1]]);
    expect(rects).toHaveLength(1);
    expect(rects[0].x).toBeCloseTo(firstSelected.globalCoords.x);
    expect(rects[0].width).toBeCloseTo(
      lastSelected.globalBoundingBox.right - firstSelected.globalCoords.x
    );
  });

  test("applies beat width formulas for dotted and tuplet beats", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth, dots: 1 },
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
    ]);
    const trackElement = new TrackElement(track);

    trackElement.update();

    const beatElements =
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].barElements[0].beatElements;

    expect(beatElements).toHaveLength(3);
    expect(
      beatElements.every((beatElement) => beatElement.boundingBox.width > 0)
    ).toBe(true);
    expect(beatElements[1].boundingBox.width).toBeGreaterThan(
      beatElements[2].boundingBox.width
    );
  });

  test("justifies wrapped non-final lines to full width while keeping beats contiguous", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 12; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const trackElement = new TrackElement(track);
    trackElement.update();

    const firstLineStyle =
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0];
    const lastBarOnFirstLine =
      firstLineStyle.barElements[firstLineStyle.barElements.length - 1];
    expect(lastBarOnFirstLine.boundingBox.right).toBeCloseTo(
      EditorLayoutDimensions.WIDTH
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

    const trackElement = new TrackElement(track);

    expect(() => trackElement.update()).not.toThrow();
    expect(trackElement.trackLineElements.length).toBeGreaterThan(1);

    for (const trackLine of trackElement.trackLineElements) {
      const styleLine = trackLine.staffLineElements[0].styleLinesAsArray[0];
      const lastBar = styleLine.barElements[styleLine.barElements.length - 1];
      expect(lastBar.boundingBox.right).toBeLessThanOrEqual(
        EditorLayoutDimensions.WIDTH
      );
    }
  });

  test("rhythm row height depends on voices present on the rendered line", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 12; i++) {
      score.appendMasterBar(DEFAULT_MASTER_BAR);
    }

    const trackElement = new TrackElement(track);
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

  test("invalid beam group ids do not suppress standalone duration flags", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.ThirtySecond },
      { baseDuration: NoteDuration.ThirtySecond },
      { baseDuration: NoteDuration.ThirtySecond },
      { baseDuration: NoteDuration.ThirtySecond },
      { baseDuration: NoteDuration.ThirtySecond },
    ]);
    const trackElement = new TrackElement(track);

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
    const trackElement = new TrackElement(track);

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
    ).toBeCloseTo(EditorLayoutDimensions.DURATION_FLAG_HEIGHT * 2);
    expect(
      beatElement.durationFlagLines![1].y - beatElement.durationFlagLines![2].y
    ).toBeCloseTo(EditorLayoutDimensions.DURATION_FLAG_HEIGHT * 2);
  });

  test("beamed dotted beats lift dots to account for beam levels", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.ThirtySecond, dots: 1 },
      { baseDuration: NoteDuration.ThirtySecond, dots: 1 },
    ]);
    const trackElement = new TrackElement(track);

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
      beatElement.voiceBarRhythmElement.boundingBox.y +
        EditorLayoutDimensions.DURATIONS_HEIGHT
    );
  });

  test("standalone dotted beats place dots above the top flag", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.ThirtySecond, dots: 1 },
    ]);
    const trackElement = new TrackElement(track);

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
      topFlagY - EditorLayoutDimensions.DOT_DIAMETER
    );
  });
});
