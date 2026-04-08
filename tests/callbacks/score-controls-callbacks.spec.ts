import { ScoreControlsDefaultCallbacks } from "../../src/callbacks/ui/score-controls-callbacks";
import { TrackControlsDefaultCallbacks } from "../../src/callbacks/ui/track-controls-callbacks";
import { NewTrackControlsDefaultCallbacks } from "../../src/callbacks/ui/new-track-controls-callbacks";
import {
  createNotationComponentMock,
  dispatchClick,
  dispatchEvent,
  dispatchInput,
  makeButton,
  makeInput,
} from "./helpers";

describe("ScoreControlsDefaultCallbacks", () => {
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

    const notationComponent = createNotationComponentMock();
    const captureKeyboard = jest.fn();
    const freeKeyboard = jest.fn();
    const score = { name: "Old" };
    const component = {
      template: {
        showTracksButton: makeButton(),
        newTrackButton: makeButton(),
        masterVolumeInput: makeButton(),
        masterPanningInput: makeButton(),
        scoreNameInput: makeInput("New Name"),
      },
      newTrackComponent: {},
      trackComponents: [{}, {}],
      tracksAreDisplayed: false,
      score,
      render: jest.fn(),
      showNewTrackDialog: jest.fn(),
      changeTracksAreDisplayed: jest.fn(() => {
        component.tracksAreDisplayed = !component.tracksAreDisplayed;
      }),
    } as any;
    const callbacks = new ScoreControlsDefaultCallbacks(
      component,
      notationComponent,
      jest.fn(),
      captureKeyboard,
      freeKeyboard
    );

    callbacks.bind();
    callbacks.bind();
    dispatchClick(component.template.showTracksButton);
    dispatchClick(component.template.newTrackButton);
    dispatchInput(component.template.scoreNameInput, "New Name");
    dispatchEvent(component.template.scoreNameInput, "focus");
    dispatchEvent(component.template.scoreNameInput, "focusout");

    expect(component.changeTracksAreDisplayed).toHaveBeenCalledTimes(1);
    expect(component.render).toHaveBeenCalledTimes(1);
    expect(trackBindSpy).toHaveBeenCalledTimes(4);
    expect(component.showNewTrackDialog).toHaveBeenCalledTimes(1);
    expect(captureKeyboard).toHaveBeenCalledTimes(2);
    expect(score.name).toBe("New Name");
    expect(freeKeyboard).toHaveBeenCalledTimes(1);
    expect(newTrackBindSpy).toHaveBeenCalledTimes(1);

    const renderCallsBeforeUnbind = component.render.mock.calls.length;
    callbacks.unbind();
    dispatchClick(component.template.showTracksButton);
    expect(component.render).toHaveBeenCalledTimes(renderCallsBeforeUnbind);
    expect(trackUnbindSpy).toHaveBeenCalledTimes(4);
    expect(newTrackUnbindSpy).toHaveBeenCalledTimes(1);

    trackBindSpy.mockRestore();
    trackUnbindSpy.mockRestore();
    newTrackBindSpy.mockRestore();
    newTrackUnbindSpy.mockRestore();
  });
});
