/** @jest-environment jsdom */

import { TabUILayoutMode } from "../../../src/config/tabui-config";
import { TrackController } from "../../../src/notation/controller/track-controller";
import { DEFAULT_MASTER_BAR } from "../../../src/notation/model";
import { EditorSVGRenderer } from "../../../src/notation/render/svg/editor-svg-renderer";
import { createTestLayoutDimensions } from "../controller/helpers";
import { createScoreGraph } from "../model/helpers";

function createViewportRenderer(layoutMode: TabUILayoutMode) {
  const { score, track } = createScoreGraph();
  for (let i = 0; i < 80; i++) {
    score.appendMasterBar(DEFAULT_MASTER_BAR);
  }
  const controller = new TrackController(
    track,
    createTestLayoutDimensions(),
    undefined,
    true,
    undefined,
    layoutMode
  );
  const viewport = document.createElement("div");
  // jsdom has no layout engine. Supply only the browser viewport dimensions.
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
  const renderedBars = () =>
    [...viewport.querySelectorAll('g[id^="bar-"]')].map((e) => e.id);
  return { track, controller, viewport, renderer, render, renderedBars };
}

test("renders a bounded horizontal window and its neighboring bars", () => {
  const { track, controller, viewport, renderer, render, renderedBars } =
    createViewportRenderer(TabUILayoutMode.SingleLine);
  try {
    render();
    const initial = renderedBars();
    expect(initial).toContain(`bar-${track.staves[0].bars[0].uuid}`);
    expect(initial.length).toBeGreaterThan(1);
    expect(initial.length).toBeLessThanOrEqual(20);

    viewport.scrollLeft =
      controller.trackElement.trackLineElements[0].trackLineBars[40].x;
    render();
    const scrolledBars = renderedBars();
    expect(scrolledBars).toContain(`bar-${track.staves[0].bars[40].uuid}`);
    expect(scrolledBars).toContain(`bar-${track.staves[0].bars[38].uuid}`);
    expect(scrolledBars.length).toBeLessThanOrEqual(20);
    expect(scrolledBars).not.toContain(initial[0]);
  } finally {
    renderer.unrender();
  }
});

test("renders the nearest final lines when vertical scroll is beyond the score", () => {
  const { track, controller, viewport, renderer, render, renderedBars } =
    createViewportRenderer(TabUILayoutMode.Wrapped);
  try {
    expect(controller.trackElement.trackLineElements.length).toBeGreaterThan(5);
    // A stale scroll offset can remain while the score's height changes.
    viewport.scrollTop = 1_000_000;
    render();
    const bars = renderedBars();
    expect(bars).toContain(`bar-${track.staves[0].bars[80].uuid}`);
    expect(bars.length).toBeGreaterThan(1);
    expect(bars.length).toBeLessThanOrEqual(20);
    expect(bars).not.toContain(`bar-${track.staves[0].bars[0].uuid}`);
  } finally {
    renderer.unrender();
  }
});
