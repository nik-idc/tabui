import { PlayControlsDefaultCallbacks } from "../../src/ui/top-controls/play-controls/play-controls-callbacks";
import { PlayControlsTemplateRenderer } from "../../src/ui/top-controls/play-controls/play-controls-template-renderer";
import { dispatchClick, makeButton } from "./helpers";

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
          get isPlaying() {
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

  test("bar traversal buttons delegate to the track controller", () => {
    const ensureSelectedNoteVisible = jest.fn();
    const trackController = {
      isPlaying: false,
      startPlayer: jest.fn(),
      stopPlayer: jest.fn(),
      toggleLoop: jest.fn(),
      selectFirstBar: jest.fn(),
      selectPreviousBar: jest.fn(),
      selectNextBar: jest.fn(),
      selectLastBar: jest.fn(),
    };
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

    callbacks.onFirstClicked();
    callbacks.onPrevClicked();
    callbacks.onNextClicked();
    callbacks.onLastClicked();

    expect(trackController.selectFirstBar).toHaveBeenCalledTimes(1);
    expect(trackController.selectPreviousBar).toHaveBeenCalledTimes(1);
    expect(trackController.selectNextBar).toHaveBeenCalledTimes(1);
    expect(trackController.selectLastBar).toHaveBeenCalledTimes(1);
    expect(ensureSelectedNoteVisible).toHaveBeenCalledTimes(4);
    expect(renderFunc).toHaveBeenCalledTimes(4);
  });

  test("range button anchors or clears the current range", () => {
    let hasSelectionAnchor = false;
    const setSelectionAnchor = jest.fn(() => {
      hasSelectionAnchor = true;
    });
    const clearSelectionRange = jest.fn(() => {
      hasSelectionAnchor = false;
    });
    const controller = {
      get hasSelectionAnchor() {
        return hasSelectionAnchor;
      },
      setSelectionAnchor,
      clearSelectionRange,
    };
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
    callbacks.onRangeClicked();

    expect(setSelectionAnchor).toHaveBeenCalledTimes(1);
    expect(clearSelectionRange).toHaveBeenCalledTimes(1);
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
