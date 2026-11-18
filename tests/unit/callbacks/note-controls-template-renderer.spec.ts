/** @jest-environment jsdom */

import { resolveTabUIConfig } from "../../../src/config/tabui-config";
import { NotationComponent } from "../../../src/notation/notation-component";
import { Dynamic, NoteDuration } from "../../../src/notation/model";
import { NoteControlsTemplate } from "../../../src/ui/side-controls/note-controls/note-controls-template";
import { NoteControlsTemplateRenderer } from "../../../src/ui/side-controls/note-controls/note-controls-template-renderer";
import { createTestLayoutDimensions } from "../controller/helpers";
import { createBarWithBeats } from "../model/helpers";
import { required } from "../required";

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

  test("presses the tuplet preset button for a 2:3 duplet", () => {
    const { score } = createBarWithBeats([
      {
        baseDuration: NoteDuration.Eighth,
        tupletSettings: { normalCount: 2, tupletCount: 3 },
      },
    ]);
    const notation = new NotationComponent(
      document.createElement("div"),
      score,
      resolveTabUIConfig(),
      createTestLayoutDimensions()
    );
    const template = new NoteControlsTemplate();
    const renderer = new NoteControlsTemplateRenderer(
      document.createElement("div"),
      notation,
      template
    );

    try {
      renderer.render();

      expect(template.tuplet2Button.getAttribute("aria-pressed")).toBe("true");
      expect(template.tuplet3Button.getAttribute("aria-pressed")).toBe("false");
    } finally {
      notation.dispose();
    }
  });

  test("lights every dynamic found in a mixed selection", () => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    beats[0].dynamic = Dynamic.Piano;
    beats[1].dynamic = Dynamic.Fortissimo;
    beats[2].dynamic = Dynamic.Piano;
    beats[2].makeRest();
    const host = document.createElement("div");
    const notation = new NotationComponent(
      document.createElement("div"),
      score,
      resolveTabUIConfig(),
      createTestLayoutDimensions()
    );
    const controller = notation.trackController;
    const template = new NoteControlsTemplate();
    const renderer = new NoteControlsTemplateRenderer(host, notation, template);
    const pressed = () =>
      template.dynamicButtons
        .filter((b) => b.getAttribute("aria-pressed") === "true")
        .map((b) => b.dataset["dynamic"]);

    try {
      renderer.render();
      // The cursor starts on the first beat.
      expect(pressed()).toEqual(["p"]);

      controller.trackElement.update();
      controller.selectBeat(
        required(controller.trackElement.getBeatElement(beats[0]))
      );
      controller.setSelectionAnchor();
      controller.selectBeat(
        required(controller.trackElement.getBeatElement(beats[2]))
      );
      renderer.render();

      expect(pressed()).toEqual(["p", "ff"]);
      const applied = template.dynamicButtons.filter((b) =>
        b.classList.contains("tu-applied-img")
      );
      expect(applied).toHaveLength(2);
      // The name starts with the visible symbol (WCAG 2.5.3 Label in Name).
      expect(template.dynamicButtons[6].getAttribute("aria-label")).toBe(
        "ff, fortissimo"
      );
    } finally {
      notation.dispose();
    }
  });
});
