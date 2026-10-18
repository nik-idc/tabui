/** @jest-environment jsdom */

import { TrackController } from "../../../src/notation/controller/track-controller";
import { GuitarNote } from "../../../src/notation/model";
import { EditorSVGRenderer } from "../../../src/notation/render/svg/editor-svg-renderer";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";
import { createScoreGraph } from "../model/helpers";

test("retained note DOM follows rebuilt elements and renders later edits", () => {
  const { track, bar } = createScoreGraph();
  const note = bar.getVoiceBar(1)?.beats[0].notes?.[0];
  if (!(note instanceof GuitarNote)) throw Error("Expected guitar note");
  note.fret = 5;
  const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
  const viewport = document.createElement("div");
  Object.defineProperties(viewport, {
    clientWidth: { value: 800 },
    clientHeight: { value: 400 },
  });
  const renderer = new EditorSVGRenderer(viewport, controller, {
    baseUrl: "/assets",
    variant: "light",
  });
  const render = () =>
    renderer.render({
      renderNotation: true,
      forceNotation: false,
      overlays: { selection: false, player: false },
    });

  try {
    render();
    const text = viewport.querySelector('text[id^="note-text-"]');
    expect(text?.textContent).toBe("5");
    if (text === null) throw Error("Expected rendered fret");
    const textID = text.id;
    expect(Number(text.getAttribute("x"))).toBeCloseTo(97.5);

    controller.trackElement.update();
    render();
    expect(viewport.querySelector(`[id="${textID}"]`)).toBe(text);

    controller.setSelectedNoteFret(9);
    render();
    expect(viewport.querySelector(`[id="${textID}"]`)).toBe(text);
    expect(text.textContent).toBe("9");
    expect(viewport.querySelectorAll(`[id="${textID}"]`)).toHaveLength(1);

    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) throw Error("Expected voice bar");
    voiceBar.insertBeat(0);
    controller.trackElement.update({ affectedMasterBarIndices: [0] });
    render();
    expect(viewport.querySelector(`[id="${textID}"]`)).toBe(text);
    // The inserted quarter shifts the attack 46.8px from its 97.5px origin.
    expect(Number(text.getAttribute("x"))).toBeCloseTo(144.3);
    expect(text.textContent).toBe("9");
    expect(viewport.querySelectorAll(`[id="${textID}"]`)).toHaveLength(1);
  } finally {
    renderer.unrender();
  }
});
