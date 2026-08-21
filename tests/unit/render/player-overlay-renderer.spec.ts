import { TrackController } from "../../../src/notation/controller/track-controller";
import { TabBeatElement } from "../../../src/notation/controller/element/beat/tab-beat-element";
import { PlayerOverlayRenderer } from "../../../src/notation/render/svg/player-overlay-renderer";
import { PlaybackState } from "../../../src/player";
import { Beat, NoteDuration } from "../../../src/notation/model";
import { trackEvent, TrackEventType } from "../../../src/shared/events";
import { createScoreGraph } from "../model/helpers";
import { createBarWithBeats } from "../model/helpers";
import { createTestTrackController } from "../controller/helpers";
import { createMultiVoiceTwoStaffScoreFixture } from "../../../demo/data/multi-voice-score";

function cursorElement() {
  const attributes = new Map<string, string>();
  return {
    setAttribute: (name: string, value: string) => attributes.set(name, value),
    getAttribute: (name: string) => attributes.get(name) ?? null,
    remove: jest.fn(),
  } as unknown as SVGRectElement;
}

function internals(overlay: PlayerOverlayRenderer) {
  return overlay as unknown as {
    positionCursorAtBeat: (beat: TabBeatElement) => void;
    renderBeatChange: (args: {
      beatUUID: number;
      nextBeatUUID?: number;
      startTime: number;
      endTime: number;
      playbackRunId: number;
    }) => void;
    updateAnimation: () => void;
    _playerCursorRect: SVGRectElement;
  };
}

function tabBeatElement(x: number, trackLineElement: object): TabBeatElement {
  return Object.defineProperties(Object.create(TabBeatElement.prototype), {
    attackXGlobal: { value: x },
    globalCoords: { value: { y: 20 } },
    boundingBox: { value: { width: 40, height: 20 } },
    owningTrackLineElement: { value: trackLineElement },
  }) as TabBeatElement;
}

function overlay(
  controller: TrackController,
  appendChild = jest.fn(),
  ensureBeatVisible = jest.fn()
) {
  const result = new PlayerOverlayRenderer(
    { appendChild } as unknown as SVGGElement,
    controller,
    ensureBeatVisible
  );
  Object.defineProperty(result, "_playerCursorRect", {
    value: cursorElement(),
  });
  return { result, appendChild, ensureBeatVisible };
}

describe("PlayerOverlayRenderer", () => {
  let originalDocument: Document | undefined;
  let originalRequestAnimationFrame: typeof requestAnimationFrame | undefined;
  let originalCancelAnimationFrame: typeof cancelAnimationFrame | undefined;
  let frame: FrameRequestCallback | undefined;
  let frameId = 0;
  let cancelFrame: jest.Mock;

  beforeEach(() => {
    originalDocument = globalThis.document;
    (globalThis as unknown as { document: Document }).document = {
      createElementNS: () => cursorElement(),
    } as unknown as Document;
    originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
    cancelFrame = jest.fn();
    (
      globalThis as unknown as {
        requestAnimationFrame: typeof requestAnimationFrame;
        cancelAnimationFrame: typeof cancelAnimationFrame;
      }
    ).requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
      frame = callback;
      return ++frameId;
    });
    (
      globalThis as unknown as {
        cancelAnimationFrame: typeof cancelAnimationFrame;
      }
    ).cancelAnimationFrame = cancelFrame;
  });

  afterEach(() => {
    (globalThis as unknown as { document: Document | undefined }).document =
      originalDocument;
    (
      globalThis as unknown as {
        requestAnimationFrame: typeof requestAnimationFrame | undefined;
        cancelAnimationFrame: typeof cancelAnimationFrame | undefined;
      }
    ).requestAnimationFrame = originalRequestAnimationFrame;
    (
      globalThis as unknown as {
        cancelAnimationFrame: typeof cancelAnimationFrame | undefined;
      }
    ).cancelAnimationFrame = originalCancelAnimationFrame;
  });

  test("positions the cursor at beat attack across multiple staff lines", () => {
    const score = createMultiVoiceTwoStaffScoreFixture();
    const controller = createTestTrackController(score.tracks[0]);
    controller.trackElement.update();
    const secondBeat =
      score.tracks[0].staves[1].bars[0].getVoiceBar(1)?.beats[0];
    if (secondBeat === undefined) {
      throw Error("Expected beat");
    }
    const secondBeatElement =
      controller.trackElement.getBeatElement(secondBeat);
    if (!(secondBeatElement instanceof TabBeatElement)) {
      throw Error("Expected tab beat element");
    }
    const { result } = overlay(controller);

    internals(result).positionCursorAtBeat(secondBeatElement);

    const cursor = internals(result)._playerCursorRect;
    expect(
      Number(cursor.getAttribute("x")) +
        Number(cursor.getAttribute("width")) / 2
    ).toBeCloseTo(secondBeatElement.attackXGlobal);
    expect(Number(cursor.getAttribute("y"))).toBeCloseTo(42);
    expect(Number(cursor.getAttribute("height"))).toBeCloseTo(
      secondBeatElement.owningTrackLineElement.outlineLinesGlobal?.left
        .height ?? 0
    );
  });

  test("renders matching playback events only while subscribed", () => {
    const { track, bar } = createScoreGraph();
    const beat = bar.ensureVoiceBar(1).beats[0];
    const controller = {
      track,
      playerUUID: 7,
      playerRunId: 1,
      playbackState: PlaybackState.Playing,
      playerLastStartedBeat: undefined,
      getBeatByUUID: jest.fn(() => beat),
      trackElement: { getTrackLineElementForBeat: jest.fn(() => ({})) },
    } as unknown as TrackController;
    const { result, ensureBeatVisible, appendChild } = overlay(controller);

    result.render();
    trackEvent.emit(TrackEventType.PlayerCurBeatChanged, {
      trackUUID: track.uuid,
      playerUUID: 7,
      beatUUID: beat.uuid,
      startTime: 1,
      endTime: 2,
      playbackRunId: 1,
    });
    result.unrender();
    trackEvent.emit(TrackEventType.PlayerCurBeatChanged, {
      trackUUID: track.uuid,
      playerUUID: 7,
      beatUUID: beat.uuid,
      startTime: 2,
      endTime: 3,
      playbackRunId: 1,
    });

    expect(appendChild).toHaveBeenCalled();
    expect(ensureBeatVisible).toHaveBeenCalledTimes(1);
  });

  test("ignores events from foreign players and stale playback runs", () => {
    const { track, bar } = createScoreGraph();
    const beat = bar.ensureVoiceBar(1).beats[0];
    const controller = {
      track,
      playerUUID: 7,
      playerRunId: 2,
      playbackState: PlaybackState.Playing,
      playerLastStartedBeat: undefined,
      getBeatByUUID: jest.fn((uuid: number) =>
        uuid === beat.uuid ? beat : undefined
      ),
      trackElement: { getTrackLineElementForBeat: jest.fn(() => ({})) },
    } as unknown as TrackController;
    const { result, ensureBeatVisible } = overlay(controller);
    result.render();

    for (const [playerUUID, playbackRunId] of [
      [8, 2],
      [7, 1],
    ]) {
      trackEvent.emit(TrackEventType.PlayerCurBeatChanged, {
        trackUUID: track.uuid,
        playerUUID,
        beatUUID: beat.uuid,
        startTime: 1,
        endTime: 2,
        playbackRunId,
      });
    }

    expect(ensureBeatVisible).not.toHaveBeenCalled();
  });

  test("hides the cursor when playback becomes idle", () => {
    const { track } = createScoreGraph();
    const controller = {
      track,
      playerUUID: 7,
      playerRunId: 1,
      playbackState: PlaybackState.Idle,
      playerLastStartedBeat: undefined,
      getBeatByUUID: jest.fn(),
      trackElement: { getTrackLineElementForBeat: jest.fn() },
    } as unknown as TrackController;
    const { result } = overlay(controller);

    result.render();

    expect(internals(result)._playerCursorRect.getAttribute("width")).toBe("0");
    expect(internals(result)._playerCursorRect.getAttribute("height")).toBe(
      "0"
    );
  });

  test("interpolates within a line and resets at a cross-line boundary", () => {
    const { track, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const [start, next] = beats;
    const firstLine = {};
    const secondLine = {};
    let nextLine: object = firstLine;
    const startElement = tabBeatElement(20, firstLine);
    const nextElement = tabBeatElement(120, firstLine);
    const crossLineElement = tabBeatElement(220, secondLine);
    const controller = {
      track,
      playerUUID: 1,
      playerRunId: 4,
      playerCurrentTime: 1.5,
      playbackState: PlaybackState.Playing,
      playerLastStartedBeat: undefined,
      getBeatByUUID: jest.fn((uuid: number) =>
        uuid === start.uuid ? start : next
      ),
      trackElement: {
        getTrackLineElementForBeat: jest.fn((beat: Beat) =>
          beat === start ? firstLine : nextLine
        ),
      },
    } as unknown as TrackController;
    const visible = jest.fn((beat: Beat) =>
      beat === start ? startElement : nextElement
    );
    const { result } = overlay(controller, jest.fn(), visible);

    internals(result).renderBeatChange({
      beatUUID: start.uuid,
      nextBeatUUID: next.uuid,
      startTime: 1,
      endTime: 2,
      playbackRunId: 4,
    });

    expect(internals(result)._playerCursorRect.getAttribute("x")).toBe("67.5");
    expect(frame).toBeDefined();
    nextLine = secondLine;
    visible.mockImplementation((beat: Beat) =>
      beat === start ? startElement : crossLineElement
    );
    internals(result).renderBeatChange({
      beatUUID: start.uuid,
      nextBeatUUID: next.uuid,
      startTime: 1,
      endTime: 2,
      playbackRunId: 4,
    });

    expect(internals(result)._playerCursorRect.getAttribute("x")).toBe("17.5");
    expect(cancelFrame).toHaveBeenCalled();
  });

  test("ignores unresolved beat events and stale final-beat animation frames", () => {
    const { track, bar } = createScoreGraph();
    const beat = bar.ensureVoiceBar(1).beats[0];
    const line = {};
    const beatElement = tabBeatElement(20, line);
    const controller = {
      track,
      playerUUID: 1,
      playerRunId: 2,
      playerCurrentTime: 1,
      playbackState: PlaybackState.Playing,
      playerLastStartedBeat: undefined,
      getBeatByUUID: jest.fn((uuid: number) =>
        uuid === beat.uuid ? beat : undefined
      ),
      trackElement: { getTrackLineElementForBeat: jest.fn(() => line) },
    } as unknown as TrackController;
    const ensureBeatVisible = jest.fn(() => beatElement);
    const { result } = overlay(controller, jest.fn(), ensureBeatVisible);

    internals(result).renderBeatChange({
      beatUUID: beat.uuid,
      startTime: 1,
      endTime: 2,
      playbackRunId: 2,
    });
    (controller as unknown as { playerRunId: number }).playerRunId = 3;
    frame?.(0);
    internals(result).renderBeatChange({
      beatUUID: -1,
      startTime: 2,
      endTime: 3,
      playbackRunId: 3,
    });
    result.unrender();

    expect(internals(result)._playerCursorRect.getAttribute("x")).toBe("17.5");
    expect(ensureBeatVisible).toHaveBeenCalledTimes(1);
  });
});
