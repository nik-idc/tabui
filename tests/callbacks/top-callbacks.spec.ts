import { TopControlsCallbacks } from "../../src/callbacks/ui/top-callbacks";
import { PlayControlsDefaultCallbacks } from "../../src/callbacks/ui/play-controls-callbacks";
import { ScoreControlsDefaultCallbacks } from "../../src/callbacks/ui/score-controls-callbacks";
import { trackEvent, TrackEventType } from "../../src/shared/events";

describe("TopControlsCallbacks", () => {
  test("bind and unbind delegate to children and player-state rerender", () => {
    const scoreBindSpy = jest
      .spyOn(ScoreControlsDefaultCallbacks.prototype, "bind")
      .mockImplementation(() => {});
    const scoreUnbindSpy = jest
      .spyOn(ScoreControlsDefaultCallbacks.prototype, "unbind")
      .mockImplementation(() => {});
    const playBindSpy = jest
      .spyOn(PlayControlsDefaultCallbacks.prototype, "bind")
      .mockImplementation(() => {});
    const playUnbindSpy = jest
      .spyOn(PlayControlsDefaultCallbacks.prototype, "unbind")
      .mockImplementation(() => {});

    const renderFunc = jest.fn();
    const callbacks = new TopControlsCallbacks(
      { scoreComponent: {}, playComponent: {} } as any,
      {} as any,
      renderFunc,
      jest.fn(),
      jest.fn()
    );

    callbacks.bind();
    callbacks.bind();
    expect(scoreBindSpy).toHaveBeenCalledTimes(1);
    expect(playBindSpy).toHaveBeenCalledTimes(1);

    trackEvent.emit(TrackEventType.PlayerStateChanged, {});
    expect(renderFunc).toHaveBeenCalledTimes(1);

    callbacks.unbind();
    expect(scoreUnbindSpy).toHaveBeenCalledTimes(1);
    expect(playUnbindSpy).toHaveBeenCalledTimes(1);
    const renderCallsBeforeEmit = renderFunc.mock.calls.length;
    trackEvent.emit(TrackEventType.PlayerStateChanged, {});
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeEmit);

    scoreBindSpy.mockRestore();
    scoreUnbindSpy.mockRestore();
    playBindSpy.mockRestore();
    playUnbindSpy.mockRestore();
  });
});
