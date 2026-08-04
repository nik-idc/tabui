import { ScoreControlsDefaultCallbacks } from "../../src/ui/top-controls/score-controls/score-controls-callbacks";
import { TrackControlsDefaultCallbacks } from "../../src/ui/top-controls/score-controls/track-controls/track-controls-callbacks";
import { NewTrackControlsDefaultCallbacks } from "../../src/ui/top-controls/score-controls/new-track/new-track-controls-callbacks";
import { TrackSettingsControlsDefaultCallbacks } from "../../src/ui/top-controls/score-controls/track-controls/track-settings/track-settings-controls-callbacks";
import { YesNoDefaultCallbacks } from "../../src/ui/shared/yes-no/yes-no-callbacks";
import { ScoreControlsTemplateRenderer } from "../../src/ui/top-controls/score-controls/score-controls-template-renderer";
import {
  createNotationComponentMock,
  dispatchClick,
  dispatchEvent,
  dispatchInput,
  makeButton,
  makeInput,
} from "./helpers";

describe("ScoreControlsDefaultCallbacks", () => {
  test("score editing controls render disabled during playback", () => {
    const newTrackButton = {
      classList: { add: jest.fn(), toggle: jest.fn() },
      setAttribute: jest.fn(),
      src: "",
      alt: "",
    };
    const scoreNameInput = {
      classList: { add: jest.fn() },
      value: "",
      disabled: false,
    };
    const renderer = Object.create(ScoreControlsTemplateRenderer.prototype);
    renderer.template = { newTrackButton, scoreNameInput };
    renderer.notationComponent = {
      trackController: { isPlaying: true, editingEnabled: true },
    };
    renderer.assetsPath = { baseUrl: "", variant: "light" };
    renderer._currentScoreName = "Score";

    renderer.renderNewTrackButton();
    renderer.renderScoreNameInput();

    expect(newTrackButton.classList.toggle).toHaveBeenCalledWith(
      "tu-disabled-img",
      true
    );
    expect(scoreNameInput.disabled).toBe(true);
  });

  test("score controls dispatch behavior and child callback lifecycle correctly", () => {
    const trackBindSpy = jest
      .spyOn(TrackControlsDefaultCallbacks.prototype, "bind")
      .mockImplementation(() => {});
    const trackUnbindSpy = jest
      .spyOn(TrackControlsDefaultCallbacks.prototype, "unbind")
      .mockImplementation(() => {});
    const newTrackBindSpy = jest
      .spyOn(NewTrackControlsDefaultCallbacks.prototype, "bind")
      .mockImplementation(() => {});
    const newTrackUnbindSpy = jest
      .spyOn(NewTrackControlsDefaultCallbacks.prototype, "unbind")
      .mockImplementation(() => {});
    const trackSettingsBindSpy = jest
      .spyOn(TrackSettingsControlsDefaultCallbacks.prototype, "bind")
      .mockImplementation(() => {});
    const trackSettingsUnbindSpy = jest
      .spyOn(TrackSettingsControlsDefaultCallbacks.prototype, "unbind")
      .mockImplementation(() => {});
    const yesNoBindSpy = jest
      .spyOn(YesNoDefaultCallbacks.prototype, "bind")
      .mockImplementation(() => {});
    const yesNoUnbindSpy = jest
      .spyOn(YesNoDefaultCallbacks.prototype, "unbind")
      .mockImplementation(() => {});

    const notationComponent = createNotationComponentMock();
    const captureKeyboard = jest.fn();
    const freeKeyboard = jest.fn();
    const showTrackSettings = jest.fn();
    const score = { name: "Old", masterVolume: 1, masterPan: 0 };
    const component = {
      template: {
        showTracksButton: makeButton(),
        newTrackButton: makeButton(),
        masterVolumeInput: makeInput("75"),
        masterPanningInput: makeInput("-0.5"),
        scoreNameInput: makeInput("New Name"),
      },
      newTrackComponent: {},
      trackSettingsComponent: {},
      trackRemoveComponent: {},
      trackComponents: [{ track: { id: 1 } }, { track: { id: 2 } }],
      tracksAreDisplayed: false,
      score,
      render: jest.fn(),
      showNewTrackDialog: jest.fn(),
      showTrackSettingsDialog: jest.fn(),
      showTrackRemoveDialog: jest.fn(),
      removeSelectedTrack: jest.fn(),
      changeTracksAreDisplayed: jest.fn(() => {
        component.tracksAreDisplayed = !component.tracksAreDisplayed;
      }),
    } as any;
    const callbacks = new ScoreControlsDefaultCallbacks(
      component,
      notationComponent,
      jest.fn(),
      captureKeyboard,
      freeKeyboard,
      showTrackSettings
    );

    callbacks.bind();
    callbacks.bind();
    dispatchClick(component.template.showTracksButton);
    dispatchClick(component.template.newTrackButton);
    dispatchInput(component.template.masterVolumeInput, "75");
    dispatchInput(component.template.masterPanningInput, "-0.5");
    dispatchInput(component.template.scoreNameInput, "New Name");
    dispatchEvent(component.template.scoreNameInput, "focus");
    dispatchEvent(component.template.scoreNameInput, "focusout");

    expect(component.changeTracksAreDisplayed).toHaveBeenCalledTimes(1);
    expect(component.render).toHaveBeenCalledTimes(1);
    expect(trackBindSpy).toHaveBeenCalledTimes(4);
    expect(component.showNewTrackDialog).toHaveBeenCalledTimes(1);
    expect(score.masterVolume).toBe(0.75);
    expect(score.masterPan).toBe(-0.5);
    expect(
      notationComponent.trackController.setMasterVolume
    ).toHaveBeenCalledWith(score, 0.75);
    expect(notationComponent.trackController.setMasterPan).toHaveBeenCalledWith(
      score,
      -0.5
    );
    expect(captureKeyboard).toHaveBeenCalledTimes(2);
    expect(score.name).toBe("New Name");
    expect(freeKeyboard).toHaveBeenCalledTimes(1);
    expect(newTrackBindSpy).toHaveBeenCalledTimes(1);
    expect(trackSettingsBindSpy).toHaveBeenCalledTimes(1);
    expect(yesNoBindSpy).toHaveBeenCalledTimes(1);

    notationComponent.trackController.isPlaying = true;
    component.template.scoreNameInput.value = "Blocked";
    callbacks.onNewTrackButtonClicked();
    callbacks.onScoreNameChanged();
    expect(component.showNewTrackDialog).toHaveBeenCalledTimes(1);
    expect(score.name).toBe("New Name");

    const renderCallsBeforeUnbind = component.render.mock.calls.length;
    callbacks.unbind();
    dispatchClick(component.template.showTracksButton);
    expect(component.render).toHaveBeenCalledTimes(renderCallsBeforeUnbind);
    expect(trackUnbindSpy).toHaveBeenCalledTimes(4);
    expect(newTrackUnbindSpy).toHaveBeenCalledTimes(1);
    expect(trackSettingsUnbindSpy).toHaveBeenCalledTimes(1);
    expect(yesNoUnbindSpy).toHaveBeenCalledTimes(1);

    trackBindSpy.mockRestore();
    trackUnbindSpy.mockRestore();
    newTrackBindSpy.mockRestore();
    newTrackUnbindSpy.mockRestore();
    trackSettingsBindSpy.mockRestore();
    trackSettingsUnbindSpy.mockRestore();
    yesNoBindSpy.mockRestore();
    yesNoUnbindSpy.mockRestore();
  });

  test("master controls render score state without resetting it", () => {
    const masterVolumeInput = {
      classList: { add: jest.fn() },
      value: "",
      type: "",
      min: "",
      max: "",
      step: "",
    };
    const masterPanningInput = {
      classList: { add: jest.fn() },
      value: "",
      type: "",
      min: "",
      max: "",
      step: "",
    };
    const renderer = Object.create(ScoreControlsTemplateRenderer.prototype);
    renderer.template = { masterVolumeInput, masterPanningInput };
    renderer.notationComponent = {
      trackController: { editingEnabled: true },
    };

    renderer.renderMasterVolumeInput({ masterVolume: 0.7 });
    renderer.renderMasterPanningInput({ masterPan: -0.25 });

    expect(masterVolumeInput.value).toBe("70");
    expect(masterPanningInput.value).toBe("-0.25");
  });
});
