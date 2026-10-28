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
      render
    );
    return {
      controller,
      player,
      template,
      renderer,
      callbacks,
      render,
    };
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

  test("toggles the live metronome and changes pitch inline without transport changes", async () => {
    const { callbacks, controller, player, template, renderer } = controls();
    renderer.render();
    callbacks.bind();
    callbacks.bind();
    template.metronomeButton.click();
    expect(controller.metronomeEnabled).toBe(true);
    expect(template.metronomeButton.getAttribute("aria-pressed")).toBe("true");
    template.metronomeButton.click();
    expect(controller.metronomeEnabled).toBe(false);
    expect(template.metronomeButton.getAttribute("aria-pressed")).toBe("false");
    expect(player.playbackState).toBe("idle");
    const pitchControl = template.pitchShiftControl;
    expect(pitchControl.valueElement.getAttribute("role")).toBe("spinbutton");
    expect(pitchControl.valueElement.textContent).toBe("0");
    pitchControl.increaseButton.click();
    pitchControl.increaseButton.click();
    expect(controller.pitchShiftSemitones).toBe(2);
    expect(player.playbackState).toBe("idle");
    controller.startPlayer();
    await settleTransport();
    expect(controller.playbackState).toBe("playing");
    pitchControl.decreaseButton.click();
    expect(controller.pitchShiftSemitones).toBe(1);
    expect(controller.playbackState).toBe("playing");
    callbacks.unbind();
    template.metronomeButton.click();
    expect(controller.metronomeEnabled).toBe(false);
    pitchControl.increaseButton.click();
    expect(controller.pitchShiftSemitones).toBe(1);
  });

  test("changes pitch with the value wheel and leaves bounds disabled", () => {
    const { callbacks, controller, template, renderer } = controls();
    renderer.render();
    callbacks.bind();
    document.body.appendChild(template.container);
    const pitchControl = template.pitchShiftControl;
    const wheel = new WheelEvent("wheel", { deltaY: -1, cancelable: true });
    pitchControl.valueElement.dispatchEvent(wheel);
    expect(controller.pitchShiftSemitones).toBe(1);
    expect(wheel.defaultPrevented).toBe(true);
    controller.setPitchShiftSemitones(12);
    renderer.render();
    expect(pitchControl.increaseButton.disabled).toBe(true);
    const boundaryWheel = new WheelEvent("wheel", {
      deltaY: -1,
      cancelable: true,
    });
    pitchControl.valueElement.dispatchEvent(boundaryWheel);
    expect(boundaryWheel.defaultPrevented).toBe(false);
    expect(controller.pitchShiftSemitones).toBe(12);
    callbacks.unbind();
    template.container.remove();
  });

  test("double-clicking the pitch value resets it and only affects the value display", () => {
    const { callbacks, controller, template, renderer } = controls();
    renderer.render();
    callbacks.bind();
    const pitchControl = template.pitchShiftControl;

    pitchControl.increaseButton.click();
    pitchControl.increaseButton.click();
    pitchControl.valueElement.dispatchEvent(new MouseEvent("dblclick"));
    expect(controller.pitchShiftSemitones).toBe(0);

    pitchControl.decreaseButton.click();
    pitchControl.valueElement.dispatchEvent(new MouseEvent("dblclick"));
    expect(controller.pitchShiftSemitones).toBe(0);
    expect(controller.playbackState).toBe("idle");

    callbacks.bind();
    pitchControl.increaseButton.click();
    callbacks.unbind();
    pitchControl.valueElement.dispatchEvent(new MouseEvent("dblclick"));
    expect(controller.pitchShiftSemitones).toBe(1);
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
          metronomeButton: {},
        },
      } as any,
      { trackController, ensureSelectedNoteVisible } as any,
      renderFunc
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
          metronomeButton: {},
        },
      } as any,
      { trackController: controller } as any,
      renderFunc
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
