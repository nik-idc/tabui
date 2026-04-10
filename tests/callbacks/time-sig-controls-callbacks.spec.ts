import { TimeSigControlsDefaultCallbacks } from "../../src/callbacks/ui/time-sig-controls-callbacks";
import { NoteDuration } from "../../src/notation/model";
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

function createTimeSigHarness() {
  const dialog = makeDialog();
  const dialogContent = new FakeElement();
  dialog.appendChild(dialogContent);
  const beatsInput = makeInput("4");
  const durationInput = makeInput("4");
  const confirmButton = makeButton();
  const cancelButton = makeButton();
  const beatsErrorText = makeText();
  const durationErrorText = makeText();
  const component = {
    template: {
      dialog,
      dialogContent,
      beatsInput,
      durationInput,
      confirmButton,
      cancelButton,
      beatsErrorText,
      durationErrorText,
    },
  } as any;
  const notationComponent = createNotationComponentMock();
  const renderFunc = jest.fn();
  const freeKeyboard = jest.fn();
  const callbacks = new TimeSigControlsDefaultCallbacks(
    component,
    notationComponent,
    renderFunc,
    jest.fn(),
    freeKeyboard
  );

  return { callbacks, component, notationComponent, renderFunc, freeKeyboard };
}

describe("TimeSigControlsDefaultCallbacks", () => {
  test("input validation updates errors and confirm state", () => {
    const { callbacks, component } = createTimeSigHarness();

    dispatchInput(component.template.beatsInput, "0");
    callbacks.onBeatsChanged({} as InputEvent);
    expect(component.template.confirmButton.disabled).toBe(true);
    expect(component.template.beatsErrorText.textContent).not.toBe(" ");

    dispatchInput(component.template.beatsInput, "7");
    callbacks.onBeatsChanged({} as InputEvent);
    expect(component.template.confirmButton.disabled).toBe(false);
    expect(component.template.beatsErrorText.textContent).toBe(" ");

    dispatchInput(component.template.durationInput, "3");
    callbacks.onDurationChanged({} as InputEvent);
    expect(component.template.confirmButton.disabled).toBe(true);
    expect(component.template.durationErrorText.textContent).not.toBe(" ");

    dispatchInput(component.template.durationInput, "8");
    callbacks.onDurationChanged({} as InputEvent);
    expect(component.template.confirmButton.disabled).toBe(false);
    expect(component.template.durationErrorText.textContent).toBe(" ");
  });

  test("confirm commits time signature and repeated bind does not double fire", () => {
    const {
      callbacks,
      component,
      notationComponent,
      renderFunc,
      freeKeyboard,
    } = createTimeSigHarness();
    const setTimeSignature =
      notationComponent.trackController.trackControllerEditor
        .setSelectedBarTimeSignature;

    callbacks.bind();
    callbacks.bind();
    dispatchInput(component.template.beatsInput, "7");
    dispatchInput(component.template.durationInput, "8");
    dispatchClick(component.template.confirmButton);

    expect(setTimeSignature).toHaveBeenCalledTimes(1);
    expect(setTimeSignature).toHaveBeenCalledWith(7, NoteDuration.Eighth);
    expect(renderFunc).toHaveBeenCalledTimes(1);
    expect(component.template.dialog.close).toHaveBeenCalledTimes(1);
    expect(freeKeyboard).toHaveBeenCalledTimes(1);

    const timeSignatureCallsBeforeUnbind = setTimeSignature.mock.calls.length;
    callbacks.unbind();
    dispatchClick(component.template.confirmButton);
    expect(setTimeSignature).toHaveBeenCalledTimes(
      timeSignatureCallsBeforeUnbind
    );
  });
});
