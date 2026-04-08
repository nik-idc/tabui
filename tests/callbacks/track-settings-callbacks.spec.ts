import { TrackSettingsControlsDefaultCallbacks } from "../../src/callbacks/ui/track-settings-callbacks";
import {
  createNotationComponentMock,
  dispatchClick,
  dispatchInput,
  FakeElement,
  makeButton,
  makeDialog,
  makeInput,
  makeText,
} from "./helpers";

function createTrackSettingsHarness() {
  const dialog = makeDialog();
  const dialogContent = new FakeElement();
  dialog.appendChild(dialogContent);
  const trackNameInput = makeInput("Lead");
  const stringCountInput = makeInput("6");
  const tuningInput = makeInput("E A D G B E");
  const trackNameError = makeText();
  const stringCountError = makeText();
  const tuningError = makeText();
  const confirmButton = makeButton();
  const cancelButton = makeButton();
  const track = { name: "Track 1" };
  const component = {
    template: {
      dialog,
      dialogContent,
      trackNameInput,
      stringCountInput,
      tuningInput,
      trackNameError,
      stringCountError,
      tuningError,
      confirmButton,
      cancelButton,
    },
    track,
    stringCount: 6,
    trackName: "Track 1",
    setTrackName: jest.fn((name: string) => {
      component.trackName = name;
    }),
    setStringCount: jest.fn((count: number) => {
      component.stringCount = count;
    }),
    setTuning: jest.fn(),
  } as any;
  const renderFunc = jest.fn();
  const freeKeyboard = jest.fn();
  const callbacks = new TrackSettingsControlsDefaultCallbacks(
    component,
    createNotationComponentMock(),
    renderFunc,
    jest.fn(),
    freeKeyboard
  );

  return { callbacks, component, renderFunc, freeKeyboard };
}

describe("TrackSettingsControlsDefaultCallbacks", () => {
  test("validation uses correct fields and lifecycle wiring is idempotent", () => {
    const { callbacks, component, renderFunc, freeKeyboard } =
      createTrackSettingsHarness();

    dispatchInput(component.template.trackNameInput, "");
    callbacks.onTrackNameChanged();
    expect(component.template.trackNameError.textContent).toBe(
      callbacks.trackNameErrorText
    );
    expect(component.template.confirmButton.disabled).toBe(true);

    dispatchInput(component.template.trackNameInput, "Lead");
    callbacks.onTrackNameChanged();
    expect(component.template.trackNameError.textContent).toBe(" ");
    expect(component.setTrackName).toHaveBeenCalledWith("Lead");

    dispatchInput(component.template.stringCountInput, "0");
    callbacks.onStringCountChanged();
    expect(component.template.stringCountError.textContent).toBe(
      callbacks.stringCountErrorText
    );

    dispatchInput(component.template.stringCountInput, "7");
    callbacks.onStringCountChanged();
    expect(component.setStringCount).toHaveBeenCalledWith(7);

    dispatchInput(component.template.tuningInput, "invalid");
    callbacks.onTuningChange();
    expect(component.template.tuningError.textContent).toBe(
      callbacks.tuningErrorText
    );

    dispatchInput(component.template.tuningInput, "B E A D G B E");
    callbacks.onTuningChange();
    expect(component.template.tuningError.textContent).toBe(" ");
    expect(component.setTuning).toHaveBeenCalledWith("B E A D G B E");

    callbacks.bind();
    callbacks.bind();
    const renderCallsBeforeConfirm = renderFunc.mock.calls.length;
    const freeKeyboardCallsBeforeConfirm = freeKeyboard.mock.calls.length;
    dispatchClick(component.template.confirmButton);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeConfirm + 1);
    expect(component.template.dialog.close).toHaveBeenCalledTimes(1);
    expect(freeKeyboard).toHaveBeenCalledTimes(
      freeKeyboardCallsBeforeConfirm + 1
    );
    expect(component.track.name).toBe(component.trackName);

    const renderCallsBeforeUnbind = renderFunc.mock.calls.length;
    callbacks.unbind();
    dispatchClick(component.template.confirmButton);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeUnbind);
  });
});
