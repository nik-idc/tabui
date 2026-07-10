import { TrackControlsDefaultCallbacks } from "../../src/ui/top-controls/score-controls/track-controls/track-controls-callbacks";
import { TrackControlsTemplateRenderer } from "../../src/ui/top-controls/score-controls/track-controls/track-controls-template-renderer";
import {
  createNotationComponentMock,
  dispatchClick,
  dispatchInput,
  makeButton,
  makeInput,
} from "./helpers";

describe("TrackControlsDefaultCallbacks", () => {
  function renderRemoveButton(trackCount: number) {
    const removeButton = {
      classList: { add: jest.fn() },
      disabled: false,
      title: "",
      style: { backgroundImage: "" },
      setAttribute: jest.fn(),
    };
    const renderer = Object.create(TrackControlsTemplateRenderer.prototype);
    renderer.template = { removeButton };
    renderer.notationComponent = { score: { tracks: new Array(trackCount) } };
    renderer.assetsPath = { baseUrl: "", variant: "light" };

    renderer.renderRemoveButton();

    return removeButton;
  }

  test("remove button is disabled for the only track", () => {
    expect(renderRemoveButton(1).disabled).toBe(true);
    expect(renderRemoveButton(2).disabled).toBe(false);
  });

  test("top-level actions dispatch correctly and child callbacks are bound idempotently", () => {
    const notationComponent = createNotationComponentMock();
    const renderFunc = jest.fn();
    const captureKeyboard = jest.fn();
    const showTrackSettings = jest.fn();
    const showTrackRemove = jest.fn();
    const track = { id: 1, volume: 0.5, pan: 0, muted: false, soloed: false };
    const component = {
      template: {
        removeButton: makeButton(),
        trackButton: makeButton(),
        volumeInput: makeInput("50"),
        panningInput: makeInput("0"),
        muteButton: makeButton(),
        soloButton: makeButton(),
        settingsButton: makeButton(),
      },
      track,
    } as any;
    const callbacks = new TrackControlsDefaultCallbacks(
      component,
      notationComponent,
      renderFunc,
      captureKeyboard,
      jest.fn(),
      showTrackSettings,
      showTrackRemove
    );

    callbacks.bind();
    callbacks.bind();
    dispatchClick(component.template.trackButton);
    dispatchClick(component.template.removeButton);
    dispatchClick(component.template.settingsButton);
    dispatchInput(component.template.volumeInput, "75");
    dispatchInput(component.template.panningInput, "-0.5");
    dispatchClick(component.template.muteButton);
    dispatchClick(component.template.soloButton);

    expect(notationComponent.loadTrack).toHaveBeenCalledWith(track);
    expect(track.volume).toBe(0.75);
    expect(track.pan).toBe(-0.5);
    expect(track.muted).toBe(true);
    expect(track.soloed).toBe(true);
    expect(
      notationComponent.trackController.syncTrackPlaybackState
    ).toHaveBeenCalledTimes(4);
    expect(renderFunc).toHaveBeenCalledTimes(3);
    expect(captureKeyboard).toHaveBeenCalledTimes(2);
    expect(showTrackRemove).toHaveBeenCalledTimes(1);
    expect(showTrackSettings).toHaveBeenCalledTimes(1);

    const renderCallsBeforeUnbind = renderFunc.mock.calls.length;
    callbacks.unbind();
    dispatchClick(component.template.trackButton);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeUnbind);
  });
});
