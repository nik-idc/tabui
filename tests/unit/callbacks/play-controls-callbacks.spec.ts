import { PlayControlsDefaultCallbacks } from "../../../src/ui/top-controls/play-controls/play-controls-callbacks";
import { PlayControlsTemplateRenderer } from "../../../src/ui/top-controls/play-controls/play-controls-template-renderer";
import { dispatchClick, makeButton } from "./helpers";
import { TrackController } from "../../../src/notation/controller/track-controller";
import { DEFAULT_MASTER_BAR } from "../../../src/notation/model";
import { createScoreGraph } from "../model/helpers";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";

describe("PlayControlsDefaultCallbacks", () => {
  test("play click toggles playback based on controller state", () => {
    const startPlayer = jest.fn();
    const stopPlayer = jest.fn();
    const renderFunc = jest.fn();
    let isPlaying = false;

    const callbacks = new PlayControlsDefaultCallbacks(
      {
        template: {
          firstButton: {},
          prevButton: {},
          playButton: {},
          nextButton: {},
          lastButton: {},
          loopButton: {},
          rangeButton: {},
        },
      } as any,
      {
        trackController: {
          get isPlaybackActive() {
            return isPlaying;
          },
          startPlayer,
          stopPlayer,
          toggleLoop: jest.fn(),
        },
      } as any,
      renderFunc,
      jest.fn(),
      jest.fn()
    );

    callbacks.onPlayClicked();

    expect(startPlayer).toHaveBeenCalledTimes(1);
    expect(stopPlayer).not.toHaveBeenCalled();
    expect(renderFunc).toHaveBeenCalledTimes(1);

    isPlaying = true;
    callbacks.onPlayClicked();

    expect(stopPlayer).toHaveBeenCalledTimes(1);
    expect(startPlayer).toHaveBeenCalledTimes(1);
    expect(renderFunc).toHaveBeenCalledTimes(2);
  });

  test("loop click toggles loop and repeated bind does not double fire", () => {
    const toggleLoop = jest.fn();
    const callbacks = new PlayControlsDefaultCallbacks(
      {
        template: {
          firstButton: makeButton(),
          prevButton: makeButton(),
          playButton: makeButton(),
          nextButton: makeButton(),
          lastButton: makeButton(),
          loopButton: makeButton(),
          rangeButton: makeButton(),
        },
      } as any,
      {
        trackController: {
          isPlaying: false,
          startPlayer: jest.fn(),
          stopPlayer: jest.fn(),
          toggleLoop,
        },
      } as any,
      jest.fn(),
      jest.fn(),
      jest.fn()
    );

    callbacks.bind();
    callbacks.bind();
    dispatchClick((callbacks as any)._playComponent.template.loopButton);
    expect(toggleLoop).toHaveBeenCalledTimes(1);

    const loopCallsBeforeUnbind = toggleLoop.mock.calls.length;
    callbacks.unbind();
    dispatchClick((callbacks as any)._playComponent.template.loopButton);
    expect(toggleLoop).toHaveBeenCalledTimes(loopCallsBeforeUnbind);
  });

  test("bar traversal buttons select the requested bar", () => {
    const ensureSelectedNoteVisible = () => {};
    const { score, track } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const trackController = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const bars = track.staves[0].bars;
    const renderFunc = jest.fn();
    const callbacks = new PlayControlsDefaultCallbacks(
      {
        template: {
          firstButton: {},
          prevButton: {},
          playButton: {},
          nextButton: {},
          lastButton: {},
          loopButton: {},
          rangeButton: {},
        },
      } as any,
      { trackController, ensureSelectedNoteVisible } as any,
      renderFunc,
      jest.fn(),
      jest.fn()
    );

    callbacks.onNextClicked();
    expect(trackController.selectionCursor?.bar).toBe(bars[1]);
    callbacks.onLastClicked();
    expect(trackController.selectionCursor?.bar).toBe(bars[2]);
    callbacks.onPrevClicked();
    expect(trackController.selectionCursor?.bar).toBe(bars[1]);
    callbacks.onFirstClicked();
    expect(trackController.selectionCursor?.bar).toBe(bars[0]);

    expect(renderFunc).toHaveBeenCalledTimes(4);
  });

  test("range button anchors or clears the current range", () => {
    const { track } = createScoreGraph();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const anchor = controller.selectionCursor?.beat;
    const renderFunc = jest.fn();
    const callbacks = new PlayControlsDefaultCallbacks(
      {
        template: {
          firstButton: {},
          prevButton: {},
          playButton: {},
          nextButton: {},
          lastButton: {},
          loopButton: {},
          rangeButton: {},
        },
      } as any,
      { trackController: controller } as any,
      renderFunc,
      jest.fn(),
      jest.fn()
    );

    callbacks.onRangeClicked();
    expect(controller.hasSelectionAnchor).toBe(true);
    expect(controller.selectionBeats).toEqual([anchor]);
    callbacks.onRangeClicked();

    expect(controller.hasSelectionAnchor).toBe(false);
    expect(controller.selectionBeats).toEqual([]);
    expect(controller.selectionCursor?.beat).toBe(anchor);
    expect(renderFunc).toHaveBeenCalledTimes(2);
  });

  test("render marks loop button active when loop is enabled", () => {
    const template = {
      container: makeButton(),
      firstButton: makeButton(),
      prevButton: makeButton(),
      playButton: makeButton(),
      nextButton: makeButton(),
      lastButton: makeButton(),
      loopButton: makeButton(),
      rangeButton: makeButton(),
    };
    const renderer = new PlayControlsTemplateRenderer(
      makeButton() as any,
      {
        config: {
          assets: { baseUrl: "", variant: "light" },
        },
        trackController: {
          isPlaying: false,
          isLooped: true,
          hasSelectionAnchor: false,
        },
      } as any,
      template as any
    );

    (renderer as any).renderPlayButtons();

    expect(template.loopButton.classList.toggle).toHaveBeenCalledWith(
      "tu-track-control-active",
      true
    );
    expect(template.loopButton.setAttribute).toHaveBeenCalledWith(
      "aria-pressed",
      "true"
    );
  });
});
