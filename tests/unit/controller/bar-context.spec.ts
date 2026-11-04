import { TrackController } from "../../../src/notation/controller/track-controller";
import {
  DEFAULT_MASTER_BAR,
  NoteDuration,
  Score,
} from "../../../src/notation/model";
import { TEST_LAYOUT_DIMENSIONS } from "./helpers";
import { required } from "../required";

test.each([
  {
    operation: "insertBarBeforeSelected" as const,
    index: 1,
    expected: {
      ...DEFAULT_MASTER_BAR,
      tempo: 150,
      beatsCount: 6,
      duration: NoteDuration.Eighth,
    },
  },
  {
    operation: "insertBarAfterSelected" as const,
    index: 2,
    expected: {
      ...DEFAULT_MASTER_BAR,
      tempo: 90,
      beatsCount: 3,
      duration: NoteDuration.Quarter,
    },
  },
])(
  "$operation inherits musical context and keeps it through undo and redo",
  ({ operation, index, expected }) => {
    const score = new Score();
    Object.assign(score.masterBars[0], {
      tempo: 150,
      beatsCount: 6,
      duration: NoteDuration.Eighth,
      isRepeatStart: true,
    });
    score.appendMasterBar({
      ...DEFAULT_MASTER_BAR,
      tempo: 90,
      beatsCount: 3,
      isRepeatEnd: true,
      repeatCount: 4,
    });
    score.appendMasterBar({
      ...DEFAULT_MASTER_BAR,
      tempo: 180,
      beatsCount: 2,
      duration: NoteDuration.Half,
    });
    const originalBars = [...score.masterBars];
    const controller = new TrackController(
      score.tracks[0],
      TEST_LAYOUT_DIMENSIONS
    );
    controller.trackElement.update();
    const selectedBeat = required(
      score.tracks[0].staves[0].bars[1].getVoiceBar(1)
    ).beats[0];
    controller.clearSelection();
    controller.selectBeat(
      required(controller.trackElement.getBeatElement(selectedBeat))
    );

    controller[operation]();

    const inserted = score.masterBars[index];
    expect(score.masterBars).toHaveLength(4);
    expect(inserted.barData).toEqual(expected);
    controller.undo();
    expect(score.masterBars).toEqual(originalBars);
    controller.redo();
    expect(score.masterBars).toHaveLength(4);
    expect(score.masterBars[index]).toBe(inserted);
    expect(score.masterBars[index].barData).toEqual(expected);
  }
);
