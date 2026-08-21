import { TimeSigControlsDefaultCallbacks } from "../../../src/ui/side-controls/measure-controls/time-sig-controls/time-sig-controls-callbacks";
import { NoteDuration } from "../../../src/notation/model";
import {
  asNotationComponent,
  createNotationComponentMock,
  dispatchClick,
  FakeElement,
  makeButton,
  makeDialog,
  makeText,
} from "./helpers";

function createTimeSigHarness() {
  const dialog = makeDialog();
  const dialogContent = new FakeElement();
  dialog.appendChild(dialogContent);
  const beatsControl = new FakeElement();
  const beatsDownButton = makeButton();
  const beatsValue = new FakeElement();
  beatsValue.textContent = "4";
  const beatsUpButton = makeButton();
  const durationSelect = new FakeElement();
  durationSelect.value = "4";
  const confirmButton = makeButton();
  const cancelButton = makeButton();
  const beatsErrorText = makeText();
  const durationErrorText = makeText();
  const component = {
    template: {
      dialog,
      dialogContent,
      beatsControl,
      beatsDownButton,
      beatsValue,
      beatsUpButton,
      durationSelect,
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
    asNotationComponent(notationComponent),
    renderFunc,
    jest.fn(),
    freeKeyboard
  );

  return { callbacks, component, notationComponent, renderFunc, freeKeyboard };
}

describe("TimeSigControlsDefaultCallbacks", () => {
  test("beats stepper clamps and duration selector validates", () => {
    const { callbacks, component } = createTimeSigHarness();

    callbacks.onBeatsStep(3);
    expect(component.template.beatsValue.textContent).toBe("7");
    callbacks.onBeatsStep(-100);
    expect(component.template.beatsValue.textContent).toBe("1");
    expect(component.template.beatsDownButton.disabled).toBe(true);

    component.template.durationSelect.value = "3";
    callbacks.onDurationChanged();
    expect(component.template.confirmButton.disabled).toBe(true);
    expect(component.template.durationErrorText.textContent).not.toBe(" ");

    component.template.durationSelect.value = "8";
    callbacks.onDurationChanged();
    expect(component.template.confirmButton.disabled).toBe(false);
    expect(component.template.durationErrorText.textContent).toBe(" ");
  });

  test("mouse wheel adjusts the beat count", () => {
    const { callbacks, component } = createTimeSigHarness();
    callbacks.bind();

    component.template.beatsControl.dispatch("wheel", {
      deltaY: -1,
      preventDefault: jest.fn(),
    });

    expect(component.template.beatsValue.textContent).toBe("5");
  });

  test("one valid field cannot re-enable confirm while the other is invalid", () => {
    const { callbacks, component, notationComponent } = createTimeSigHarness();

    component.template.beatsValue.textContent = "0";
    component.template.durationSelect.value = "8";
    callbacks.onConfirmClicked();

    expect(component.template.confirmButton.disabled).toBe(true);
    expect(
      notationComponent.trackController.setSelectedBarTimeSignature
    ).not.toHaveBeenCalled();
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
      notationComponent.trackController.setSelectedBarTimeSignature;

    callbacks.bind();
    callbacks.bind();
    component.template.beatsValue.textContent = "7";
    component.template.durationSelect.value = "8";
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
