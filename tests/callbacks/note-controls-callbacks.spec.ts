import { NoteControlsDefaultCallbacks } from "../../src/ui/side-controls/note-controls/note-controls-callbacks";
import { NoteDuration } from "../../src/notation/model";
import {
  asNotationComponent,
  createNotationComponentMock,
  dispatchClick,
  makeButton,
} from "./helpers";

describe("NoteControlsDefaultCallbacks", () => {
  test("buttons map to note actions and repeated bind does not double fire", () => {
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
      tupletComponent: {
        template: {
          dialog: makeButton(),
          normalDownButton: makeButton(),
          normalUpButton: makeButton(),
          normalControl: makeButton(),
          tupletDownButton: makeButton(),
          tupletUpButton: makeButton(),
          tupletControl: makeButton(),
          confirmButton: makeButton(),
          cancelButton: makeButton(),
        },
      },
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
      asNotationComponent(notationComponent),
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

    const renderCallsBeforeUnbind = renderFunc.mock.calls.length;
    const durationCallsBeforeUnbind =
      notationComponent.trackController.setDuration.mock.calls.length;
    callbacks.unbind();
    dispatchClick(durationButtons[1]);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeUnbind);
    expect(notationComponent.trackController.setDuration).toHaveBeenCalledTimes(
      durationCallsBeforeUnbind
    );

    expect(() => callbacks.onTupletNormalClicked(1)).toThrow(
      "Tuplet normal count has to be >= 2"
    );
  });

  test("rejects unsupported voice numbers from button datasets", () => {
    const notationComponent = createNotationComponentMock();
    const voiceButton = makeButton();
    voiceButton.dataset.voiceNumber = "5";
    const component = {
      template: {
        durationButtons: [],
        voiceButtons: [voiceButton],
        fretButton: makeButton(),
        restButton: makeButton(),
        dot1Button: makeButton(),
        dot2Button: makeButton(),
        insertBeatBeforeButton: makeButton(),
        insertBeatAfterButton: makeButton(),
        removeBeatButton: makeButton(),
        tuplet2Button: makeButton(),
        tuplet3Button: makeButton(),
        tupletButton: makeButton(),
      },
      tupletComponent: {
        template: {
          dialog: makeButton(),
          normalDownButton: makeButton(),
          normalUpButton: makeButton(),
          normalControl: makeButton(),
          tupletDownButton: makeButton(),
          tupletUpButton: makeButton(),
          tupletControl: makeButton(),
          confirmButton: makeButton(),
          cancelButton: makeButton(),
        },
      },
      fretComponent: {
        template: {
          dialog: makeButton(),
          noFretButton: makeButton(),
          deadButton: makeButton(),
          input: makeButton(),
          confirmButton: makeButton(),
          cancelButton: makeButton(),
        },
        showControls: jest.fn(),
      },
    } as any;
    const callbacks = new NoteControlsDefaultCallbacks(
      component,
      asNotationComponent(notationComponent),
      jest.fn(),
      jest.fn(),
      jest.fn(),
      jest.fn()
    );

    callbacks.bind();

    expect(() => dispatchClick(voiceButton)).toThrow(
      "Unsupported voice number: 5"
    );
  });
});
