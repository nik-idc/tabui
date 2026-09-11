import { RepeatCountControlsDefaultCallbacks } from "../../../src/ui/side-controls/measure-controls/repeat-count-controls/repeat-count-controls-callbacks";
import {
  asNotationComponent,
  createNotationComponentMock,
  FakeElement,
  makeDialogFixture,
} from "./helpers";

test("rejects an invalid repeat count and accepts a valid one", () => {
  const { dialog, dialogContainer } = makeDialogFixture();
  const template = {
    dialogContainer,
    dialogContent: new FakeElement(),
    decreaseButton: new FakeElement(),
    increaseButton: new FakeElement(),
    value: new FakeElement(),
    valueControl: new FakeElement(),
    errorText: new FakeElement(),
    confirmButton: new FakeElement(),
    cancelButton: new FakeElement(),
    removeButton: new FakeElement(),
  };
  const notation = createNotationComponentMock();
  const render = jest.fn();
  const callbacks = new RepeatCountControlsDefaultCallbacks(
    { dialog, template } as any,
    asNotationComponent(notation),
    render,
    jest.fn()
  );
  callbacks.bind();

  template.value.value = "1.5";
  template.dialogContent.dispatch("submit");
  expect(template.errorText.textContent).toBe("Invalid repeat count");
  expect(
    notation.trackController.setSelectedBarRepeatStatus
  ).not.toHaveBeenCalled();

  template.value.value = "4";
  template.value.dispatch("input");
  template.dialogContent.dispatch("submit");

  expect(
    notation.trackController.setSelectedBarRepeatStatus
  ).toHaveBeenCalledTimes(1);
  expect(
    notation.trackController.setSelectedBarRepeatStatus
  ).toHaveBeenCalledWith(
    expect.objectContaining({ enabled: true, repeatCount: 4 })
  );
  expect(render).toHaveBeenCalledTimes(1);
});
