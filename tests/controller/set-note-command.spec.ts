import { SetNoteCommand } from "../../src/notation/controller/editor/command";
import { Beat, Guitar, NoteValue, Score } from "../../src/notation/model";
import { createScoreGraph } from "../model/helpers";

describe("SetNoteCommand", () => {
  function getVoiceBar1(bar: ReturnType<typeof createScoreGraph>["bar"]) {
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }

    return voiceBar;
  }

  function getNote(beat: Beat<Guitar>, stringNumber = 1) {
    const note = beat.notes?.[stringNumber - 1];
    if (note === undefined) {
      throw Error("Expected note in test beat");
    }

    return note;
  }

  test("execute, undo, and redo update note value and octave together", () => {
    const { bar } = createScoreGraph();
    const beat = getVoiceBar1(bar).beats[0];
    const note = getNote(beat);
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
    const beat = getVoiceBar1(bar).beats[0];
    const command = new SetNoteCommand(beat, 1, NoteValue.C, 4);

    expect(() => command.redo()).toThrow("Redo called before execute");
  });

  test("setting note on a rest beat converts it and undo restores the rest", () => {
    const score = new Score();
    const bar = score.tracks[0].staves[0].bars[0];
    const beat = getVoiceBar1(bar).beats[0];
    const command = new SetNoteCommand(beat, 3, NoteValue.C, 4);

    expect(beat.isRest()).toBe(true);
    expect(command.updateRequest).toEqual({
      updateType: "Targeted",
      affectedModelUUIDs: [beat.uuid],
    });

    command.execute();
    expect(beat.isRest()).toBe(false);
    expect(getNote(beat, 3).noteValue).toBe(NoteValue.C);
    expect(getNote(beat, 3).octave).toBe(4);

    command.undo();
    expect(beat.isRest()).toBe(true);

    command.redo();
    expect(beat.isRest()).toBe(false);
    expect(getNote(beat, 3).noteValue).toBe(NoteValue.C);
    expect(getNote(beat, 3).octave).toBe(4);
  });
});
