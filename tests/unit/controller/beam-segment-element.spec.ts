import { BeamSegmentElement } from "../../../src/notation/controller/element/bar/beam-segment-element";
import { TrackElement } from "../../../src/notation/controller/element/track-element";
import { NoteDuration } from "../../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";
import { required } from "../required";
import { TEST_LAYOUT_DIMENSIONS } from "./helpers";

function createBeamSegments(durations: NoteDuration[]): BeamSegmentElement[] {
  const { track } = createBarWithBeats(
    durations.map((d) => ({ baseDuration: d }))
  );
  const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
  trackElement.update();

  return trackElement.trackLineElements[0].staffLineContainers[0].styleLinesAsArray[0].barElements[0]
    .refreshOwnedNotationNodes()
    .filter((e): e is BeamSegmentElement => e instanceof BeamSegmentElement);
}

describe("BeamSegmentElement", () => {
  test("equal sixteenth notes share two beams without extra tails", () => {
    const segments = createBeamSegments([
      NoteDuration.Sixteenth,
      NoteDuration.Sixteenth,
    ]);

    expect(segments).toHaveLength(2);
    expect(segments[0].longRects).toHaveLength(2);
    expect(segments[0].shortRects).toHaveLength(0);
    expect(segments[1].longRects).toHaveLength(0);
    expect(segments[1].shortRects).toHaveLength(0);
  });

  test("shared beams connect the two stem attacks after an earlier beat", () => {
    const segment = createBeamSegments([
      NoteDuration.Quarter,
      NoteDuration.Sixteenth,
      NoteDuration.ThirtySecond,
    ])[0];
    const nextBeat = required(segment.nextBeatElement);

    // Both the rectangles and attacks below use bar-local coordinates.
    expect(segment.longRectsBarLocal).toHaveLength(2);
    for (const rect of segment.longRectsBarLocal) {
      expect(rect.width).toBeGreaterThan(0);
      expect(rect.x).toBeCloseTo(segment.curBeatElement.attackXBarLocal);
      expect(rect.right).toBeCloseTo(nextBeat.attackXBarLocal);
    }
  });

  test("a sixteenth before an eighth has a right-facing secondary tail", () => {
    const segment = createBeamSegments([
      NoteDuration.Sixteenth,
      NoteDuration.Eighth,
    ])[0];

    expect(segment.longRectsBarLocal).toHaveLength(1);
    expect(segment.shortRectsBarLocal).toHaveLength(1);
    const tail = segment.shortRectsBarLocal[0];
    expect(tail.x).toBeCloseTo(segment.curBeatElement.attackXBarLocal);
    expect(tail.width).toBe(10);
    expect(tail.y).toBeLessThan(segment.longRectsBarLocal[0].y);
  });

  test("the last thirty-second has a left-facing tail only for its unshared level", () => {
    const segment = createBeamSegments([
      NoteDuration.Eighth,
      NoteDuration.Sixteenth,
      NoteDuration.ThirtySecond,
    ])[2];

    expect(segment.nextBeatElement).toBeUndefined();
    expect(segment.longRectsBarLocal).toHaveLength(0);
    expect(segment.shortRectsBarLocal).toHaveLength(1);
    const tail = segment.shortRectsBarLocal[0];
    expect(tail.width).toBe(10);
    expect(tail.right).toBeCloseTo(segment.curBeatElement.attackXBarLocal);
  });

  test("three beam levels have equal thickness and one thickness of clear space", () => {
    const segment = createBeamSegments([
      NoteDuration.ThirtySecond,
      NoteDuration.ThirtySecond,
    ])[0];
    const rects = segment.longRects;
    const thickness = TEST_LAYOUT_DIMENSIONS.durationFlagHeight;

    expect(rects).toHaveLength(3);
    expect(rects.map((r) => r.height)).toEqual([
      thickness,
      thickness,
      thickness,
    ]);
    expect(rects[0].y - rects[1].bottom).toBeCloseTo(thickness);
    expect(rects[1].y - rects[2].bottom).toBeCloseTo(thickness);
  });
});
