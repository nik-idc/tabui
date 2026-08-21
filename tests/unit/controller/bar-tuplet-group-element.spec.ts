import { BarTupletGroupElement } from "../../../src/notation/controller/element/bar/bar-tuplet-group-element";
import { TrackElement } from "../../../src/notation/controller/element/track-element";
import { NoteDuration } from "../../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";
import { TEST_LAYOUT_DIMENSIONS } from "./helpers";

function getBarElement(trackElement: TrackElement) {
  return trackElement.trackLineElements[0].staffLineContainers[0]
    .styleLinesAsArray[0].barElements[0];
}

function getTupletElement(trackElement: TrackElement): BarTupletGroupElement {
  const tupletElement = getBarElement(trackElement)
    .refreshOwnedNotationNodes()
    .find((element) => element instanceof BarTupletGroupElement);
  if (!(tupletElement instanceof BarTupletGroupElement)) {
    throw Error("Expected rendered tuplet element");
  }

  return tupletElement;
}

describe("BarTupletGroupElement", () => {
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
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    voiceBar.rebuildTiming();
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const tupletElement = getTupletElement(trackElement);
    const expectedWidth = tupletElement.beatElements.reduce(
      (sum: number, beatElement) => sum + beatElement.boundingBox.width,
      0
    );

    expect(tupletElement.incompleteRects).toBeUndefined();
    expect(tupletElement.boundingBox.width).toBeCloseTo(expectedWidth);
    expect(tupletElement.boundingBox.height).toBe(
      TEST_LAYOUT_DIMENSIONS.TUPLET_RECT_HEIGHT
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
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    voiceBar.rebuildTiming();
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const tupletElement = getTupletElement(trackElement);
    const incompleteRects = tupletElement.incompleteRects;

    expect(tupletElement.tupletGroup.complete).toBe(false);
    expect(incompleteRects).toHaveLength(2);
    expect(incompleteRects?.[0].x).toBeCloseTo(0);
    expect(incompleteRects?.[0].width).toBeCloseTo(
      tupletElement.beatElements[0].boundingBox.width
    );
    expect(incompleteRects?.[1].x).toBeCloseTo(incompleteRects?.[0].right ?? 0);
    expect(incompleteRects?.[1].width).toBeCloseTo(
      tupletElement.beatElements[1].boundingBox.width
    );
    expect(
      incompleteRects?.every(
        (rect) => rect.height === TEST_LAYOUT_DIMENSIONS.TUPLET_RECT_HEIGHT
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
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    voiceBar.rebuildTiming();
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const barElement = getBarElement(trackElement);
    const tupletElement = getTupletElement(trackElement);
    const sumWidth = tupletElement.beatElements.reduce(
      (sum: number, beatElement) => sum + beatElement.boundingBox.width,
      0
    );

    expect(tupletElement.boundingBox.x).toBeCloseTo(
      tupletElement.beatElements[0].boundingBox.x
    );
    expect(tupletElement.boundingBox.width).toBeCloseTo(sumWidth);
    expect(tupletElement.boundingBox.y).toBeCloseTo(
      tupletElement.voiceBarRhythmContainer.boundingBox.height -
        TEST_LAYOUT_DIMENSIONS.TUPLET_RECT_HEIGHT
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
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    voiceBar.rebuildTiming();
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const tupletElement = getTupletElement(trackElement);
    const firstBeatWidth = tupletElement.beatElements[0].boundingBox.width;
    const lastBeatWidth =
      tupletElement.beatElements[tupletElement.beatElements.length - 1]
        .boundingBox.width;
    const pathRect = tupletElement.completePathRectGlobal;

    expect(pathRect).toBeDefined();
    expect(pathRect?.width).toBeCloseTo(
      tupletElement.boundingBox.width - firstBeatWidth / 2 - lastBeatWidth / 2
    );
    expect(pathRect?.height).toBe(TEST_LAYOUT_DIMENSIONS.TUPLET_PATH_HEIGHT);
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
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    voiceBar.rebuildTiming();
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const tupletElement = getTupletElement(trackElement);

    expect(tupletElement.comleteTextCoords?.x).toBeCloseTo(
      tupletElement.boundingBox.middleX
    );
    expect(tupletElement.comleteTextCoords?.y).toBeCloseTo(
      tupletElement.boundingBox.middleY
    );
    expect(tupletElement.comleteTextCoordsGlobal?.x).toBeCloseTo(
      tupletElement.globalCoords.x + tupletElement.boundingBox.width / 2
    );
    expect(tupletElement.comleteTextCoordsGlobal?.y).toBeCloseTo(
      tupletElement.globalCoords.y +
        tupletElement.boundingBox.height / 2 +
        TEST_LAYOUT_DIMENSIONS.TUPLET_PATH_HEIGHT * 2
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
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 bar");
    }
    voiceBar.rebuildTiming();
    const trackElement = new TrackElement(track, TEST_LAYOUT_DIMENSIONS);
    trackElement.update();

    const tupletElement = getTupletElement(trackElement);

    expect(() => tupletElement.getTupletString(-1)).toThrow(
      "Get tuplet string invalid index: -1"
    );
    expect(() => tupletElement.getTupletString(2)).toThrow(
      "Get tuplet string invalid index: 2"
    );
  });
});
