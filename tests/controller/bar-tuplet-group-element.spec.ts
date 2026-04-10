import { TrackElement } from "../../src/notation/controller/element/track-element";
import { TabLayoutDimensions } from "../../src/notation/controller/tab-layout-dimensions";
import { NoteDuration } from "../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";
import { ensureLayoutConfigured } from "./helpers";

function getBarElement(trackElement: TrackElement) {
  return trackElement.trackLineElements[0].staffLineElements[0]
    .styleLinesAsArray[0].barElements[0];
}

describe("BarTupletGroupElement", () => {
  beforeAll(() => {
    ensureLayoutConfigured();
  });

  test("complete tuplets use one outer rect and no incomplete rects", () => {
    const { track, bar } = createBarWithBeats([
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
    ]);
    bar.rebuildTiming();
    const trackElement = new TrackElement(track);
    trackElement.update();

    const tupletElement = getBarElement(trackElement).tupletElements[0];
    const expectedWidth = tupletElement.beatElements.reduce(
      (sum, beatElement) => sum + beatElement.rect.width,
      0
    );

    expect(tupletElement.incompleteRects).toBeUndefined();
    expect(tupletElement.rect.width).toBeCloseTo(expectedWidth);
    expect(tupletElement.rect.height).toBe(
      TabLayoutDimensions.TUPLET_RECT_HEIGHT
    );
    expect(tupletElement.completeText).toBe("3");
  });

  test("incomplete tuplets allocate one contiguous rect per beat", () => {
    const { track, bar } = createBarWithBeats([
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
      { baseDuration: NoteDuration.Eighth },
    ]);
    bar.rebuildTiming();
    const trackElement = new TrackElement(track);
    trackElement.update();

    const tupletElement = getBarElement(trackElement).tupletElements[0];
    const incompleteRects = tupletElement.incompleteRects;

    expect(tupletElement.tupletGroup.complete).toBe(false);
    expect(incompleteRects).toHaveLength(2);
    expect(incompleteRects?.[0].x).toBeCloseTo(0);
    expect(incompleteRects?.[0].width).toBeCloseTo(
      tupletElement.beatElements[0].rect.width
    );
    expect(incompleteRects?.[1].x).toBeCloseTo(incompleteRects?.[0].right ?? 0);
    expect(incompleteRects?.[1].width).toBeCloseTo(
      tupletElement.beatElements[1].rect.width
    );
    expect(
      incompleteRects?.every(
        (rect) => rect.height === TabLayoutDimensions.TUPLET_RECT_HEIGHT
      )
    ).toBe(true);
  });

  test("outer rect starts at the first beat and spans the summed beat widths", () => {
    const { track, bar } = createBarWithBeats([
      {
        baseDuration: NoteDuration.Sixteenth,
        tupletSettings: { normalCount: 5, tupletCount: 3 },
      },
      {
        baseDuration: NoteDuration.Sixteenth,
        tupletSettings: { normalCount: 5, tupletCount: 3 },
      },
      {
        baseDuration: NoteDuration.Sixteenth,
        tupletSettings: { normalCount: 5, tupletCount: 3 },
      },
      {
        baseDuration: NoteDuration.Sixteenth,
        tupletSettings: { normalCount: 5, tupletCount: 3 },
      },
      {
        baseDuration: NoteDuration.Sixteenth,
        tupletSettings: { normalCount: 5, tupletCount: 3 },
      },
    ]);
    bar.rebuildTiming();
    const trackElement = new TrackElement(track);
    trackElement.update();

    const barElement = getBarElement(trackElement);
    const tupletElement = barElement.tupletElements[0];
    const sumWidth = tupletElement.beatElements.reduce(
      (sum, beatElement) => sum + beatElement.rect.width,
      0
    );

    expect(tupletElement.rect.x).toBeCloseTo(
      tupletElement.beatElements[0].rect.x
    );
    expect(tupletElement.rect.width).toBeCloseTo(sumWidth);
    expect(tupletElement.rect.y).toBeCloseTo(
      barElement.rect.height - TabLayoutDimensions.TUPLET_RECT_HEIGHT
    );
    expect(tupletElement.completeText).toBe("5:3");
  });

  test("complete path rect excludes half of the first and last beat widths", () => {
    const { track, bar } = createBarWithBeats([
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
    ]);
    bar.rebuildTiming();
    const trackElement = new TrackElement(track);
    trackElement.update();

    const tupletElement = getBarElement(trackElement).tupletElements[0];
    const firstBeatWidth = tupletElement.beatElements[0].rect.width;
    const lastBeatWidth =
      tupletElement.beatElements[tupletElement.beatElements.length - 1].rect
        .width;
    const pathRect = tupletElement.completePathRectGlobal;

    expect(pathRect).toBeDefined();
    expect(pathRect?.width).toBeCloseTo(
      tupletElement.rect.width - firstBeatWidth / 2 - lastBeatWidth / 2
    );
    expect(pathRect?.height).toBe(TabLayoutDimensions.TUPLET_PATH_HEIGHT);
    expect(pathRect?.x).toBeCloseTo(
      tupletElement.globalCoords.x + firstBeatWidth / 2
    );
  });

  test("complete text coords are centered on the tuplet rect with vertical offset", () => {
    const { track, bar } = createBarWithBeats([
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
    ]);
    bar.rebuildTiming();
    const trackElement = new TrackElement(track);
    trackElement.update();

    const tupletElement = getBarElement(trackElement).tupletElements[0];

    expect(tupletElement.comleteTextCoords?.x).toBeCloseTo(
      tupletElement.rect.middleX
    );
    expect(tupletElement.comleteTextCoords?.y).toBeCloseTo(
      tupletElement.rect.middleY
    );
    expect(tupletElement.comleteTextCoordsGlobal?.x).toBeCloseTo(
      tupletElement.globalCoords.x + tupletElement.rect.width / 2
    );
    expect(tupletElement.comleteTextCoordsGlobal?.y).toBeCloseTo(
      tupletElement.globalCoords.y +
        tupletElement.rect.height / 2 +
        TabLayoutDimensions.TUPLET_PATH_HEIGHT * 2
    );
  });

  test("getTupletString throws on invalid index for incomplete tuplets", () => {
    const { track, bar } = createBarWithBeats([
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
      { baseDuration: NoteDuration.Eighth },
    ]);
    bar.rebuildTiming();
    const trackElement = new TrackElement(track);
    trackElement.update();

    const tupletElement = getBarElement(trackElement).tupletElements[0];

    expect(() => tupletElement.getTupletString(-1)).toThrow(
      "Get tuplet string invalid index: -1"
    );
    expect(() => tupletElement.getTupletString(2)).toThrow(
      "Get tuplet string invalid index: 2"
    );
  });
});
