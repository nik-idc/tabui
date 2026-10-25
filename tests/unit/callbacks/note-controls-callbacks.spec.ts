/** @jest-environment jsdom */

import { resolveTabUIConfig } from "../../../src/config/tabui-config";
import { NotationComponent } from "../../../src/notation/notation-component";
import { GuitarNote, NoteDuration } from "../../../src/notation/model";
import { DialogEnforcer } from "../../../src/shared/hmtl/dialog-enforcer";
import { NoteControlsComponent } from "../../../src/ui/side-controls/note-controls/note-controls-component";
import { NoteControlsDefaultCallbacks } from "../../../src/ui/side-controls/note-controls/note-controls-callbacks";
import { createTestLayoutDimensions } from "../controller/helpers";
import { createBarWithBeats } from "../model/helpers";
import { required } from "../required";

function createControls() {
  const { score, beats } = createBarWithBeats([
    { baseDuration: NoteDuration.Eighth },
  ]);
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
  const controls = new NoteControlsComponent(
    controlsHost,
    enforcer,
    notation,
    () => {}
  );
  let keyboardCaptured = false;
  const callbacks = new NoteControlsDefaultCallbacks(
    controls,
    notation,
    () => controls.render(),
    () => controls.render(),
    () => {
      keyboardCaptured = true;
    },
    () => {
      keyboardCaptured = false;
    }
  );
  controls.render();

  return {
    beat: beats[0],
    controller: notation.trackController,
    controls,
    callbacks,
    enforcer,
    get keyboardCaptured() {
      return keyboardCaptured;
    },
    dispose() {
      controls.tupletComponent.dialog.close();
      controls.fretComponent.dialog.close();
      callbacks.unbind();
      notation.dispose();
      root.remove();
    },
  };
}

describe("NoteControlsDefaultCallbacks", () => {
  let fixture: ReturnType<typeof createControls>;

  beforeEach(() => {
    fixture = createControls();
  });
  afterEach(() => {
    fixture.dispose();
  });

  test("duration, double dot, and triplet controls edit the selected beat and undo independently", () => {
    const { callbacks, controls, beat, controller } = fixture;
    callbacks.bind();
    callbacks.bind();

    controls.template.durationButtons[2].click();
    expect(beat.baseDuration).toBe(NoteDuration.Quarter);
    controls.template.dot2Button.click();
    expect(beat.dots).toBe(2);
    controls.template.tuplet3Button.click();
    expect(beat.tupletSettings).toEqual({ normalCount: 3, tupletCount: 2 });

    controller.undo();
    expect(beat.tupletSettings).toBeNull();
    expect(beat.dots).toBe(2);
    controller.undo();
    expect(beat.dots).toBe(0);
    expect(beat.baseDuration).toBe(NoteDuration.Quarter);
    controller.undo();
    expect(beat.baseDuration).toBe(NoteDuration.Eighth);
  });

  test("repeated binding inserts before and after, then removes one beat per click", () => {
    const { callbacks, controls, beat, controller } = fixture;
    const voiceBar = beat.voiceBar;
    (required(beat.notes)[0] as GuitarNote).fret = 7;
    const frets = () =>
      voiceBar.beats.map((b) => (required(b.notes)[0] as GuitarNote).fret);
    callbacks.bind();
    callbacks.bind();

    controls.template.insertBeatBeforeButton.click();
    const before = required(controller.selectionCursor).beat;
    expect(before).not.toBe(beat);
    expect(frets()).toEqual([null, 7]);

    controls.template.insertBeatAfterButton.click();
    const after = required(controller.selectionCursor).beat;
    expect(after).not.toBe(before);
    expect(frets()).toEqual([null, null, 7]);

    controls.template.removeBeatButton.click();
    expect(frets()).toEqual([null, 7]);
    controller.undo();
    expect(frets()).toEqual([null, null, 7]);
    controller.undo();
    expect(frets()).toEqual([null, 7]);
    controller.undo();
    expect(frets()).toEqual([7]);
    controller.redo();
    expect(frets()).toEqual([null, 7]);
    controller.redo();
    expect(frets()).toEqual([null, null, 7]);
    controller.redo();
    expect(frets()).toEqual([null, 7]);
  });

  test("unbinding removes duration listeners and leaves edit history unchanged", () => {
    const { callbacks, controls, beat, controller } = fixture;
    callbacks.bind();
    controls.template.durationButtons[2].click();
    callbacks.unbind();

    controls.template.durationButtons[3].click();
    expect(beat.baseDuration).toBe(NoteDuration.Quarter);
    controller.undo();
    expect(beat.baseDuration).toBe(NoteDuration.Eighth);
    controller.redo();
    expect(beat.baseDuration).toBe(NoteDuration.Quarter);
  });

  test("custom tuplets open a contained dialog and release keyboard ownership on cancel", () => {
    const { callbacks, controls, enforcer } = fixture;
    callbacks.bind();
    callbacks.bind();

    controls.template.tupletButton.click();
    expect(controls.tupletComponent.dialog.open).toBe(true);
    expect(enforcer.activeDialog).toBe(controls.tupletComponent.dialog);
    expect(fixture.keyboardCaptured).toBe(true);

    controls.tupletComponent.template.cancelButton.click();
    expect(controls.tupletComponent.dialog.open).toBe(false);
    expect(enforcer.activeDialog).toBeUndefined();
    expect(fixture.keyboardCaptured).toBe(false);
  });

  test("rejects an invalid tuplet preset without editing the selected beat", () => {
    expect(() => fixture.callbacks.onTupletNormalClicked(1)).toThrow(Error);
    expect(fixture.beat.tupletSettings).toBeNull();
  });
});
