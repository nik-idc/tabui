/** @jest-environment jsdom */

import { PlayControlsDefaultCallbacks } from "../../../src/ui/top-controls/play-controls/play-controls-callbacks";
import { PlayControlsTemplateRenderer } from "../../../src/ui/top-controls/play-controls/play-controls-template-renderer";
import { PlayControlsTemplate } from "../../../src/ui/top-controls/play-controls/play-controls-template";
import { ScorePlayer } from "../../../src/player";
import {
  installTransportAudio,
  settleTransport,
} from "../player/transport-audio";
import { TrackController } from "../../../src/notation/controller/track-controller";
import { DEFAULT_MASTER_BAR } from "../../../src/notation/model";
import { createScoreGraph } from "../model/helpers";
import { TEST_LAYOUT_DIMENSIONS } from "../controller/helpers";

describe("PlayControlsDefaultCallbacks", () => {
  let audio: ReturnType<typeof installTransportAudio>;
  const players: ScorePlayer[] = [];
  function controls() {
    const { score, track } = createScoreGraph();
    const player = new ScorePlayer(score, track);
    players.push(player);
    const controller = new TrackController(
      track,
      TEST_LAYOUT_DIMENSIONS,
      player
    );
    const template = new PlayControlsTemplate();
    const notation = { trackController: controller } as any;
    const renderer = new PlayControlsTemplateRenderer(
      document.createElement("div"),
      notation,
      template,
      { baseUrl: "", variant: "light" }
    );
    const render = jest.fn(() => renderer.render());
    const callbacks = new PlayControlsDefaultCallbacks(
      { template } as any,
      notation,
      render,
      jest.fn(),
      jest.fn()
    );
    return { controller, player, template, renderer, callbacks, render };
  }
  beforeEach(() => {
    jest.useFakeTimers();
    audio = installTransportAudio();
  });
  afterEach(() => {
    players.splice(0).forEach((p) => p.dispose());
    audio.restore();
    jest.useRealTimers();
  });

  test("play click starts and stops the real transport", async () => {
    const { callbacks, controller, template, renderer, render } = controls();
    callbacks.bind();
    template.playButton.click();
    expect(controller.playbackState).toBe("starting");
    expect(template.playButton.getAttribute("aria-pressed")).toBe("true");
    await settleTransport();
    renderer.render();
    expect(controller.playbackState).toBe("playing");
    expect(template.playButton.title).toBe("Pause");
    template.playButton.click();
    expect(controller.playbackState).toBe("idle");
    expect(template.playButton.getAttribute("aria-pressed")).toBe("false");
    expect(render).toHaveBeenCalledTimes(2);
    callbacks.unbind();
  });

  test("loop click toggles loop and repeated bind does not double fire", () => {
    const { callbacks, controller, template } = controls();
    callbacks.bind();
    callbacks.bind();
    template.loopButton.click();
    expect(controller.isLooped).toBe(true);
    template.loopButton.click();
    expect(controller.isLooped).toBe(false);
    callbacks.unbind();
    template.loopButton.click();
    expect(controller.isLooped).toBe(false);
  });

  test("bar traversal buttons select the requested bar", () => {
    const ensureSelectedNoteVisible = () => {};
    const { score, track } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const trackController = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const bars = track.staves[0].bars;
    const renderFunc = jest.fn();
    const callbacks = new PlayControlsDefaultCallbacks(
      {
        template: {
          firstButton: {},
          prevButton: {},
          playButton: {},
          nextButton: {},
          lastButton: {},
          loopButton: {},
          rangeButton: {},
        },
      } as any,
      { trackController, ensureSelectedNoteVisible } as any,
      renderFunc,
      jest.fn(),
      jest.fn()
    );

    callbacks.onNextClicked();
    expect(trackController.selectionCursor?.bar).toBe(bars[1]);
    callbacks.onLastClicked();
    expect(trackController.selectionCursor?.bar).toBe(bars[2]);
    callbacks.onPrevClicked();
    expect(trackController.selectionCursor?.bar).toBe(bars[1]);
    callbacks.onFirstClicked();
    expect(trackController.selectionCursor?.bar).toBe(bars[0]);

    expect(renderFunc).toHaveBeenCalledTimes(4);
  });

  test("range button anchors or clears the current range", () => {
    const { track } = createScoreGraph();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const anchor = controller.selectionCursor?.beat;
    const renderFunc = jest.fn();
    const callbacks = new PlayControlsDefaultCallbacks(
      {
        template: {
          firstButton: {},
          prevButton: {},
          playButton: {},
          nextButton: {},
          lastButton: {},
          loopButton: {},
          rangeButton: {},
        },
      } as any,
      { trackController: controller } as any,
      renderFunc,
      jest.fn(),
      jest.fn()
    );

    callbacks.onRangeClicked();
    expect(controller.hasSelectionAnchor).toBe(true);
    expect(controller.selectionBeats).toEqual([anchor]);
    callbacks.onRangeClicked();

    expect(controller.hasSelectionAnchor).toBe(false);
    expect(controller.selectionBeats).toEqual([]);
    expect(controller.selectionCursor?.beat).toBe(anchor);
    expect(renderFunc).toHaveBeenCalledTimes(2);
  });

  test("render marks loop button active when loop is enabled", () => {
    const { controller, renderer, template } = controls();
    renderer.render();
    expect(
      template.loopButton.classList.contains("tu-track-control-active")
    ).toBe(false);
    expect(template.loopButton.getAttribute("aria-pressed")).toBe("false");
    controller.toggleLoop();
    renderer.render();
    expect(
      template.loopButton.classList.contains("tu-track-control-active")
    ).toBe(true);
    expect(template.loopButton.getAttribute("aria-pressed")).toBe("true");
    controller.toggleLoop();
    renderer.render();
    expect(template.loopButton.getAttribute("aria-pressed")).toBe("false");
  });
});
