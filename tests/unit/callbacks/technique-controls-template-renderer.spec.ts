/** @jest-environment jsdom */

import { resolveTabUIConfig } from "../../../src/config/tabui-config";
import { NotationComponent } from "../../../src/notation/notation-component";
import { SelectedMoveDirection } from "../../../src/notation/controller";
import { Beat, GuitarNote, NoteDuration } from "../../../src/notation/model";
import { TechniqueControlsTemplate } from "../../../src/ui/side-controls/technique-controls/technique-controls-template";
import { TechniqueControlsTemplateRenderer } from "../../../src/ui/side-controls/technique-controls/technique-controls-template-renderer";
import { createTestLayoutDimensions } from "../controller/helpers";
import { createBarWithBeats } from "../model/helpers";
import { required } from "../required";

describe("TechniqueControlsTemplateRenderer", () => {
  let notation: NotationComponent;
  let template: TechniqueControlsTemplate;
  let renderer: TechniqueControlsTemplateRenderer;
  let testBeats: Beat[];

  beforeEach(() => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    testBeats = beats;
    for (const beat of beats) {
      (required(beat.notes)[0] as GuitarNote).setFret(5);
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

  test("enables Tie on a selected rest only when the previous beat has a source", () => {
    testBeats[2].makeRest();
    notation.trackController.moveSelectedNote(SelectedMoveDirection.Right);
    notation.trackController.moveSelectedNote(SelectedMoveDirection.Right);
    renderer.render();
    expect(template.tieButton.disabled).toBe(false);
    (required(testBeats[1].notes)[0] as GuitarNote).setFret(null);
    renderer.render();
    expect(template.tieButton.disabled).toBe(true);
    testBeats[1].makeRest();
    renderer.render();
    expect(template.tieButton.disabled).toBe(true);
  });

  test.each([
    "vibratoButton",
    "palmMuteButton",
    "letRingButton",
    "tieButton",
    "nhButton",
    "phButton",
    "legatoButton",
    "slideButton",
  ] as const)("enables %s during range selection", (buttonName) => {
    (required(testBeats[1].notes)[0] as GuitarNote).setFret(7);
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
