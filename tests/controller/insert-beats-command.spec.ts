import { InsertBeatsCommand } from "../../src/notation/controller/editor/command/insert-beats-command";
import { NoteDuration } from "../../src/notation/model";
import { createBarWithBeats, createBeat } from "../model/helpers";

describe("InsertBeatsCommand", () => {
  test("execute inserts beats at the requested index preserving surrounding order", () => {
    const { score, track, bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Half },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const insertedBeats = [
      createBeat(bar, NoteDuration.Eighth),
      createBeat(bar, NoteDuration.Sixteenth),
    ];
    const originalBeatUUIDs = beats.map((beat) => beat.uuid);
    const command = new InsertBeatsCommand(bar.staff, beats[0], insertedBeats);

    command.execute();
    expect(bar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Eighth,
      NoteDuration.Sixteenth,
      NoteDuration.Half,
      NoteDuration.Quarter,
    ]);
    expect(score.masterBars).toHaveLength(1);
    expect(bar.beats[0].uuid).toBe(originalBeatUUIDs[0]);
    expect(bar.beats[3].uuid).toBe(originalBeatUUIDs[1]);
    expect(bar.beats[4].uuid).toBe(originalBeatUUIDs[2]);
    expect(bar.beats[1].baseDuration).toBe(NoteDuration.Eighth);
    expect(bar.beats[2].baseDuration).toBe(NoteDuration.Sixteenth);

    command.undo();
    expect(bar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Half,
      NoteDuration.Quarter,
    ]);

    command.redo();
    expect(bar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Eighth,
      NoteDuration.Sixteenth,
      NoteDuration.Half,
      NoteDuration.Quarter,
    ]);
    expect(bar.beats[1].baseDuration).toBe(NoteDuration.Eighth);
    expect(bar.beats[2].baseDuration).toBe(NoteDuration.Sixteenth);
  });

  test("inserting into an empty seed bar replaces the seed beat", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const insertedBeat = createBeat(bar, NoteDuration.Eighth);
    const command = new InsertBeatsCommand(bar.staff, beats[0], [insertedBeat]);

    command.execute();
    expect(bar.beats).toHaveLength(1);
    expect(bar.beats[0].baseDuration).toBe(NoteDuration.Eighth);

    command.undo();
    expect(bar.beats).toHaveLength(1);
    expect(bar.beats[0].isEmpty()).toBe(true);

    command.redo();
    expect(bar.beats).toHaveLength(1);
    expect(bar.beats[0].baseDuration).toBe(NoteDuration.Eighth);
  });

  test("repeated redo restores local permissive insertions", () => {
    const { score, track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const clipboard = [...bar.beats];
    const firstCommand = new InsertBeatsCommand(
      bar.staff,
      bar.beats[3],
      clipboard
    );

    firstCommand.execute();
    const secondCommand = new InsertBeatsCommand(
      bar.staff,
      bar.beats[7],
      clipboard
    );
    secondCommand.execute();

    secondCommand.undo();
    firstCommand.undo();
    firstCommand.redo();
    secondCommand.redo();

    expect(score.masterBars).toHaveLength(1);
    expect(track.staves[0].bars[0].beats).toHaveLength(12);
    expect(track.staves[0].bars[0].checkDurationsFit()).toBe(false);
  });
});
