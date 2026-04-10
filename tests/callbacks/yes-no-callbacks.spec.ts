import { YesNoDefaultCallbacks } from "../../src/callbacks/ui/yes-no-callbacks";
import {
  createNotationComponentMock,
  dispatchClick,
  FakeElement,
  makeButton,
  makeDialog,
} from "./helpers";

function createYesNoHarness() {
  const yesNoDialog = makeDialog();
  const yesNoDialogContent = new FakeElement();
  yesNoDialog.appendChild(yesNoDialogContent);
  const confirmButton = makeButton();
  const cancelButton = makeButton();
  const onConfirm = jest.fn();
  const renderFunc = jest.fn();
  const freeKeyboard = jest.fn();
  const callbacks = new YesNoDefaultCallbacks(
    {
      template: {
        yesNoDialog,
        yesNoDialogContent,
        confirmButton,
        cancelButton,
      },
    } as any,
    createNotationComponentMock(),
    renderFunc,
    jest.fn(),
    freeKeyboard,
    onConfirm
  );

  return {
    callbacks,
    component: { yesNoDialog, yesNoDialogContent, confirmButton, cancelButton },
    onConfirm,
    renderFunc,
    freeKeyboard,
  };
}

describe("YesNoDefaultCallbacks", () => {
  test("confirm, cancel, and outside clicks behave correctly with lifecycle wiring", () => {
    const { callbacks, component, onConfirm, renderFunc, freeKeyboard } =
      createYesNoHarness();
    const outsideTarget = new FakeElement();

    callbacks.onDialogClicked({ target: component.yesNoDialogContent } as any);
    expect(component.yesNoDialog.close).not.toHaveBeenCalled();

    callbacks.onDialogClicked({ target: outsideTarget } as any);
    expect(component.yesNoDialog.close).toHaveBeenCalledTimes(1);
    expect(freeKeyboard).toHaveBeenCalledTimes(1);

    callbacks.bind();
    callbacks.bind();
    const confirmCallsBefore = onConfirm.mock.calls.length;
    const renderCallsBefore = renderFunc.mock.calls.length;
    dispatchClick(component.confirmButton);
    expect(onConfirm).toHaveBeenCalledTimes(confirmCallsBefore + 1);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBefore + 1);

    const confirmCallsBeforeUnbind = onConfirm.mock.calls.length;
    callbacks.unbind();
    dispatchClick(component.confirmButton);
    expect(onConfirm).toHaveBeenCalledTimes(confirmCallsBeforeUnbind);

    callbacks.bind();
    const closeCallsBeforeCancel =
      component.yesNoDialog.close.mock.calls.length;
    dispatchClick(component.cancelButton);
    expect(component.yesNoDialog.close).toHaveBeenCalledTimes(
      closeCallsBeforeCancel + 1
    );
  });
});
