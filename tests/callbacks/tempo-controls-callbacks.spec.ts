import { TempoControlsDefaultCallbacks } from "../../src/callbacks/ui/tempo-controls-callbacks";
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

function createTempoHarness() {
  const dialog = makeDialog();
  const dialogContent = new FakeElement();
  dialog.appendChild(dialogContent);
  const input = makeInput("120");
  const confirmButton = makeButton();
  const cancelButton = makeButton();
  const errorText = makeText();
  const component = {
    template: {
      dialog,
      dialogContent,
      input,
      confirmButton,
      cancelButton,
      errorText,
    },
  } as any;
  const notationComponent = createNotationComponentMock();
  const renderFunc = jest.fn();
  const captureKeyboard = jest.fn();
  const freeKeyboard = jest.fn();
  const callbacks = new TempoControlsDefaultCallbacks(
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

describe("TempoControlsDefaultCallbacks", () => {
  test("invalid and valid tempo input update dialog state", () => {
    const { callbacks, component } = createTempoHarness();

    dispatchInput(component.template.input, "0");
    callbacks.onTempoChanged({} as InputEvent);
    expect(component.template.confirmButton.disabled).toBe(true);
    expect(component.template.errorText.textContent).not.toBe(" ");

    dispatchInput(component.template.input, "180");
    callbacks.onTempoChanged({} as InputEvent);
    expect(component.template.confirmButton.disabled).toBe(false);
    expect(component.template.errorText.textContent).toBe(" ");
  });

  test("confirm commits tempo, renders, closes dialog, and frees keyboard", () => {
    const {
      callbacks,
      component,
      notationComponent,
      renderFunc,
      freeKeyboard,
    } = createTempoHarness();

    component.template.input.value = "180";
    callbacks.onTempoChanged({} as InputEvent);
    callbacks.onConfirmClicked();

    expect(
      notationComponent.trackController.trackControllerEditor
        .setSelectedBarTempo
    ).toHaveBeenCalledWith(180);
    expect(renderFunc).toHaveBeenCalledTimes(1);
    expect(component.template.dialog.close).toHaveBeenCalledTimes(1);
    expect(freeKeyboard).toHaveBeenCalledTimes(1);
  });

  test("dialog clicks close only when clicking outside content", () => {
    const { callbacks, component, freeKeyboard } = createTempoHarness();
    const outsideTarget = new FakeElement();

    callbacks.onDialogClicked({
      target: component.template.dialogContent,
    } as any);
    expect(component.template.dialog.close).not.toHaveBeenCalled();

    callbacks.onDialogClicked({ target: outsideTarget } as any);
    expect(component.template.dialog.close).toHaveBeenCalledTimes(1);
    expect(freeKeyboard).toHaveBeenCalledTimes(1);
  });

  test("bind and unbind wire events once even across repeated bind", () => {
    const {
      callbacks,
      component,
      notationComponent,
      renderFunc,
      freeKeyboard,
    } = createTempoHarness();
    const setTempo =
      notationComponent.trackController.trackControllerEditor
        .setSelectedBarTempo;

    callbacks.bind();
    dispatchInput(component.template.input, "200");
    dispatchClick(component.template.confirmButton);

    expect(setTempo).toHaveBeenCalledTimes(1);
    expect(renderFunc).toHaveBeenCalledTimes(1);

    const tempoCallsBeforeUnbind = setTempo.mock.calls.length;
    const renderCallsBeforeUnbind = renderFunc.mock.calls.length;
    callbacks.unbind();
    dispatchInput(component.template.input, "220");
    dispatchClick(component.template.confirmButton);
    expect(setTempo).toHaveBeenCalledTimes(tempoCallsBeforeUnbind);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeUnbind);

    callbacks.bind();
    callbacks.bind();
    const tempoCallsBeforeRebindClick = setTempo.mock.calls.length;
    const renderCallsBeforeRebindClick = renderFunc.mock.calls.length;
    const freeKeyboardCallsBeforeRebindClick = freeKeyboard.mock.calls.length;
    dispatchInput(component.template.input, "240");
    dispatchClick(component.template.confirmButton);
    expect(setTempo).toHaveBeenCalledTimes(tempoCallsBeforeRebindClick + 1);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeRebindClick + 1);
    expect(freeKeyboard).toHaveBeenCalledTimes(
      freeKeyboardCallsBeforeRebindClick + 1
    );
  });
});
