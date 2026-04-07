import { TrackElement } from "../../src/notation/controller/element/track-element";
import { TabLayoutDimensions } from "../../src/notation/controller/tab-layout-dimensions";
import {
  BarRepeatStatus,
  DEFAULT_MASTER_BAR,
  NoteDuration,
} from "../../src/notation/model";
import { createScoreGraph } from "../model/helpers";
import { ensureLayoutConfigured } from "./helpers";

describe("TrackElement measure", () => {
  beforeAll(() => {
    ensureLayoutConfigured();
  });

  test("hides repeated time signature on consecutive bars and removes its leading width", () => {
    const { score, track } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);

    const trackElement = new TrackElement(track);
    trackElement.update();

    const barElements =
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].barElements;

    expect(barElements[0].timeSigRect).toBeDefined();
    expect(barElements[1].timeSigRect).toBeUndefined();
    expect(barElements[0].startGap.width).toBe(
      TabLayoutDimensions.TIME_SIG_RECT_WIDTH
    );
    expect(barElements[1].startGap.width).toBe(0);
    expect(barElements[1].beatElements[0].rect.x).toBeCloseTo(0);
  });

  test("shows time signature with expected dimensions and placement when meter changes", () => {
    const { score, track } = createScoreGraph();
    score.appendMasterBar({
      ...DEFAULT_MASTER_BAR,
      beatsCount: 3,
      duration: NoteDuration.Eighth,
    });

    const trackElement = new TrackElement(track);
    trackElement.update();

    const barElements =
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].barElements;

    expect(barElements[0].timeSigRect).toBeDefined();
    expect(barElements[1].timeSigRect).toBeDefined();
    expect(barElements[1].timeSigRect?.width).toBe(
      TabLayoutDimensions.TIME_SIG_RECT_WIDTH
    );
    expect(barElements[1].timeSigRect?.height).toBe(
      TabLayoutDimensions.TIME_SIG_TEXT_SIZE * 2
    );
    expect(barElements[1].timeSigRect?.x).toBe(0);
    expect(barElements[1].beatElements[0].rect.x).toBeCloseTo(
      barElements[1].timeSigRect?.right ?? 0
    );
  });

  test("creates repeat start and repeat end rectangles with correct geometry", () => {
    const { score, track } = createScoreGraph();
    score.masterBars[0].repeatStatus = BarRepeatStatus.Start;

    const appendOutput = score.appendMasterBar(DEFAULT_MASTER_BAR);
    appendOutput.masterBar.repeatStatus = BarRepeatStatus.End;

    const trackElement = new TrackElement(track);
    trackElement.update();

    const barElements =
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].barElements;

    expect(barElements[0].repeatStartRect).toBeDefined();
    expect(barElements[0].repeatEndRect).toBeUndefined();
    expect(barElements[1].repeatStartRect).toBeUndefined();
    expect(barElements[1].repeatEndRect).toBeDefined();

    expect(barElements[0].repeatStartRect?.width).toBe(
      TabLayoutDimensions.REPEAT_SIGN_WIDTH
    );
    expect(barElements[0].repeatStartRect?.height).toBe(
      TabLayoutDimensions.getStaffHeight(track.context.instrument)
    );
    expect(barElements[0].repeatStartRect?.x).toBeCloseTo(
      barElements[0].timeSigRect?.right ?? 0
    );
    expect(barElements[0].beatElements[0].rect.x).toBeCloseTo(
      barElements[0].repeatStartRect?.right ?? 0
    );

    expect(barElements[1].repeatEndRect?.width).toBe(
      TabLayoutDimensions.REPEAT_SIGN_WIDTH
    );
    expect(barElements[1].repeatEndRect?.height).toBe(
      TabLayoutDimensions.getStaffHeight(track.context.instrument)
    );
    expect(barElements[1].repeatEndRect?.right).toBeCloseTo(
      barElements[1].rect.width
    );
    expect(
      barElements[1].beatElements[barElements[1].beatElements.length - 1].rect
        .right
    ).toBeLessThanOrEqual(barElements[1].repeatEndRect?.x ?? 0);
  });
});
