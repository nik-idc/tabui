import { NoteControlsDefaultCallbacks } from "../../src/ui/side-controls/note-controls/note-controls-callbacks";
import { TupletControlsDefaultCallbacks } from "../../src/ui/side-controls/note-controls/tuplet-controls/tuplet-controls-callbacks";
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
        fretButton: makeButton(),
        restButton: makeButton(),
        dot1Button: makeButton(),
        dot2Button: makeButton(),
        insertBeatBeforeButton: makeButton(),
        insertBeatAfterButton: makeButton(),
        removeBeatButton: makeButton(),
        voiceButtons: [],
        tuplet2Button: makeButton(),
        tuplet3Button: makeButton(),
        tupletButton: makeButton(),
      },
      tupletComponent: {},
      fretComponent: {
        template: {
          dialog: makeButton(),
          dialogContent: makeButton(),
          noFretButton: makeButton(),
          deadButton: makeButton(),
          input: makeButton(),
          confirmButton: makeButton(),
          cancelButton: makeButton(),
        },
        showControls: jest.fn(),
      },
      showTupletControls: jest.fn(),
    } as any;
    const callbacks = new NoteControlsDefaultCallbacks(
      component,
      notationComponent,
      renderFunc,
      jest.fn(),
      captureKeyboard,
      jest.fn()
    );

    callbacks.bind();
    callbacks.bind();
    dispatchClick(durationButtons[0]);
    dispatchClick(component.template.dot2Button);
    dispatchClick(component.template.insertBeatBeforeButton);
    dispatchClick(component.template.insertBeatAfterButton);
    dispatchClick(component.template.removeBeatButton);
    dispatchClick(component.template.tuplet3Button);
    dispatchClick(component.template.tupletButton);

    expect(notationComponent.trackController.setDuration).toHaveBeenCalledWith(
      NoteDuration.Quarter
    );
    expect(notationComponent.trackController.setDots).toHaveBeenCalledWith(2);
    expect(
      notationComponent.trackController.insertBeatBeforeSelected
    ).toHaveBeenCalledTimes(1);
    expect(
      notationComponent.trackController.insertBeatAfterSelected
    ).toHaveBeenCalledTimes(1);
    expect(
      notationComponent.trackController.removeSelectedBeat
    ).toHaveBeenCalledTimes(1);
    expect(
      notationComponent.trackController.setSelectedBeatsTuplet
    ).toHaveBeenCalledWith(3, 2);
    expect(renderFunc).toHaveBeenCalledTimes(6);
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

  test("note callbacks dispatch in view-only mode", () => {
    const notationComponent = createNotationComponentMock();
    notationComponent.trackController.editingEnabled = false;
    const component = {
      template: { durationButtons: [], voiceButtons: [] },
      tupletComponent: {},
      showTupletControls: jest.fn(),
    } as any;
    const callbacks = new NoteControlsDefaultCallbacks(
      component,
      notationComponent,
      jest.fn(),
      jest.fn(),
      jest.fn(),
      jest.fn()
    );

    callbacks.onDurationClicked(NoteDuration.Quarter);
    callbacks.onTupletClicked();

    expect(notationComponent.trackController.setDuration).toHaveBeenCalledWith(
      NoteDuration.Quarter
    );
    expect(component.showTupletControls).toHaveBeenCalledTimes(1);
  });
});
