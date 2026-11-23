/** @jest-environment jsdom */

import { resolveTabUIConfig } from "../../../src/config/tabui-config";
import { NotationComponent } from "../../../src/notation/notation-component";
import {
  Beat,
  BeatGuitarTechniqueType,
  NoteDuration,
  STROKE_ALIGNMENT_FALLS_ON_TIME,
  STROKE_DURATION_EIGHTH,
  STROKE_DURATION_QUARTER,
  StrokeDirection,
  StrokeOptions,
  ScoreEditor,
} from "../../../src/notation/model";
import { DialogEnforcer } from "../../../src/shared/hmtl/dialog-enforcer";
import { TechniqueControlsComponent } from "../../../src/ui/side-controls/technique-controls/technique-controls-component";
import { TechniqueControlsDefaultCallbacks } from "../../../src/ui/side-controls/technique-controls/technique-controls-callbacks";
import { createTestLayoutDimensions } from "../controller/helpers";
import { createBarWithBeats } from "../model/helpers";

/** Mounts technique controls with bound callbacks for one beat. */
function withStrokeControls(
  action: (fixture: {
    beat: Beat;
    notation: NotationComponent;
    controls: TechniqueControlsComponent;
  }) => void
): void {
  const { score, beats } = createBarWithBeats([
    { baseDuration: NoteDuration.Quarter },
  ]);
  const root = document.createElement("div");
  document.body.append(root);
  const notation = new NotationComponent(
    document.createElement("div"),
    score,
    resolveTabUIConfig(),
    createTestLayoutDimensions()
  );
  notation.trackController.setSelectedNoteFret(5);
  const enforcer = new DialogEnforcer(root, () => {});
  const controls = new TechniqueControlsComponent(
    root,
    enforcer,
    notation,
    () => {}
  );
  const callbacks = new TechniqueControlsDefaultCallbacks(
    controls,
    notation,
    () => controls.render()
  );
  controls.render();
  callbacks.bind();
  try {
    action({ beat: beats[0], notation, controls });
  } finally {
    controls.strokeControlsComponent.dialog.close();
    callbacks.unbind();
    notation.dispose();
    root.remove();
  }
}

function getStroke(beat: Beat): StrokeOptions | undefined {
  return beat.getBeatTechnique(BeatGuitarTechniqueType.Stroke)?.options;
}

/** Moves a range input like a user and fires its input event. */
function setRange(input: HTMLInputElement, value: number): void {
  input.value = `${value}`;
  input.dispatchEvent(new Event("input"));
}

describe("stroke controls", () => {
  test("the Stroke button opens settings and shows if the beat has a stroke", () => {
    withStrokeControls(({ beat, controls }) => {
      const button = controls.template.strokeButton;
      const dialog = controls.strokeControlsComponent.dialog;
      const t = controls.strokeControlsComponent.template;
      expect(button.getAttribute("aria-pressed")).toBe("false");

      button.click();
      expect(dialog.open).toBe(true);
      expect(getStroke(beat)).toBeUndefined();

      t.directionUpInput.checked = true;
      t.dialogContent.requestSubmit();
      expect(getStroke(beat)?.direction).toBe(StrokeDirection.Up);
      expect(button.getAttribute("aria-pressed")).toBe("true");
    });
  });

  test("the Stroke button is disabled on a rest", () => {
    withStrokeControls(({ notation, controls }) => {
      notation.trackController.setSelectedBeatRest();
      controls.render();
      expect(controls.template.strokeButton.disabled).toBe(true);
    });
  });

  test("settings open with the current stroke and apply edited values", () => {
    withStrokeControls(({ beat, controls }) => {
      ScoreEditor.setBeatTechnique([beat], BeatGuitarTechniqueType.Stroke, {
        strokeOptions: new StrokeOptions({
          direction: StrokeDirection.Down,
          duration: STROKE_DURATION_EIGHTH,
        }),
      });
      const t = controls.strokeControlsComponent.template;
      controls.template.strokeButton.click();

      expect(controls.strokeControlsComponent.dialog.open).toBe(true);
      expect(t.directionDownInput.checked).toBe(true);
      expect(t.durationInput.getAttribute("aria-valuetext")).toBe("8th note");
      expect(t.alignmentInput.getAttribute("aria-valuetext")).toBe(
        "Starts on time"
      );
      expect(t.removeButton.disabled).toBe(false);

      // One octave (12 steps) right doubles the duration; left end of
      // the timing slider is "falls on time".
      t.directionUpInput.checked = true;
      setRange(t.durationInput, Number(t.durationInput.value) + 12);
      setRange(t.alignmentInput, 0);
      expect(t.durationInput.getAttribute("aria-valuetext")).toBe(
        "Quarter note"
      );
      expect(t.alignmentInput.getAttribute("aria-valuetext")).toBe(
        "Falls on time"
      );
      t.dialogContent.requestSubmit();

      expect(controls.strokeControlsComponent.dialog.open).toBe(false);
      expect(getStroke(beat)).toEqual(
        new StrokeOptions({
          direction: StrokeDirection.Up,
          duration: STROKE_DURATION_QUARTER,
          alignment: STROKE_ALIGNMENT_FALLS_ON_TIME,
        })
      );
    });
  });

  test("an unmoved slider keeps a duration between slider steps", () => {
    withStrokeControls(({ beat, controls }) => {
      const duration = STROKE_DURATION_EIGHTH + 7;
      ScoreEditor.setBeatTechnique([beat], BeatGuitarTechniqueType.Stroke, {
        strokeOptions: new StrokeOptions({
          direction: StrokeDirection.Down,
          duration,
        }),
      });
      controls.template.strokeButton.click();
      controls.strokeControlsComponent.template.dialogContent.requestSubmit();
      expect(getStroke(beat)?.duration).toBe(duration);
    });
  });

  test("Remove is disabled without a stroke and removes an existing one", () => {
    withStrokeControls(({ beat, controls }) => {
      const t = controls.strokeControlsComponent.template;
      controls.template.strokeButton.click();
      expect(t.removeButton.disabled).toBe(true);
      t.cancelButton.click();
      expect(controls.strokeControlsComponent.dialog.open).toBe(false);

      // Confirm adds a stroke; opening again enables Remove.
      controls.template.strokeButton.click();
      t.dialogContent.requestSubmit();
      expect(getStroke(beat)).toBeDefined();
      controls.template.strokeButton.click();
      expect(t.removeButton.disabled).toBe(false);
      t.removeButton.click();
      expect(getStroke(beat)).toBeUndefined();
      expect(controls.strokeControlsComponent.dialog.open).toBe(false);
    });
  });
});
