import { PlaybackAudioEngine } from "../../../src/player/playback-audio-engine";
import { PlaybackScheduler } from "../../../src/player/playback-scheduler";
import {
  BarRepeatStatus,
  Guitar,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteDuration,
} from "../../../src/notation/model";
import { createBarWithBeats, createScoreGraph } from "../model/helpers";

describe("PlaybackScheduler model invariants", () => {
  test("throws when a staff lacks the scheduled master bar", () => {
    const { score, track } = createScoreGraph();
    track.staves[0].bars.splice(0, 1);
    const audioEngine = {
      scheduleBeat: jest.fn(),
    } as unknown as PlaybackAudioEngine;
    const scheduler = new PlaybackScheduler(score, audioEngine);

    expect(() => scheduler.scheduleUntil(1)).toThrow(
      `PlaybackScheduler invariant violated: staff ${track.staves[0].uuid} has no bar at master bar index 0`
    );
  });

  test("schedules beats from all tracks at the same start time", () => {
    const { score, track, bar } = createScoreGraph();
    const secondTrack = score.addTrack(new Guitar(), "Second").tracks[0];
    const scheduleBeat = jest.fn();
    const scheduler = new PlaybackScheduler(score, {
      scheduleBeat,
    } as unknown as PlaybackAudioEngine);
    const firstBeat = bar.ensureVoiceBar(1).beats[0];
    const secondBeat = secondTrack.staves[0].bars[0].ensureVoiceBar(1).beats[0];
    scheduler.setScheduleBase(10);

    const result = scheduler.scheduleUntil(1);

    expect(scheduleBeat).toHaveBeenCalledWith(firstBeat, 10, 10.5, undefined);
    expect(scheduleBeat).toHaveBeenCalledWith(secondBeat, 10, 10.5, undefined);
    expect(result.beatChanges).toHaveLength(2);
  });

  test("schedules every live track staff and playable voice", () => {
    const { score, track, bar } = createScoreGraph();
    const secondTrack = score.addTrack(new Guitar(), "Second").tracks[0];
    const secondStaff = track.insertStaff(1).staves[0];
    const firstVoiceBeat = bar.ensureVoiceBar(1).beats[0];
    const secondVoiceBeat = bar.ensureVoiceBar(2).beats[0];
    const secondStaffBeat = secondStaff.bars[0].ensureVoiceBar(1).beats[0];
    const secondTrackBeat =
      secondTrack.staves[0].bars[0].ensureVoiceBar(1).beats[0];
    const scheduleBeat = jest.fn();
    const scheduler = new PlaybackScheduler(score, {
      scheduleBeat,
    } as unknown as PlaybackAudioEngine);

    scheduler.scheduleUntil(1);

    expect(scheduleBeat.mock.calls.map(([b]) => b)).toEqual(
      expect.arrayContaining([
        firstVoiceBeat,
        secondVoiceBeat,
        secondStaffBeat,
        secondTrackBeat,
      ])
    );
  });

  test("uses track additions and removals between scheduling windows", () => {
    const { score, track } = createScoreGraph();
    const scheduleBeat = jest.fn();
    const scheduler = new PlaybackScheduler(score, {
      scheduleBeat,
    } as unknown as PlaybackAudioEngine);
    const secondTrack = score.addTrack(new Guitar(), "Added").tracks[0];
    const secondBar = score.appendMasterBar();
    const retainedBeat =
      secondTrack.staves[0].bars[1].ensureVoiceBar(1).beats[0];
    const removedTrack = track;

    scheduler.scheduleUntil(0.5);
    score.removeTrack(score.tracks.indexOf(removedTrack));
    scheduler.scheduleUntil(3);

    expect(scheduleBeat.mock.calls.map(([b]) => b)).toContain(retainedBeat);
    expect(scheduleBeat.mock.calls.map(([b]) => b)).not.toContain(
      removedTrack.staves[0].bars[1].ensureVoiceBar(1).beats[0]
    );
    expect(secondBar.masterBar).toBe(score.masterBars[1]);
  });

  test("reports next-bar cursor timing after a silent bar", () => {
    const { score, track, bar } = createScoreGraph();
    const secondBar = score.appendMasterBar().bars.get(track.staves[0].uuid);
    if (secondBar === undefined) {
      throw Error("Expected second bar");
    }
    const scheduler = new PlaybackScheduler(score, {
      scheduleBeat: jest.fn(),
    } as unknown as PlaybackAudioEngine);
    scheduler.setScheduleBase(2);

    const result = scheduler.scheduleUntil(1);

    expect(result.nextBeatChanges[0]).toEqual(
      expect.objectContaining({
        beat: secondBar.ensureVoiceBar(1).beats[0],
        startTime: 4,
      })
    );
    expect(result.beatChanges[0]).toEqual(
      expect.objectContaining({ beat: bar.ensureVoiceBar(1).beats[0] })
    );
  });

  test("clips the final scheduled beat at the playback range end", () => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const scheduleBeat = jest.fn();
    const scheduler = new PlaybackScheduler(score, {
      scheduleBeat,
    } as unknown as PlaybackAudioEngine);
    scheduler.setPlaybackRange(beats[0], beats[1]);
    scheduler.setScheduleBase(0);

    scheduler.scheduleUntil(1);

    expect(scheduleBeat).toHaveBeenCalledTimes(2);
    expect(scheduleBeat.mock.calls[1][3]).toBe(1);
  });

  test("starts at an in-bar beat and clips LetRing tails at range end", () => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const scheduleBeat = jest.fn();
    beats[2].makeBeatWithNotes();
    const letRingNote = beats[2].notes?.[0];
    if (!(letRingNote instanceof GuitarNote)) {
      throw Error("Expected guitar note");
    }
    letRingNote.addTechnique(
      new GuitarTechnique(letRingNote, GuitarTechniqueType.LetRing)
    );
    const scheduler = new PlaybackScheduler(score, {
      scheduleBeat,
    } as unknown as PlaybackAudioEngine);
    scheduler.setPlaybackRange(beats[1], beats[2]);
    scheduler.setScheduleBase(4);

    const result = scheduler.scheduleUntil(2);

    expect(scheduleBeat.mock.calls.map(([b]) => b)).toEqual([
      beats[1],
      beats[2],
    ]);
    expect(scheduleBeat.mock.calls[0].slice(1)).toEqual([4, 4.5, 5]);
    expect(scheduleBeat.mock.calls[1].slice(1)).toEqual([4.5, 5, 5]);
    expect(result.playbackComplete).toBe(true);
  });

  test("uses dotted beat durations for scheduled timing", () => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter, dots: 1 },
      { baseDuration: NoteDuration.Eighth },
    ]);
    const scheduleBeat = jest.fn();
    const scheduler = new PlaybackScheduler(score, {
      scheduleBeat,
    } as unknown as PlaybackAudioEngine);

    scheduler.scheduleUntil(1);

    expect(scheduleBeat.mock.calls.map(([b]) => b)).toEqual(beats);
    expect(scheduleBeat.mock.calls.map(([, s, e]) => [s, e])).toEqual([
      [0, 0.75],
      [0.75, 1],
    ]);
  });

  test("preserves an underfilled bar's silent remainder before the next bar", () => {
    const { score, track, bar } = createScoreGraph();
    const secondBar = score.appendMasterBar().bars.get(track.staves[0].uuid);
    if (secondBar === undefined) {
      throw Error("Expected second bar");
    }
    const scheduleBeat = jest.fn();
    const scheduler = new PlaybackScheduler(score, {
      scheduleBeat,
    } as unknown as PlaybackAudioEngine);

    scheduler.scheduleUntil(3);

    expect(scheduleBeat.mock.calls.map(([b]) => b)).toEqual([
      bar.ensureVoiceBar(1).beats[0],
      secondBar.ensureVoiceBar(1).beats[0],
    ]);
    expect(scheduleBeat.mock.calls.map(([, s, e]) => [s, e])).toEqual([
      [0, 0.5],
      [2, 2.5],
    ]);
  });

  test("schedules a complete bar when it exceeds the lookahead window", () => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const scheduleBeat = jest.fn();
    const scheduler = new PlaybackScheduler(score, {
      scheduleBeat,
    } as unknown as PlaybackAudioEngine);

    scheduler.scheduleUntil(0.25);

    expect(scheduleBeat.mock.calls.map(([b]) => b)).toEqual(beats);
    expect(scheduler.scheduledPlaybackSeconds).toBe(2);
  });

  test("loops the full score with contiguous pass offsets", () => {
    const { score, track, bar } = createScoreGraph();
    const secondBar = score.appendMasterBar().bars.get(track.staves[0].uuid);
    if (secondBar === undefined) {
      throw Error("Expected second bar");
    }
    const scheduleBeat = jest.fn();
    const scheduler = new PlaybackScheduler(score, {
      scheduleBeat,
    } as unknown as PlaybackAudioEngine);
    scheduler.toggleLoop();

    scheduler.scheduleUntil(5);

    expect(scheduleBeat.mock.calls.map(([b]) => b)).toEqual([
      bar.ensureVoiceBar(1).beats[0],
      secondBar.ensureVoiceBar(1).beats[0],
      bar.ensureVoiceBar(1).beats[0],
    ]);
    expect(scheduleBeat.mock.calls.map(([, s]) => s)).toEqual([0, 2, 4]);
    expect(scheduler.nextLoopStartOffsetAfter(0)).toBe(4);
  });

  test("loops only the selected in-bar section", () => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const scheduleBeat = jest.fn();
    const scheduler = new PlaybackScheduler(score, {
      scheduleBeat,
    } as unknown as PlaybackAudioEngine);
    scheduler.setSelectionLoopSection(beats[1], beats[2]);
    scheduler.setPlaybackRange();

    scheduler.scheduleUntil(1.1);

    expect(scheduleBeat.mock.calls.map(([b]) => b.uuid)).toEqual([
      beats[1].uuid,
      beats[2].uuid,
      beats[1].uuid,
      beats[2].uuid,
    ]);
    expect(scheduleBeat.mock.calls.map(([, s]) => s)).toEqual([0, 0.5, 1, 1.5]);
  });

  test("schedules notation repeats in order after truncation and restart", () => {
    const { score, track, bar } = createScoreGraph();
    const secondBar = score.appendMasterBar().bars.get(track.staves[0].uuid);
    if (secondBar === undefined) {
      throw Error("Expected second bar");
    }
    score.masterBars[0].repeatStatus = BarRepeatStatus.Start;
    score.masterBars[1].repeatStatus = BarRepeatStatus.End;
    score.masterBars[1].repeatCount = 2;
    const firstBeat = bar.ensureVoiceBar(1).beats[0];
    const secondBeat = secondBar.ensureVoiceBar(1).beats[0];
    const scheduleBeat = jest.fn();
    const scheduler = new PlaybackScheduler(score, {
      scheduleBeat,
    } as unknown as PlaybackAudioEngine);

    scheduler.scheduleUntil(8);
    scheduler.truncateAt(1.5);
    scheduler.toggleLoop();
    scheduler.scheduleUntil(6);

    expect(scheduleBeat.mock.calls.map(([b]) => b)).toEqual([
      firstBeat,
      secondBeat,
      firstBeat,
      secondBeat,
      firstBeat,
      secondBeat,
      firstBeat,
    ]);
    expect(scheduleBeat.mock.calls.map(([, s]) => s)).toEqual([
      0, 2, 4, 6, 1.5, 3.5, 5.5,
    ]);
  });
});
