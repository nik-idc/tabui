import { PlayControlsDefaultCallbacks } from "../../src/callbacks/ui/play-controls-callbacks";

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
});
