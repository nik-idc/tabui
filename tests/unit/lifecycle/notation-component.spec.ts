/** @jest-environment jsdom */

import { NotationComponent } from "../../../src/notation/notation-component";
import {
  GuitarNote,
  NoteDuration,
  Score,
  serializeScore,
} from "../../../src/notation/model";
import { PlaybackState } from "../../../src/player";
import { resolveTabUIConfig } from "../../../src/config/tabui-config";
import { createBarWithBeats, createScoreGraph } from "../model/helpers";
import { createTestLayoutDimensions } from "../controller/helpers";
import {
  installTransportAudio,
  settleTransport,
} from "../player/transport-audio";
import { required } from "../required";

describe("NotationComponent", () => {
  let audio: ReturnType<typeof installTransportAudio>;
  const cleanups: Array<() => void> = [];

  beforeEach(() => {
    jest.useFakeTimers();
    audio = installTransportAudio();
  });

  afterEach(() => {
    cleanups.splice(0).forEach((c) => c());
    audio.restore();
    jest.useRealTimers();
  });

  function viewFor(score: Score) {
    const viewport = document.createElement("div");
    Object.defineProperties(viewport, {
      clientWidth: { value: 1200 },
      clientHeight: { value: 200 },
    });
    document.body.append(viewport);
    const dimensions = createTestLayoutDimensions();
    const notation = new NotationComponent(
      viewport,
      score,
      resolveTabUIConfig(),
      dimensions
    );
    notation.render();
    cleanups.push(() => {
      notation.dispose();
      viewport.remove();
    });
    return { notation, viewport, dimensions };
  }

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

  function svgPosition(element: Element) {
    let x = Number(required(element.getAttribute("x")));
    let y = Number(required(element.getAttribute("y")));
    // jsdom has no getCTM. Resolve the rendered translation chain to root-SVG coordinates.
    for (
      let node: Element | null = element;
      node !== null && node.localName !== "svg";
      node = node.parentElement
    ) {
      const transform = node.getAttribute("transform");
      if (transform === null) continue;
      const translation = required(
        /^translate\(([-\d.]+)[,\s]+([-\d.]+)\)$/.exec(transform)
      );
      x += Number(translation[1]);
      y += Number(translation[2]);
    }
    return { x, y };
  }

  test("rejects a score without a track", () => {
    const { score } = createScoreGraph();
    score.tracks.splice(0, 1);
    expect(
      () =>
        new NotationComponent(
          document.createElement("div"),
          score,
          resolveTabUIConfig(),
          createTestLayoutDimensions()
        )
    ).toThrow("NotationComponent requires a score with at least one track");
  });

  test("track switches preserve player identity, run, loop and scheduled audio until disposal", async () => {
    const { score, track, beats } = populatedScore();
    const nextTrack = score.addTrack(track.context.instrument, "Track 2")
      .tracks[0];
    const { notation, viewport } = viewFor(score);
    const controller = notation.trackController;
    const playerUUID = controller.playerUUID;
    expect(playerUUID).toEqual(expect.any(Number));
    controller.toggleLoop();
    controller.startPlayer();
    await settleTransport();
    notation.render();
    expect(controller.playbackState).toBe(PlaybackState.Playing);
    const runId = controller.playerRunId;
    expect(runId).toEqual(expect.any(Number));
    const sources = [...audio.sources];
    expect(sources.length).toBeGreaterThanOrEqual(4);
    jest.advanceTimersByTime(50);
    expect(controller.playerLastStartedBeat).toBe(beats[0]);

    for (const activeTrack of [nextTrack, track, nextTrack, track]) {
      notation.loadTrack(activeTrack);
      expect(notation.trackController.track).toBe(activeTrack);
      expect(notation.trackController.playerUUID).toBe(playerUUID);
      expect(notation.trackController.playerRunId).toBe(runId);
      expect(notation.trackController.playbackState).toBe(
        PlaybackState.Playing
      );
      expect(notation.trackController.isLooped).toBe(true);
      expect(viewport.querySelectorAll(".tu-root-svg")).toHaveLength(1);
      expect(audio.sources).toEqual(sources);
      sources.forEach((s) => expect(s.stop).toHaveBeenCalledTimes(1));
    }
    jest.advanceTimersByTime(500);
    expect(notation.trackController.playerLastStartedBeat).toBe(beats[1]);
    notation.dispose();
    notation.dispose();
    expect(viewport.querySelectorAll(".tu-root-svg")).toHaveLength(0);
    expect(audio.context.close).toHaveBeenCalledTimes(1);
    sources.forEach((s) => expect(s.stop).toHaveBeenCalledTimes(2));
  });

  test("switching during buffered playback materializes and follows the new track cursor", async () => {
    const { score, track } = populatedScore();
    for (let i = 0; i < 30; i++) score.appendMasterBar();
    const nextTrack = score.addTrack(track.context.instrument, "Track 2")
      .tracks[0];
    const nextBeat = required(nextTrack.staves[0].bars[30].getVoiceBar(1))
      .beats[0];
    nextBeat.makeBeatWithNotes();
    (required(nextBeat.notes)[0] as GuitarNote).fret = 9;
    const { notation, viewport } = viewFor(score);
    notation.trackController.selectLastBar();
    notation.trackController.startPlayer();
    await settleTransport();
    notation.render();
    jest.advanceTimersByTime(50);
    const oldCursor = required(viewport.querySelector("#playerCursor"));
    expect(Number(oldCursor.getAttribute("width"))).toBeGreaterThan(0);

    notation.loadTrack(nextTrack);
    jest.advanceTimersByTime(0);

    expect(oldCursor.isConnected).toBe(false);
    expect(notation.trackController.playerLastStartedBeat).toBe(nextBeat);
    expect(viewport.scrollTop).toBeGreaterThan(0);
    expect(
      notation.trackController.trackElement.getBeatElement(nextBeat)
    ).toBeDefined();
    const targetNotes = [
      ...viewport.querySelectorAll('[id^="note-text-"]'),
    ].filter((n) => n.textContent === "9");
    expect(targetNotes).toHaveLength(1);
    const targetNote = required(targetNotes[0]);
    const targetRect = required(
      viewport.querySelector(
        `[id="${targetNote.id.replace("note-text-", "note-rect-")}"]`
      )
    );
    const cursor = required(viewport.querySelector("#playerCursor"));
    expect(Number(cursor.getAttribute("width"))).toBeGreaterThan(0);
    const cursorPosition = svgPosition(cursor);
    const notePosition = svgPosition(targetNote);
    const noteRectPosition = svgPosition(targetRect);
    expect(notePosition.y).toBeGreaterThan(200);
    expect(
      cursorPosition.x + Number(cursor.getAttribute("width")) / 2
    ).toBeCloseTo(notePosition.x);
    const cursorBottom =
      cursorPosition.y + Number(required(cursor.getAttribute("height")));
    const noteBottom =
      noteRectPosition.y + Number(required(targetRect.getAttribute("height")));
    expect(cursorPosition.y).toBeLessThanOrEqual(noteRectPosition.y);
    expect(cursorBottom).toBeGreaterThanOrEqual(noteBottom);
  });

  test("follows the active range endpoint when no cursor is selected", () => {
    const { score, track, bar } = createScoreGraph();
    for (let i = 0; i < 30; i++) score.appendMasterBar();
    const { notation, viewport } = viewFor(score);
    const controller = notation.trackController;
    const start = required(bar.getVoiceBar(1)).beats[0];
    controller.selectBeat(
      required(controller.trackElement.getBeatElement(start))
    );
    controller.setSelectionAnchor();
    controller.selectLastBar();
    const end = required(track.staves[0].bars[30].getVoiceBar(1)).beats[0];
    expect(controller.selectionCursor).toBeUndefined();
    expect(controller.selectionEndBeat).toBe(end);
    expect(viewport.scrollTop).toBe(0);

    notation.ensureSelectedNoteVisible();
    notation.render();

    expect(viewport.scrollTop).toBeGreaterThan(0);
    expect(controller.trackElement.getBeatElement(end)).toBeDefined();
    expect(viewport.querySelector(`#beat-rest-${end.uuid}`)).not.toBeNull();
  });

  test("explicit layout refresh reflows rendered notation without changing the score", () => {
    const { score, track } = populatedScore();
    for (let i = 0; i < 12; i++) score.appendMasterBar();
    const { notation, viewport, dimensions } = viewFor(score);
    const before =
      notation.trackController.trackElement.trackLineElements.length;
    const bars = [...track.staves[0].bars];
    const serializedScore = serializeScore(score);
    dimensions.setWidth(400);

    notation.refreshLayout();
    notation.render();

    expect(
      notation.trackController.trackElement.trackLineElements.length
    ).toBeGreaterThan(before);
    expect(viewport.querySelector(".tu-root-svg")?.getAttribute("width")).toBe(
      "424"
    );
    expect(track.staves[0].bars).toEqual(bars);
    expect(serializeScore(score)).toEqual(serializedScore);
    expect(viewport.querySelectorAll(".tu-root-svg")).toHaveLength(1);
  });
});
