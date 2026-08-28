import { TrackElement } from "../../../src/notation/controller/element/track-element";
import {
  BarRepeatStatus,
  DEFAULT_MASTER_BAR,
  NoteDuration,
} from "../../../src/notation/model";
import { createScoreGraph } from "../model/helpers";
import { TEST_LAYOUT_DIMENSIONS } from "./helpers";

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
      TEST_LAYOUT_DIMENSIONS.TIME_SIG_RECT_WIDTH +
        TEST_LAYOUT_DIMENSIONS.REPEAT_SIGN_WIDTH * 2
    );
    expect(barElements[0].endGap.width).toBe(
      TEST_LAYOUT_DIMENSIONS.REPEAT_SIGN_WIDTH
    );
    expect(barElements[1].startGap.width).toBe(
      TEST_LAYOUT_DIMENSIONS.REPEAT_SIGN_WIDTH * 2
    );
    expect(barElements[1].endGap.width).toBe(
      TEST_LAYOUT_DIMENSIONS.REPEAT_SIGN_WIDTH
    );
    expect(barElements[1].beatElements[0].barLocalBoundingBox.x).toBeCloseTo(
      TEST_LAYOUT_DIMENSIONS.REPEAT_SIGN_WIDTH +
        TEST_LAYOUT_DIMENSIONS.REPEAT_SIGN_WIDTH +
        TEST_LAYOUT_DIMENSIONS.RHYTHM_ATTACK_PADDING
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
      TEST_LAYOUT_DIMENSIONS.TIME_SIG_RECT_WIDTH
    );
    expect(barElements[1].timeSigRect?.height).toBe(
      TEST_LAYOUT_DIMENSIONS.TIME_SIG_TEXT_SIZE * 2
    );
    expect(barElements[1].timeSigRect?.x).toBe(0);
    expect(barElements[1].beatElements[0].barLocalBoundingBox.x).toBeCloseTo(
      barElements[1].startGap.right +
        TEST_LAYOUT_DIMENSIONS.RHYTHM_ATTACK_PADDING
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
      TEST_LAYOUT_DIMENSIONS.REPEAT_SIGN_WIDTH
    );
    expect(barElements[0].repeatStartRect?.height).toBe(
      TEST_LAYOUT_DIMENSIONS.getStaffHeight(track.context.instrument)
    );
    expect(barElements[0].repeatStartRect?.x).toBeCloseTo(
      barElements[0].timeSigRect?.right ?? 0
    );
    expect(barElements[0].beatElements[0].barLocalBoundingBox.x).toBeCloseTo(
      barElements[0].startGap.right +
        TEST_LAYOUT_DIMENSIONS.RHYTHM_ATTACK_PADDING
    );

    expect(barElements[1].repeatEndRect?.width).toBe(
      TEST_LAYOUT_DIMENSIONS.REPEAT_SIGN_WIDTH
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
  });
});
