import { PlayControlsDefaultCallbacks } from "../../src/callbacks/ui/play-controls-callbacks";
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
});
