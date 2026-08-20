import { PlaybackAudioEngine } from "../../src/player/playback-audio-engine";
import { PlaybackScheduler } from "../../src/player/playback-scheduler";
import { createScoreGraph } from "../model/helpers";

describe("PlaybackScheduler model invariants", () => {
  test("rejects a staff without the scheduled master bar", () => {
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
});
