import { TrackElement } from "../../src/notation/controller/element/track-element";
import { getBeatWidth } from "../../src/notation/controller/element/beat/beat-element";
import { NoteDuration } from "../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";
import { ensureLayoutConfigured } from "./helpers";

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

    let expectedX = barElement.startGap.right;
    for (let i = 0; i < beatElements.length; i++) {
      expect(beatElements[i].rect.x).toBeCloseTo(expectedX);
      expect(beatElements[i].rect.width).toBeCloseTo(getBeatWidth(beats[i]));
      expectedX += beatElements[i].rect.width;
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
      lastSelected.globalRect.right - firstSelected.globalCoords.x
    );
  });
});
