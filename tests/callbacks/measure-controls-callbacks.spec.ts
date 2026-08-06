import { MeasureControlsDefaultCallbacks } from "../../src/ui/side-controls/measure-controls/measure-controls-callbacks";
import { TempoControlsDefaultCallbacks } from "../../src/ui/side-controls/measure-controls/tempo-controls/tempo-controls-callbacks";
import { TimeSigControlsDefaultCallbacks } from "../../src/ui/side-controls/measure-controls/time-sig-controls/time-sig-controls-callbacks";
import { BarRepeatStatus } from "../../src/notation/model";
import {
  createNotationComponentMock,
  dispatchClick,
  makeButton,
} from "./helpers";

describe("MeasureControlsDefaultCallbacks", () => {
  test("top-level actions dispatch correctly and child callbacks are bound idempotently", () => {
    const tempoBindSpy = jest
      .spyOn(TempoControlsDefaultCallbacks.prototype, "bind")
      .mockImplementation(() => {});
    const tempoUnbindSpy = jest
      .spyOn(TempoControlsDefaultCallbacks.prototype, "unbind")
      .mockImplementation(() => {});
    const timeBindSpy = jest
      .spyOn(TimeSigControlsDefaultCallbacks.prototype, "bind")
      .mockImplementation(() => {});
    const timeUnbindSpy = jest
      .spyOn(TimeSigControlsDefaultCallbacks.prototype, "unbind")
      .mockImplementation(() => {});

    const notationComponent = createNotationComponentMock();
    const renderFunc = jest.fn();
    const captureKeyboard = jest.fn();
    const component = {
      template: {
        tempoButton: makeButton(),
        timeSignatureButton: makeButton(),
        repeatStartButton: makeButton(),
        repeatEndButton: makeButton(),
        insertBarBeforeButton: makeButton(),
        insertBarAfterButton: makeButton(),
        removeBarButton: makeButton(),
      },
      tempoControlsComponent: {},
      timeSigControlsComponent: {},
      showTempoControls: jest.fn(),
      showTimeSigControls: jest.fn(),
    } as any;
    const callbacks = new MeasureControlsDefaultCallbacks(
      component,
      notationComponent,
      renderFunc,
      captureKeyboard,
      jest.fn()
    );

    callbacks.bind();
    callbacks.bind();

    dispatchClick(component.template.tempoButton);
    dispatchClick(component.template.timeSignatureButton);
    dispatchClick(component.template.repeatStartButton);
    dispatchClick(component.template.repeatEndButton);
    dispatchClick(component.template.insertBarBeforeButton);
    dispatchClick(component.template.insertBarAfterButton);
    dispatchClick(component.template.removeBarButton);

    expect(captureKeyboard).toHaveBeenCalledTimes(2);
    expect(component.showTempoControls).toHaveBeenCalledTimes(1);
    expect(component.showTimeSigControls).toHaveBeenCalledTimes(1);
    expect(
      notationComponent.trackController.setSelectedBarRepeatStatus
    ).toHaveBeenNthCalledWith(1, BarRepeatStatus.Start);
    expect(
      notationComponent.trackController.setSelectedBarRepeatStatus
    ).toHaveBeenNthCalledWith(2, BarRepeatStatus.End);
    expect(
      notationComponent.trackController.insertBarBeforeSelected
    ).toHaveBeenCalledTimes(1);
    expect(
      notationComponent.trackController.insertBarAfterSelected
    ).toHaveBeenCalledTimes(1);
    expect(
      notationComponent.trackController.removeSelectedBar
    ).toHaveBeenCalledTimes(1);
    expect(renderFunc).toHaveBeenCalledTimes(5);
    expect(tempoBindSpy).toHaveBeenCalledTimes(2);
    expect(timeBindSpy).toHaveBeenCalledTimes(2);

    const renderCallsBeforeUnbind = renderFunc.mock.calls.length;
    const repeatStatusCallsBeforeUnbind =
      notationComponent.trackController.setSelectedBarRepeatStatus.mock.calls
        .length;
    callbacks.unbind();
    dispatchClick(component.template.repeatStartButton);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeUnbind);
    expect(
      notationComponent.trackController.setSelectedBarRepeatStatus
    ).toHaveBeenCalledTimes(repeatStatusCallsBeforeUnbind);
    expect(tempoUnbindSpy).toHaveBeenCalledTimes(1);
    expect(timeUnbindSpy).toHaveBeenCalledTimes(1);

    tempoBindSpy.mockRestore();
    tempoUnbindSpy.mockRestore();
    timeBindSpy.mockRestore();
    timeUnbindSpy.mockRestore();
  });

  test("measure callbacks dispatch in view-only mode", () => {
    const notationComponent = createNotationComponentMock();
    notationComponent.trackController.editingEnabled = false;
    const component = {
      template: {},
      tempoControlsComponent: {},
      timeSigControlsComponent: {},
      showTempoControls: jest.fn(),
      showTimeSigControls: jest.fn(),
    } as any;
    const callbacks = new MeasureControlsDefaultCallbacks(
      component,
      notationComponent,
      jest.fn(),
      jest.fn(),
      jest.fn()
    );

    callbacks.onTempoClicked();
    callbacks.onTimeSignatureClicked();

    expect(component.showTempoControls).toHaveBeenCalledTimes(1);
    expect(component.showTimeSigControls).toHaveBeenCalledTimes(1);
  });
});
