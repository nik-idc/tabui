/** @jest-environment jsdom */

import { resolveTabUIConfig } from "../../../src/config/tabui-config";
import { NotationComponent } from "../../../src/notation/notation-component";
import {
  ElectricGuitarTone,
  GuitarNote,
  StringInstrumentType,
  TrackInstrumentChangeMode,
} from "../../../src/notation/model";
import { DialogEnforcer } from "../../../src/shared/hmtl/dialog-enforcer";
import { TrackSettingsControlsDefaultCallbacks } from "../../../src/ui/top-controls/score-controls/track-controls/track-settings/track-settings-controls-callbacks";
import { TrackSettingsControlsComponent } from "../../../src/ui/top-controls/score-controls/track-controls/track-settings/track-settings-controls-component";
import { createTestLayoutDimensions } from "../controller/helpers";
import { createScoreGraph } from "../model/helpers";
import { required } from "../required";

function createControls() {
  const { score, track, bar } = createScoreGraph();
  const beat = required(bar.getVoiceBar(1)).beats[0];
  beat.makeBeatWithNotes();
  const note = required(beat.notes)[5] as GuitarNote;
  note.fret = 3;
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
  const controls = new TrackSettingsControlsComponent(
    controlsHost,
    enforcer,
    notation,
    track,
    () => {}
  );
  const keyboard = { released: false };
  const callbacks = new TrackSettingsControlsDefaultCallbacks(
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
    track,
    note,
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

describe("TrackSettingsControlsDefaultCallbacks", () => {
  let fixture: ReturnType<typeof createControls>;

  beforeEach(() => {
    fixture = createControls();
  });
  afterEach(() => {
    fixture.dispose();
  });

  test.each([
    [TrackInstrumentChangeMode.KeepFrets, 3, "F2"],
    [TrackInstrumentChangeMode.Transpose, 5, "G2"],
  ])(
    "confirming Drop D in %s mode changes the active track",
    (mode, fret, pitch) => {
      const { callbacks, controls, track, note, notation, enforcer } = fixture;
      callbacks.bind();
      callbacks.bind();
      controls.template.tuningDownButtons[0].click();
      controls.template.tuningDownButtons[0].click();
      expect(controls.tuning).toBe("D A D G B E");
      controls.template.transposeButton.click();
      if (mode === TrackInstrumentChangeMode.KeepFrets) {
        controls.template.keepFretsButton.click();
      }
      expect(controls.tuningChangeMode).toBe(mode);
      expect(track.context.instrument.getTuningStrSimple()).toBe("E A D G B E");

      controls.template.confirmButton.click();

      expect(track.context.instrument.getTuningStrSimple()).toBe("D A D G B E");
      expect(note.fret).toBe(fret);
      expect(note.getNoteStr()).toBe(pitch);
      expect(notation.trackController.track).toBe(track);
      expect(controls.dialog.open).toBe(false);
      expect(enforcer.activeDialog).toBeUndefined();
      expect(fixture.keyboard.released).toBe(true);
    }
  );

  test("instrument selection and tuning steppers update the draft once per click", () => {
    const { callbacks, controls, track } = fixture;
    callbacks.bind();
    callbacks.bind();
    controls.template.instrTypesButtons[1].click();
    controls.template.instrTonesButtons[1].click();
    expect(controls.makeInstrument().type).toBe(
      StringInstrumentType.ElectricGuitar
    );
    expect(controls.makeInstrument().tone).toBe(ElectricGuitarTone.Overdrive);
    controls.template.tuningUpButtons[0].click();
    expect(controls.tuning).toBe("F A D G B E");
    controls.template.tuningDownButtons[1].click();
    expect(controls.tuning).toBe("F G# D G B E");
    controls.template.wholeTuningUpButton.click();
    expect(controls.tuning).toBe("F# A D# G# C F");
    controls.template.wholeTuningDownButton.click();
    expect(controls.tuning).toBe("F G# D G B E");

    callbacks.unbind();
    controls.template.tuningUpButtons[0].click();
    controls.template.dialogContent.dispatchEvent(
      new Event("submit", { cancelable: true })
    );
    expect(controls.tuning).toBe("F G# D G B E");
    expect(track.context.instrument.getTuningStrSimple()).toBe("E A D G B E");
    expect(controls.dialog.open).toBe(true);
  });
});
