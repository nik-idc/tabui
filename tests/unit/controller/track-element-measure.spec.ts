import { TrackElement } from "../../../src/notation/controller/element/track-element";
import { TabBeatElement } from "../../../src/notation/controller/element/beat/tab-beat-element";
import {
  DEFAULT_MASTER_BAR,
  GuitarNote,
  NoteDuration,
} from "../../../src/notation/model";
import { createBarWithBeats, createScoreGraph } from "../model/helpers";
import { TEST_LAYOUT_DIMENSIONS } from "./helpers";
import { required } from "../required";

describe("TrackElement measure", () => {
  test("hides repeated time signature on consecutive bars and removes its leading width", () => {
    const { score, track } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const barElements =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements;

    expect(barElements[0].timeSigRect).toBeDefined();
    expect(barElements[1].timeSigRect).toBeUndefined();
    expect(barElements[0].startGap.width).toBe(
      TEST_LAYOUT_DIMENSIONS.timeSigRectWidth +
        TEST_LAYOUT_DIMENSIONS.repeatSignWidth * 2
    );
    expect(barElements[0].endGap.width).toBe(
      TEST_LAYOUT_DIMENSIONS.repeatSignWidth
    );
    expect(barElements[1].startGap.width).toBe(
      TEST_LAYOUT_DIMENSIONS.repeatSignWidth * 2
    );
    expect(barElements[1].endGap.width).toBe(
      TEST_LAYOUT_DIMENSIONS.repeatSignWidth
    );
    expect(barElements[1].beatElements[0].barLocalBoundingBox.x).toBeCloseTo(
      TEST_LAYOUT_DIMENSIONS.repeatSignWidth +
        TEST_LAYOUT_DIMENSIONS.repeatSignWidth +
        TEST_LAYOUT_DIMENSIONS.rhythmAttackPadding
    );
  });

  test("shows time signature with expected dimensions and placement when meter changes", () => {
    const { score, track } = createScoreGraph();
    score.appendMasterBar({
      ...DEFAULT_MASTER_BAR,
      beatsCount: 3,
      duration: NoteDuration.Eighth,
    });

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const barElements =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements;

    expect(barElements[0].timeSigRect).toBeDefined();
    expect(barElements[1].timeSigRect).toBeDefined();
    expect(barElements[1].timeSigRect?.width).toBe(
      TEST_LAYOUT_DIMENSIONS.timeSigRectWidth
    );
    expect(barElements[1].timeSigRect?.height).toBe(
      TEST_LAYOUT_DIMENSIONS.timeSigTextSize * 2
    );
    expect(barElements[1].timeSigRect?.x).toBe(0);
    expect(barElements[1].beatElements[0].barLocalBoundingBox.x).toBeCloseTo(
      TEST_LAYOUT_DIMENSIONS.timeSigRectWidth +
        TEST_LAYOUT_DIMENSIONS.repeatSignWidth * 2 +
        TEST_LAYOUT_DIMENSIONS.rhythmAttackPadding
    );
  });

  test("creates repeat start and repeat end rectangles with correct geometry", () => {
    const { score, track } = createScoreGraph();
    score.masterBars[0].isRepeatStart = true;

    const appendOutput = score.appendMasterBar(DEFAULT_MASTER_BAR);
    appendOutput.masterBar.isRepeatEnd = true;

    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const barElements =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements;

    expect(barElements[0].repeatStartRect).toBeDefined();
    expect(barElements[0].repeatEndRect).toBeUndefined();
    expect(barElements[1].repeatStartRect).toBeUndefined();
    expect(barElements[1].repeatEndRect).toBeDefined();

    expect(barElements[0].repeatStartRect?.width).toBe(
      TEST_LAYOUT_DIMENSIONS.repeatSignWidth
    );
    expect(barElements[0].repeatStartRect?.height).toBe(
      TEST_LAYOUT_DIMENSIONS.getStaffHeight(track.context.instrument)
    );
    expect(barElements[0].repeatStartRect?.x).toBeCloseTo(
      barElements[0].timeSigRect?.right ?? 0
    );
    expect(barElements[0].beatElements[0].barLocalBoundingBox.x).toBeCloseTo(
      barElements[0].startGap.right + TEST_LAYOUT_DIMENSIONS.rhythmAttackPadding
    );

    expect(barElements[1].repeatEndRect?.width).toBe(
      TEST_LAYOUT_DIMENSIONS.repeatSignWidth
    );
    expect(barElements[1].repeatEndRect?.height).toBe(
      TEST_LAYOUT_DIMENSIONS.getStaffHeight(track.context.instrument)
    );
    expect(barElements[1].repeatEndRect?.right).toBeCloseTo(
      barElements[1].boundingBox.width
    );
    expect(
      barElements[1].beatElements[barElements[1].beatElements.length - 1]
        .barLocalBoundingBox.right
    ).toBeLessThanOrEqual(barElements[1].repeatEndRect?.x ?? 0);
  });

  test("repeat status does not change bar width", () => {
    const { score, track } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const beforeWidths =
      trackElement.trackLineElements[0].staffLineContainers[0].styleLinesAsArray[0].barElements.map(
        (barElement) => barElement.boundingBox.width
      );
    score.masterBars[0].isRepeatStart = true;
    score.masterBars[1].isRepeatEnd = true;
    trackElement.update();

    const afterWidths =
      trackElement.trackLineElements[0].staffLineContainers[0].styleLinesAsArray[0].barElements.map(
        (barElement) => barElement.boundingBox.width
      );
    expect(afterWidths).toEqual(beforeWidths);
    const updatedBars =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements;
    expect(updatedBars[0].repeatStartRect).toBeDefined();
    expect(updatedBars[1].repeatEndRect).toBeDefined();
  });

  test("marks bars invalid for unmatched repeat boundaries", () => {
    const oneQuarterBar = {
      ...DEFAULT_MASTER_BAR,
      beatsCount: 1,
    };
    const { score, track } = createScoreGraph(oneQuarterBar);
    score.appendMasterBar(oneQuarterBar);
    score.masterBars[0].isRepeatStart = true;
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    trackElement.update();

    const barElements =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements;
    expect(barElements[0].barValidState).toBe(false);
    expect(barElements[1].barValidState).toBe(true);

    score.masterBars[1].isRepeatEnd = true;
    trackElement.update();

    const updatedBarElements =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements;
    expect(updatedBarElements[0].barValidState).toBe(true);
    expect(updatedBarElements[1].barValidState).toBe(true);
  });

  test("accepts repeat start and end on the same bar", () => {
    const oneQuarterBar = {
      ...DEFAULT_MASTER_BAR,
      beatsCount: 1,
      isRepeatStart: true,
      isRepeatEnd: true,
      repeatCount: 2,
    };
    const { track } = createScoreGraph(oneQuarterBar);
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);

    trackElement.update();

    const barElement =
      trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements[0];
    expect(barElement.barValidState).toBe(true);
  });
});

describe("Tab beat technique slot", () => {
  function layoutTabBeats(
    beatConfigs: Array<{ baseDuration: NoteDuration; dots?: 0 | 1 | 2 }>,
    fret: number
  ): TabBeatElement[] {
    const { track, beats } = createBarWithBeats(beatConfigs);
    for (const beat of beats) {
      (required(beat.notes)[0] as GuitarNote).setFret(fret);
    }
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    return beats.map((b) => {
      const element = trackElement.getBeatElement(b);
      if (!(element instanceof TabBeatElement)) {
        throw Error("Expected a tab beat element");
      }
      return element;
    });
  }

  test("keeps the slot free of two-digit fret text", () => {
    const beatElements = layoutTabBeats(
      [
        { baseDuration: NoteDuration.Sixteenth },
        { baseDuration: NoteDuration.Sixteenth },
        { baseDuration: NoteDuration.Half },
      ],
      12
    );

    for (const beatElement of beatElements) {
      const slotRight =
        beatElement.globalCoords.x + TEST_LAYOUT_DIMENSIONS.beatTechniqueWidth;
      const textRect = beatElement.noteElements[0].textRectGlobal;
      expect(textRect.x).toBeGreaterThanOrEqual(slotRight);
    }
  });

  test("keeps the last fret text inside the content when a bar ends with a 64th", () => {
    const beatElements = layoutTabBeats(
      [
        { baseDuration: NoteDuration.Half },
        { baseDuration: NoteDuration.Quarter, dots: 1 },
        { baseDuration: NoteDuration.SixtyFourth },
      ],
      12
    );
    const last = required(beatElements.at(-1));
    const barElement = last.barElement;
    const contentRightX =
      barElement.globalCoords.x +
      last.voiceBarContainer.boundingBox.x +
      barElement.voiceContentWidth;

    expect(last.boundingBox.width).toBeGreaterThanOrEqual(
      TEST_LAYOUT_DIMENSIONS.minRhythmColumnGap
    );
    expect(last.noteElements[0].textRectGlobal.right).toBeLessThanOrEqual(
      contentRightX
    );
  });
});
