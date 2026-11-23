import type { TrackController } from "../../../src/notation/controller/track-controller";
import {
  AddStaffCommand,
  RemoveStaffCommand,
} from "../../../src/notation/controller/editor/command";
import {
  Guitar,
  GuitarNote,
  MAX_TRACK_STAVES,
  NoteDuration,
} from "../../../src/notation/model";
import { SelectedMoveDirection } from "../../../src/notation/controller/selection/selection-cursor";
import {
  createBarWithBeats,
  createBeat,
  createScoreGraph,
} from "../model/helpers";
import { createTestTrackController } from "./helpers";

function fretAt(controller: TrackController): number | null {
  const note = controller.selectionCursor?.note;
  return note instanceof GuitarNote ? note.fret : null;
}

describe("AddStaffCommand and RemoveStaffCommand", () => {
  test("undo and redo reuse the same staff object", () => {
    const { track } = createScoreGraph();
    const add = new AddStaffCommand(track, 1, 0);
    add.execute();
    const added = add.staff;
    expect(track.staves).toHaveLength(2);
    expect(track.staves[1]).toBe(added);

    add.undo();
    expect(track.staves).toHaveLength(1);
    add.redo();
    expect(track.staves[1]).toBe(added);

    const remove = new RemoveStaffCommand(track, track.staves[0], 0);
    const first = track.staves[0];
    remove.execute();
    expect(remove.executed).toBe(true);
    expect(track.staves).toEqual([added]);
    remove.undo();
    expect(track.staves).toEqual([first, added]);
  });

  test("a track's last staff is never removed", () => {
    const { track } = createScoreGraph();
    const remove = new RemoveStaffCommand(track, track.staves[0], 0);
    remove.execute();
    expect(remove.executed).toBe(false);
    expect(track.staves).toHaveLength(1);
  });
});

describe("TrackController staff editing", () => {
  test("adds a staff below, moves the cursor into it, and undoes", () => {
    const { track } = createScoreGraph();
    const controller = createTestTrackController(track);
    const original = track.staves[0];

    expect(controller.canAddStaff).toBe(true);
    expect(controller.canRemoveStaff).toBe(false);
    expect(controller.addStaffBelowSelected()).toBe(true);
    expect(track.staves).toHaveLength(2);
    expect(controller.selectionCursor?.bar.staff).toBe(track.staves[1]);
    expect(controller.canRemoveStaff).toBe(true);

    controller.undo();
    expect(track.staves).toEqual([original]);
    expect(controller.selectionCursor?.bar.staff).toBe(original);

    controller.redo();
    expect(track.staves).toHaveLength(2);
    expect(controller.selectionCursor?.bar.staff).toBe(track.staves[1]);
  });

  test("stops at the staff limit", () => {
    const { track } = createScoreGraph();
    const controller = createTestTrackController(track);
    for (let i = 1; i < MAX_TRACK_STAVES; i++) {
      expect(controller.addStaffBelowSelected()).toBe(true);
    }
    expect(track.staves).toHaveLength(MAX_TRACK_STAVES);
    expect(controller.canAddStaff).toBe(false);
    expect(controller.addStaffBelowSelected()).toBe(false);
    expect(track.staves).toHaveLength(MAX_TRACK_STAVES);
  });

  test("removing a staff keeps older history valid", () => {
    const { track } = createScoreGraph();
    const controller = createTestTrackController(track);
    controller.addStaffBelowSelected();
    const second = track.staves[1];
    controller.setSelectedNoteFret(5);
    expect(fretAt(controller)).toBe(5);

    expect(controller.removeSelectedStaff()).toBe(true);
    expect(track.staves).toHaveLength(1);
    expect(controller.selectionCursor?.bar.staff).toBe(track.staves[0]);

    controller.undo();
    expect(track.staves[1]).toBe(second);
    expect(controller.selectionCursor?.bar.staff).toBe(second);
    expect(fretAt(controller)).toBe(5);

    controller.undo();
    expect(track.staves[1]).toBe(second);
    expect(fretAt(controller)).toBe(null);
  });

  test("the last staff cannot be removed and adds no history", () => {
    const { track } = createScoreGraph();
    const controller = createTestTrackController(track);
    controller.setSelectedNoteFret(3);
    expect(controller.removeSelectedStaff()).toBe(false);
    expect(track.staves).toHaveLength(1);
    controller.undo();
    expect(fretAt(controller)).toBe(null);
  });

  test("moves between staves at the same moment and stops at the edges", () => {
    const { track, beats: upper } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Half },
    ]);
    track.insertStaff(1);
    const lowerVoice = track.staves[1].bars[0].getVoiceBar(1);
    if (lowerVoice === null) {
      throw Error("Expected voice 1 in the second staff");
    }
    const lower = [
      createBeat(lowerVoice, NoteDuration.Half),
      createBeat(lowerVoice, NoteDuration.Half),
    ];
    lowerVoice.beats.splice(0, lowerVoice.beats.length, ...lower);
    lowerVoice.computeBarTupletGroups();
    const controller = createTestTrackController(track);

    // The third upper beat starts at the half; the second lower beat covers it.
    controller.moveSelectedNote(SelectedMoveDirection.Right);
    controller.moveSelectedNote(SelectedMoveDirection.Right);
    expect(controller.selectionCursor?.beat).toBe(upper[2]);
    expect(controller.moveSelectionToStaff(-1)).toBe(false);
    expect(controller.moveSelectionToStaff(1)).toBe(true);
    expect(controller.selectionCursor?.beat).toBe(lower[1]);
    expect(controller.moveSelectionToStaff(1)).toBe(false);

    // The second lower beat starts at the half, where the third upper beat starts.
    expect(controller.moveSelectionToStaff(-1)).toBe(true);
    expect(controller.selectionCursor?.beat).toBe(upper[2]);
  });

  test("view-only mode blocks adding and removing staves but not moving", () => {
    const { track } = createScoreGraph();
    track.insertStaff(1);
    const controller = createTestTrackController(track);
    controller.setEditingEnabled(false);
    expect(controller.canAddStaff).toBe(false);
    expect(controller.canRemoveStaff).toBe(false);
    expect(controller.addStaffBelowSelected()).toBe(false);
    expect(controller.removeSelectedStaff()).toBe(false);
    expect(track.staves).toHaveLength(2);
    expect(controller.moveSelectionToStaff(1)).toBe(true);
  });

  test("addTrack creates the requested number of staves", () => {
    const { score, track } = createScoreGraph();
    const controller = createTestTrackController(track);
    const added = controller.addTrack(score, new Guitar(), "Piano-ish", 3);
    expect(added?.staves).toHaveLength(3);
    expect(() =>
      controller.addTrack(score, new Guitar(), "Too many", MAX_TRACK_STAVES + 1)
    ).toThrow();
  });
});
