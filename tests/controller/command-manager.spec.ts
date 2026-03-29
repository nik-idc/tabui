import { CommandManager } from "../../src/notation/controller/editor/command/command-manager";

class TestCommand {
  public executed = 0;
  public undone = 0;
  public redone = 0;

  public execute(): void {
    this.executed++;
  }

  public undo(): void {
    this.undone++;
  }

  public redo(): void {
    this.redone++;
  }
}

describe("CommandManager", () => {
  test("redo moves a command back to the undo stack", () => {
    const manager = new CommandManager();
    const command = new TestCommand();

    manager.execute(command);
    manager.undo();

    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(true);

    manager.redo();

    expect(command.executed).toBe(1);
    expect(command.undone).toBe(1);
    expect(command.redone).toBe(1);
    expect(manager.canUndo).toBe(true);
    expect(manager.canRedo).toBe(false);
  });

  test("executing a new command after undo clears redo history", () => {
    const manager = new CommandManager();
    const first = new TestCommand();
    const second = new TestCommand();

    manager.execute(first);
    manager.undo();
    expect(manager.canRedo).toBe(true);

    manager.execute(second);

    expect(manager.canUndo).toBe(true);
    expect(manager.canRedo).toBe(false);
  });

  test("multiple undo and redo operations preserve order", () => {
    const manager = new CommandManager();
    const first = new TestCommand();
    const second = new TestCommand();

    manager.execute(first);
    manager.execute(second);

    manager.undo();
    manager.undo();
    expect(first.undone).toBe(1);
    expect(second.undone).toBe(1);
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(true);

    manager.redo();
    manager.redo();
    expect(first.redone).toBe(1);
    expect(second.redone).toBe(1);
    expect(manager.canUndo).toBe(true);
    expect(manager.canRedo).toBe(false);
  });

  test("clear resets both undo and redo stacks", () => {
    const manager = new CommandManager();
    const command = new TestCommand();

    manager.execute(command);
    manager.undo();
    expect(manager.canRedo).toBe(true);

    manager.clear();

    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(false);
  });

  test("undo and redo are no-ops when corresponding stack is empty", () => {
    const manager = new CommandManager();

    manager.undo();
    manager.redo();

    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(false);
  });
});
