import { SetFretCommand } from "../../src/notation/controller/editor/command";
import { TrackController } from "../../src/notation/controller/track-controller";
import { TabNoteElement } from "../../src/notation/controller/element/note/tab-note-element";
import { GuitarNote, Score } from "../../src/notation/model";
import { createScoreGraph } from "../model/helpers";
import { TEST_LAYOUT_DIMENSIONS } from "./helpers";

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

  test("redo before execute throws", () => {
    const { bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const note = voiceBar.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }

    const command = new SetFretCommand(note.beat, note.stringNum, 5);

    expect(() => command.redo()).toThrow("Redo called before execute");
  });

  test("setting fret from empty requests a targeted note update", () => {
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

  test("setting fret from empty marks the tab note element updated", () => {
    const { track, bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const note = voiceBar.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }

    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const beatElement = controller.trackElement.getBeatElement(note.beat);
    const noteElement = beatElement?.noteElements[0] as TabNoteElement;

    controller.setSelectedNoteFret(7);

    expect(
      controller.trackElement.elementDiff.updated.get(TabNoteElement)
    ).toContain(noteElement.getStableIdentity());
  });

  test("changing existing fret marks the tab note element updated", () => {
    const { track, bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice 1 in test bar");
    }
    const note = voiceBar.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note in test beat");
    }

    note.fret = 5;
    const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
    const beatElement = controller.trackElement.getBeatElement(note.beat);
    const noteElement = beatElement?.noteElements[0] as TabNoteElement;

    controller.setSelectedNoteFret(7);

    expect(
      controller.trackElement.elementDiff.updated.get(TabNoteElement)
    ).toContain(noteElement.getStableIdentity());
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
