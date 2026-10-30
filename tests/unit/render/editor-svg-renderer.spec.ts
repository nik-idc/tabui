/** @jest-environment jsdom */

import { TrackController } from "../../../src/notation/controller/track-controller";
import { GuitarNote } from "../../../src/notation/model";
import { EditorSVGRenderer } from "../../../src/notation/render/svg/editor-svg-renderer";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";
import { createScoreGraph } from "../model/helpers";
import { PlaybackState, ScorePlayer } from "../../../src/player/score-player";

test("retained note DOM follows rebuilt elements and renders later edits", () => {
  const { track, bar } = createScoreGraph();
  const note = bar.getVoiceBar(1)?.beats[0].notes?.[0];
  if (!(note instanceof GuitarNote)) throw Error("Expected guitar note");
  note.setFret(5);
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

test("hides and restores the selection overlay during playback", () => {
  const { track } = createScoreGraph();
  let playbackState = PlaybackState.Idle;
  const playback = {
    get playbackState() {
      return playbackState;
    },
  } as ScorePlayer;
  const controller = new TrackController(
    track,
    TEST_LAYOUT_DIMENSIONS,
    playback
  );
  const initialCursor = controller.selectionCursor;
  const initialBeat = initialCursor?.beat;
  const initialNoteIndex = initialCursor?.noteIndex;
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
      overlays: { selection: true, player: false },
    });

  try {
    render();
    const selectionGroup = viewport.querySelector("#tu-selection");
    expect(selectionGroup?.children).toHaveLength(1);

    playbackState = PlaybackState.Playing;
    render();
    expect(selectionGroup?.children).toHaveLength(0);
    expect(controller.selectionCursor?.beat).toBe(initialBeat);
    expect(controller.selectionCursor?.noteIndex).toBe(initialNoteIndex);

    playbackState = PlaybackState.Idle;
    render();
    expect(selectionGroup?.children).toHaveLength(1);
    expect(controller.selectionCursor?.beat).toBe(initialBeat);
    expect(controller.selectionCursor?.noteIndex).toBe(initialNoteIndex);
  } finally {
    renderer.unrender();
  }
});
