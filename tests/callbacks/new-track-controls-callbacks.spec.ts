import { NewTrackControlsDefaultCallbacks } from "../../src/callbacks/ui/new-track-controls-callbacks";
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

function createNewTrackHarness() {
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
  const kindButtons = [makeButton()];
  const typeButtons = [makeButton(), makeButton()];
  const presetButtons = [makeButton(), makeButton()];
  const madeTrack = { id: 1 };
  const component = {
    template: {
      dialog,
      dialogContent,
      instrKindsButtons: kindButtons,
      instrTypesButtons: typeButtons,
      instrPresetsButtons: presetButtons,
      trackNameInput,
      stringCountInput,
      tuningInput,
      trackNameError,
      stringCountError,
      tuningError,
      confirmButton,
      cancelButton,
    },
    stringCount: 6,
    getAllKinds: jest.fn(() => ["string"]),
    getAllTypes: jest.fn(() => ["guitar", "bass"]),
    getAllPresets: jest.fn(() => ["clean", "dist"]),
    setKind: jest.fn(),
    setType: jest.fn(),
    setPreset: jest.fn(),
    setTrackName: jest.fn(),
    setStringCount: jest.fn((count: number) => {
      component.stringCount = count;
    }),
    setTuning: jest.fn(),
    makeTrack: jest.fn(() => madeTrack),
  } as any;
  const notationComponent = createNotationComponentMock();
  const renderFunc = jest.fn();
  const captureKeyboard = jest.fn();
  const freeKeyboard = jest.fn();
  const callbacks = new NewTrackControlsDefaultCallbacks(
    component,
    notationComponent,
    renderFunc,
    captureKeyboard,
    freeKeyboard
  );

  return {
    callbacks,
    component,
    notationComponent,
    renderFunc,
    freeKeyboard,
  };
}

describe("NewTrackControlsDefaultCallbacks", () => {
  test("validation and lifecycle behavior use the correct fields", () => {
    const {
      callbacks,
      component,
      notationComponent,
      renderFunc,
      freeKeyboard,
    } = createNewTrackHarness();

    dispatchInput(component.template.trackNameInput, "");
    callbacks.onTrackNameChanged();
    expect(component.template.trackNameError.textContent).toBe(
      callbacks.trackNameErrorText
    );

    dispatchInput(component.template.trackNameInput, "Lead");
    callbacks.onTrackNameChanged();
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
    expect(component.setTuning).toHaveBeenCalledWith("B E A D G B E");

    callbacks.bind();
    callbacks.bind();
    dispatchClick(component.template.instrKindsButtons[0]);
    dispatchClick(component.template.instrTypesButtons[1]);
    dispatchClick(component.template.instrPresetsButtons[0]);
    expect(component.setKind).toHaveBeenCalledWith("string");
    expect(component.setType).toHaveBeenCalledWith("bass");
    expect(component.setPreset).toHaveBeenCalledWith("clean");

    const renderCallsBeforeConfirm = renderFunc.mock.calls.length;
    const freeKeyboardCallsBeforeConfirm = freeKeyboard.mock.calls.length;
    dispatchClick(component.template.confirmButton);
    expect(notationComponent.loadTrack).toHaveBeenCalledWith(
      component.makeTrack.mock.results[0].value
    );
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeConfirm + 1);
    expect(component.template.dialog.close).toHaveBeenCalledTimes(1);
    expect(freeKeyboard).toHaveBeenCalledTimes(
      freeKeyboardCallsBeforeConfirm + 1
    );

    const loadTrackCallsBeforeUnbind =
      notationComponent.loadTrack.mock.calls.length;
    callbacks.unbind();
    dispatchClick(component.template.confirmButton);
    expect(notationComponent.loadTrack).toHaveBeenCalledTimes(
      loadTrackCallsBeforeUnbind
    );
  });
});
