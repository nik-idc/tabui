import { NoteControlsDefaultCallbacks } from "../../src/callbacks/ui/note-controls-callbacks";
import { TupletControlsDefaultCallbacks } from "../../src/callbacks/ui/tuplet-controls-callbacks";
import { NoteDuration } from "../../src/notation/model";
import {
  createNotationComponentMock,
  dispatchClick,
  makeButton,
} from "./helpers";

describe("NoteControlsDefaultCallbacks", () => {
  test("buttons map to note actions and repeated bind does not double fire", () => {
    const tupletBindSpy = jest
      .spyOn(TupletControlsDefaultCallbacks.prototype, "bind")
      .mockImplementation(() => {});
    const tupletUnbindSpy = jest
      .spyOn(TupletControlsDefaultCallbacks.prototype, "unbind")
      .mockImplementation(() => {});

    const notationComponent = createNotationComponentMock();
    const renderFunc = jest.fn();
    const captureKeyboard = jest.fn();
    const durationButtons = [makeButton(), makeButton()];
    durationButtons[0].dataset.duration = "4";
    durationButtons[1].dataset.duration = "8";
    const component = {
      template: {
        durationButtons,
        dot1Button: makeButton(),
        dot2Button: makeButton(),
        tuplet2Button: makeButton(),
        tuplet3Button: makeButton(),
        tupletButton: makeButton(),
      },
      tupletComponent: {},
      showTupletControls: jest.fn(),
    } as any;
    const callbacks = new NoteControlsDefaultCallbacks(
      component,
      notationComponent,
      renderFunc,
      captureKeyboard,
      jest.fn()
    );

    callbacks.bind();
    callbacks.bind();
    dispatchClick(durationButtons[0]);
    dispatchClick(component.template.dot2Button);
    dispatchClick(component.template.tuplet3Button);
    dispatchClick(component.template.tupletButton);

    expect(notationComponent.trackController.setDuration).toHaveBeenCalledWith(
      NoteDuration.Quarter
    );
    expect(notationComponent.trackController.setDots).toHaveBeenCalledWith(2);
    expect(
      notationComponent.trackController.setSelectedBeatsTuplet
    ).toHaveBeenCalledWith(3, 2);
    expect(renderFunc).toHaveBeenCalledTimes(3);
    expect(captureKeyboard).toHaveBeenCalledTimes(1);
    expect(component.showTupletControls).toHaveBeenCalledTimes(1);
    expect(tupletBindSpy).toHaveBeenCalledTimes(2);

    const renderCallsBeforeUnbind = renderFunc.mock.calls.length;
    const durationCallsBeforeUnbind =
      notationComponent.trackController.setDuration.mock.calls.length;
    callbacks.unbind();
    dispatchClick(durationButtons[1]);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeUnbind);
    expect(notationComponent.trackController.setDuration).toHaveBeenCalledTimes(
      durationCallsBeforeUnbind
    );
    expect(tupletUnbindSpy).toHaveBeenCalledTimes(1);

    expect(() => callbacks.onTupletNormalClicked(1)).toThrow(
      "Tuplet normal count has to be >= 2"
    );

    tupletBindSpy.mockRestore();
    tupletUnbindSpy.mockRestore();
  });
});
