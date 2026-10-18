/** @jest-environment jsdom */

import { resolveTabUIConfig } from "../../../src/config/tabui-config";
import { NotationComponent } from "../../../src/notation/notation-component";
import {
  ElectricGuitarTone,
  Guitar,
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
  const keyboard = { released: false };
  const callbacks = new NewTrackControlsDefaultCallbacks(
    controls,
    notation,
    () => {
      controls.render();
      callbacks.bind();
    },
    () => {},
    () => {
      keyboard.released = true;
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
    keyboard,
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
    expect(fixture.keyboard.released).toBe(true);

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
    controls.template.instrFamiliesButtons[0].click();
    expect(controls.instrumentType).toBe(StringInstrumentType.AcousticGuitar);
    controls.template.instrTypesButtons[1].click();
    controls.template.instrTonesButtons[1].click();
    controls.template.stringCountDownButton.click();
    expect(controls.stringCount).toBe(5);
    expect(controls.tuning).toBe("G D G B D");
    controls.template.stringCountUpButton.click();
    expect(controls.stringCount).toBe(6);
    expect(controls.tuning).toBe("E A D G B E");
    controls.template.stringCountUpButton.click();
    expect(controls.stringCount).toBe(7);
    expect(controls.tuning).toBe("B E A D G B E");
    // The seventh tuning control was created by the string-count render.
    controls.template.tuningUpButtons[6].click();
    expect(controls.tuning).toBe("B E A D G B F");
    controls.template.tuningUpButtons[1].click();
    expect(controls.tuning).toBe("B F A D G B F");
    controls.template.tuningDownButtons[2].click();
    expect(controls.tuning).toBe("B F G# D G B F");
    controls.template.wholeTuningUpButton.click();
    expect(controls.tuning).toBe("C F# A D# G# C F#");
    controls.template.wholeTuningDownButton.click();
    expect(controls.tuning).toBe("B F G# D G B F");

    controls.template.confirmButton.click();
    expect(score.tracks).toHaveLength(2);
    const instrument = score.tracks[1].context.instrument;
    expect(instrument).toBeInstanceOf(Guitar);
    if (!(instrument instanceof Guitar)) throw Error("Expected a guitar");
    expect(instrument.type).toBe(StringInstrumentType.ElectricGuitar);
    expect(instrument.tone).toBe(ElectricGuitarTone.Overdrive);
    expect(instrument.stringsCount).toBe(7);
    expect(instrument.getTuningStrSimple()).toBe("B F G# D G B F");
  });
});
