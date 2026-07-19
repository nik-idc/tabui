import {
  renderPlayerCursor,
  TrackPlayerSVGAnimator,
} from "../../src/notation/render/svg/player-svg-animator";
import { EditorSVGRenderer } from "../../src/notation/render/svg/editor-svg-renderer";
import { PlayerOverlayRenderer } from "../../src/notation/render/svg/player-overlay-renderer";
import { Rect } from "../../src/shared";
import { TrackController } from "../../src/notation/controller/track-controller";
import { TabBeatElement } from "../../src/notation/controller/element/beat/tab-beat-element";
import { createScoreGraph } from "../model/helpers";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";

describe("renderPlayerCursor", () => {
  test("places tab beat cursor at the beat attack column", () => {
    const { track } = createScoreGraph();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    controller.trackElement.update();
    const beat = track.staves[0].bars[0].getVoiceBar(1)?.beats[0];
    if (beat === undefined) {
      throw Error("Expected beat");
    }
    const beatElement = controller.trackElement.getBeatElement(beat);
    if (!(beatElement instanceof TabBeatElement)) {
      throw Error("Expected tab beat element");
    }
    const attrs = new Map<string, string>();
    const cursorElement = {
      setAttribute: (name: string, value: string) => {
        attrs.set(name, value);
      },
      getAttribute: (name: string) => attrs.get(name) ?? null,
    } as unknown as SVGRectElement;

    renderPlayerCursor(cursorElement, beatElement);

    const cursorWidth = Number(cursorElement.getAttribute("width"));
    const cursorCenterX =
      Number(cursorElement.getAttribute("x")) + cursorWidth / 2;
    expect(cursorCenterX).toBeCloseTo(
      beatElement.barElement.globalCoords.x +
        beatElement.barLocalCoords.x +
        beatElement.attackLocalX
    );
  });

  test("animator renders the snapped cursor for a resolved beat", () => {
    const beatElement = {} as any;
    const renderBeatElement = jest.fn();
    const animator = new TrackPlayerSVGAnimator(
      {} as SVGRectElement,
      renderBeatElement
    );

    animator.snapToBeat(beatElement);

    expect(renderBeatElement).toHaveBeenCalledWith(beatElement);
  });
});

describe("PlayerOverlayRenderer", () => {
  test("follows and materializes a playback line before snapping", () => {
    const beat = {} as any;
    const trackLineElement = {} as any;
    const beatElement = {} as any;
    const ensureTrackLineVisible = jest.fn();
    const snapToBeat = jest.fn();
    const trackElement = {
      getTrackLineElementForBeat: jest.fn(() => trackLineElement),
      getBeatElement: jest.fn(() => {
        expect(ensureTrackLineVisible).toHaveBeenCalledWith(trackLineElement);
        return beatElement;
      }),
    };
    const trackController = {
      getBeatByUUID: jest.fn(() => beat),
      trackElement,
    } as any;
    const overlay = new PlayerOverlayRenderer(
      {} as SVGGElement,
      trackController,
      ensureTrackLineVisible
    );
    (overlay as any)._playerAnimator = { snapToBeat };

    (overlay as any).onBeatChanged({ beatUUID: 42 });

    expect(trackController.getBeatByUUID).toHaveBeenCalledWith(42);
    expect(snapToBeat).toHaveBeenCalledWith(beatElement);
  });

  test("safely ignores a playback beat that cannot be resolved", () => {
    const ensureTrackLineVisible = jest.fn();
    const snapToBeat = jest.fn();
    const overlay = new PlayerOverlayRenderer(
      {} as SVGGElement,
      {
        getBeatByUUID: jest.fn(() => undefined),
        trackElement: {},
      } as any,
      ensureTrackLineVisible
    );
    (overlay as any)._playerAnimator = { snapToBeat };

    expect(() =>
      (overlay as any).onBeatChanged({ beatUUID: 42 })
    ).not.toThrow();
    expect(ensureTrackLineVisible).not.toHaveBeenCalled();
    expect(snapToBeat).not.toHaveBeenCalled();
  });
});

function createPlaybackFollowHarness(
  lineBounds: Rect,
  materialized: boolean = true
) {
  const trackLineElement = { globalBoundingBox: lineBounds } as any;
  const notationViewportDiv = {
    scrollTop: 100,
    clientWidth: 800,
    clientHeight: 400,
  };
  const renderNotation = jest.fn();
  const renderer = Object.create(EditorSVGRenderer.prototype) as any;
  renderer.notationViewportDiv = notationViewportDiv;
  renderer.trackController = {
    trackElement: {
      trackLineElements: [trackLineElement],
      materializedLineIndices: materialized ? new Set([0]) : new Set(),
    },
  };
  renderer._viewportRect = new Rect();
  renderer.renderNotation = renderNotation;

  return {
    renderer,
    trackLineElement,
    notationViewportDiv,
    renderNotation,
  };
}

describe("EditorSVGRenderer track line visibility", () => {
  function followLine(lineBounds: Rect) {
    const harness = createPlaybackFollowHarness(lineBounds);
    harness.renderer.ensureTrackLineVisible(harness.trackLineElement);
    return harness;
  }

  test("does not scroll for a line inside the viewport safe zone", () => {
    const { notationViewportDiv, renderNotation } = followLine(
      new Rect(0, 250, 800, 80)
    );

    expect(notationViewportDiv.scrollTop).toBe(100);
    expect(renderNotation).not.toHaveBeenCalled();
  });

  test("scrolls a lower line to one quarter of the viewport", () => {
    const { notationViewportDiv } = followLine(new Rect(0, 390, 800, 80));

    expect(notationViewportDiv.scrollTop).toBe(290);
  });

  test("scrolls an upper line to one quarter of the viewport", () => {
    const { notationViewportDiv } = followLine(new Rect(0, 120, 800, 80));

    expect(notationViewportDiv.scrollTop).toBe(20);
  });

  test("aligns an oversized line to the viewport top", () => {
    const { notationViewportDiv } = followLine(new Rect(0, 550, 800, 500));

    expect(notationViewportDiv.scrollTop).toBe(550);
  });

  test("materializes an unmaterialized line without requiring a scroll", () => {
    const { renderer, trackLineElement, renderNotation } =
      createPlaybackFollowHarness(new Rect(0, 250, 800, 80), false);

    renderer.ensureTrackLineVisible(trackLineElement);

    expect(renderNotation).toHaveBeenCalledWith({
      renderNotation: true,
      forceNotation: true,
      overlays: { selection: false, player: false },
    });
  });
});
