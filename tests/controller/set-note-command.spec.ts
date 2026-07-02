import { SetNoteCommand } from "../../src/notation/controller/editor/command";
import { NoteValue, Score } from "../../src/notation/model";
import { createScoreGraph } from "../model/helpers";

describe("SetNoteCommand", () => {
  test("execute, undo, and redo update note value and octave together", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    const beat = voiceBar.beats[0];
    const note = beat.notes?.[0];
    if (note === undefined) {
      throw Error("Expected note in test beat");
    }

    const command = new SetNoteCommand(beat, 1, NoteValue.GSharp, 5);

    command.execute();
    expect(note.noteValue).toBe(NoteValue.GSharp);
    expect(note.octave).toBe(5);

    command.undo();
    expect(note.noteValue).toBe(NoteValue.None);
    expect(note.octave).toBeNull();

    command.redo();
    expect(note.noteValue).toBe(NoteValue.GSharp);
    expect(note.octave).toBe(5);
  });

  test("redo before execute throws", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    const beat = voiceBar.beats[0];
    const command = new SetNoteCommand(beat, 1, NoteValue.C, 4);

    expect(() => command.redo()).toThrow("Redo called before execute");
  });

  test("setting note on a rest beat converts it and undo restores the rest", () => {
    const score = new Score();
    const bar = score.tracks[0].staves[0].bars[0];
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    const beat = voiceBar.beats[0];
    const command = new SetNoteCommand(beat, 3, NoteValue.C, 4);

    expect(beat.isRest()).toBe(true);
    expect(command.affectedModels).toEqual([
      { masterBarIndex: 0, modelUUID: beat.uuid },
    ]);

    command.execute();
    const noteAfterExecute = beat.notes?.[2];
    if (noteAfterExecute === undefined) {
      throw Error("Expected note in test beat");
    }

    expect(beat.isRest()).toBe(false);
    expect(noteAfterExecute.noteValue).toBe(NoteValue.C);
    expect(noteAfterExecute.octave).toBe(4);

    command.undo();
    expect(beat.isRest()).toBe(true);

    command.redo();
    const noteAfterRedo = beat.notes?.[2];
    if (noteAfterRedo === undefined) {
      throw Error("Expected note in test beat");
    }

    expect(beat.isRest()).toBe(false);
    expect(noteAfterRedo.noteValue).toBe(NoteValue.C);
    expect(noteAfterRedo.octave).toBe(4);
  });
});
