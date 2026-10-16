import { SetFretCommand } from "../../../src/notation/controller/editor/command";
import { GuitarNote, Score } from "../../../src/notation/model";
import { createScoreGraph } from "../model/helpers";

describe("SetFretCommand", () => {
  test("execute, undo, and redo update fret", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const note = voiceBar.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }

    const command = new SetFretCommand(note.beat, note.stringNum, 7);

    command.execute();
    expect(note.fret).toBe(7);

    command.undo();
    expect(note.fret).toBeNull();

    command.redo();
    expect(note.fret).toBe(7);
  });

  test("supports clearing fret with null", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const note = voiceBar.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }

    note.fret = 9;
    const command = new SetFretCommand(note.beat, note.stringNum, null);

    command.execute();
    expect(note.fret).toBeNull();

    command.undo();
    expect(note.fret).toBe(9);

    command.redo();
    expect(note.fret).toBeNull();
  });

  test("clamps out-of-range frets to the instrument maximum", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const note = voiceBar.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }

    const command = new SetFretCommand(note.beat, note.stringNum, 30);

    command.execute();
    expect(note.fret).toBe(note.trackContext.instrument.fretsCount);

    command.undo();
    expect(note.fret).toBeNull();

    command.redo();
    expect(note.fret).toBe(note.trackContext.instrument.fretsCount);
  });

  test("exposes the affected beat anchor", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const note = voiceBar.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }

    const command = new SetFretCommand(note.beat, note.stringNum, 7);

    expect(command.affectedModels).toEqual([
      {
        masterBarIndex: 0,
        modelUUID: note.beat.uuid,
      },
    ]);
  });

  test("setting fret on a rest beat converts it and undo restores the rest", () => {
    const score = new Score();
    const bar = score.tracks[0].staves[0].bars[0];
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const beat = voiceBar.beats[0];
    const command = new SetFretCommand(beat, 3, 7);

    expect(beat.isRest()).toBe(true);
    expect(command.affectedModels).toEqual([
      {
        masterBarIndex: 0,
        modelUUID: beat.uuid,
      },
    ]);

    command.execute();
    const noteAfterExecute = beat.notes?.[2];
    if (!(noteAfterExecute instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }

    expect(beat.isRest()).toBe(false);
    expect(noteAfterExecute.fret).toBe(7);

    command.undo();
    expect(beat.isRest()).toBe(true);

    command.redo();
    const noteAfterRedo = beat.notes?.[2];
    if (!(noteAfterRedo instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }

    expect(beat.isRest()).toBe(false);
    expect(noteAfterRedo.fret).toBe(7);
  });
});
