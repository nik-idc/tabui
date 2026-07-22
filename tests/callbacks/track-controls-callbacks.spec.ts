import { TrackControlsDefaultCallbacks } from "../../src/ui/top-controls/score-controls/track-controls/track-controls-callbacks";
import { TrackControlsTemplateRenderer } from "../../src/ui/top-controls/score-controls/track-controls/track-controls-template-renderer";
import {
  createNotationComponentMock,
  dispatchClick,
  dispatchEvent,
  dispatchInput,
  makeButton,
  makeInput,
} from "./helpers";

describe("TrackControlsDefaultCallbacks", () => {
  function renderRemoveButton(trackCount: number, isPlaying: boolean = false) {
    const removeButton = {
      classList: { add: jest.fn() },
      disabled: false,
      dataset: {},
      title: "",
      style: { backgroundImage: "" },
      removeAttribute: jest.fn(),
      setAttribute: jest.fn(),
    };
    const renderer = Object.create(TrackControlsTemplateRenderer.prototype);
    renderer.template = { removeButton };
    renderer.notationComponent = {
      score: { tracks: new Array(trackCount) },
      trackController: { isPlaying },
    };
    renderer.assetsPath = { baseUrl: "", variant: "light" };

    renderer.renderRemoveButton();

    return removeButton;
  }

  test("remove button is disabled for the only track", () => {
    expect(renderRemoveButton(1).disabled).toBe(true);
    expect(renderRemoveButton(2).disabled).toBe(false);
    expect(renderRemoveButton(2, true).disabled).toBe(true);
  });

  test("track editing controls render disabled during playback", () => {
    const makeElement = () => ({
      classList: { add: jest.fn(), toggle: jest.fn() },
      disabled: false,
      dataset: {},
      title: "",
      textContent: "",
      value: "",
      src: "",
      alt: "",
      removeAttribute: jest.fn(),
      setAttribute: jest.fn(),
    });
    const track = { name: "Lead" };
    const template = {
      moveUpButton: makeElement(),
      moveDownButton: makeElement(),
      trackNameInput: makeElement(),
      removeButton: makeElement(),
      settingsButton: makeElement(),
    };
    const renderer = Object.create(TrackControlsTemplateRenderer.prototype);
    renderer.template = template;
    renderer.track = track;
    renderer.notationComponent = {
      score: { tracks: [track, {}] },
      trackController: { isPlaying: true },
    };
    renderer.assetsPath = { baseUrl: "", variant: "light" };

    renderer.renderMoveButtons();
    renderer.renderTrackNameInput();
    renderer.renderRemoveButton();
    renderer.renderScoreSettingsButton();

    expect(template.moveUpButton.disabled).toBe(true);
    expect(template.moveDownButton.disabled).toBe(true);
    expect(template.trackNameInput.disabled).toBe(true);
    expect(template.removeButton.disabled).toBe(true);
    expect(template.settingsButton.classList.toggle).toHaveBeenCalledWith(
      "tu-disabled-img",
      true
    );
  });

  test("playback blocks track editing but preserves mix controls", () => {
    const notationComponent = createNotationComponentMock();
    notationComponent.trackController.isPlaying = true;
    const track = {
      name: "Lead",
      volume: 0.5,
      pan: 0,
      muted: false,
      soloed: false,
    };
    const component = {
      template: {
        trackNameInput: makeInput("Blocked"),
      },
      track,
    } as any;
    notationComponent.score = { tracks: [track] };
    const showSettings = jest.fn();
    const showRemove = jest.fn();
    const callbacks = new TrackControlsDefaultCallbacks(
      component,
      notationComponent,
      jest.fn(),
      jest.fn(),
      jest.fn(),
      showSettings,
      showRemove
    );

    callbacks.onTrackSelected();
    callbacks.onTrackMoveUpClicked();
    callbacks.onTrackNameChanged();
    callbacks.onTrackRemoveClicked();
    callbacks.onTrackSettingsClicked();
    callbacks.onTrackVolumeChanged({
      target: makeInput("75"),
    } as any);
    callbacks.onMuteButtonClicked();

    expect(notationComponent.loadTrack).toHaveBeenCalledWith(track);
    expect(notationComponent.trackController.moveTrack).not.toHaveBeenCalled();
    expect(track.name).toBe("Lead");
    expect(showRemove).not.toHaveBeenCalled();
    expect(showSettings).not.toHaveBeenCalled();
    expect(track.volume).toBe(0.75);
    expect(track.muted).toBe(true);
  });

  test("top-level actions dispatch correctly and child callbacks are bound idempotently", () => {
    const notationComponent = createNotationComponentMock();
    const renderFunc = jest.fn();
    const captureKeyboard = jest.fn();
    const showTrackSettings = jest.fn();
    const showTrackRemove = jest.fn();
    const track = {
      id: 1,
      name: "Lead",
      volume: 0.5,
      pan: 0,
      muted: false,
      soloed: false,
    };
    const component = {
      template: {
        removeButton: makeButton(),
        selectButton: makeButton(),
        moveUpButton: makeButton(),
        moveDownButton: makeButton(),
        trackNameInput: makeInput("Rhythm"),
        volumeInput: makeInput("50"),
        panningInput: makeInput("0"),
        muteButton: makeButton(),
        soloButton: makeButton(),
        settingsButton: makeButton(),
      },
      track,
    } as any;
    notationComponent.score = {
      tracks: [{}, track, {}],
    };
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
    dispatchClick(component.template.selectButton);
    dispatchClick(component.template.moveUpButton);
    dispatchClick(component.template.moveDownButton);
    dispatchInput(component.template.trackNameInput, "Rhythm");
    dispatchEvent(component.template.trackNameInput, "focus");
    dispatchEvent(component.template.trackNameInput, "focusout");
    dispatchClick(component.template.removeButton);
    dispatchClick(component.template.settingsButton);
    dispatchInput(component.template.volumeInput, "75");
    dispatchInput(component.template.panningInput, "-0.5");
    dispatchClick(component.template.muteButton);
    dispatchClick(component.template.soloButton);

    expect(notationComponent.loadTrack).toHaveBeenCalledWith(track);
    expect(notationComponent.trackController.moveTrack).toHaveBeenNthCalledWith(
      1,
      track,
      0
    );
    expect(notationComponent.trackController.moveTrack).toHaveBeenNthCalledWith(
      2,
      track,
      2
    );
    expect(track.name).toBe("Rhythm");
    expect(track.volume).toBe(0.75);
    expect(track.pan).toBe(-0.5);
    expect(track.muted).toBe(true);
    expect(track.soloed).toBe(true);
    expect(
      notationComponent.trackController.syncTrackPlaybackState
    ).toHaveBeenCalledTimes(4);
    expect(renderFunc).toHaveBeenCalledTimes(5);
    expect(captureKeyboard).toHaveBeenCalledTimes(3);
    expect(showTrackRemove).toHaveBeenCalledTimes(1);
    expect(showTrackSettings).toHaveBeenCalledTimes(1);

    const renderCallsBeforeUnbind = renderFunc.mock.calls.length;
    callbacks.unbind();
    dispatchClick(component.template.selectButton);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeUnbind);
  });
});
