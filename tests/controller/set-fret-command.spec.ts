import { SetFretCommand } from "../../src/notation/controller/editor/command";
import { TrackController } from "../../src/notation/controller/track-controller";
import { TabNoteElement } from "../../src/notation/controller/element/note/tab-note-element";
import { GuitarNote } from "../../src/notation/model";
import { createScoreGraph } from "../model/helpers";
import { ensureLayoutConfigured } from "./helpers";

function getVoiceBar1(bar: ReturnType<typeof createScoreGraph>["bar"]) {
  const voiceBar = bar.getVoiceBar(1);
  if (voiceBar === null) {
    throw Error("Expected voice 1 in test bar");
  }

  return voiceBar;
}

describe("SetFretCommand", () => {
  beforeAll(() => {
    ensureLayoutConfigured();
  });

  test("execute, undo, and redo update fret", () => {
    const { bar } = createScoreGraph();
    const note = getVoiceBar1(bar).beats[0].notes[0] as GuitarNote;
    const command = new SetFretCommand(note, 7);

    command.execute();
    expect(note.fret).toBe(7);

    command.undo();
    expect(note.fret).toBeNull();

    command.redo();
    expect(note.fret).toBe(7);
  });

  test("supports clearing fret with null", () => {
    const { bar } = createScoreGraph();
    const note = getVoiceBar1(bar).beats[0].notes[0] as GuitarNote;
    note.fret = 9;
    const command = new SetFretCommand(note, null);

    command.execute();
    expect(note.fret).toBeNull();

    command.undo();
    expect(note.fret).toBe(9);

    command.redo();
    expect(note.fret).toBeNull();
  });

  test("clamps out-of-range frets to the instrument maximum", () => {
    const { bar } = createScoreGraph();
    const note = getVoiceBar1(bar).beats[0].notes[0] as GuitarNote;
    const command = new SetFretCommand(note, 30);

    command.execute();
    expect(note.fret).toBe(note.trackContext.instrument.fretsCount);

    command.undo();
    expect(note.fret).toBeNull();

    command.redo();
    expect(note.fret).toBe(note.trackContext.instrument.fretsCount);
  });

  test("redo before execute throws", () => {
    const { bar } = createScoreGraph();
    const note = getVoiceBar1(bar).beats[0].notes[0] as GuitarNote;
    const command = new SetFretCommand(note, 5);

    expect(() => command.redo()).toThrow("Redo called before execute");
  });

  test("setting fret from empty requests a targeted note update", () => {
    const { bar } = createScoreGraph();
    const note = getVoiceBar1(bar).beats[0].notes[0] as GuitarNote;
    const command = new SetFretCommand(note, 7);

    expect(command.updateRequest).toEqual({
      updateType: "Targeted",
      affectedModelUUID: note.uuid,
    });
  });

  test("setting fret from empty marks the tab note element updated", () => {
    const { track, bar } = createScoreGraph();
    const note = getVoiceBar1(bar).beats[0].notes[0] as GuitarNote;
    const controller = new TrackController(track);
    const beatElement = controller.trackElement.findCorrespondingBeatElement(
      note.beat
    );
    const noteElement = beatElement?.noteElements[0] as TabNoteElement;

    controller.setSelectedNoteFret(7);

    expect(
      controller.trackElement.elementDiff.updated.get(TabNoteElement)
    ).toContain(noteElement.getStableIdentity());
  });

  test("changing existing fret marks the tab note element updated", () => {
    const { track, bar } = createScoreGraph();
    const note = getVoiceBar1(bar).beats[0].notes[0] as GuitarNote;
    note.fret = 5;
    const controller = new TrackController(track);
    const beatElement = controller.trackElement.findCorrespondingBeatElement(
      note.beat
    );
    const noteElement = beatElement?.noteElements[0] as TabNoteElement;

    controller.setSelectedNoteFret(7);

    expect(
      controller.trackElement.elementDiff.updated.get(TabNoteElement)
    ).toContain(noteElement.getStableIdentity());
  });
});
