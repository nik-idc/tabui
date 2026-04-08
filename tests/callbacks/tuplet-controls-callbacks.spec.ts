import { TupletControlsDefaultCallbacks } from "../../src/callbacks/ui/tuplet-controls-callbacks";
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

function createTupletHarness() {
  const dialog = makeDialog();
  const dialogContent = new FakeElement();
  dialog.appendChild(dialogContent);
  const normalInput = makeInput("3");
  const input = makeInput("2");
  const confirmButton = makeButton();
  const cancelButton = makeButton();
  const normalErrorText = makeText();
  const tupletErrorText = makeText();
  const component = {
    template: {
      dialog,
      dialogContent,
      normalInput,
      input,
      confirmButton,
      cancelButton,
      normalErrorText,
      tupletErrorText,
    },
  } as any;
  const notationComponent = createNotationComponentMock();
  const renderFunc = jest.fn();
  const freeKeyboard = jest.fn();
  const callbacks = new TupletControlsDefaultCallbacks(
    component,
    notationComponent,
    renderFunc,
    jest.fn(),
    freeKeyboard
  );

  return { callbacks, component, notationComponent, renderFunc, freeKeyboard };
}

describe("TupletControlsDefaultCallbacks", () => {
  test("input validation updates confirm state and errors", () => {
    const { callbacks, component } = createTupletHarness();

    dispatchInput(component.template.normalInput, "1");
    callbacks.onNormalCountChanged({} as InputEvent);
    expect(component.template.confirmButton.disabled).toBe(true);
    expect(component.template.normalErrorText.textContent).not.toBe(" ");

    dispatchInput(component.template.normalInput, "5");
    callbacks.onNormalCountChanged({} as InputEvent);
    expect(component.template.confirmButton.disabled).toBe(false);
    expect(component.template.normalErrorText.textContent).toBe(" ");

    dispatchInput(component.template.input, "1");
    callbacks.onTupletCountChanged({} as InputEvent);
    expect(component.template.confirmButton.disabled).toBe(true);
    expect(component.template.tupletErrorText.textContent).not.toBe(" ");

    dispatchInput(component.template.input, "4");
    callbacks.onTupletCountChanged({} as InputEvent);
    expect(component.template.confirmButton.disabled).toBe(false);
    expect(component.template.tupletErrorText.textContent).toBe(" ");
  });

  test("confirm commits tuplet settings and lifecycle wiring is idempotent", () => {
    const {
      callbacks,
      component,
      notationComponent,
      renderFunc,
      freeKeyboard,
    } = createTupletHarness();
    const setTuplet =
      notationComponent.trackController.trackControllerEditor
        .setSelectedBeatsTuplet;

    callbacks.bind();
    callbacks.bind();
    const tupletCallsBeforeConfirm = setTuplet.mock.calls.length;
    const renderCallsBeforeConfirm = renderFunc.mock.calls.length;
    const freeKeyboardCallsBeforeConfirm = freeKeyboard.mock.calls.length;
    dispatchInput(component.template.normalInput, "5");
    dispatchInput(component.template.input, "4");
    dispatchClick(component.template.confirmButton);

    expect(setTuplet).toHaveBeenCalledTimes(tupletCallsBeforeConfirm + 1);
    expect(setTuplet).toHaveBeenCalledWith(5, 4);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeConfirm + 1);
    expect(component.template.dialog.close).toHaveBeenCalledTimes(1);
    expect(freeKeyboard).toHaveBeenCalledTimes(
      freeKeyboardCallsBeforeConfirm + 1
    );

    const tupletCallsBeforeUnbind = setTuplet.mock.calls.length;
    const renderCallsBeforeUnbind = renderFunc.mock.calls.length;
    callbacks.unbind();
    dispatchClick(component.template.confirmButton);
    expect(setTuplet).toHaveBeenCalledTimes(tupletCallsBeforeUnbind);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeUnbind);
  });
});
