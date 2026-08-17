import { EditorSVGRenderer } from "../../src/notation/render/svg/editor-svg-renderer";
import { PlayerOverlayRenderer } from "../../src/notation/render/svg/player-overlay-renderer";
import { Rect } from "../../src/shared";
import { TrackController } from "../../src/notation/controller/track-controller";
import { TabBeatElement } from "../../src/notation/controller/element/beat/tab-beat-element";
import { createScoreGraph } from "../model/helpers";
import { createTestTrackController } from "../controller/helpers";
import { createMultiVoiceTwoStaffScoreFixture } from "../../demo/data/multi-voice-score";

function createCursorElement() {
  const attrs = new Map<string, string>();
  return {
    setAttribute: (name: string, value: string) => attrs.set(name, value),
    getAttribute: (name: string) => attrs.get(name) ?? null,
  } as unknown as SVGRectElement;
}

let originalDocument: Document | undefined;

beforeEach(() => {
  originalDocument = (globalThis as any).document;
  (globalThis as any).document = {
    createElementNS: () => createCursorElement(),
  };
});

afterEach(() => {
  (globalThis as any).document = originalDocument;
});

function createTabBeatElement(x: number, trackLineElement: object) {
  const beatElement = Object.create(TabBeatElement.prototype) as any;
  Object.defineProperties(beatElement, {
    barElement: { value: { globalCoords: { x: 0 } } },
    barLocalCoords: { value: { x } },
    attackLocalX: { value: 0 },
    globalCoords: { value: { x, y: 20 } },
    boundingBox: { value: { width: 40, height: 60 } },
    owningTrackLineElement: { value: trackLineElement },
  });
  return beatElement;
}

function cursorCenterX(cursorElement: SVGRectElement): number {
  return (
    Number(cursorElement.getAttribute("x")) +
    Number(cursorElement.getAttribute("width")) / 2
  );
}

function createAnimationOverlay(
  cursorElement: SVGRectElement,
  getCurrentTime: () => number,
  getCurrentPlaybackRunId: () => number
) {
  const trackController = {} as any;
  Object.defineProperties(trackController, {
    playerCurrentTime: { get: getCurrentTime },
    playerRunId: { get: getCurrentPlaybackRunId },
  });
  const overlay = new PlayerOverlayRenderer(
    {} as SVGGElement,
    trackController,
    () => undefined
  );
  (overlay as any)._playerCursorRect = cursorElement;
  return overlay;
}

describe("PlayerOverlayRenderer cursor geometry", () => {
  test("places tab beat cursor at the beat attack column", () => {
    const { track } = createScoreGraph();
    const controller = createTestTrackController(track);
    controller.trackElement.update();
    const beat = track.staves[0].bars[0].getVoiceBar(1)?.beats[0];
    if (beat === undefined) {
      throw Error("Expected beat");
    }
    const beatElement = controller.trackElement.getBeatElement(beat);
    if (!(beatElement instanceof TabBeatElement)) {
      throw Error("Expected tab beat element");
    }
    const cursorElement = createCursorElement();
    const overlay = new PlayerOverlayRenderer(
      {} as SVGGElement,
      controller,
      () => undefined
    );
    (overlay as any)._playerCursorRect = cursorElement;

    (overlay as any).positionCursorAtBeat(beatElement);

    const cursorWidth = Number(cursorElement.getAttribute("width"));
    const cursorCenterX =
      Number(cursorElement.getAttribute("x")) + cursorWidth / 2;
    expect(cursorCenterX).toBeCloseTo(
      beatElement.barElement.globalCoords.x +
        beatElement.barLocalCoords.x +
        beatElement.attackLocalX
    );
  });

  test("uses the corrected multi-staff outline extent", () => {
    const score = createMultiVoiceTwoStaffScoreFixture();
    const controller = createTestTrackController(score.tracks[0]);
    controller.trackElement.update();
    const beat = score.tracks[0].staves[0].bars[0].getVoiceBar(1)?.beats[0];
    if (beat === undefined) {
      throw Error("Expected fixture beat");
    }
    const beatElement = controller.trackElement.getBeatElement(beat);
    if (!(beatElement instanceof TabBeatElement)) {
      throw Error("Expected tab beat element");
    }
    const trackLine = beatElement.owningTrackLineElement;
    const firstStyleLine = trackLine.staffLineElements[0].styleLinesAsArray[0];
    const finalStaffLine =
      trackLine.staffLineElements[trackLine.staffLineElements.length - 1];
    const finalStyleLine = finalStaffLine.styleLinesAsArray[0];
    const firstRenderedStaffLine =
      firstStyleLine.barElements[0].staffLinesGlobal[0];
    const lastBar =
      finalStyleLine.barElements[finalStyleLine.barElements.length - 1];
    const lastRenderedStaffLine =
      lastBar.staffLinesGlobal[lastBar.staffLinesGlobal.length - 1];
    const cursorElement = createCursorElement();
    const overlay = new PlayerOverlayRenderer(
      {} as SVGGElement,
      controller,
      () => undefined
    );
    (overlay as any)._playerCursorRect = cursorElement;

    (overlay as any).positionCursorAtBeat(beatElement);

    expect(Number(cursorElement.getAttribute("y"))).toBeCloseTo(
      firstRenderedStaffLine.y
    );
    expect(Number(cursorElement.getAttribute("height"))).toBeCloseTo(
      lastRenderedStaffLine.y - firstRenderedStaffLine.y
    );
  });
});

describe("PlayerOverlayRenderer animation", () => {
  let originalRequestAnimationFrame: typeof requestAnimationFrame;
  let originalCancelAnimationFrame: typeof cancelAnimationFrame;

  beforeEach(() => {
    originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  test("interpolates between same-line beat attacks using audio time", () => {
    const trackLineElement = {};
    const startBeatElement = createTabBeatElement(100, trackLineElement);
    const endBeatElement = createTabBeatElement(300, trackLineElement);
    const cursorElement = createCursorElement();
    let currentTime = 10;
    let frameCallback: FrameRequestCallback | undefined;
    const requestFrame = jest.fn((callback: FrameRequestCallback) => {
      frameCallback = callback;
      return 1;
    });
    globalThis.requestAnimationFrame = requestFrame;
    globalThis.cancelAnimationFrame = jest.fn();
    const overlay = createAnimationOverlay(
      cursorElement,
      () => currentTime,
      () => 1
    );

    (overlay as any).animateBetweenBeats(
      startBeatElement,
      endBeatElement,
      10,
      12,
      1
    );
    expect(cursorCenterX(cursorElement)).toBeCloseTo(100);

    currentTime = 11;
    frameCallback?.(0);
    expect(cursorCenterX(cursorElement)).toBeCloseTo(200);

    currentTime = 12;
    frameCallback?.(0);
    expect(cursorCenterX(cursorElement)).toBeCloseTo(300);
  });

  test("preserves snapping for cross-line transitions", () => {
    const startBeatElement = createTabBeatElement(100, {});
    const endBeatElement = createTabBeatElement(300, {});
    const cursorElement = createCursorElement();
    const requestFrame = jest.fn();
    globalThis.requestAnimationFrame = requestFrame;
    globalThis.cancelAnimationFrame = jest.fn();
    const overlay = createAnimationOverlay(
      cursorElement,
      () => 10,
      () => 1
    );

    (overlay as any).animateBetweenBeats(
      startBeatElement,
      endBeatElement,
      10,
      12,
      1
    );

    expect(cursorCenterX(cursorElement)).toBeCloseTo(100);
    expect(requestFrame).not.toHaveBeenCalled();
  });

  test("stops stale playback-run animation", () => {
    const trackLineElement = {};
    const startBeatElement = createTabBeatElement(100, trackLineElement);
    const endBeatElement = createTabBeatElement(300, trackLineElement);
    const cursorElement = createCursorElement();
    let frameCallback: FrameRequestCallback | undefined;
    let currentPlaybackRunId = 1;
    const requestFrame = jest.fn((callback: FrameRequestCallback) => {
      frameCallback = callback;
      return 1;
    });
    globalThis.requestAnimationFrame = requestFrame;
    globalThis.cancelAnimationFrame = jest.fn();
    const overlay = createAnimationOverlay(
      cursorElement,
      () => 11,
      () => currentPlaybackRunId
    );

    (overlay as any).animateBetweenBeats(
      startBeatElement,
      endBeatElement,
      10,
      12,
      1
    );
    currentPlaybackRunId = 2;
    frameCallback?.(0);

    expect(requestFrame).toHaveBeenCalledTimes(1);
  });

  test("snapping cancels an active animation frame", () => {
    const trackLineElement = {};
    const startBeatElement = createTabBeatElement(100, trackLineElement);
    const endBeatElement = createTabBeatElement(300, trackLineElement);
    const cancelFrame = jest.fn();
    globalThis.requestAnimationFrame = () => 7;
    globalThis.cancelAnimationFrame = cancelFrame;
    const overlay = createAnimationOverlay(
      createCursorElement(),
      () => 10,
      () => 1
    );

    (overlay as any).animateBetweenBeats(
      startBeatElement,
      endBeatElement,
      10,
      12,
      1
    );
    (overlay as any).snapToBeat(startBeatElement);

    expect(cancelFrame).toHaveBeenCalledWith(7);
  });

  test("moves through a final beat without a successor", () => {
    const beatElement = createTabBeatElement(100, {});
    const cursorElement = createCursorElement();
    globalThis.requestAnimationFrame = () => 1;
    globalThis.cancelAnimationFrame = jest.fn();
    const overlay = createAnimationOverlay(
      cursorElement,
      () => 12,
      () => 1
    );

    (overlay as any).animateThroughBeat(beatElement, 10, 12, 1);
    expect(cursorCenterX(cursorElement)).toBeCloseTo(140);
  });
});

describe("PlayerOverlayRenderer", () => {
  test("follows and materializes a playback line before animating", () => {
    const beat = {} as any;
    const nextBeat = {} as any;
    const trackLineElement = {} as any;
    const beatElement = {} as any;
    const nextBeatElement = {} as any;
    const ensureBeatVisible = jest.fn((resolvedBeat: unknown) =>
      resolvedBeat === beat ? beatElement : nextBeatElement
    );
    const animateBetweenBeats = jest.fn();
    const trackElement = {
      getTrackLineElementForBeat: jest.fn(() => trackLineElement),
    };
    const trackController = {
      track: { uuid: 1 },
      playerUUID: 7,
      playerRunId: 1,
      getBeatByUUID: jest.fn((uuid: number) => (uuid === 42 ? beat : nextBeat)),
      trackElement,
    } as any;
    const overlay = new PlayerOverlayRenderer(
      {} as SVGGElement,
      trackController,
      ensureBeatVisible
    );
    (overlay as any).animateBetweenBeats = animateBetweenBeats;

    (overlay as any).onBeatChanged({
      trackUUID: 1,
      playerUUID: 7,
      beatUUID: 42,
      nextBeatUUID: 43,
      startTime: 10,
      endTime: 11,
      playbackRunId: 1,
    });

    expect(trackController.getBeatByUUID).toHaveBeenCalledWith(42);
    expect(ensureBeatVisible).toHaveBeenCalledWith(beat, true);
    expect(ensureBeatVisible).toHaveBeenCalledWith(nextBeat, false);
    expect(animateBetweenBeats).toHaveBeenCalledWith(
      beatElement,
      nextBeatElement,
      10,
      11,
      1
    );
  });

  test("safely ignores a playback beat that cannot be resolved", () => {
    const ensureBeatVisible = jest.fn();
    const snapToBeat = jest.fn();
    const overlay = new PlayerOverlayRenderer(
      {} as SVGGElement,
      {
        track: { uuid: 1 },
        playerUUID: 7,
        playerRunId: 1,
        getBeatByUUID: jest.fn(() => undefined),
        trackElement: {},
      } as any,
      ensureBeatVisible
    );
    (overlay as any).snapToBeat = snapToBeat;

    expect(() =>
      (overlay as any).onBeatChanged({
        trackUUID: 1,
        playerUUID: 7,
        beatUUID: 42,
        startTime: 10,
        playbackRunId: 1,
      })
    ).not.toThrow();
    expect(ensureBeatVisible).not.toHaveBeenCalled();
    expect(snapToBeat).not.toHaveBeenCalled();
  });

  test("ignores beat changes emitted by another player", () => {
    const getBeatByUUID = jest.fn();
    const overlay = new PlayerOverlayRenderer(
      {} as SVGGElement,
      {
        track: { uuid: 1 },
        playerUUID: 7,
        playerRunId: 1,
        getBeatByUUID,
      } as any,
      () => undefined
    );

    (overlay as any).onBeatChanged({
      trackUUID: 1,
      playerUUID: 8,
      beatUUID: 42,
      startTime: 10,
      endTime: 11,
      playbackRunId: 1,
    });

    expect(getBeatByUUID).not.toHaveBeenCalled();
  });
});

describe("EditorSVGRenderer viewport ranges", () => {
  test("uses a bounded nearest-line range outside the current viewport", () => {
    const renderer = Object.create(EditorSVGRenderer.prototype) as any;
    renderer._viewportRect = new Rect(0, 10_000, 800, 400);
    renderer.trackController = {
      trackElement: {
        trackLineElements: Array.from({ length: 20 }, (_, index) => ({
          globalBoundingBox: new Rect(0, index * 100, 800, 80),
        })),
      },
    };

    expect(renderer.getLinesInViewport()).toEqual({ start: 17, end: 19 });
  });
});
