import { MeasureControlsDefaultCallbacks } from "../../src/callbacks/ui/measure-controls-callbacks";
import { TempoControlsDefaultCallbacks } from "../../src/callbacks/ui/tempo-controls-callbacks";
import { TimeSigControlsDefaultCallbacks } from "../../src/callbacks/ui/time-sig-controls-callbacks";
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

    expect(captureKeyboard).toHaveBeenCalledTimes(2);
    expect(component.showTempoControls).toHaveBeenCalledTimes(1);
    expect(component.showTimeSigControls).toHaveBeenCalledTimes(1);
    expect(
      notationComponent.trackController.setSelectedBarRepeatStatus
    ).toHaveBeenNthCalledWith(1, BarRepeatStatus.Start);
    expect(
      notationComponent.trackController.setSelectedBarRepeatStatus
    ).toHaveBeenNthCalledWith(2, BarRepeatStatus.End);
    expect(renderFunc).toHaveBeenCalledTimes(2);
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
});
