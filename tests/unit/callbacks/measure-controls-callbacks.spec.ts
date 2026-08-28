import { MeasureControlsDefaultCallbacks } from "../../../src/ui/side-controls/measure-controls/measure-controls-callbacks";
import { TempoControlsDefaultCallbacks } from "../../../src/ui/side-controls/measure-controls/tempo-controls/tempo-controls-callbacks";
import { TimeSigControlsDefaultCallbacks } from "../../../src/ui/side-controls/measure-controls/time-sig-controls/time-sig-controls-callbacks";
import { RepeatCountControlsDefaultCallbacks } from "../../../src/ui/side-controls/measure-controls/repeat-count-controls/repeat-count-controls-callbacks";
import { BarRepeatStatus } from "../../../src/notation/model";
import {
  asNotationComponent,
  createNotationComponentMock,
  dispatchClick,
  makeButton,
} from "./helpers";

describe("MeasureControlsDefaultCallbacks", () => {
  test("top-level actions dispatch correctly and unbind stops events", () => {
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
    const repeatBindSpy = jest
      .spyOn(RepeatCountControlsDefaultCallbacks.prototype, "bind")
      .mockImplementation(() => {});
    const repeatUnbindSpy = jest
      .spyOn(RepeatCountControlsDefaultCallbacks.prototype, "unbind")
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
      repeatCountControlsComponent: {},
      showTempoControls: jest.fn(),
      showTimeSigControls: jest.fn(),
      showRepeatCountControls: jest.fn(),
    } as any;
    const callbacks = new MeasureControlsDefaultCallbacks(
      component,
      asNotationComponent(notationComponent),
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

    expect(captureKeyboard).toHaveBeenCalledTimes(3);
    expect(component.showTempoControls).toHaveBeenCalledTimes(1);
    expect(component.showTimeSigControls).toHaveBeenCalledTimes(1);
    expect(
      notationComponent.trackController.setSelectedBarRepeatStatus
    ).toHaveBeenNthCalledWith(1, BarRepeatStatus.Start);
    expect(component.showRepeatCountControls).toHaveBeenCalledTimes(1);
    expect(
      notationComponent.trackController.insertBarBeforeSelected
    ).toHaveBeenCalledTimes(1);
    expect(
      notationComponent.trackController.insertBarAfterSelected
    ).toHaveBeenCalledTimes(1);
    expect(
      notationComponent.trackController.removeSelectedBar
    ).toHaveBeenCalledTimes(1);
    expect(renderFunc).toHaveBeenCalledTimes(4);
    expect(tempoBindSpy).toHaveBeenCalledTimes(2);
    expect(timeBindSpy).toHaveBeenCalledTimes(2);
    expect(repeatBindSpy).toHaveBeenCalledTimes(2);

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
    expect(repeatUnbindSpy).toHaveBeenCalledTimes(1);

    tempoBindSpy.mockRestore();
    tempoUnbindSpy.mockRestore();
    timeBindSpy.mockRestore();
    timeUnbindSpy.mockRestore();
    repeatBindSpy.mockRestore();
    repeatUnbindSpy.mockRestore();
  });
});
