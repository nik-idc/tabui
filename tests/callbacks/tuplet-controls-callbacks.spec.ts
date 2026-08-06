import { TupletControlsDefaultCallbacks } from "../../src/ui/side-controls/note-controls/tuplet-controls/tuplet-controls-callbacks";
import {
  createNotationComponentMock,
  dispatchClick,
  FakeElement,
  makeButton,
  makeDialog,
  makeText,
} from "./helpers";

function createTupletHarness() {
  const dialog = makeDialog();
  const dialogContent = new FakeElement();
  dialog.appendChild(dialogContent);
  const normalControl = new FakeElement();
  const normalDownButton = makeButton();
  const normalValue = new FakeElement();
  normalValue.textContent = "3";
  const normalUpButton = makeButton();
  const tupletControl = new FakeElement();
  const tupletDownButton = makeButton();
  const tupletValue = new FakeElement();
  tupletValue.textContent = "2";
  const tupletUpButton = makeButton();
  const confirmButton = makeButton();
  const cancelButton = makeButton();
  const normalErrorText = makeText();
  const tupletErrorText = makeText();
  const component = {
    template: {
      dialog,
      dialogContent,
      normalControl,
      normalDownButton,
      normalValue,
      normalUpButton,
      tupletControl,
      tupletDownButton,
      tupletValue,
      tupletUpButton,
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
  test("button controls step and clamp both tuplet values", () => {
    const { callbacks, component } = createTupletHarness();

    callbacks.onNormalCountStep(2);
    callbacks.onTupletCountStep(2);
    expect(component.template.normalValue.textContent).toBe("5");
    expect(component.template.tupletValue.textContent).toBe("4");
    callbacks.onTupletCountStep(-100);
    expect(component.template.tupletValue.textContent).toBe("2");
    expect(component.template.tupletDownButton.disabled).toBe(true);
  });

  test("mouse wheel adjusts each tuplet value independently", () => {
    const { callbacks, component } = createTupletHarness();
    callbacks.bind();

    component.template.normalControl.dispatch("wheel", {
      deltaY: -1,
      preventDefault: jest.fn(),
    });
    component.template.tupletControl.dispatch("wheel", {
      deltaY: -1,
      preventDefault: jest.fn(),
    });

    expect(component.template.normalValue.textContent).toBe("4");
    expect(component.template.tupletValue.textContent).toBe("3");
  });

  test("one valid field cannot re-enable confirm while the other is invalid", () => {
    const { callbacks, component, notationComponent } = createTupletHarness();

    component.template.normalValue.textContent = "1";
    component.template.tupletValue.textContent = "4";
    callbacks.onConfirmClicked();

    expect(component.template.confirmButton.disabled).toBe(true);
    expect(
      notationComponent.trackController.setSelectedBeatsTuplet
    ).not.toHaveBeenCalled();
  });

  test("confirm commits tuplet settings and lifecycle wiring is idempotent", () => {
    const {
      callbacks,
      component,
      notationComponent,
      renderFunc,
      freeKeyboard,
    } = createTupletHarness();
    const setTuplet = notationComponent.trackController.setSelectedBeatsTuplet;

    callbacks.bind();
    callbacks.bind();
    const tupletCallsBeforeConfirm = setTuplet.mock.calls.length;
    const renderCallsBeforeConfirm = renderFunc.mock.calls.length;
    const freeKeyboardCallsBeforeConfirm = freeKeyboard.mock.calls.length;
    component.template.normalValue.textContent = "5";
    component.template.tupletValue.textContent = "4";
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
