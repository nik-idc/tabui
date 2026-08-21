import { TrackSettingsControlsDefaultCallbacks } from "../../src/ui/top-controls/score-controls/track-controls/track-settings/track-settings-controls-callbacks";
import { TrackSettingsControlsComponent } from "../../src/ui/top-controls/score-controls/track-controls/track-settings/track-settings-controls-component";
import {
  ElectricGuitarTone,
  Guitar,
  InstrumentFamily,
  StringInstrumentType,
  TrackInstrumentChangeMode,
} from "../../src/notation/model";
import {
  asNotationComponent,
  createNotationComponentMock,
  dispatchClick,
  FakeElement,
  makeButton,
  makeDialog,
  makeText,
} from "./helpers";

function createTrackSettingsHarness() {
  const dialog = makeDialog();
  const dialogContent = new FakeElement();
  dialog.appendChild(dialogContent);
  const tuningUpButtons = [makeButton(), makeButton(), makeButton()];
  const tuningDownButtons = [makeButton(), makeButton(), makeButton()];
  const wholeTuningUpButton = makeButton();
  const wholeTuningDownButton = makeButton();
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
  const notationComponent = createNotationComponentMock();
  const track = notationComponent.score.tracks[0];
  track.name = "Track 1";
  const madeInstrument = new Guitar();
  const component = {
    template: {
      dialog,
      dialogContent,
      tuningUpButtons,
      tuningDownButtons,
      wholeTuningUpButton,
      wholeTuningDownButton,
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
    tuningChangeMode: TrackInstrumentChangeMode.KeepFrets,
    setFamily: jest.fn(),
    setType: jest.fn(),
    setTone: jest.fn(),
    shiftTuningString: jest.fn(),
    shiftWholeTuning: jest.fn(),
    setTuningChangeMode: jest.fn(),
    render: jest.fn(),
    makeInstrument: jest.fn(() => madeInstrument),
  } as any;
  const renderFunc = jest.fn();
  const freeKeyboard = jest.fn();
  notationComponent.trackController.track = track;
  const callbacks = new TrackSettingsControlsDefaultCallbacks(
    component,
    asNotationComponent(notationComponent),
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
    dispatchClick(component.template.tuningUpButtons[1]);
    expect(component.shiftTuningString).toHaveBeenCalledWith(1, 1);
    dispatchClick(component.template.tuningDownButtons[2]);
    expect(component.shiftTuningString).toHaveBeenCalledWith(2, -1);
    dispatchClick(component.template.wholeTuningUpButton);
    expect(component.shiftWholeTuning).toHaveBeenCalledWith(1);
    dispatchClick(component.template.wholeTuningDownButton);
    expect(component.shiftWholeTuning).toHaveBeenCalledWith(-1);
    dispatchClick(component.template.transposeButton);
    expect(component.setTuningChangeMode).toHaveBeenCalledWith(
      TrackInstrumentChangeMode.Transpose
    );
    dispatchClick(component.template.keepFretsButton);
    expect(component.setTuningChangeMode).toHaveBeenCalledWith(
      TrackInstrumentChangeMode.KeepFrets
    );

    const renderCallsBeforeConfirm = renderFunc.mock.calls.length;
    const freeKeyboardCallsBeforeConfirm = freeKeyboard.mock.calls.length;
    dispatchClick(component.template.confirmButton);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeConfirm + 1);
    expect(notationComponent.loadTrack).toHaveBeenCalledWith(component.track);
    expect(component.template.dialog.close).toHaveBeenCalledTimes(1);
    expect(freeKeyboard).toHaveBeenCalledTimes(
      freeKeyboardCallsBeforeConfirm + 1
    );
    expect(
      notationComponent.trackController.setTrackInstrument
    ).toHaveBeenCalledWith(
      component.track,
      component.makeInstrument.mock.results[0].value,
      TrackInstrumentChangeMode.KeepFrets
    );

    const renderCallsBeforeUnbind = renderFunc.mock.calls.length;
    callbacks.unbind();
    dispatchClick(component.template.confirmButton);
    expect(renderFunc).toHaveBeenCalledTimes(renderCallsBeforeUnbind);
  });

  test("tuning steppers update conventional tuning string", () => {
    const component = Object.create(
      TrackSettingsControlsComponent.prototype
    ) as any;
    component._tuning = "E A D G B E";
    component.render = jest.fn();

    component.shiftTuningString(0, 1);
    expect(component._tuning).toBe("F A D G B E");

    component.shiftTuningString(1, -1);
    expect(component._tuning).toBe("F G# D G B E");

    component.shiftWholeTuning(1);
    expect(component._tuning).toBe("F# A D# G# C F");
    expect(component.render).toHaveBeenCalledTimes(3);
  });
});
