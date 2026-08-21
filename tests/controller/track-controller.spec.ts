import { TrackController as BaseTrackController } from "../../src/notation/controller/track-controller";
import { ScorePlayer } from "../../src/player";
import { BeatElement } from "../../src/notation/controller/element/beat/beat-element";
import {
  BendTechniqueOptions,
  BendType,
  BarRepeatStatus,
  DEFAULT_MASTER_BAR,
  Beat,
  Guitar,
  GuitarNote,
  GuitarTechniqueType,
  NoteDuration,
  NoteValue,
  Score,
  TrackInstrumentChangeMode,
  VoiceBar,
  serializeScore,
} from "../../src/notation/model";
import { SelectedMoveDirection } from "../../src/notation/controller/selection/selection-cursor";
import { BarElement } from "../../src/notation/controller/element/bar/bar-element";
import { TrackLineInfoElement } from "../../src/notation/controller/element/track/track-line-info-element";
import {
  createBarWithBeats,
  createBeat,
  createScoreGraph,
} from "../model/helpers";
import { TEST_LAYOUT_DIMENSIONS } from "./helpers";

const mockScorePlayerInstances: Array<{
  isPlaying: boolean;
  isLooped: boolean;
  lastStartedBeat: Beat | undefined;
  playbackAnchorBeat: Beat | undefined;
  setActiveTrack: jest.Mock;
  setSelectionLoopSection: jest.Mock;
  clearSelectionLoopSection: jest.Mock;
  setLoopSection: jest.Mock;
  clearLoopSection: jest.Mock;
  start: jest.Mock;
  stop: jest.Mock;
  toggleLoop: jest.Mock;
  dispose: jest.Mock;
}> = [];

function getBeatElements(controller: TrackController) {
  if (controller.trackElement.materializedLineIndices.size === 0) {
    controller.trackElement.update();
  }
  const beatElements: BeatElement[] = [];

  for (const trackLine of controller.trackElement.trackLineElements) {
    for (const staffLine of trackLine.staffLineContainers) {
      for (const styleLine of staffLine.styleLinesAsArray) {
        for (const barElement of styleLine.barElements) {
          beatElements.push(...barElement.beatElements);
        }
      }
    }
  }

  return beatElements;
}

function noteBeats(beats: Beat<Guitar>[]): Beat<Guitar>[] {
  return beats.filter((beat) => beat.hasNotes());
}

function getBeatElement(
  controller: TrackController,
  barIndex: number,
  beatIndex: number
) {
  const bar = controller.trackElement.track.staves[0].bars[barIndex];
  const voiceBar = bar?.getVoiceBar(1);
  const beat = voiceBar?.beats[beatIndex];
  const element = getBeatElements(controller).find(
    (candidate) => candidate.beat === beat
  );
  if (element === undefined) {
    throw Error("Expected beat element for model beat");
  }
  return element;
}

function setBarDurations(
  controller: TrackController,
  barIndex: number,
  durations: NoteDuration[]
) {
  const bar = controller.trackElement.track.staves[0].bars[barIndex];
  const voiceBar = bar.getVoiceBar(1);
  if (voiceBar === null) {
    throw Error("Expected voice 1 in test bar");
  }
  const beats = durations.map((duration) =>
    createBeat(voiceBar as VoiceBar<Guitar>, duration)
  );
  voiceBar.beats.splice(0, voiceBar.beats.length, ...beats);
  voiceBar.rebuildTiming();
}

jest.mock("../../src/player", () => ({
  PlaybackState: {
    Idle: "idle",
    Starting: "starting",
    Playing: "playing",
  },
  ScorePlayer: class {
    public isPlaying = false;
    public get playbackState(): "idle" | "playing" {
      return this.isPlaying ? "playing" : "idle";
    }
    public isLooped = false;
    public lastStartedBeat: Beat | undefined = undefined;
    public playbackAnchorBeat: Beat | undefined = undefined;
    public setActiveTrack = jest.fn();
    public setSelectionLoopSection = jest.fn();
    public clearSelectionLoopSection = jest.fn();
    public setCurrentBeat(): void {}
    public setLoopSection = jest.fn();
    public clearLoopSection = jest.fn();
    public start = jest.fn();
    public stop = jest.fn();
    public toggleLoop = jest.fn();
    public dispose = jest.fn();

    constructor() {
      mockScorePlayerInstances.push(this);
    }
  },
}));

class TrackController extends BaseTrackController {
  constructor(
    track: ConstructorParameters<typeof BaseTrackController>[0],
    layoutDimensions: ConstructorParameters<typeof BaseTrackController>[1]
  ) {
    super(track, layoutDimensions, new ScorePlayer(track.score, track));
  }
}

describe("TrackController", () => {
  beforeEach(() => {
    mockScorePlayerInstances.length = 0;
  });

  test("supports headless use without a score player", () => {
    const { track } = createScoreGraph();
    const controller = new BaseTrackController(track, TEST_LAYOUT_DIMENSIONS);

    expect(() => {
      controller.startPlayer();
      controller.stopPlayer();
      controller.toggleLoop();
      controller.syncTrackPlaybackState();
      controller.syncMasterPlaybackState();
    }).not.toThrow();
    expect(controller.playbackState).toBe("idle");
    expect(controller.isLooped).toBe(false);
    expect(controller.playerCurrentTime).toBeUndefined();
    expect(controller.playerRunId).toBeUndefined();
    expect(controller.playerUUID).toBeUndefined();
  });

  test("moving right from the seed beat appends a second beat", () => {
    const { track, bar } = createScoreGraph();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    controller.moveSelectedNote(SelectedMoveDirection.Right);
    controller.trackElement.update();

    expect(voiceBar.beats).toHaveLength(2);
    expect(controller.selectionCursor?.bar).toBe(bar);
    expect(controller.selectionCursor?.beatIndex).toBe(1);
  });

  test("playback start does not disable an existing loop choice", () => {
    const { track } = createScoreGraph();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);

    controller.startPlayer();

    expect(
      mockScorePlayerInstances[0].clearSelectionLoopSection
    ).toHaveBeenCalledTimes(1);
    expect(mockScorePlayerInstances[0].start).toHaveBeenCalledTimes(1);
  });

  test("playback start enables looping for a beat selection", () => {
    const { score, track } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const beatElements = getBeatElements(controller);
    const player = mockScorePlayerInstances[0];
    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[1]);

    controller.startPlayer();

    expect(player.setSelectionLoopSection).toHaveBeenCalledWith(
      beatElements[0].beat,
      beatElements[1].beat
    );
    expect(player.start).toHaveBeenCalledWith({
      startBeat: beatElements[0].beat,
      loopEndBeat: beatElements[1].beat,
    });
  });

  test("playback start loops an explicitly anchored single beat", () => {
    const { track } = createScoreGraph();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const [beatElement] = getBeatElements(controller);
    const player = mockScorePlayerInstances[0];
    controller.selectBeat(beatElement);

    controller.startPlayer();

    expect(player.setSelectionLoopSection).toHaveBeenCalledWith(
      beatElement.beat,
      beatElement.beat
    );
    expect(player.start).toHaveBeenCalledWith({
      startBeat: beatElement.beat,
      loopEndBeat: beatElement.beat,
    });
  });

  test("selection playback preserves an enabled loop choice", () => {
    const { score, track } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const beatElements = getBeatElements(controller);
    const player = mockScorePlayerInstances[0];
    player.isLooped = true;
    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[1]);

    controller.startPlayer();
    player.isPlaying = true;
    controller.restartPlayerFromBeat(beatElements[1].beat);

    expect(player.clearSelectionLoopSection).toHaveBeenCalledTimes(1);
    expect(player.setSelectionLoopSection).toHaveBeenCalledTimes(1);
  });

  test("playback seek disables only selection-enabled looping", () => {
    const { score, track } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const beatElements = getBeatElements(controller);
    const player = mockScorePlayerInstances[0];
    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[1]);
    controller.startPlayer();
    player.isPlaying = true;

    controller.restartPlayerFromBeat(beatElements[1].beat);

    expect(player.clearSelectionLoopSection).toHaveBeenCalledTimes(1);
    expect(player.setSelectionLoopSection).toHaveBeenCalledTimes(1);
  });

  test("loop toggle does not restart active playback", () => {
    const { track } = createScoreGraph();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    mockScorePlayerInstances[0].isPlaying = true;

    controller.toggleLoop();

    expect(mockScorePlayerInstances[0].toggleLoop).toHaveBeenCalledTimes(1);
    expect(mockScorePlayerInstances[0].start).not.toHaveBeenCalled();
  });

  test("notation mutations are ignored while playback is active", () => {
    const { score, track } = createScoreGraph();
    const note = track.staves[0].bars[0].getVoiceBar(1)?.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.fret = 5;
    score.addTrack(new Guitar(), "Track 2");
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const before = serializeScore(score);
    const trackOrder = [...score.tracks];
    mockScorePlayerInstances[0].isPlaying = true;

    controller.moveTrack(track, 1);
    controller.undo();
    controller.redo();
    controller.setSelectedNoteFret(3);
    controller.setDuration(NoteDuration.Half);
    controller.setSelectedBeatRest();
    controller.setDots(1);
    controller.setSelectedBeatsTuplet(3, 2);
    controller.setSelectedBarTempo(90);
    controller.setSelectedBarTimeSignature(3, NoteDuration.Quarter);
    controller.setSelectedBarRepeatStatus(BarRepeatStatus.Start);
    controller.setTechnique(GuitarTechniqueType.Vibrato);
    controller.moveSelectedNote(SelectedMoveDirection.Right);
    controller.paste();
    controller.deleteSelectedBeats();
    controller.insertBeatBeforeSelected();
    controller.insertBeatAfterSelected();
    controller.removeSelectedBeat();
    controller.setActiveVoiceNumber(2);
    controller.insertBarBeforeSelected();
    controller.insertBarAfterSelected();
    controller.removeSelectedBar();

    expect(score.tracks).toEqual(trackOrder);
    expect(serializeScore(score)).toEqual(before);
  });

  test("view-only preserves the complete score document", () => {
    const { score, track } = createScoreGraph();
    const note = track.staves[0].bars[0].getVoiceBar(1)?.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.fret = 5;
    const secondTrack = score.addTrack(new Guitar(), "Track 2").tracks[0];
    const controller = new BaseTrackController(
      track,
      TEST_LAYOUT_DIMENSIONS,
      undefined,
      false
    );
    const before = serializeScore(score);

    controller.setScoreName(score, "Blocked");
    controller.setMasterVolume(score, 0.25);
    controller.setMasterPan(score, -0.5);
    controller.addTrack(score, new Guitar(), "Blocked");
    controller.removeTrack(score, secondTrack);
    controller.moveTrack(track, 1);
    controller.setTrackName(track, "Blocked");
    controller.setTrackVolume(track, 0.25);
    controller.setTrackPan(track, -0.5);
    controller.toggleTrackMuted(track);
    controller.toggleTrackSoloed(track);
    controller.setTrackInstrument(
      track,
      new Guitar(),
      TrackInstrumentChangeMode.KeepFrets
    );
    controller.undo();
    controller.redo();
    controller.setSelectedNoteFret(3);
    controller.setDuration(NoteDuration.Half);
    controller.setSelectedBeatRest();
    controller.setDots(1);
    controller.setSelectedBeatsTuplet(3, 2);
    controller.setSelectedBarTempo(90);
    controller.setSelectedBarTimeSignature(3, NoteDuration.Quarter);
    controller.setSelectedBarRepeatStatus(BarRepeatStatus.Start);
    controller.setTechnique(GuitarTechniqueType.Vibrato);
    controller.paste();
    controller.deleteSelectedBeats();
    controller.insertBeatBeforeSelected();
    controller.insertBeatAfterSelected();
    controller.removeSelectedBeat();
    controller.setActiveVoiceNumber(2);
    controller.insertBarBeforeSelected();
    controller.insertBarAfterSelected();
    controller.removeSelectedBar();

    expect(controller.editingEnabled).toBe(false);
    expect(serializeScore(score)).toEqual(before);
  });

  test("playback seek clears edit selection and restarts from the target beat", () => {
    const { score, track } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const targetBeatElement = getBeatElements(controller)[1];
    const masterBarCount = score.masterBars.length;
    const barCount = track.staves[0].bars.length;
    mockScorePlayerInstances[0].isPlaying = true;

    controller.restartPlayerFromBeat(targetBeatElement.beat);

    expect(controller.selectionCursor).toBeUndefined();
    expect(controller.selectionBeats).toEqual([]);
    expect(
      mockScorePlayerInstances[0].clearSelectionLoopSection
    ).toHaveBeenCalledTimes(1);
    expect(mockScorePlayerInstances[0].start).toHaveBeenCalledWith({
      startBeat: targetBeatElement.beat,
    });
    expect(score.masterBars).toHaveLength(masterBarCount);
    expect(track.staves[0].bars).toHaveLength(barCount);
  });

  test("bar traversal selects first beats without editing the score", () => {
    const { score, track } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);

    controller.selectNextBar();
    expect(controller.selectionCursor?.bar).toBe(track.staves[0].bars[1]);

    controller.selectLastBar();
    expect(controller.selectionCursor?.bar).toBe(track.staves[0].bars[2]);

    controller.selectPreviousBar();
    expect(controller.selectionCursor?.bar).toBe(track.staves[0].bars[1]);

    controller.selectFirstBar();
    expect(controller.selectionCursor?.bar).toBe(track.staves[0].bars[0]);
  });

  test("anchored bar traversal extends from the active range endpoint", () => {
    const { score, track } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);

    expect(controller.setSelectionAnchor()).toBe(true);
    expect(controller.selectionBeats).toHaveLength(1);

    controller.selectNextBar();
    controller.selectNextBar();
    expect(controller.selectionBeats).toEqual([
      track.staves[0].bars[0].getVoiceBar(1)?.beats[0],
      track.staves[0].bars[1].getVoiceBar(1)?.beats[0],
      track.staves[0].bars[2].getVoiceBar(1)?.beats[0],
    ]);

    controller.selectPreviousBar();
    expect(controller.selectionBeats).toHaveLength(2);

    expect(controller.clearSelectionRange()).toBe(true);
    expect(controller.selectionBeats).toEqual([]);
    expect(controller.selectionCursor?.bar).toBe(track.staves[0].bars[0]);
  });

  test("bar traversal restarts active playback from the current bar", () => {
    const { score, track } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const player = mockScorePlayerInstances[0];
    player.isPlaying = true;
    player.playbackAnchorBeat =
      track.staves[0].bars[0].getVoiceBar(1)?.beats[0];

    controller.selectNextBar();

    expect(controller.selectionCursor).toBeUndefined();
    expect(player.start).toHaveBeenCalledTimes(1);
    expect(player.start).toHaveBeenCalledWith({
      startBeat: track.staves[0].bars[1].getVoiceBar(1)?.beats[0],
    });
  });

  test("bar traversal does not restart playback when selection does not move", () => {
    const { track } = createScoreGraph();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const player = mockScorePlayerInstances[0];
    player.isPlaying = true;
    player.playbackAnchorBeat =
      track.staves[0].bars[0].getVoiceBar(1)?.beats[0];

    controller.selectFirstBar();
    controller.selectPreviousBar();

    expect(player.start).not.toHaveBeenCalled();
  });

  test("bar traversal safely ignores active playback without an anchor beat", () => {
    const { track } = createScoreGraph();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    mockScorePlayerInstances[0].isPlaying = true;

    expect(() => controller.selectPreviousBar()).not.toThrow();
    expect(mockScorePlayerInstances[0].start).not.toHaveBeenCalled();
  });

  test("first and last bar follow playback state after selection is cleared", () => {
    const { score, track } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const player = mockScorePlayerInstances[0];
    const playbackAnchorBeat = track.staves[0].bars[1].getVoiceBar(1)?.beats[0];
    const firstBeat = track.staves[0].bars[0].getVoiceBar(1)?.beats[0];
    const lastBeat = track.staves[0].bars[2].getVoiceBar(1)?.beats[0];
    player.isPlaying = true;
    if (playbackAnchorBeat === undefined) {
      throw Error("Expected playback anchor beat");
    }

    controller.restartPlayerFromBeat(playbackAnchorBeat);
    player.playbackAnchorBeat = playbackAnchorBeat;

    expect(() => controller.selectFirstBar()).not.toThrow();
    expect(player.start).toHaveBeenLastCalledWith({ startBeat: firstBeat });

    player.playbackAnchorBeat = playbackAnchorBeat;
    expect(() => controller.selectLastBar()).not.toThrow();
    expect(player.start).toHaveBeenLastCalledWith({ startBeat: lastBeat });
  });

  test("playback bar traversal falls back when the anchor voice is absent", () => {
    const { score, track } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const bars = track.staves[0].bars;
    const anchorVoice = bars[1].insertVoiceBar(2);
    const playbackAnchorBeat = anchorVoice.beats[0];
    const firstBeat = bars[0].getVoiceBar(1)?.beats[0];
    const lastBeat = bars[2].getVoiceBar(1)?.beats[0];
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const player = mockScorePlayerInstances[0];
    player.isPlaying = true;
    player.playbackAnchorBeat = playbackAnchorBeat;

    controller.selectFirstBar();
    player.playbackAnchorBeat = playbackAnchorBeat;
    controller.selectPreviousBar();
    player.playbackAnchorBeat = playbackAnchorBeat;
    controller.selectNextBar();
    player.playbackAnchorBeat = playbackAnchorBeat;
    controller.selectLastBar();

    expect(player.start).toHaveBeenNthCalledWith(1, { startBeat: firstBeat });
    expect(player.start).toHaveBeenNthCalledWith(2, { startBeat: firstBeat });
    expect(player.start).toHaveBeenNthCalledWith(3, { startBeat: lastBeat });
    expect(player.start).toHaveBeenNthCalledWith(4, { startBeat: lastBeat });
  });

  test("playback bar traversal falls back across staves", () => {
    const { score, track } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const secondStaff = track.insertStaff(1).staves[0];
    const emptyTargetVoice = secondStaff.bars[2].getVoiceBar(1);
    if (emptyTargetVoice === null) {
      throw Error("Expected target voice bar");
    }
    emptyTargetVoice.replaceBeats([]);
    const playbackAnchorBeat = secondStaff.bars[1].getVoiceBar(1)?.beats[0];
    const fallbackBeat = track.staves[0].bars[2].getVoiceBar(1)?.beats[0];
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const player = mockScorePlayerInstances[0];
    player.isPlaying = true;
    player.playbackAnchorBeat = playbackAnchorBeat;

    controller.selectNextBar();

    expect(player.start).toHaveBeenCalledWith({ startBeat: fallbackBeat });
  });

  test("switching to a new voice updates only the affected line vertically", () => {
    const { track, bar } = createScoreGraph();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const updateSpy = jest.spyOn(controller.trackElement, "update");

    controller.setActiveVoiceNumber(2);

    expect(controller.activeVoiceNumber).toBe(2);
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledWith({
      affectedMasterBarIndices: [0],
    });
  });

  test("switching to an existing voice only updates selection", () => {
    const { track, bar } = createScoreGraph();
    const existingVoiceBar = bar.insertVoiceBar(2);
    const voiceBarCount = bar.voiceBarsAsArray.length;
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const updateSpy = jest.spyOn(controller.trackElement, "update");

    controller.setActiveVoiceNumber(2);

    expect(bar.voiceBarsAsArray).toHaveLength(voiceBarCount);
    expect(bar.getVoiceBar(2)).toBe(existingVoiceBar);
    expect(controller.activeVoiceNumber).toBe(2);
    expect(controller.selectionCursor?.beat).toBe(existingVoiceBar.beats[0]);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  test("moving right into a missing active voice bar updates elements", () => {
    const { score, track } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    controller.setActiveVoiceNumber(2);
    const secondBar = track.staves[0].bars[1];

    controller.moveSelectedNote(SelectedMoveDirection.Right);
    controller.moveSelectedNote(SelectedMoveDirection.Right);
    controller.moveSelectedNote(SelectedMoveDirection.Right);
    controller.moveSelectedNote(SelectedMoveDirection.Right);

    expect(secondBar.getVoiceBar(2)).not.toBeNull();
    expect(controller.selectionCursor?.bar).toBe(secondBar);
    expect(
      controller.trackElement.getBeatElement(controller.selectionCursor!.beat)
    ).toBeDefined();
  });

  test("moving left into a missing active voice bar updates elements", () => {
    const { score, track } = createScoreGraph();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const secondBar = track.staves[0].bars[1];
    const secondVoiceBar = secondBar.insertVoiceBar(2);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    controller.trackElement.update();
    const secondVoiceBeatElement = controller.trackElement.getBeatElement(
      secondVoiceBar.beats[0]
    );
    if (secondVoiceBeatElement === undefined) {
      throw Error("Second voice beat element not found");
    }
    controller.selectNoteElement(secondVoiceBeatElement.noteElements[0]);
    const firstBar = track.staves[0].bars[0];

    controller.moveSelectedNote(SelectedMoveDirection.Left);

    expect(firstBar.getVoiceBar(2)).not.toBeNull();
    expect(controller.selectionCursor?.bar).toBe(firstBar);
    expect(
      controller.trackElement.getBeatElement(controller.selectionCursor!.beat)
    ).toBeDefined();
  });

  test("redo on TrackController redoes the previously undone command", () => {
    const { track, bar } = createScoreGraph();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    controller.moveSelectedNote(SelectedMoveDirection.Right);
    expect(voiceBar.beats).toHaveLength(2);

    controller.undo();
    expect(voiceBar.beats).toHaveLength(1);

    controller.redo();
    expect(voiceBar.beats).toHaveLength(2);
  });

  test("insert beat before selected inserts and selects the new beat", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const beats = voiceBar.beats;
    const secondBeatUUID = beats[1].uuid;

    controller.moveSelectedNote(SelectedMoveDirection.Right);
    controller.insertBeatBeforeSelected();

    expect(beats).toHaveLength(3);
    expect(beats[2].uuid).toBe(secondBeatUUID);
    expect(controller.selectionCursor?.beat).toBe(beats[1]);

    const insertedBeatElement = controller.trackElement.getBeatElement(
      beats[1]
    );
    if (insertedBeatElement === undefined) {
      throw Error("Expected inserted beat element");
    }
    controller.selectNoteElement(insertedBeatElement.noteElements[0]);
    expect(controller.selectionCursor?.beat).toBe(beats[1]);
    expect(controller.selectionCursor?.noteIndex).toBe(0);
  });

  test("insert beat after selected inserts and selects the new beat", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const beats = voiceBar.beats;
    const secondBeatUUID = beats[1].uuid;

    controller.insertBeatAfterSelected();

    expect(beats).toHaveLength(3);
    expect(beats[2].uuid).toBe(secondBeatUUID);
    expect(controller.selectionCursor?.beat).toBe(beats[1]);

    const insertedBeatElement = controller.trackElement.getBeatElement(
      beats[1]
    );
    if (insertedBeatElement === undefined) {
      throw Error("Expected inserted beat element");
    }
    controller.selectNoteElement(insertedBeatElement.noteElements[0]);
    expect(controller.selectionCursor?.beat).toBe(beats[1]);
    expect(controller.selectionCursor?.noteIndex).toBe(0);
  });

  test("remove selected beat deletes current beat and clears selection", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const beats = voiceBar.beats;
    const secondBeatUUID = beats[1].uuid;

    controller.removeSelectedBeat();

    expect(beats).toHaveLength(1);
    expect(beats[0].uuid).toBe(secondBeatUUID);
    expect(controller.selectionCursor?.beat).toBe(beats[0]);
  });

  test("remove selected last beat keeps cursor on replacement rest", () => {
    const score = new Score();
    const track = score.tracks[0];
    const bar = track.staves[0].bars[0];
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);

    controller.removeSelectedBeat();

    expect(voiceBar.beats).toHaveLength(1);
    expect(voiceBar.beats[0].isRest()).toBe(true);
    expect(controller.selectionCursor).not.toBeUndefined();
    expect(controller.selectionCursor?.beat).toBe(voiceBar.beats[0]);
    expect(controller.selectionCursor?.note).toBeNull();
  });

  test("insert bar before selected note inserts and selects the new bar", () => {
    const { track, score } = createScoreGraph();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const originalUUID = score.masterBars[0].uuid;

    controller.insertBarBeforeSelected();

    const voiceBar = track.staves[0].bars[0].getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    expect(score.masterBars).toHaveLength(2);
    expect(score.masterBars[1].uuid).toBe(originalUUID);
    expect(controller.selectionBeats).toHaveLength(0);
    expect(controller.selectionCursor?.beat).toBe(voiceBar.beats[0]);
  });

  test("insert bar after selected note inserts and selects the new bar", () => {
    const { track, score } = createScoreGraph();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const originalUUID = score.masterBars[0].uuid;

    controller.insertBarAfterSelected();

    const voiceBar = track.staves[0].bars[1].getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    expect(score.masterBars).toHaveLength(2);
    expect(score.masterBars[0].uuid).toBe(originalUUID);
    expect(controller.selectionBeats).toHaveLength(0);
    expect(controller.selectionCursor?.beat).toBe(voiceBar.beats[0]);
  });

  test("insert beat before active selection inserts before first selected beat", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Sixteenth },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const beatElements = getBeatElements(controller);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const beats = voiceBar.beats;
    const originalUUIDs = beats.map((beat) => beat.uuid);

    controller.selectBeat(beatElements[1]);
    controller.selectBeat(beatElements[2]);
    controller.insertBeatBeforeSelected();

    expect(beats).toHaveLength(4);
    expect(beats[0].uuid).toBe(originalUUIDs[0]);
    expect(beats[2].uuid).toBe(originalUUIDs[1]);
    expect(beats[3].uuid).toBe(originalUUIDs[2]);
    expect(controller.selectionBeats).toHaveLength(0);
    expect(controller.selectionCursor?.beat).toBe(beats[1]);
  });

  test("insert beat after active selection inserts after last selected beat", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Sixteenth },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const beatElements = getBeatElements(controller);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const beats = voiceBar.beats;
    const originalUUIDs = beats.map((beat) => beat.uuid);

    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[1]);
    controller.insertBeatAfterSelected();

    expect(beats).toHaveLength(4);
    expect(beats[0].uuid).toBe(originalUUIDs[0]);
    expect(beats[1].uuid).toBe(originalUUIDs[1]);
    expect(beats[3].uuid).toBe(originalUUIDs[2]);
    expect(controller.selectionBeats).toHaveLength(0);
    expect(controller.selectionCursor?.beat).toBe(beats[2]);
  });

  test("remove active selection selects the beat before selection", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
      { baseDuration: NoteDuration.Sixteenth },
      { baseDuration: NoteDuration.ThirtySecond },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const beatElements = getBeatElements(controller);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const beats = voiceBar.beats;
    const beforeSelectionUUID = beats[0].uuid;
    const afterSelectionUUID = beats[3].uuid;

    controller.selectBeat(beatElements[1]);
    controller.selectBeat(beatElements[2]);
    controller.removeSelectedBeat();

    expect(beats).toHaveLength(2);
    expect(beats[0].uuid).toBe(beforeSelectionUUID);
    expect(beats[1].uuid).toBe(afterSelectionUUID);
    expect(controller.selectionBeats).toHaveLength(0);
    expect(controller.selectionCursor?.beat).toBe(beats[0]);
  });

  test("insert bar before active selection inserts before first selected bar", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar({
      tempo: 120,
      beatsCount: 4,
      duration: NoteDuration.Quarter,
      repeatStatus: 0,
      repeatCount: null,
    });
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    controller.trackElement.update();
    const originalUUIDs = score.masterBars.map((bar) => bar.uuid);

    controller.selectBeat(getBeatElement(controller, 0, 0));
    controller.selectBeat(getBeatElement(controller, 1, 0));
    controller.insertBarBeforeSelected();

    const voiceBar = track.staves[0].bars[0].getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    expect(score.masterBars.length).toBeGreaterThanOrEqual(3);
    expect(score.masterBars[1].uuid).toBe(originalUUIDs[0]);
    expect(controller.selectionBeats).toHaveLength(0);
    expect(controller.selectionCursor?.beat).toBe(voiceBar.beats[0]);
  });

  test("insert bar after active selection inserts after last selected bar", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar({
      tempo: 120,
      beatsCount: 4,
      duration: NoteDuration.Quarter,
      repeatStatus: 0,
      repeatCount: null,
    });
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    controller.trackElement.update();
    const originalUUIDs = score.masterBars.map((bar) => bar.uuid);

    controller.selectBeat(getBeatElement(controller, 0, 0));
    controller.selectBeat(getBeatElement(controller, 1, 0));
    controller.insertBarAfterSelected();

    const voiceBar = track.staves[0].bars[2].getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    expect(score.masterBars.length).toBeGreaterThanOrEqual(3);
    expect(score.masterBars[0].uuid).toBe(originalUUIDs[0]);
    expect(score.masterBars[1].uuid).toBe(originalUUIDs[1]);
    expect(controller.selectionBeats).toHaveLength(0);
    expect(controller.selectionCursor?.beat).toBe(voiceBar.beats[0]);
  });

  test("remove selected bar removes the current bar and selects the previous bar", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar({
      tempo: 120,
      beatsCount: 4,
      duration: NoteDuration.Quarter,
      repeatStatus: 0,
      repeatCount: null,
    });
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    controller.trackElement.update();
    const voiceBar = track.staves[0].bars[0].getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const firstBarFirstBeat = voiceBar.beats[0];

    controller.selectBeat(getBeatElement(controller, 1, 0));
    controller.removeSelectedBar();

    expect(score.masterBars).toHaveLength(1);
    expect(controller.selectionBeats).toHaveLength(0);
    expect(controller.selectionCursor?.beat).toBe(firstBarFirstBeat);
  });

  test("remove active selection removes all touched bars in order", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar({
      tempo: 120,
      beatsCount: 4,
      duration: NoteDuration.Quarter,
      repeatStatus: 0,
      repeatCount: null,
    });
    score.appendMasterBar({
      tempo: 120,
      beatsCount: 4,
      duration: NoteDuration.Quarter,
      repeatStatus: 0,
      repeatCount: null,
    });
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    controller.trackElement.update();

    controller.selectBeat(getBeatElement(controller, 0, 0));
    controller.selectBeat(getBeatElement(controller, 1, 0));
    controller.removeSelectedBar();

    const voiceBar = track.staves[0].bars[0].getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    expect(score.masterBars).toHaveLength(1);
    expect(controller.selectionBeats).toHaveLength(0);
    expect(controller.selectionCursor?.beat).toBe(voiceBar.beats[0]);
  });

  test("remove active selection removes contiguous middle bars by original index", () => {
    const { track, score } = createScoreGraph();

    for (let i = 0; i < 6; i++) {
      score.appendMasterBar({
        tempo: 120,
        beatsCount: 4,
        duration: NoteDuration.Quarter,
        repeatStatus: 0,
        repeatCount: null,
      });
    }

    const originalUUIDs = score.masterBars.map((bar) => bar.uuid);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    controller.trackElement.update();

    controller.selectBeat(getBeatElement(controller, 2, 0));
    controller.selectBeat(getBeatElement(controller, 3, 0));
    controller.selectBeat(getBeatElement(controller, 4, 0));
    controller.removeSelectedBar();

    expect(score.masterBars.map((bar) => bar.uuid)).toEqual([
      originalUUIDs[0],
      originalUUIDs[1],
      originalUUIDs[5],
      originalUUIDs[6],
    ]);
    expect(controller.selectionBeats).toHaveLength(0);
    const voiceBar = track.staves[0].bars[1].getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    expect(controller.selectionCursor?.beat).toBe(voiceBar.beats[0]);
  });

  test("remove all selected beats can leave a true empty voice bar", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Eighth },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const beatElements = getBeatElements(controller);

    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[1]);
    controller.removeSelectedBeat();

    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    expect(noteBeats(voiceBar.beats)).toHaveLength(0);
    expect(voiceBar.beats).toHaveLength(1);
    expect(voiceBar.beats[0].isRest()).toBe(true);
    expect(controller.selectionBeats).toHaveLength(0);
  });

  test("setDuration changes only the selected note beat", () => {
    const { track, bar } = createScoreGraph();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    controller.setDuration(NoteDuration.Eighth);

    expect(voiceBar.beats[0].baseDuration).toBe(NoteDuration.Eighth);
    expect(voiceBar.beats[0].fullDurationTicks).toBe(
      voiceBar.tickResolution / 8
    );
    expect(voiceBar.actualTicks).toBe(voiceBar.tickResolution / 8);
  });

  test("setDuration changes every beat in the selected range", () => {
    const { track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const beatElements = getBeatElements(controller);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[2]);
    controller.setDuration(NoteDuration.Eighth);

    expect(voiceBar.beats.slice(0, 3).map((beat) => beat.baseDuration)).toEqual(
      [NoteDuration.Eighth, NoteDuration.Eighth, NoteDuration.Eighth]
    );
    expect(voiceBar.beats[3].baseDuration).toBe(NoteDuration.Quarter);
    expect(
      voiceBar.beats.slice(0, 3).map((beat) => beat.fullDurationTicks)
    ).toEqual([
      voiceBar.tickResolution / 8,
      voiceBar.tickResolution / 8,
      voiceBar.tickResolution / 8,
    ]);
    expect(voiceBar.beats[1].startTick).toBe(voiceBar.beats[0].endTick);
    expect(voiceBar.beats[2].startTick).toBe(voiceBar.beats[1].endTick);
    expect(voiceBar.actualTicks).toBe((voiceBar.tickResolution * 5) / 8);
  });

  test("paste over beat selection inserts clipboard at selection start", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar();
    score.appendMasterBar();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);

    setBarDurations(controller, 0, [
      NoteDuration.ThirtySecond,
      NoteDuration.Sixteenth,
      NoteDuration.Eighth,
    ]);
    setBarDurations(controller, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    setBarDurations(controller, 2, [NoteDuration.Half, NoteDuration.Half]);
    controller.trackElement.update();
    const beatElements = getBeatElements(controller);
    const barOneVoiceBar = track.staves[0].bars[1].getVoiceBar(1);
    const barTwoVoiceBar = track.staves[0].bars[2].getVoiceBar(1);
    if (barOneVoiceBar === null || barTwoVoiceBar === null) {
      throw Error("Expected voice 1 in test bars");
    }

    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[2]);
    controller.copy();
    controller.clearSelection();
    controller.selectBeat(beatElements[3]);
    controller.selectBeat(beatElements[4]);
    controller.paste();

    expect(
      noteBeats(barOneVoiceBar.beats).map((beat) => beat.baseDuration)
    ).toEqual([
      NoteDuration.ThirtySecond,
      NoteDuration.Sixteenth,
      NoteDuration.Eighth,
    ]);
    expect(
      noteBeats(barTwoVoiceBar.beats).map((beat) => beat.baseDuration)
    ).toEqual([NoteDuration.Half, NoteDuration.Half]);
    expect(controller.selectionBeats).toHaveLength(0);
  });

  test("paste underfill removes remaining selected beats until rests exist", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar();
    score.appendMasterBar();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);

    setBarDurations(controller, 0, [NoteDuration.Sixteenth]);
    setBarDurations(controller, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    setBarDurations(controller, 2, [NoteDuration.Half, NoteDuration.Half]);
    controller.trackElement.update();
    const beatElements = getBeatElements(controller);
    const barOneVoiceBar = track.staves[0].bars[1].getVoiceBar(1);
    const barTwoVoiceBar = track.staves[0].bars[2].getVoiceBar(1);
    if (barOneVoiceBar === null || barTwoVoiceBar === null) {
      throw Error("Expected voice 1 in test bars");
    }

    controller.selectBeat(beatElements[0]);
    controller.copy();
    controller.clearSelection();
    controller.selectBeat(beatElements[1]);
    controller.selectBeat(beatElements[4]);
    controller.paste();

    expect(
      noteBeats(barOneVoiceBar.beats).map((beat) => beat.baseDuration)
    ).toEqual([NoteDuration.Sixteenth]);
    expect(noteBeats(barTwoVoiceBar.beats)).toHaveLength(0);
    expect(barTwoVoiceBar.beats[0].isRest()).toBe(true);
  });

  test("paste replacement does not retain an invariant rest through undo", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    setBarDurations(controller, 0, [NoteDuration.Whole]);
    setBarDurations(controller, 1, [NoteDuration.Half, NoteDuration.Half]);
    controller.trackElement.update();
    const beatElements = getBeatElements(controller);
    const targetVoiceBar = track.staves[0].bars[1].getVoiceBar(1);
    if (targetVoiceBar === null) {
      throw Error("Expected voice 1 in target bar");
    }

    controller.selectBeat(beatElements[0]);
    controller.copy();
    controller.clearSelection();
    controller.selectBeat(beatElements[1]);
    controller.selectBeat(beatElements[2]);
    controller.paste();

    expect(targetVoiceBar.beats.map((b) => b.baseDuration)).toEqual([
      NoteDuration.Whole,
    ]);

    controller.undo();
    expect(targetVoiceBar.beats.map((b) => b.baseDuration)).toEqual([
      NoteDuration.Half,
      NoteDuration.Half,
    ]);
  });

  test("undo restores beats removed by multi-bar paste replacement", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar();
    score.appendMasterBar();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);

    setBarDurations(controller, 0, [
      NoteDuration.ThirtySecond,
      NoteDuration.Sixteenth,
      NoteDuration.Eighth,
    ]);
    setBarDurations(controller, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    setBarDurations(controller, 2, [NoteDuration.Half, NoteDuration.Half]);
    controller.trackElement.update();
    const beatElements = getBeatElements(controller);
    const barOneVoiceBar = track.staves[0].bars[1].getVoiceBar(1);
    const barTwoVoiceBar = track.staves[0].bars[2].getVoiceBar(1);
    if (barOneVoiceBar === null || barTwoVoiceBar === null) {
      throw Error("Expected voice 1 in test bars");
    }

    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[2]);
    controller.copy();
    controller.clearSelection();
    controller.selectBeat(beatElements[3]);
    controller.selectBeat(beatElements[4]);
    controller.paste();
    controller.undo();

    expect(
      noteBeats(barOneVoiceBar.beats).map((beat) => beat.baseDuration)
    ).toEqual([NoteDuration.Quarter, NoteDuration.Quarter]);
    expect(
      noteBeats(barTwoVoiceBar.beats).map((beat) => beat.baseDuration)
    ).toEqual([NoteDuration.Half, NoteDuration.Half]);
    expect(barOneVoiceBar.beats).toHaveLength(2);
    expect(barTwoVoiceBar.beats).toHaveLength(2);

    controller.redo();
    expect(noteBeats(barOneVoiceBar.beats)).toHaveLength(3);
  });

  test("paste keeps long clipboard content in the target bar", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);

    setBarDurations(
      controller,
      0,
      Array.from({ length: 16 }, () => NoteDuration.ThirtySecond)
    );
    setBarDurations(controller, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    controller.trackElement.update();
    const beatElements = getBeatElements(controller);
    const voiceBar = track.staves[0].bars[1].getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[15]);
    controller.copy();
    controller.clearSelection();
    controller.selectBeat(beatElements[16]);
    controller.selectBeat(beatElements[17]);
    controller.paste();

    expect(score.masterBars).toHaveLength(2);
    expect(noteBeats(voiceBar.beats)).toHaveLength(16);
    expect(track.staves[0].bars[1].checkDurationsFit()).toBe(false);
  });

  test("paste handles source and target beat selections made right-to-left", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar();
    score.appendMasterBar();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);

    setBarDurations(controller, 0, [
      NoteDuration.ThirtySecond,
      NoteDuration.Sixteenth,
      NoteDuration.Eighth,
    ]);
    setBarDurations(controller, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    setBarDurations(controller, 2, [NoteDuration.Half, NoteDuration.Half]);
    controller.trackElement.update();
    const beatElements = getBeatElements(controller);
    const voiceBar = track.staves[0].bars[1].getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    controller.selectBeat(beatElements[2]);
    controller.selectBeat(beatElements[0]);
    controller.copy();
    controller.clearSelection();
    controller.selectBeat(beatElements[4]);
    controller.selectBeat(beatElements[3]);
    controller.paste();

    expect(noteBeats(voiceBar.beats).map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.ThirtySecond,
      NoteDuration.Sixteenth,
      NoteDuration.Eighth,
    ]);
  });

  test("drag selection ignores beats from another voice without changing selection", () => {
    const { bar, track } = createScoreGraph();
    const voice1 = bar.getVoiceBar(1);
    const voice2 = bar.ensureVoiceBar(2);
    if (voice1 === null) {
      throw Error("Expected voice 1 in test bar");
    }
    voice1.beats.splice(
      0,
      voice1.beats.length,
      createBeat(voice1, NoteDuration.Quarter),
      createBeat(voice1, NoteDuration.Quarter)
    );
    voice2.beats.splice(
      0,
      voice2.beats.length,
      createBeat(voice2, NoteDuration.Quarter),
      createBeat(voice2, NoteDuration.Quarter)
    );
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    controller.trackElement.update();
    const beatElements = getBeatElements(controller);
    const voice1Beats = beatElements.filter(
      (beatElement) => beatElement.beat.voiceBar.voiceNumber === 1
    );
    const voice2Beats = beatElements.filter(
      (beatElement) => beatElement.beat.voiceBar.voiceNumber === 2
    );

    controller.selectBeat(voice1Beats[0]);
    controller.selectBeat(voice1Beats[1]);
    controller.selectBeat(voice2Beats[1]);

    expect(controller.selectionBeats).toEqual([
      voice1Beats[0].beat,
      voice1Beats[1].beat,
    ]);
    expect(controller.activeVoiceNumber).toBe(1);
  });

  test("paste over same-bar selection inserts clipboard at selection start", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);

    setBarDurations(
      controller,
      0,
      Array.from({ length: 8 }, () => NoteDuration.Eighth)
    );
    setBarDurations(controller, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    controller.trackElement.update();
    const beatElements = getBeatElements(controller);
    const voiceBar = track.staves[0].bars[1].getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[7]);
    controller.copy();
    controller.clearSelection();
    controller.selectBeat(beatElements[8]);
    controller.selectBeat(beatElements[9]);
    controller.paste();

    expect(noteBeats(voiceBar.beats)).toHaveLength(10);
    expect(noteBeats(voiceBar.beats).map((beat) => beat.baseDuration)).toEqual([
      ...Array.from({ length: 8 }, () => NoteDuration.Eighth),
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    expect(track.staves[0].bars[1].checkDurationsFit()).toBe(false);

    controller.undo();
    expect(noteBeats(voiceBar.beats)).toHaveLength(4);

    controller.redo();
    expect(noteBeats(voiceBar.beats)).toHaveLength(10);
    expect(noteBeats(voiceBar.beats).map((beat) => beat.baseDuration)).toEqual([
      ...Array.from({ length: 8 }, () => NoteDuration.Eighth),
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
  });

  test("paste at note selection inserts locally into selected bar", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);

    setBarDurations(controller, 0, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    setBarDurations(controller, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    controller.trackElement.update();
    const beatElements = getBeatElements(controller);
    const voiceBar = track.staves[0].bars[1].getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[3]);
    controller.copy();
    controller.clearSelection();
    controller.selectNoteElement(beatElements[4].noteElements[0]);
    controller.paste();

    expect(score.masterBars).toHaveLength(2);
    expect(noteBeats(voiceBar.beats)).toHaveLength(8);
    expect(track.staves[0].bars[1].checkDurationsFit()).toBe(false);
  });

  test("undo restores local paste without creating bars", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);

    setBarDurations(
      controller,
      0,
      Array.from({ length: 16 }, () => NoteDuration.ThirtySecond)
    );
    setBarDurations(controller, 1, [
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
    controller.trackElement.update();
    const beatElements = getBeatElements(controller);
    const voiceBar = track.staves[0].bars[1].getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    controller.selectBeat(beatElements[0]);
    controller.selectBeat(beatElements[15]);
    controller.copy();
    controller.clearSelection();
    controller.selectBeat(beatElements[16]);
    controller.selectBeat(beatElements[17]);
    controller.paste();
    controller.undo();

    expect(score.masterBars).toHaveLength(2);
    expect(noteBeats(voiceBar.beats).map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Quarter,
    ]);
  });

  test("paste copies playable guitar notes without invalid intermediate state", () => {
    const { track, score } = createScoreGraph();
    score.appendMasterBar();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);

    setBarDurations(controller, 0, [NoteDuration.ThirtySecond]);
    setBarDurations(controller, 1, [NoteDuration.Quarter]);
    const sourceVoiceBar = track.staves[0].bars[0].getVoiceBar(1);
    const targetVoiceBar = track.staves[0].bars[1].getVoiceBar(1);
    if (sourceVoiceBar === null || targetVoiceBar === null) {
      throw Error("Expected voice 1 in test bars");
    }
    const sourceNote = sourceVoiceBar.beats[0].notes?.[0];
    if (!(sourceNote instanceof GuitarNote)) {
      throw Error("Expected source guitar note");
    }

    sourceNote.octave = 5;
    sourceNote.noteValue = NoteValue.A;
    controller.trackElement.update();
    const beatElements = getBeatElements(controller);

    controller.selectBeat(beatElements[0]);
    controller.copy();
    controller.clearSelection();
    controller.selectBeat(beatElements[1]);
    controller.paste();

    const pastedNote = targetVoiceBar.beats[0].notes?.[0];
    if (pastedNote === undefined) {
      throw Error("Expected pasted note");
    }

    expect(pastedNote.noteValue).toBe(NoteValue.A);
    expect(pastedNote.octave).toBe(5);
  });

  test("moving right enough to split the last bar onto a new line marks that bar updated", () => {
    const { score, track, staff } = createScoreGraph();
    for (let i = 0; i < 40; i++) {
      score.appendMasterBar({
        tempo: 120,
        beatsCount: 4,
        duration: NoteDuration.Quarter,
        repeatStatus: 0,
        repeatCount: null,
      });
    }

    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    controller.trackElement.update();

    const lastBar = staff.bars[staff.bars.length - 1];
    while (controller.selectionCursor?.bar !== lastBar) {
      controller.moveSelectedNote(SelectedMoveDirection.Right);
    }

    const initialLineCount = controller.trackElement.trackLineElements.length;

    while (
      controller.trackElement.trackLineElements.length === initialLineCount
    ) {
      controller.moveSelectedNote(SelectedMoveDirection.Right);
    }

    const secondLastLine =
      controller.trackElement.trackLineElements[
        controller.trackElement.trackLineElements.length - 2
      ];
    const lastLine =
      controller.trackElement.trackLineElements[
        controller.trackElement.trackLineElements.length - 1
      ];

    expect(controller.trackElement.trackLineElements.length).toBeGreaterThan(
      initialLineCount
    );
    expect(secondLastLine.boundingBox.bottom).toBeCloseTo(
      lastLine.boundingBox.y
    );
    expect(controller.selectionCursor?.beat).toBeDefined();
    expect(controller.selectionCursor?.bar).toBeDefined();
  });

  test("vibrato apply undo redo uses vertical update behavior", () => {
    const { score, track } = createScoreGraph();
    const note = track.staves[0].bars[0].getVoiceBar(1)?.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }
    note.fret = 5;
    for (let i = 0; i < 80; i++) {
      score.appendMasterBar({
        tempo: 120,
        beatsCount: 4,
        duration: NoteDuration.Quarter,
        repeatStatus: 0,
        repeatCount: null,
      });
    }

    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    controller.trackElement.update();

    const secondLine = controller.trackElement.trackLineElements[1];
    const initialY = secondLine.boundingBox.y;

    controller.setTechnique(GuitarTechniqueType.Vibrato);
    expect(
      controller.trackElement.trackLineElements[1].boundingBox.y
    ).toBeGreaterThan(initialY);

    controller.undo();
    expect(
      controller.trackElement.trackLineElements[1].boundingBox.y
    ).toBeCloseTo(initialY);

    controller.redo();
    expect(
      controller.trackElement.trackLineElements[1].boundingBox.y
    ).toBeGreaterThan(initialY);
  });

  test("tempo visibility apply undo redo uses vertical update behavior", () => {
    const { score, track } = createScoreGraph();
    for (let i = 0; i < 120; i++) {
      score.appendMasterBar({
        tempo: 120,
        beatsCount: 4,
        duration: NoteDuration.Quarter,
        repeatStatus: 0,
        repeatCount: null,
      });
    }

    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    controller.trackElement.update();

    const secondLine = controller.trackElement.trackLineElements[1];
    const thirdLine = controller.trackElement.trackLineElements[2];
    const firstNoteOnSecondLine =
      secondLine.staffLineContainers[0].styleLinesAsArray[0].barElements[0]
        .beatElements[0].noteElements[0];
    const initialThirdLineY = thirdLine.boundingBox.y;

    controller.selectNoteElement(firstNoteOnSecondLine);
    controller.setSelectedBarTempo(160);
    expect(
      controller.trackElement.trackLineElements[2].boundingBox.y
    ).toBeGreaterThan(initialThirdLineY);

    controller.undo();
    expect(
      controller.trackElement.trackLineElements[2].boundingBox.y
    ).toBeCloseTo(initialThirdLineY);

    controller.redo();
    expect(
      controller.trackElement.trackLineElements[2].boundingBox.y
    ).toBeGreaterThan(initialThirdLineY);
  });

  test("repeated tempo changes invalidate displayed tempo text", () => {
    const { track } = createScoreGraph();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    controller.trackElement.update();
    controller.selectNoteElement(
      getBeatElements(controller)[0].noteElements[0]
    );
    controller.trackElement.consumeDiff();

    controller.setSelectedBarTempo(130);
    let lineInfo = controller.trackElement.trackLineElements[0]
      .trackLineInfoElement as TrackLineInfoElement;
    let barElement = [...lineInfo.barTempoRectsMap.keys()][0];
    const firstHash = lineInfo.stateHash;
    const firstDiff = controller.trackElement.consumeDiff();

    expect(lineInfo.getBarTempoText(barElement)).toBe("=130");
    expect(firstDiff.updated.get(TrackLineInfoElement)).toContain(
      lineInfo.getStableIdentity()
    );

    controller.setSelectedBarTempo(160);
    lineInfo = controller.trackElement.trackLineElements[0]
      .trackLineInfoElement as TrackLineInfoElement;
    barElement = [...lineInfo.barTempoRectsMap.keys()][0];
    const secondDiff = controller.trackElement.consumeDiff();

    expect(lineInfo.getBarTempoText(barElement)).toBe("=160");
    expect(lineInfo.stateHash).not.toBe(firstHash);
    expect(secondDiff.updated.get(TrackLineInfoElement)).toContain(
      lineInfo.getStableIdentity()
    );

    controller.undo();
    lineInfo = controller.trackElement.trackLineElements[0]
      .trackLineInfoElement as TrackLineInfoElement;
    barElement = [...lineInfo.barTempoRectsMap.keys()][0];
    const undoDiff = controller.trackElement.consumeDiff();
    expect(lineInfo.getBarTempoText(barElement)).toBe("=130");
    expect(undoDiff.updated.get(TrackLineInfoElement)).toContain(
      lineInfo.getStableIdentity()
    );

    controller.redo();
    lineInfo = controller.trackElement.trackLineElements[0]
      .trackLineInfoElement as TrackLineInfoElement;
    barElement = [...lineInfo.barTempoRectsMap.keys()][0];
    const redoDiff = controller.trackElement.consumeDiff();
    expect(lineInfo.getBarTempoText(barElement)).toBe("=160");
    expect(redoDiff.updated.get(TrackLineInfoElement)).toContain(
      lineInfo.getStableIdentity()
    );
  });

  test("repeated time signature changes invalidate displayed meter text", () => {
    const { track } = createScoreGraph();
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    controller.trackElement.update();
    controller.selectNoteElement(
      getBeatElements(controller)[0].noteElements[0]
    );
    controller.trackElement.consumeDiff();

    controller.setSelectedBarTimeSignature(3, NoteDuration.Quarter);
    let barElement =
      controller.trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements[0];
    const firstHash = barElement.stateHash;
    const firstDiff = controller.trackElement.consumeDiff();

    expect(firstDiff.updated.get(BarElement)).toContain(
      barElement.getStableIdentity()
    );

    controller.setSelectedBarTimeSignature(5, NoteDuration.Quarter);
    barElement =
      controller.trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements[0];
    const secondDiff = controller.trackElement.consumeDiff();

    expect(barElement.stateHash).not.toBe(firstHash);
    expect(secondDiff.updated.get(BarElement)).toContain(
      barElement.getStableIdentity()
    );

    controller.undo();
    barElement =
      controller.trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements[0];
    const undoDiff = controller.trackElement.consumeDiff();
    expect(track.score.masterBars[0].beatsCount).toBe(3);
    expect(undoDiff.updated.get(BarElement)).toContain(
      barElement.getStableIdentity()
    );

    controller.redo();
    barElement =
      controller.trackElement.trackLineElements[0].staffLineContainers[0]
        .styleLinesAsArray[0].barElements[0];
    const redoDiff = controller.trackElement.consumeDiff();
    expect(track.score.masterBars[0].beatsCount).toBe(5);
    expect(redoDiff.updated.get(BarElement)).toContain(
      barElement.getStableIdentity()
    );
  });
});
