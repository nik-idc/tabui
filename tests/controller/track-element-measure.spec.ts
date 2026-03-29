import { TrackElement } from "../../src/notation/controller/element/track-element";
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

  test("hides repeated time signature on consecutive bars", () => {
    const { score, track } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);

    const trackElement = new TrackElement(track);
    trackElement.update();

    const barElements =
      trackElement.trackLineElements[0].staffLineElements[0]
        .styleLinesAsArray[0].barElements;

    expect(barElements[0].timeSigRect).toBeDefined();
    expect(barElements[1].timeSigRect).toBeUndefined();
  });

  test("shows time signature when meter changes", () => {
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
  });

  test("creates repeat start and repeat end rectangles", () => {
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
  });
});
