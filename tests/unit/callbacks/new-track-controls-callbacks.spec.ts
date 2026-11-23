/** @jest-environment jsdom */

import { resolveTabUIConfig } from "../../../src/config/tabui-config";
import { NotationComponent } from "../../../src/notation/notation-component";
import {
  AcousticGuitarTone,
  ElectricGuitarTone,
  Guitar,
  OtherStringTone,
  Score,
  StringInstrumentType,
} from "../../../src/notation/model";
import { DialogEnforcer } from "../../../src/shared/hmtl/dialog-enforcer";
import { NewTrackControlsDefaultCallbacks } from "../../../src/ui/top-controls/score-controls/new-track/new-track-controls-callbacks";
import { NewTrackControlsComponent } from "../../../src/ui/top-controls/score-controls/new-track/new-track-controls-component";
import { createTestLayoutDimensions } from "../controller/helpers";

function createControls() {
  const score = new Score();
  const root = document.createElement("div");
  const controlsHost = document.createElement("div");
  const notationHost = document.createElement("div");
  const dialogHost = document.createElement("div");
  root.append(controlsHost, notationHost, dialogHost);
  document.body.append(root);
  const notation = new NotationComponent(
    notationHost,
    score,
    resolveTabUIConfig(),
    createTestLayoutDimensions()
  );
  const enforcer = new DialogEnforcer(dialogHost, () => {});
  const controls = new NewTrackControlsComponent(
    controlsHost,
    enforcer,
    notation,
    () => {}
  );
  const callbacks = new NewTrackControlsDefaultCallbacks(
    controls,
    notation,
    () => {
      controls.render();
    }
  );
  controls.render();
  controls.dialog.showModal();

  return {
    score,
    notation,
    controls,
    callbacks,
    enforcer,
    dispose() {
      controls.dialog.close();
      callbacks.unbind();
      notation.dispose();
      root.remove();
    },
  };
}

describe("NewTrackControlsDefaultCallbacks", () => {
  let fixture: ReturnType<typeof createControls>;

  beforeEach(() => {
    fixture = createControls();
    fixture.callbacks.bind();
    fixture.callbacks.bind();
  });
  afterEach(() => {
    fixture.dispose();
  });

  test("invalid names block creation, then a trimmed name creates and selects one track", () => {
    const { controls, score, notation, enforcer } = fixture;
    for (const name of [" ", "a".repeat(33)]) {
      controls.template.trackNameInput.value = name;
      controls.template.trackNameInput.dispatchEvent(new Event("input"));
      expect(controls.template.trackNameError.textContent).toBe(
        "Invalid track name"
      );
      expect(controls.template.confirmButton.disabled).toBe(true);
      controls.template.dialogContent.dispatchEvent(
        new Event("submit", { cancelable: true })
      );
      expect(score.tracks).toHaveLength(1);
      expect(controls.dialog.open).toBe(true);
    }

    controls.template.trackNameInput.value = " Lead ";
    controls.template.trackNameInput.dispatchEvent(new Event("input"));
    expect(controls.trackName).toBe("Lead");
    expect(controls.template.trackNameError.textContent.trim()).toBe("");
    expect(controls.template.confirmButton.disabled).toBe(false);
    controls.template.confirmButton.click();
    expect(score.tracks).toHaveLength(2);
    expect(score.tracks[1].name).toBe("Lead");
    expect(notation.trackController.track).toBe(score.tracks[1]);
    expect(controls.dialog.open).toBe(false);
    expect(enforcer.activeDialog).toBeUndefined();

    controls.dialog.showModal();
    fixture.callbacks.unbind();
    controls.template.dialogContent.dispatchEvent(
      new Event("submit", { cancelable: true })
    );
    expect(score.tracks).toHaveLength(2);
    expect(controls.dialog.open).toBe(true);
  });

  test("instrument, string-count, and tuning controls determine the created instrument", () => {
    const { controls, score } = fixture;
    controls.template.instrTypesButtons[1].click();
    controls.template.instrTonesButtons[1].click();
    controls.template.stringCountDownButton.click();
    expect(controls.stringCount).toBe(5);
    expect(controls.tuning).toBe("E2 A2 D3 G3 B3");
    controls.template.stringCountUpButton.click();
    expect(controls.stringCount).toBe(6);
    expect(controls.tuning).toBe("E2 A2 D3 G3 B3 E4");
    controls.template.stringCountUpButton.click();
    expect(controls.stringCount).toBe(7);
    expect(controls.tuning).toBe("B1 E2 A2 D3 G3 B3 E4");
    // The seventh tuning control was created by the string-count render.
    controls.template.tuningUpButtons[6].click();
    expect(controls.tuning).toBe("B1 E2 A2 D3 G3 B3 F4");
    controls.template.tuningUpButtons[1].click();
    expect(controls.tuning).toBe("B1 F2 A2 D3 G3 B3 F4");
    controls.template.tuningDownButtons[2].click();
    expect(controls.tuning).toBe("B1 F2 G#2 D3 G3 B3 F4");
    controls.template.wholeTuningUpButton.click();
    expect(controls.tuning).toBe("C2 F#2 A2 D#3 G#3 C4 F#4");
    controls.template.wholeTuningDownButton.click();
    expect(controls.tuning).toBe("B1 F2 G#2 D3 G3 B3 F4");

    controls.template.confirmButton.click();
    expect(score.tracks).toHaveLength(2);
    const instrument = score.tracks[1].context.instrument;
    expect(instrument).toBeInstanceOf(Guitar);
    if (!(instrument instanceof Guitar)) {
      throw Error("Expected a guitar");
    }
    expect(instrument.type).toBe(StringInstrumentType.ElectricGuitar);
    expect(instrument.tone).toBe(ElectricGuitarTone.Overdrive);
    expect(instrument.stringsCount).toBe(7);
    // First string first; the added seventh string is a fourth below E2.
    expect(instrument.tuning.map((n) => `${n.noteValue}${n.octave}`)).toEqual([
      "F4",
      "B3",
      "G3",
      "D3",
      "G#2",
      "F2",
      "B1",
    ]);
  });

  test("an instrument with a different preset takes its strings and tuning", () => {
    const { controls, score } = fixture;
    controls.setType(StringInstrumentType.Other);
    controls.setTone(OtherStringTone.Ukulele);
    expect(controls.stringCount).toBe(4);
    expect(controls.tuning).toBe("G4 C4 E4 A4");

    controls.template.confirmButton.click();
    const instrument = score.tracks[1].context.instrument as Guitar;
    expect(instrument.tuning.map((n) => `${n.noteValue}${n.octave}`)).toEqual([
      "A4",
      "E4",
      "C4",
      "G4",
    ]);
    expect(instrument.fretsCount).toBe(15);
  });

  test("a tone with the same preset keeps the edited tuning", () => {
    const { controls } = fixture;
    controls.setType(StringInstrumentType.AcousticGuitar);
    controls.template.tuningDownButtons[0].click();
    controls.template.tuningDownButtons[0].click();
    expect(controls.tuning).toBe("D2 A2 D3 G3 B3 E4");
    controls.setTone(AcousticGuitarTone.Nylon);
    expect(controls.tuning).toBe("D2 A2 D3 G3 B3 E4");
    controls.setType(StringInstrumentType.BassGuitar);
    expect(controls.tuning).toBe("E1 A1 D2 G2");
  });

  test("raising B carries into the next octave", () => {
    const { controls, score } = fixture;
    // Second string, B3.
    controls.template.tuningUpButtons[4].click();
    expect(controls.tuning).toBe("E2 A2 D3 G3 C4 E4");
    controls.template.confirmButton.click();
    const instrument = score.tracks[1].context.instrument as Guitar;
    expect(instrument.tuning[1]).toEqual({ noteValue: "C", octave: 4 });
  });
});
