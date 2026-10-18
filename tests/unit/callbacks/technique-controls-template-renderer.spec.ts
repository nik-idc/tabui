/** @jest-environment jsdom */

import { resolveTabUIConfig } from "../../../src/config/tabui-config";
import { NotationComponent } from "../../../src/notation/notation-component";
import { SelectedMoveDirection } from "../../../src/notation/controller";
import { GuitarNote, NoteDuration } from "../../../src/notation/model";
import { TechniqueControlsTemplate } from "../../../src/ui/side-controls/technique-controls/technique-controls-template";
import { TechniqueControlsTemplateRenderer } from "../../../src/ui/side-controls/technique-controls/technique-controls-template-renderer";
import { createTestLayoutDimensions } from "../controller/helpers";
import { createBarWithBeats } from "../model/helpers";
import { required } from "../required";

describe("TechniqueControlsTemplateRenderer", () => {
  let notation: NotationComponent;
  let template: TechniqueControlsTemplate;
  let renderer: TechniqueControlsTemplateRenderer;

  beforeEach(() => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    for (const beat of beats) {
      (required(beat.notes)[0] as GuitarNote).fret = 5;
    }
    notation = new NotationComponent(
      document.createElement("div"),
      score,
      resolveTabUIConfig(),
      createTestLayoutDimensions()
    );
    template = new TechniqueControlsTemplate();
    renderer = new TechniqueControlsTemplateRenderer(
      document.createElement("div"),
      notation,
      template
    );
  });

  afterEach(() => notation.dispose());

  test.each([
    "vibratoButton",
    "palmMuteButton",
    "letRingButton",
    "nhButton",
    "phButton",
    "legatoButton",
    "slideButton",
  ] as const)("enables %s during range selection", (buttonName) => {
    notation.trackController.extendSelectionByBeat(SelectedMoveDirection.Right);
    expect(notation.trackController.selectionBeats).toHaveLength(2);

    renderer.render();

    const button = template[buttonName];
    expect(button.disabled).toBe(false);
    expect(button.classList.contains("tu-disabled-img")).toBe(false);
  });

  test("disables bend during range selection", () => {
    notation.trackController.extendSelectionByBeat(SelectedMoveDirection.Right);
    expect(notation.trackController.selectionBeats).toHaveLength(2);

    renderer.render();

    expect(template.bendButton.disabled).toBe(true);
    expect(template.bendButton.classList.contains("tu-disabled-img")).toBe(
      true
    );
  });

  test.each(["legatoButton", "slideButton"] as const)(
    "disables %s without a valid note transition target",
    (buttonName) => {
      renderer.render();

      const button = template[buttonName];
      expect(button.disabled).toBe(true);
      expect(button.classList.contains("tu-disabled-img")).toBe(true);
    }
  );
});
