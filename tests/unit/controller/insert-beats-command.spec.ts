import { InsertBeatsCommand } from "../../../src/notation/controller/editor/command/insert-beats-command";
import { NoteDuration } from "../../../src/notation/model";
import { createBarWithBeats, createBeat } from "../model/helpers";

describe("InsertBeatsCommand", () => {
  test("execute inserts beats at the requested index preserving surrounding order", () => {
    const { score, track, bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Half },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }

    const insertedBeats = [
      createBeat(voiceBar, NoteDuration.Eighth),
      createBeat(voiceBar, NoteDuration.Sixteenth),
    ];
    const originalBeatUUIDs = beats.map((beat) => beat.uuid);
    const command = new InsertBeatsCommand(bar.staff, beats[0], insertedBeats);

    command.execute();
    expect(voiceBar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Eighth,
      NoteDuration.Sixteenth,
      NoteDuration.Half,
      NoteDuration.Quarter,
    ]);
    expect(score.masterBars).toHaveLength(1);
    expect(voiceBar.beats[0].uuid).toBe(originalBeatUUIDs[0]);
    expect(voiceBar.beats[3].uuid).toBe(originalBeatUUIDs[1]);
    expect(voiceBar.beats[4].uuid).toBe(originalBeatUUIDs[2]);
    expect(voiceBar.beats[1].baseDuration).toBe(NoteDuration.Eighth);
    expect(voiceBar.beats[2].baseDuration).toBe(NoteDuration.Sixteenth);

    command.undo();
    expect(voiceBar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Half,
      NoteDuration.Quarter,
    ]);

    command.redo();
    expect(voiceBar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Eighth,
      NoteDuration.Sixteenth,
      NoteDuration.Half,
      NoteDuration.Quarter,
    ]);
    expect(voiceBar.beats[1].baseDuration).toBe(NoteDuration.Eighth);
    expect(voiceBar.beats[2].baseDuration).toBe(NoteDuration.Sixteenth);
  });

  test("inserting after an empty beat keeps the anchor beat", () => {
    const { bar, beats } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }

    const insertedBeat = createBeat(voiceBar, NoteDuration.Eighth);
    const command = new InsertBeatsCommand(bar.staff, beats[0], [insertedBeat]);

    command.execute();
    expect(voiceBar.beats).toHaveLength(2);
    expect(voiceBar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Eighth,
    ]);

    command.undo();
    expect(voiceBar.beats).toHaveLength(1);
    expect(voiceBar.beats[0].isRest()).toBe(false);

    command.redo();
    expect(voiceBar.beats).toHaveLength(2);
    expect(voiceBar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Eighth,
    ]);
  });

  test("repeated redo restores local permissive insertions", () => {
    const { score, track, bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
      { baseDuration: NoteDuration.Quarter },
    ]);
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 to exist");
    }

    const clipboard = [...voiceBar.beats];
    const firstCommand = new InsertBeatsCommand(
      bar.staff,
      voiceBar.beats[3],
      clipboard
    );

    firstCommand.execute();
    const secondCommand = new InsertBeatsCommand(
      bar.staff,
      voiceBar.beats[7],
      clipboard
    );
    secondCommand.execute();

    secondCommand.undo();
    firstCommand.undo();
    firstCommand.redo();
    secondCommand.redo();

    expect(score.masterBars).toHaveLength(1);
    expect(voiceBar.beats).toHaveLength(12);
    expect(track.staves[0].bars[0].checkDurationsFit()).toBe(false);
  });

  test("execute inserts into the provided voice instead of voice 1", () => {
    const { bar } = createBarWithBeats([
      { baseDuration: NoteDuration.Quarter },
    ]);
    const voiceOneBar = bar.getVoiceBar(1);
    if (voiceOneBar === null) {
      throw Error("Expected voice 1 to exist");
    }

    const voiceTwoBar = bar.insertVoiceBar(2, []);
    const voiceTwoRest = voiceTwoBar.beats[0];
    const insertedBeat = createBeat(voiceTwoBar, NoteDuration.Eighth);
    const command = new InsertBeatsCommand(
      bar.staff,
      voiceTwoRest,
      [insertedBeat],
      2
    );

    command.execute();

    expect(voiceOneBar.beats).toHaveLength(1);
    expect(voiceTwoBar.beats).toHaveLength(2);
    expect(voiceTwoBar.beats.map((beat) => beat.baseDuration)).toEqual([
      NoteDuration.Quarter,
      NoteDuration.Eighth,
    ]);
  });
});
