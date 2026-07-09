import { TrackSettingsControlsDefaultCallbacks } from "../../src/ui/top-controls/score-controls/track-controls/track-settings/track-settings-controls-callbacks";
import {
  ElectricGuitarTone,
  Guitar,
  InstrumentFamily,
  parseTuningStrSimple,
  StringInstrumentType,
} from "../../src/notation/model";
import {
  createNotationComponentMock,
  dispatchClick,
  dispatchInput,
  FakeElement,
  makeButton,
  makeDialog,
  makeInput,
  makeText,
} from "./helpers";

function createTrackSettingsHarness() {
  const dialog = makeDialog();
  const dialogContent = new FakeElement();
  dialog.appendChild(dialogContent);
  const trackNameInput = makeInput("Lead");
  const stringCountInput = makeInput("6");
  const tuningInput = makeInput("E A D G B E");
  const trackNameError = makeText();
  const stringCountError = makeText();
  const tuningError = makeText();
  const keepFretsButton = makeButton();
  const transposeButton = makeButton();
  const confirmButton = makeButton();
  const cancelButton = makeButton();
  const familyButtons = [
    makeButton() as any,
    makeButton() as any,
    makeButton() as any,
  ];
  const typeButtons = [makeButton(), makeButton(), makeButton(), makeButton()];
  const toneButtons = [makeButton(), makeButton(), makeButton()];
  const track = { name: "Track 1" };
  const component = {
    template: {
      dialog,
      dialogContent,
      trackNameInput,
      stringCountInput,
      tuningInput,
      trackNameError,
      stringCountError,
      tuningError,
      keepFretsButton,
      transposeButton,
      confirmButton,
      cancelButton,
      instrFamiliesButtons: familyButtons,
      instrTypesButtons: typeButtons,
      instrTonesButtons: toneButtons,
    },
    track,
    stringCount: 6,
    trackName: "Track 1",
    instrumentFamily: InstrumentFamily.Strings,
    instrumentType: StringInstrumentType.ElectricGuitar,
    setFamily: jest.fn(),
    setType: jest.fn(),
    setTone: jest.fn(),
    setTrackName: jest.fn((name: string) => {
      component.trackName = name;
    }),
    setStringCount: jest.fn((count: number) => {
      component.stringCount = count;
    }),
    setTuning: jest.fn(),
    setTuningChangeMode: jest.fn(),
    render: jest.fn(),
    applyTrackSettings: jest.fn(() => {
      component.track.name = component.trackName;
    }),
  } as any;
  const renderFunc = jest.fn();
  const freeKeyboard = jest.fn();
  const notationComponent = createNotationComponentMock();
  notationComponent.trackController.track = track;
  const callbacks = new TrackSettingsControlsDefaultCallbacks(
    component,
    notationComponent,
    renderFunc,
    jest.fn(),
    freeKeyboard
  );

  return { callbacks, component, notationComponent, renderFunc, freeKeyboard };
}

describe("TrackSettingsControlsDefaultCallbacks", () => {
  test("validation uses correct fields and lifecycle wiring is idempotent", () => {
    const {
      callbacks,
      component,
      notationComponent,
      renderFunc,
      freeKeyboard,
    } = createTrackSettingsHarness();

    dispatchInput(component.template.trackNameInput, "");
    callbacks.onTrackNameChanged();
    expect(component.template.trackNameError.textContent).toBe(
      callbacks.trackNameErrorText
    );
    expect(component.template.confirmButton.disabled).toBe(true);

    dispatchInput(component.template.trackNameInput, "Lead");
    callbacks.onTrackNameChanged();
    expect(component.template.trackNameError.textContent).toBe(" ");
    expect(component.setTrackName).toHaveBeenCalledWith("Lead");

    dispatchInput(component.template.stringCountInput, "0");
    callbacks.onStringCountChanged();
    expect(component.template.stringCountError.textContent).toBe(
      callbacks.stringCountErrorText
    );

    dispatchInput(component.template.stringCountInput, "7");
    callbacks.onStringCountChanged();
    expect(component.setStringCount).toHaveBeenCalledWith(7);

    dispatchInput(component.template.tuningInput, "invalid");
    callbacks.onTuningChange();
    expect(component.template.tuningError.textContent).toBe(
      callbacks.tuningErrorText
    );

    dispatchInput(component.template.tuningInput, "B E A D G B E");
    callbacks.onTuningChange();
    expect(component.template.tuningError.textContent).toBe(" ");
    expect(component.setTuning).toHaveBeenCalledWith("B E A D G B E");
    expect(component.render).toHaveBeenCalledTimes(1);

    callbacks.bind();
    callbacks.bind();

    dispatchClick(component.template.instrFamiliesButtons[0]);
    expect(component.setFamily).toHaveBeenCalledWith(InstrumentFamily.Strings);
    dispatchClick(component.template.instrTypesButtons[1]);
    expect(component.setType).toHaveBeenCalledWith(
      StringInstrumentType.ElectricGuitar
    );
    dispatchClick(component.template.instrTonesButtons[1]);
    expect(component.setTone).toHaveBeenCalledWith(
      ElectricGuitarTone.Overdrive
    );
    dispatchClick(component.template.transposeButton);
    expect(component.setTuningChangeMode).toHaveBeenCalledWith("transpose");
    dispatchClick(component.template.keepFretsButton);
    expect(component.setTuningChangeMode).toHaveBeenCalledWith("keepFrets");

    const renderCallsBeforeConfirm = renderFunc.mock.calls.length;
    const freeKeyboardCallsBeforeConfirm = freeKeyboard.mock.calls.length;
    dispatchClick(component.template.confirmButton);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeConfirm + 1);
    expect(notationComponent.loadTrack).toHaveBeenCalledWith(component.track);
    expect(component.template.dialog.close).toHaveBeenCalledTimes(1);
    expect(freeKeyboard).toHaveBeenCalledTimes(
      freeKeyboardCallsBeforeConfirm + 1
    );
    expect(component.track.name).toBe(component.trackName);
    expect(component.applyTrackSettings).toHaveBeenCalledTimes(1);

    const renderCallsBeforeUnbind = renderFunc.mock.calls.length;
    callbacks.unbind();
    dispatchClick(component.template.confirmButton);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeUnbind);
  });

  test("simple tuning strings use conventional low-to-high order", () => {
    const tunings = ["E A D G", "G D G B D", "D A F C G C"];

    for (const tuning of tunings) {
      const guitar = new Guitar(
        StringInstrumentType.ElectricGuitar,
        ElectricGuitarTone.Clean,
        "Custom",
        tuning.split(" ").length,
        parseTuningStrSimple(tuning)
      );

      expect(guitar.getTuningStrSimple()).toBe(tuning);
    }
  });
});
