import { TopControlsCallbacks } from "../../../src/ui/top-controls/top-controls-callbacks";
import { PlayControlsDefaultCallbacks } from "../../../src/ui/top-controls/play-controls/play-controls-callbacks";
import { ScoreControlsDefaultCallbacks } from "../../../src/ui/top-controls/score-controls/score-controls-callbacks";
import {
  TrackEvent,
  trackEvent,
  TrackEventType,
} from "../../../src/shared/events";

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
      { trackController: { playerUUID: 42 } } as any,
      renderFunc,
      jest.fn(),
      jest.fn()
    );

    callbacks.bind();
    callbacks.bind();
    expect(scoreBindSpy).toHaveBeenCalledTimes(1);
    expect(playBindSpy).toHaveBeenCalledTimes(1);

    trackEvent.emit(TrackEventType.PlayerStateChanged, { playerUUID: 7 });
    expect(renderFunc).not.toHaveBeenCalled();
    trackEvent.emit(TrackEventType.PlayerStateChanged, { playerUUID: 42 });
    expect(renderFunc).toHaveBeenCalledTimes(1);

    callbacks.unbind();
    expect(scoreUnbindSpy).toHaveBeenCalledTimes(1);
    expect(playUnbindSpy).toHaveBeenCalledTimes(1);
    const renderCallsBeforeEmit = renderFunc.mock.calls.length;
    trackEvent.emit(TrackEventType.PlayerStateChanged, { playerUUID: 42 });
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeEmit);

    scoreBindSpy.mockRestore();
    scoreUnbindSpy.mockRestore();
    playBindSpy.mockRestore();
    playUnbindSpy.mockRestore();
  });

  test("event emission uses a stable listener snapshot", () => {
    const event = new TrackEvent();
    const secondListener = jest.fn();
    const firstListener = jest.fn(() => {
      event.off(TrackEventType.PlayerStateChanged, firstListener);
      event.on(TrackEventType.PlayerStateChanged, firstListener);
    });
    event.on(TrackEventType.PlayerStateChanged, firstListener);
    event.on(TrackEventType.PlayerStateChanged, secondListener);

    event.emit(TrackEventType.PlayerStateChanged, { playerUUID: 1 });

    expect(firstListener).toHaveBeenCalledTimes(1);
    expect(secondListener).toHaveBeenCalledTimes(1);
  });
});
