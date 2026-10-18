/** @jest-environment jsdom */

import { resolveTabUIConfig } from "../../../src/config/tabui-config";
import { NotationComponent } from "../../../src/notation/notation-component";
import { NoteDuration } from "../../../src/notation/model";
import { NoteControlsTemplate } from "../../../src/ui/side-controls/note-controls/note-controls-template";
import { NoteControlsTemplateRenderer } from "../../../src/ui/side-controls/note-controls/note-controls-template-renderer";
import { createTestLayoutDimensions } from "../controller/helpers";
import { createBarWithBeats } from "../model/helpers";

describe("NoteControlsTemplateRenderer", () => {
  test("highlights the selected note's eighth duration, double dot, and triplet", () => {
    const { score } = createBarWithBeats([
      {
        baseDuration: NoteDuration.Eighth,
        dots: 2,
        tupletSettings: { normalCount: 3, tupletCount: 2 },
      },
    ]);
    const host = document.createElement("div");
    const notation = new NotationComponent(
      document.createElement("div"),
      score,
      resolveTabUIConfig(),
      createTestLayoutDimensions()
    );
    const template = new NoteControlsTemplate();
    const renderer = new NoteControlsTemplateRenderer(host, notation, template);

    try {
      renderer.render();

      expect(host.contains(template.container)).toBe(true);
      expect(
        template.durationButtons[3].classList.contains("tu-applied-img")
      ).toBe(true);
      expect(template.dot2Button.classList.contains("tu-applied-img")).toBe(
        true
      );
      expect(template.tuplet3Button.classList.contains("tu-applied-img")).toBe(
        true
      );
    } finally {
      notation.dispose();
    }
  });
});
