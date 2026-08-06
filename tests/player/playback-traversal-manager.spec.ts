import { PlaybackTraversalManager } from "../../src/player/playback-traversal-manager";
import { NoteDuration } from "../../src/notation/model";
import { createBarWithBeats } from "../model/helpers";

describe("PlaybackTraversalManager loop state", () => {
  test("selection looping enables and later restores loop mode", () => {
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

  test("selection looping preserves an existing loop choice", () => {
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

  test("explicit loop choice clears selection ownership", () => {
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
