import { BeamSegmentElement } from "../../src/notation/controller/element/bar/beam-segment-element";
import { TrackElement } from "../../src/notation/controller/element/track-element";
import { TabBeatElement } from "../../src/notation/controller/element/beat/tab-beat-element";
import { EditorLayoutDimensions } from "../../src/notation/controller/editor-layout-dimensions";
import { NoteDuration } from "../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";
import { ensureLayoutConfigured } from "./helpers";

function getBarElement(trackElement: TrackElement) {
  return trackElement.trackLineElements[0].staffLineElements[0]
    .styleLinesAsArray[0].barElements[0];
}

describe("BeamSegmentElement", () => {
  beforeAll(() => {
    ensureLayoutConfigured();
  });

  test("creates one long rect per shared beam level and no short tails for equal flag counts", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Sixteenth },
      { baseDuration: NoteDuration.Sixteenth },
    ]);
    bar.rebuildTiming();
    const trackElement = new TrackElement(track);
    trackElement.update();

    const barElement = getBarElement(trackElement);

    expect(barElement.beamSegments).toHaveLength(2);
    expect(barElement.beamSegments[0].longRects).toHaveLength(2);
    expect(barElement.beamSegments[0].shortRects).toHaveLength(0);
    expect(barElement.beamSegments[1].longRects).toHaveLength(0);
    expect(barElement.beamSegments[1].shortRects).toHaveLength(0);
  });

  test("long rect width equals half current beat plus half next beat", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Sixteenth },
      { baseDuration: NoteDuration.ThirtySecond },
    ]);
    bar.rebuildTiming();
    const trackElement = new TrackElement(track);
    trackElement.update();

    const barElement = getBarElement(trackElement);
    const segment = barElement.beamSegments[0];
    const curBeat = segment.curBeatElement;
    const nextBeat = segment.nextBeatElement as TabBeatElement;
    const stemX = curBeat.durationStemLine?.x ?? 0;
    const expectedWidth =
      curBeat.boundingBox.width / 2 + nextBeat.boundingBox.width / 2;

    expect(segment.longRects).toHaveLength(2);
    expect(segment.longRects[0].width).toBeCloseTo(expectedWidth);
    expect(segment.longRects[1].width).toBeCloseTo(expectedWidth);
    expect(segment.longRects[0].x).toBeCloseTo(curBeat.boundingBox.x + stemX);
  });

  test("uses a right-facing short tail when the next beat has fewer flags", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Sixteenth },
      { baseDuration: NoteDuration.Eighth },
    ]);
    bar.rebuildTiming();
    const trackElement = new TrackElement(track);
    trackElement.update();

    const segment = getBarElement(trackElement).beamSegments[0];
    const longX =
      segment.curBeatElement.boundingBox.x +
      (segment.curBeatElement.durationStemLine?.x ?? 0);

    expect(segment.longRects).toHaveLength(1);
    expect(segment.shortRects).toHaveLength(1);
    expect(segment.shortRects[0].x).toBeCloseTo(longX);
  });

  test("terminal segment places remaining short tails to the left", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Sixteenth },
      { baseDuration: NoteDuration.ThirtySecond },
    ]);
    bar.rebuildTiming();
    const trackElement = new TrackElement(track);
    trackElement.update();

    const segment = getBarElement(trackElement).beamSegments[2];
    const longX =
      segment.curBeatElement.boundingBox.x +
      (segment.curBeatElement.durationStemLine?.x ?? 0);

    expect(segment.nextBeatElement).toBeUndefined();
    expect(segment.longRects).toHaveLength(0);
    expect(segment.shortRects).toHaveLength(1);
    expect(segment.shortRects[0].x).toBeCloseTo(longX - 10);
  });

  test("beam levels stack upward by two flag heights per level", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.ThirtySecond },
      { baseDuration: NoteDuration.ThirtySecond },
    ]);
    bar.rebuildTiming();
    const trackElement = new TrackElement(track);
    trackElement.update();

    const segment = getBarElement(trackElement).beamSegments[0];

    expect(segment.longRects).toHaveLength(3);
    expect(segment.longRects[0].height).toBe(
      EditorLayoutDimensions.DURATION_FLAG_HEIGHT
    );
    expect(segment.longRects[1].height).toBe(
      EditorLayoutDimensions.DURATION_FLAG_HEIGHT
    );
    expect(segment.longRects[0].y - segment.longRects[1].y).toBeCloseTo(
      EditorLayoutDimensions.DURATION_FLAG_HEIGHT * 2
    );
    expect(segment.longRects[1].y - segment.longRects[2].y).toBeCloseTo(
      EditorLayoutDimensions.DURATION_FLAG_HEIGHT * 2
    );
  });

  test("throws when constructing a beam segment for a non-beamable duration", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    bar.rebuildTiming();
    const trackElement = new TrackElement(track);
    trackElement.update();
    const barElement = getBarElement(trackElement);
    const beatElement = barElement.beatElements[0] as TabBeatElement;

    expect(() => new BeamSegmentElement(barElement, beatElement)).toThrow(
      "Beam segment for a beat with a non-beamable duration"
    );
  });
});
