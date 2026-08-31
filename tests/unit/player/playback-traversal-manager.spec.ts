import { PlaybackTraversalManager } from "../../../src/player/playback-traversal-manager";
import { NoteDuration } from "../../../src/notation/model";
import { BarRepeatStatus } from "../../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";

describe("PlaybackTraversalManager loop state", () => {
  test("enables selection looping and restores the prior loop mode", () => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const traversal = new PlaybackTraversalManager(score);

    expect(traversal.setSelectionLoopSection(beats[0], beats[1])).toBe(true);
    expect(traversal.isLooped).toBe(true);
    expect(traversal.clearSelectionLoopSection()).toBe(true);
    expect(traversal.isLooped).toBe(false);
  });

  test("limits playback to the selected beat range", () => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const traversal = new PlaybackTraversalManager(score);
    traversal.setPlaybackRange(beats[1], beats[2]);

    expect(traversal.firstMasterBarIndex).toBe(0);
    expect(traversal.beatOutsideBoundaries(0, beats[0])).toBe(true);
    expect(traversal.beatOutsideBoundaries(0, beats[1])).toBe(false);
    expect(traversal.beatOutsideBoundaries(0, beats[2])).toBe(false);
    expect(traversal.getMasterBarDurationSeconds(0)).toBe(1);
  });

  test("restarts a bounded loop at its configured section start", () => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const traversal = new PlaybackTraversalManager(score);
    traversal.setLoopSection(beats[0], beats[1]);
    traversal.toggleLoop();
    traversal.setPlaybackRange(beats[0], beats[1]);

    const result = traversal.completeMasterBar(0);

    expect(result).toEqual({
      nextMasterBarIndex: 0,
      loopRestarted: true,
      repeatJumped: false,
    });
  });

  test("applies repeats fully contained in the playback range", () => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Whole },
    ]);
    score.appendMasterBar();
    score.masterBars[0].isRepeatStart = true;
    score.masterBars[1].isRepeatEnd = true;
    score.masterBars[1].repeatCount = 2;
    const traversal = new PlaybackTraversalManager(score);
    traversal.setPlaybackRange(beats[0]);

    expect(traversal.completeMasterBar(0).nextMasterBarIndex).toBe(1);
    expect(traversal.completeMasterBar(1)).toEqual({
      nextMasterBarIndex: 0,
      loopRestarted: false,
      repeatJumped: true,
    });
  });

  test("does not repeat when the repeat end is outside the selected range", () => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    score.appendMasterBar();
    score.masterBars[0].isRepeatStart = true;
    score.masterBars[1].isRepeatEnd = true;
    const traversal = new PlaybackTraversalManager(score);
    traversal.setPlaybackRange(beats[0], beats[1]);

    expect(traversal.completeMasterBar(0)).toEqual({
      nextMasterBarIndex: null,
      loopRestarted: false,
      repeatJumped: false,
    });
  });

  test("does not repeat at an excluded partial end boundary", () => {
    const { score, beats, track } = createBarWithBeats([
      { baseDuration: NoteDuration.Whole },
    ]);
    const secondBar = score.appendMasterBar().bars.get(track.staves[0].uuid);
    if (secondBar === undefined) {
      throw Error("Expected second bar");
    }
    const selectedEndBeat = secondBar.ensureVoiceBar(1).beats[0];
    score.masterBars[0].isRepeatStart = true;
    score.masterBars[1].isRepeatEnd = true;
    const traversal = new PlaybackTraversalManager(score);
    traversal.setPlaybackRange(beats[0], selectedEndBeat);

    expect(traversal.completeMasterBar(0).nextMasterBarIndex).toBe(1);
    expect(traversal.completeMasterBar(1)).toEqual({
      nextMasterBarIndex: null,
      loopRestarted: false,
      repeatJumped: false,
    });
  });

  test("does not jump to a repeat that began before a partial start", () => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    score.appendMasterBar();
    score.masterBars[0].isRepeatStart = true;
    score.masterBars[1].isRepeatEnd = true;
    const traversal = new PlaybackTraversalManager(score);
    traversal.setPlaybackRange(beats[1]);

    traversal.completeMasterBar(0);

    expect(traversal.completeMasterBar(1)).toEqual({
      nextMasterBarIndex: null,
      loopRestarted: false,
      repeatJumped: false,
    });
  });

  test("ignores unmatched repeat boundaries", () => {
    const { score } = createBarWithBeats([
      { baseDuration: NoteDuration.Whole },
    ]);
    score.appendMasterBar();
    score.masterBars[0].isRepeatStart = true;
    const traversal = new PlaybackTraversalManager(score);

    expect(traversal.completeMasterBar(0).nextMasterBarIndex).toBe(1);
    score.masterBars[1].isRepeatEnd = true;
    score.masterBars[0].isRepeatStart = false;

    expect(traversal.completeMasterBar(1).nextMasterBarIndex).toBeNull();
  });

  test("closes then opens repeats at a shared boundary bar", () => {
    const { score } = createBarWithBeats([
      { baseDuration: NoteDuration.Whole },
    ]);
    score.appendMasterBar();
    score.appendMasterBar();
    score.appendMasterBar();
    score.masterBars[0].isRepeatStart = true;
    score.masterBars[1].isRepeatEnd = true;
    score.masterBars[2].isRepeatStart = true;
    score.masterBars[3].isRepeatEnd = true;
    const traversal = new PlaybackTraversalManager(score);

    expect(traversal.completeMasterBar(0).nextMasterBarIndex).toBe(1);
    expect(traversal.completeMasterBar(1).nextMasterBarIndex).toBe(0);
    expect(traversal.completeMasterBar(0).nextMasterBarIndex).toBe(1);
    expect(traversal.completeMasterBar(1).nextMasterBarIndex).toBe(2);
    expect(traversal.completeMasterBar(2).nextMasterBarIndex).toBe(3);
    expect(traversal.completeMasterBar(3).nextMasterBarIndex).toBe(2);
    expect(traversal.completeMasterBar(2).nextMasterBarIndex).toBe(3);
    expect(traversal.completeMasterBar(3).nextMasterBarIndex).toBeNull();
  });

  test("repeats a single bar with both repeat boundaries", () => {
    const { score } = createBarWithBeats([
      { baseDuration: NoteDuration.Whole },
    ]);
    score.masterBars[0].isRepeatStart = true;
    score.masterBars[0].isRepeatEnd = true;
    const traversal = new PlaybackTraversalManager(score);

    expect(traversal.completeMasterBar(0).nextMasterBarIndex).toBe(0);
    expect(traversal.completeMasterBar(0).nextMasterBarIndex).toBeNull();
  });

  test("preserves explicit loop state when selection looping changes", () => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const traversal = new PlaybackTraversalManager(score);
    traversal.toggleLoop();

    expect(traversal.setSelectionLoopSection(beats[0], beats[1])).toBe(false);
    expect(traversal.clearSelectionLoopSection()).toBe(false);
    expect(traversal.isLooped).toBe(true);
  });

  test("clears selection loop ownership after an explicit loop toggle", () => {
    const { score, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const traversal = new PlaybackTraversalManager(score);
    traversal.setSelectionLoopSection(beats[0], beats[1]);

    traversal.toggleLoop();
    traversal.toggleLoop();

    expect(traversal.clearSelectionLoopSection()).toBe(false);
    expect(traversal.isLooped).toBe(true);
  });
});
