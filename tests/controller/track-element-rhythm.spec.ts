import { TrackElement } from "../../src/notation/controller/element/track-element";
import { getBeatWidth } from "../../src/notation/controller/element/beat/beat-element";
import { EditorLayoutDimensions } from "../../src/notation/controller/editor-layout-dimensions";
import { DEFAULT_MASTER_BAR, NoteDuration } from "../../src/notation/model";
import { createBarWithBeats, createScoreGraph } from "../model/helpers";
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
      expect(beatElements[i].boundingBox.x).toBeCloseTo(expectedX);
      expect(beatElements[i].boundingBox.width).toBeCloseTo(
        getBeatWidth(beats[i])
      );
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
    for (let i = 0; i < beatElements.length; i++) {
      expect(beatElements[i].boundingBox.width).toBeCloseTo(
        getBeatWidth(beats[i])
      );
    }
    expect(beatElements[1].boundingBox.width).toBeGreaterThan(
      beatElements[2].boundingBox.width
    );
  });

  test("justifies wrapped non-final lines to full width while keeping beats contiguous", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 40; i++) {
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
});
