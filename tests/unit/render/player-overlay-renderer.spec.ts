/** @jest-environment jsdom */

import { TrackController } from "../../../src/notation/controller/track-controller";
import { TabBeatElement } from "../../../src/notation/controller/element/beat/tab-beat-element";
import { EditorSVGRenderer } from "../../../src/notation/render/svg/editor-svg-renderer";
import {
  GuitarNote,
  NoteDuration,
  Score,
  Track,
} from "../../../src/notation/model";
import { ScorePlayer } from "../../../src/player";
import { trackEvent, TrackEventType } from "../../../src/shared/events";
import { createBarWithBeats } from "../model/helpers";
import { createTestTrackController } from "../controller/helpers";
import { createMultiVoiceTwoStaffScoreFixture } from "../../../fixtures/multi-voice-score";

function populatedScore() {
  const graph = createBarWithBeats(
    Array.from({ length: 4 }, () => ({ baseDuration: NoteDuration.Quarter }))
  );
  graph.beats.forEach((b, i) => {
    b.makeBeatWithNotes();
    (required(b.notes)[0] as GuitarNote).fret = i + 3;
  });
  return graph;
}

describe("PlayerOverlayRenderer", () => {
  let audio: ReturnType<typeof installTransportAudio>;
  const cleanups: Array<() => void> = [];
  let frames: Map<number, FrameRequestCallback>;
  let nextFrame: number;

  function viewFor(score: Score, track: Track = score.tracks[0]) {
    const player = new ScorePlayer(score, track);
    const controller = new TrackController(
      track,
      createTestLayoutDimensions(),
      player
    );
    const viewport = document.createElement("div");
    Object.defineProperties(viewport, {
      clientWidth: { value: 800 },
      clientHeight: { value: 200 },
    });
    document.body.appendChild(viewport);
    const renderer = new EditorSVGRenderer(viewport, controller, {
      baseUrl: "/assets",
      variant: "light",
    });
    const render = () =>
      renderer.render({
        renderNotation: true,
        forceNotation: false,
        overlays: { selection: false, player: true },
      });
    const cursor = () =>
      required(viewport.querySelector<SVGRectElement>("#playerCursor"));
    const center = () =>
      Number(cursor().getAttribute("x")) +
      Number(cursor().getAttribute("width")) / 2;
    const emit = (beatUUID: number, nextBeatUUID?: number, overrides = {}) => {
      trackEvent.emit(TrackEventType.PlayerCurBeatChanged, {
        trackUUID: track.uuid,
        playerUUID: player.uuid,
        playbackRunId: player.playbackRunId,
        beatUUID,
        nextBeatUUID,
        startTime: 0.05,
        endTime: 0.55,
        ...overrides,
      });
    };
    const result = {
      player,
      controller,
      viewport,
      renderer,
      render,
      cursor,
      center,
      emit,
    };
    cleanups.push(() => {
      renderer.dispose();
      player.dispose();
      viewport.remove();
    });
    return result;
  }

  function frame() {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((f) => f(0));
  }

  beforeEach(() => {
    jest.useFakeTimers();
    audio = installTransportAudio();
    frames = new Map();
    nextFrame = 0;
    jest.spyOn(globalThis, "requestAnimationFrame").mockImplementation((f) => {
      frames.set(++nextFrame, f);
      return nextFrame;
    });
    jest.spyOn(globalThis, "cancelAnimationFrame").mockImplementation((id) => {
      frames.delete(id);
    });
  });

  afterEach(() => {
    cleanups.splice(0).forEach((c) => c());
    audio.restore();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test("positions the cursor at beat attack across multiple staff lines", async () => {
    const score = createMultiVoiceTwoStaffScoreFixture();
    const view = viewFor(score);
    await view.player.start();
    view.render();
    const beat = required(score.tracks[0].staves[1].bars[0].getVoiceBar(1))
      .beats[0];
    view.emit(beat.uuid);
    const element = view.controller.trackElement.getBeatElement(beat);
    expect(element).toBeInstanceOf(TabBeatElement);
    if (!(element instanceof TabBeatElement)) throw Error("Expected tab beat");

    expect(view.center()).toBeCloseTo(element.attackXGlobal);
    expect(Number(view.cursor().getAttribute("y"))).toBeCloseTo(42);
    const outline = required(
      element.owningTrackLineElement.outlineLinesGlobal
    ).left;
    expect(outline.height).toBeGreaterThan(0);
    expect(Number(view.cursor().getAttribute("height"))).toBeCloseTo(
      outline.height
    );
  });

  test("renders matching playback events only while subscribed", async () => {
    const graph = populatedScore();
    const view = viewFor(graph.score);
    await view.player.start();
    view.render();
    view.emit(graph.beats[0].uuid, graph.beats[1].uuid);
    expect(view.cursor().getAttribute("width")).toBe("5");
    expect(view.viewport.textContent).toContain("3");
    expect(frames.size).toBeGreaterThan(0);
    const cursor = view.cursor();
    const x = cursor.getAttribute("x");

    view.renderer.unrender();
    view.emit(graph.beats[2].uuid);
    frame();
    expect(view.viewport.querySelector("#playerCursor")).toBeNull();
    expect(cursor.isConnected).toBe(false);
    expect(cursor.getAttribute("x")).toBe(x);
    expect(frames.size).toBe(0);
  });

  test("ignores foreign tracks, foreign players, and stale runs with two live editors", async () => {
    const graph = populatedScore();
    const first = viewFor(graph.score);
    const second = viewFor(graph.score);
    await first.player.start();
    await second.player.start();
    first.render();
    second.render();
    first.emit(graph.beats[0].uuid);
    expect(first.cursor().getAttribute("width")).toBe("5");
    expect(second.cursor().getAttribute("width")).toBe("0");
    const x = first.center();

    first.emit(graph.beats[3].uuid, undefined, { trackUUID: -1 });
    first.emit(graph.beats[3].uuid, undefined, {
      playerUUID: second.player.uuid,
    });
    first.emit(graph.beats[3].uuid, undefined, {
      playbackRunId: first.player.playbackRunId - 1,
    });
    expect(first.center()).toBe(x);

    second.emit(graph.beats[2].uuid);
    expect(second.cursor().getAttribute("width")).toBe("5");
    expect(second.center()).toBeGreaterThan(first.center());
    expect(first.center()).toBe(x);
  });

  test("hides a visible cursor when playback becomes idle", async () => {
    const graph = populatedScore();
    const view = viewFor(graph.score);
    await view.player.start();
    view.render();
    view.emit(graph.beats[0].uuid);
    expect(view.cursor().getAttribute("width")).toBe("5");

    view.player.stop();
    view.render();
    expect(view.cursor().getAttribute("width")).toBe("0");
    expect(view.cursor().getAttribute("height")).toBe("0");
    expect(frames.size).toBe(0);
  });

  test("interpolates real beat geometry on the audio clock and snaps across lines", async () => {
    const graph = populatedScore();
    for (let i = 0; i < 20; i++) {
      graph.score.appendMasterBar();
      const beat = required(graph.track.staves[0].bars[i + 1].getVoiceBar(1))
        .beats[0];
      beat.makeBeatWithNotes();
      (required(beat.notes)[0] as GuitarNote).fret = 9;
    }
    const view = viewFor(graph.score);
    await view.player.start();
    view.render();
    // Quarter notes at 120 bpm start at .05 and .55 seconds.
    jest.advanceTimersByTime(50);
    const startX = view.center();
    const texts = [...view.viewport.querySelectorAll('text[id^="note-text-"]')];
    const startText = required(texts.find((t) => t.textContent === "3"));
    const nextText = required(texts.find((t) => t.textContent === "4"));
    expect(startText.textContent).toBe("3");
    expect(nextText.textContent).toBe("4");
    expect(startX).toBeCloseTo(97.5);
    const next = required(
      view.controller.trackElement.getBeatElement(graph.beats[1])
    );
    expect(next).toBeInstanceOf(TabBeatElement);
    if (!(next instanceof TabBeatElement)) throw Error("Expected tab beat");
    expect(next.attackXGlobal).toBeGreaterThan(startX);
    jest.advanceTimersByTime(250);
    frame();
    const attackSpacing =
      Number(nextText.getAttribute("x")) - Number(startText.getAttribute("x"));
    expect(attackSpacing).toBeGreaterThan(0);
    expect(view.center()).toBeCloseTo(startX + attackSpacing / 2);

    const farBeat = required(graph.track.staves[0].bars[20].getVoiceBar(1))
      .beats[0];
    expect(
      view.controller.trackElement.getBeatElement(farBeat)
    ).toBeUndefined();
    view.emit(graph.beats[0].uuid, farBeat.uuid);
    expect(view.center()).toBeCloseTo(startX);
    expect(frames.size).toBe(0);

    view.emit(farBeat.uuid);
    const farElement = required(
      view.controller.trackElement.getBeatElement(farBeat)
    );
    expect(farElement).toBeInstanceOf(TabBeatElement);
    expect(view.viewport.scrollTop).toBeGreaterThan(0);
    expect(Number(view.cursor().getAttribute("y"))).toBeGreaterThan(200);
    expect(view.viewport.textContent).toContain("9");
  });

  test("ignores unresolved beats and stale final-beat animation frames", async () => {
    const graph = populatedScore();
    const view = viewFor(graph.score);
    await view.player.start();
    view.render();
    jest.advanceTimersByTime(50);
    view.emit(graph.beats[0].uuid);
    const startX = view.center();
    const beatElement = required(
      view.controller.trackElement.getBeatElement(graph.beats[0])
    );
    jest.advanceTimersByTime(250);
    frame();
    expect(view.center()).toBeCloseTo(
      startX + beatElement.boundingBox.width / 2
    );
    const x = view.center();
    view.emit(-1);
    expect(view.center()).toBe(x);
    const staleFrames = [...frames.values()];
    expect(staleFrames.length).toBeGreaterThan(0);

    view.player.stop();
    await view.player.start();
    // Move the audio clock without reaching the new run's first beat (.35s).
    jest.advanceTimersByTime(25);
    expect(view.player.lastStartedBeat).toBeUndefined();
    // Deliver captured callbacks as consumed frames, before rendering the new run.
    frames.clear();
    staleFrames.forEach((f) => f(0));
    expect(view.center()).toBe(x);
    expect(frames.size).toBe(0);
    view.render();
    expect(view.cursor().getAttribute("width")).toBe("0");
  });
});
