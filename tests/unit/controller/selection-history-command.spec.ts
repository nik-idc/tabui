import { CommandManager } from "../../../src/notation/controller/editor/command/command-manager";
import { SelectionHistoryCommand } from "../../../src/notation/controller/editor/command/selection-history-command";
import type { Command } from "../../../src/notation/controller/editor/command/command";
import type { SelectionHistorySnapshot } from "../../../src/notation/controller/selection/selection-cursor";
import type { SelectionManager } from "../../../src/notation/controller/selection/selection-manager";

function snapshot(staffIndex: number): SelectionHistorySnapshot {
  return {
    cursor: {
      staffIndex,
      barIndex: 0,
      voiceNumber: 1,
      beatIndex: 0,
      noteIndex: 0,
    },
    range: null,
  };
}

function createSelectionManager(
  captures: SelectionHistorySnapshot[],
  restored: Array<[SelectionHistorySnapshot, SelectionHistorySnapshot]>,
  captureCount = { value: 0 },
  state?: { staffIndex: number }
): SelectionManager {
  let index = 0;
  return {
    captureHistorySnapshot: () => {
      captureCount.value++;
      if (state !== undefined) {
        return (
          captures.find((v) => v.cursor?.staffIndex === state.staffIndex) ??
          captures[captures.length - 1]
        );
      }
      return captures[index++] ?? captures[captures.length - 1];
    },
    restoreHistorySnapshot: (
      selection: SelectionHistorySnapshot,
      opposite: SelectionHistorySnapshot
    ) => {
      restored.push([selection, opposite]);
      if (state !== undefined && selection.cursor !== null) {
        state.staffIndex = selection.cursor.staffIndex;
      }
    },
  } as unknown as SelectionManager;
}

function createCommand(onApply = () => undefined): Command {
  let applied = false;
  return {
    get executed() {
      return applied;
    },
    affectedModels: [],
    execute() {
      applied = true;
      onApply();
    },
    undo() {
      applied = false;
    },
    redo() {
      applied = true;
      onApply();
    },
  };
}

describe("SelectionHistoryCommand", () => {
  test("captures before and after completion, then restores them across navigation", () => {
    const before = snapshot(10);
    const after = snapshot(20);
    const restored: Array<
      [SelectionHistorySnapshot, SelectionHistorySnapshot]
    > = [];
    const captureCount = { value: 0 };
    const state = { staffIndex: 10 };
    const selectionManager = createSelectionManager(
      [before, after],
      restored,
      captureCount,
      state
    );
    const wrapped = new SelectionHistoryCommand(
      createCommand(() => {
        state.staffIndex = 30;
      }),
      selectionManager,
      () => {
        state.staffIndex = 20;
      }
    );
    const manager = new CommandManager();

    manager.execute(wrapped);
    expect(state.staffIndex).toBe(20);
    state.staffIndex = 40;
    manager.undo();
    expect(state.staffIndex).toBe(10);
    state.staffIndex = 50;
    manager.redo();
    expect(state.staffIndex).toBe(20);
    state.staffIndex = 60;
    manager.undo();
    expect(state.staffIndex).toBe(10);
    state.staffIndex = 70;
    manager.redo();
    expect(state.staffIndex).toBe(20);

    expect(captureCount.value).toBe(2);
    expect(restored).toEqual([
      [before, after],
      [after, before],
      [before, after],
      [after, before],
    ]);
  });

  test("propagates completion errors without capturing an after snapshot", () => {
    const captureCount = { value: 0 };
    const selectionManager = createSelectionManager(
      [snapshot(0), snapshot(1)],
      [],
      captureCount
    );
    const error = new Error("completion failed");
    const wrapped = new SelectionHistoryCommand(
      createCommand(),
      selectionManager,
      () => {
        throw error;
      }
    );

    expect(() => wrapped.execute()).toThrow(error);
    expect(captureCount.value).toBe(1);
  });
});
