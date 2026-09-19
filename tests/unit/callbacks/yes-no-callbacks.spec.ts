import { YesNoDefaultCallbacks } from "../../../src/ui/shared/yes-no/yes-no-callbacks";
import {
  asNotationComponent,
  createNotationComponentMock,
  dispatchClick,
  FakeElement,
  makeButton,
  makeDialogFixture,
} from "./helpers";

function createYesNoHarness() {
  const { dialog, dialogContainer } = makeDialogFixture();
  const yesNoDialogContent = new FakeElement();
  dialogContainer.appendChild(yesNoDialogContent);
  const confirmButton = makeButton();
  const cancelButton = makeButton();
  const onConfirm = jest.fn();
  const renderFunc = jest.fn();
  const freeKeyboard = jest.fn();
  const callbacks = new YesNoDefaultCallbacks(
    {
      dialog,
      template: {
        dialogContainer,
        yesNoDialogContent,
        confirmButton,
        cancelButton,
      },
    } as any,
    asNotationComponent(createNotationComponentMock()),
    renderFunc,
    jest.fn(),
    freeKeyboard,
    onConfirm
  );

  return {
    callbacks,
    component: { dialog, yesNoDialogContent, confirmButton, cancelButton },
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
    class RuntimeNode {}
    Object.defineProperty(globalThis, "Node", {
      configurable: true,
      value: RuntimeNode,
    });
    const insideTarget = new RuntimeNode();
    component.yesNoDialogContent.contains = jest.fn(
      (target) => target === insideTarget
    );

    callbacks.onDialogClicked({ target: insideTarget } as any);
    expect(component.dialog.close).not.toHaveBeenCalled();

    callbacks.bind();
    callbacks.onDialogClicked({ target: outsideTarget } as any);
    expect(component.dialog.close).toHaveBeenCalledTimes(1);
    expect(freeKeyboard).toHaveBeenCalledTimes(1);

    callbacks.bind();
    const confirmCallsBefore = onConfirm.mock.calls.length;
    const renderCallsBefore = renderFunc.mock.calls.length;
    component.yesNoDialogContent.dispatch("submit");
    expect(onConfirm).toHaveBeenCalledTimes(confirmCallsBefore + 1);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBefore + 1);

    const confirmCallsBeforeUnbind = onConfirm.mock.calls.length;
    callbacks.unbind();
    component.yesNoDialogContent.dispatch("submit");
    expect(onConfirm).toHaveBeenCalledTimes(confirmCallsBeforeUnbind);

    callbacks.bind();
    const closeCallsBeforeCancel = component.dialog.close.mock.calls.length;
    dispatchClick(component.cancelButton);
    expect(component.dialog.close).toHaveBeenCalledTimes(
      closeCallsBeforeCancel + 1
    );
  });
});
