import { TempoControlsDefaultCallbacks } from "../../src/ui/side-controls/measure-controls/tempo-controls/tempo-controls-callbacks";
import { DEFAULT_MASTER_BAR } from "../../src/notation/model";
import {
  createNotationComponentMock,
  dispatchClick,
  FakeElement,
  makeButton,
  makeDialog,
  makeText,
} from "./helpers";

function createTempoHarness() {
  const dialog = makeDialog();
  const dialogContent = new FakeElement();
  dialog.appendChild(dialogContent);
  const valueControl = new FakeElement();
  const decreaseTenButton = makeButton();
  const decreaseButton = makeButton();
  const value = new FakeElement();
  value.textContent = "120";
  const increaseButton = makeButton();
  const increaseTenButton = makeButton();
  const confirmButton = makeButton();
  const cancelButton = makeButton();
  const errorText = makeText();
  const component = {
    template: {
      dialog,
      dialogContent,
      valueControl,
      decreaseTenButton,
      decreaseButton,
      value,
      increaseButton,
      increaseTenButton,
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
  test("tempo buttons step and clamp the displayed value", () => {
    const { callbacks, component } = createTempoHarness();

    callbacks.onTempoStep(10);
    expect(component.template.value.textContent).toBe("130");
    callbacks.onTempoStep(-500);
    expect(component.template.value.textContent).toBe("1");
    expect(component.template.decreaseButton.disabled).toBe(true);
    expect(component.template.confirmButton.disabled).toBe(false);
  });

  test("a non-numeric displayed tempo resets to the model default on step", () => {
    const { callbacks, component } = createTempoHarness();
    component.template.value.textContent = "not a number";

    callbacks.onTempoStep(1);

    expect(component.template.value.textContent).toBe(
      `${DEFAULT_MASTER_BAR.tempo + 1}`
    );
  });

  test("mouse wheel adjusts tempo", () => {
    const { callbacks, component } = createTempoHarness();
    const preventDefault = jest.fn();
    callbacks.bind();

    component.template.valueControl.dispatch("wheel", {
      deltaY: -1,
      preventDefault,
    });

    expect(component.template.value.textContent).toBe("121");
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  test("confirm commits tempo, renders, closes dialog, and frees keyboard", () => {
    const {
      callbacks,
      component,
      notationComponent,
      renderFunc,
      freeKeyboard,
    } = createTempoHarness();

    callbacks.bind();
    component.template.value.textContent = "180";
    callbacks.onConfirmClicked();

    expect(
      notationComponent.trackController.setSelectedBarTempo
    ).toHaveBeenCalledWith(180);
    expect(renderFunc).toHaveBeenCalledTimes(1);
    expect(component.template.dialog.close).toHaveBeenCalledTimes(1);
    expect(freeKeyboard).toHaveBeenCalledTimes(1);
  });

  test("dialog clicks close only when clicking outside content", () => {
    const { callbacks, component, freeKeyboard } = createTempoHarness();
    const outsideTarget = new FakeElement();
    class RuntimeNode {}
    Object.defineProperty(globalThis, "Node", {
      configurable: true,
      value: RuntimeNode,
    });
    const insideTarget = new RuntimeNode();
    component.template.dialogContent.contains = jest.fn(
      (target) => target === insideTarget
    );
    callbacks.bind();

    callbacks.onDialogClicked({ target: insideTarget } as any);
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
    const setTempo = notationComponent.trackController.setSelectedBarTempo;

    callbacks.bind();
    component.template.value.textContent = "200";
    dispatchClick(component.template.confirmButton);

    expect(setTempo).toHaveBeenCalledTimes(1);
    expect(renderFunc).toHaveBeenCalledTimes(1);

    const tempoCallsBeforeUnbind = setTempo.mock.calls.length;
    const renderCallsBeforeUnbind = renderFunc.mock.calls.length;
    callbacks.unbind();
    component.template.value.textContent = "220";
    dispatchClick(component.template.confirmButton);
    expect(setTempo).toHaveBeenCalledTimes(tempoCallsBeforeUnbind);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeUnbind);

    callbacks.bind();
    callbacks.bind();
    const tempoCallsBeforeRebindClick = setTempo.mock.calls.length;
    const renderCallsBeforeRebindClick = renderFunc.mock.calls.length;
    const freeKeyboardCallsBeforeRebindClick = freeKeyboard.mock.calls.length;
    component.template.value.textContent = "240";
    dispatchClick(component.template.confirmButton);
    expect(setTempo).toHaveBeenCalledTimes(tempoCallsBeforeRebindClick + 1);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeRebindClick + 1);
    expect(freeKeyboard).toHaveBeenCalledTimes(
      freeKeyboardCallsBeforeRebindClick + 1
    );
  });
});
