import { TrackControlsDefaultCallbacks } from "../../src/callbacks/ui/track-controls-callbacks";
import { YesNoDefaultCallbacks } from "../../src/callbacks/ui/yes-no-callbacks";
import { TrackSettingsControlsDefaultCallbacks } from "../../src/callbacks/ui/track-settings-callbacks";
import {
  createNotationComponentMock,
  dispatchClick,
  makeButton,
} from "./helpers";

describe("TrackControlsDefaultCallbacks", () => {
  test("top-level actions dispatch correctly and child callbacks are bound idempotently", () => {
    const yesBindSpy = jest
      .spyOn(YesNoDefaultCallbacks.prototype, "bind")
      .mockImplementation(() => {});
    const yesUnbindSpy = jest
      .spyOn(YesNoDefaultCallbacks.prototype, "unbind")
      .mockImplementation(() => {});
    const settingsBindSpy = jest
      .spyOn(TrackSettingsControlsDefaultCallbacks.prototype, "bind")
      .mockImplementation(() => {});
    const settingsUnbindSpy = jest
      .spyOn(TrackSettingsControlsDefaultCallbacks.prototype, "unbind")
      .mockImplementation(() => {});

    const notationComponent = createNotationComponentMock();
    const renderFunc = jest.fn();
    const captureKeyboard = jest.fn();
    const track = { id: 1 };
    const component = {
      template: {
        removeButton: makeButton(),
        trackButton: makeButton(),
        volumeInput: makeButton(),
        muteButton: makeButton(),
        soloButton: makeButton(),
        settingsButton: makeButton(),
      },
      yesNoComponent: {},
      trackSettingsComponent: {},
      track,
      showRemoveDialog: jest.fn(),
      showTrackSettings: jest.fn(),
    } as any;
    const callbacks = new TrackControlsDefaultCallbacks(
      component,
      notationComponent,
      renderFunc,
      captureKeyboard,
      jest.fn()
    );

    callbacks.bind();
    callbacks.bind();
    dispatchClick(component.template.trackButton);
    dispatchClick(component.template.removeButton);
    dispatchClick(component.template.settingsButton);

    expect(notationComponent.loadTrack).toHaveBeenCalledWith(track);
    expect(renderFunc).toHaveBeenCalledTimes(1);
    expect(captureKeyboard).toHaveBeenCalledTimes(2);
    expect(component.showRemoveDialog).toHaveBeenCalledTimes(1);
    expect(component.showTrackSettings).toHaveBeenCalledTimes(1);
    expect(yesBindSpy).toHaveBeenCalledTimes(1);
    expect(settingsBindSpy).toHaveBeenCalledTimes(1);

    const renderCallsBeforeUnbind = renderFunc.mock.calls.length;
    callbacks.unbind();
    dispatchClick(component.template.trackButton);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeUnbind);
    expect(yesUnbindSpy).toHaveBeenCalledTimes(1);
    expect(settingsUnbindSpy).toHaveBeenCalledTimes(1);

    yesBindSpy.mockRestore();
    yesUnbindSpy.mockRestore();
    settingsBindSpy.mockRestore();
    settingsUnbindSpy.mockRestore();
  });
});
