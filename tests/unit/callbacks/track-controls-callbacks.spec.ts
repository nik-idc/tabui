import { TrackControlsDefaultCallbacks } from "../../../src/ui/top-controls/score-controls/track-controls/track-controls-callbacks";
import { TrackControlsTemplateRenderer } from "../../../src/ui/top-controls/score-controls/track-controls/track-controls-template-renderer";
import { Guitar, Score } from "../../../src/notation/model";
import {
  asNotationComponent,
  createNotationComponentMock,
  dispatchClick,
  dispatchEvent,
  dispatchInput,
  makeButton,
  makeInput,
} from "./helpers";

describe("TrackControlsDefaultCallbacks", () => {
  function renderRemoveButton(trackCount: number, isPlaybackActive = false) {
    const score = new Score();
    while (score.tracks.length < trackCount) {
      score.addTrack(new Guitar(), `Track ${score.tracks.length + 1}`);
    }
    const removeButton = {
      classList: { add: jest.fn(), toggle: jest.fn() },
      dataset: {},
      title: "",
      style: { backgroundImage: "" },
      removeAttribute: jest.fn(),
      setAttribute: jest.fn(),
    };
    const renderer = Object.create(TrackControlsTemplateRenderer.prototype);
    renderer.template = { removeButton };
    renderer.notationComponent = {
      score,
      trackController: { isPlaybackActive, editingEnabled: true },
    };
    renderer.assetsPath = { baseUrl: "", variant: "light" };

    renderer.renderRemoveButton();

    return removeButton;
  }

  test("remove button is disabled for the only track", () => {
    expect(renderRemoveButton(1).classList.toggle).toHaveBeenCalledWith(
      "tu-disabled-img",
      true
    );
    expect(renderRemoveButton(2).classList.toggle).toHaveBeenCalledWith(
      "tu-disabled-img",
      false
    );
    expect(renderRemoveButton(2, true).classList.toggle).toHaveBeenCalledWith(
      "tu-disabled-img",
      true
    );
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
    const score = new Score();
    const track = score.tracks[0];
    track.name = "Lead";
    score.addTrack(new Guitar(), "Track 2");
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
      score,
      trackController: { isPlaybackActive: true, editingEnabled: true },
    };
    renderer.assetsPath = { baseUrl: "", variant: "light" };

    renderer.renderMoveButtons();
    renderer.renderTrackNameInput();
    renderer.renderRemoveButton();
    renderer.renderScoreSettingsButton();

    expect(template.moveUpButton.disabled).toBe(true);
    expect(template.moveDownButton.disabled).toBe(true);
    expect(template.trackNameInput.disabled).toBe(true);
    expect(template.removeButton.classList.toggle).toHaveBeenCalledWith(
      "tu-disabled-img",
      true
    );
    expect(template.settingsButton.classList.toggle).toHaveBeenCalledWith(
      "tu-disabled-img",
      true
    );
  });

  test("playback blocks track editing but preserves mix controls", () => {
    const notationComponent = createNotationComponentMock();
    notationComponent.trackController.isPlaying = true;
    const track = notationComponent.score.tracks[0];
    track.name = "Lead";
    track.volume = 0.5;
    track.pan = 0;
    track.muted = false;
    track.soloed = false;
    const component = {
      template: {
        trackNameInput: makeInput("Blocked"),
      },
      track,
    } as any;
    const showSettings = jest.fn();
    const showRemove = jest.fn();
    const callbacks = new TrackControlsDefaultCallbacks(
      component,
      asNotationComponent(notationComponent),
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

  test("persisted mix callbacks dispatch in view-only mode", () => {
    const notationComponent = createNotationComponentMock();
    notationComponent.trackController.editingEnabled = false;
    const track = notationComponent.score.tracks[0];
    track.volume = 0.5;
    track.pan = 0;
    track.muted = false;
    track.soloed = false;
    const callbacks = new TrackControlsDefaultCallbacks(
      { track, template: {} } as any,
      asNotationComponent(notationComponent),
      jest.fn(),
      jest.fn(),
      jest.fn(),
      jest.fn(),
      jest.fn()
    );

    callbacks.onTrackVolumeChanged({ target: makeInput("75") } as any);
    callbacks.onTrackPanningChanged({ target: makeInput("-0.5") } as any);
    callbacks.onMuteButtonClicked();
    callbacks.onSoloButtonClicked();

    expect(
      notationComponent.trackController.setTrackVolume
    ).toHaveBeenCalledWith(track, 0.75);
    expect(notationComponent.trackController.setTrackPan).toHaveBeenCalledWith(
      track,
      -0.5
    );
    expect(
      notationComponent.trackController.toggleTrackMuted
    ).toHaveBeenCalledWith(track);
    expect(
      notationComponent.trackController.toggleTrackSoloed
    ).toHaveBeenCalledWith(track);
  });

  test("top-level actions dispatch correctly and unbind stops events", () => {
    const notationComponent = createNotationComponentMock();
    const renderFunc = jest.fn();
    const captureKeyboard = jest.fn();
    const showTrackSettings = jest.fn();
    const showTrackRemove = jest.fn();
    const score = notationComponent.score;
    const firstTrack = score.tracks[0];
    const track = score.addTrack(new Guitar(), "Lead").tracks[0];
    score.addTrack(new Guitar(), "Track 3");
    track.volume = 0.5;
    track.pan = 0;
    track.muted = false;
    track.soloed = false;
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
    const callbacks = new TrackControlsDefaultCallbacks(
      component,
      asNotationComponent(notationComponent),
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
      score.tracks.indexOf(firstTrack)
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
      notationComponent.trackController.setTrackVolume
    ).toHaveBeenCalledWith(track, 0.75);
    expect(notationComponent.trackController.setTrackPan).toHaveBeenCalledWith(
      track,
      -0.5
    );
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
