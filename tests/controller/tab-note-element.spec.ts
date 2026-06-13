import { TabNoteElement } from "../../src/notation/controller/element/note/tab-note-element";
import { TrackController } from "../../src/notation/controller/track-controller";
import { SVGTabNoteRenderer } from "../../src/notation/render/svg/svg-tab-note-renderer";
import { Beat, GuitarNote, NoteDuration } from "../../src/notation/model";
import { createScoreGraph } from "../model/helpers";
import { ensureLayoutConfigured } from "./helpers";

function getNoteElement(controller: TrackController, note: GuitarNote) {
  const noteElement = controller.trackElement.elementRegistryByModelUUID.get(
    note.uuid
  );
  if (!(noteElement instanceof TabNoteElement)) {
    throw Error("Expected tab note element");
  }

  return noteElement;
}

function shouldRenderHitRect(controller: TrackController, note: GuitarNote) {
  const renderer = new SVGTabNoteRenderer(
    controller,
    getNoteElement(controller, note),
    ""
  );

  return renderer.shouldRenderHitRect();
}

function getBackingNote(beat: Beat) {
  beat.makeBeatWithNotes();
  return beat.notes![0] as GuitarNote;
}

function createLaidOutController(
  track: ConstructorParameters<typeof TrackController>[0]
) {
  const controller = new TrackController(track);
  controller.trackElement.measure();
  controller.trackElement.layout();

  return controller;
}

describe("SVGTabNoteRenderer", () => {
  beforeAll(() => {
    ensureLayoutConfigured();
  });

  test("active empty slot yields hit rect to lowest filled inactive voice", () => {
    const { track, bar } = createScoreGraph();
    const voice1 = bar.getVoiceBar(1);
    const voice2 = bar.insertVoiceBar(2);
    const voice4 = bar.insertVoiceBar(4);
    if (voice1 === null) {
      throw Error("Expected voice 1");
    }
    const activeEmptyNote = getBackingNote(voice1.beats[0]);
    const voice2Note = getBackingNote(voice2.beats[0]);
    const voice4Note = getBackingNote(voice4.beats[0]);
    voice2Note.fret = 3;
    voice4Note.fret = 5;

    const controller = createLaidOutController(track);

    expect(shouldRenderHitRect(controller, activeEmptyNote)).toBe(false);
    expect(shouldRenderHitRect(controller, voice2Note)).toBe(true);
    expect(shouldRenderHitRect(controller, voice4Note)).toBe(false);
  });

  test("active empty later beat yields hit rect to inactive filled voice", () => {
    const { track, bar } = createScoreGraph();
    const voice1 = bar.getVoiceBar(1);
    const voice2 = bar.insertVoiceBar(2);
    if (voice1 === null) {
      throw Error("Expected voice 1");
    }
    voice1.appendBeats();
    voice2.appendBeats();
    const activeEmptyNote = getBackingNote(voice1.beats[1]);
    const inactiveNote = getBackingNote(voice2.beats[1]);
    inactiveNote.fret = 3;

    const controller = createLaidOutController(track);
    const activeElement = getNoteElement(controller, activeEmptyNote);
    const inactiveElement = getNoteElement(controller, inactiveNote);

    expect(controller.activeVoiceNumber).toBe(1);
    expect(activeEmptyNote.stringNum).toBe(inactiveNote.stringNum);
    expect(inactiveElement.note.beat.voiceBar.voiceNumber).toBe(2);
    expect(inactiveElement.note.fret).toBe(3);
    expect(activeElement.note.beat.startTick).toBe(
      inactiveElement.note.beat.startTick
    );

    expect(shouldRenderHitRect(controller, activeEmptyNote)).toBe(false);
    expect(shouldRenderHitRect(controller, inactiveNote)).toBe(true);
  });

  test("manual quarter and half voices match note slots by attack column", () => {
    const { track, bar } = createScoreGraph();
    const voice1 = bar.getVoiceBar(1);
    const voice2 = bar.insertVoiceBar(2);
    if (voice1 === null) {
      throw Error("Expected voice 1");
    }
    voice1.appendBeats();
    voice1.appendBeats();
    voice1.appendBeats();
    for (const beat of voice1.beats) {
      getBackingNote(beat).fret = 3;
    }
    voice1.rebuildTiming();

    voice2.beats[0].baseDuration = NoteDuration.Half;
    voice2.appendBeats();
    voice2.rebuildTiming();
    const inactiveHalfNote = getBackingNote(voice2.beats[1]);
    inactiveHalfNote.fret = 5;

    const controller = createLaidOutController(track);
    const matchingVoice1Element = getNoteElement(
      controller,
      getBackingNote(voice1.beats[2])
    );
    const previousVoice1Element = getNoteElement(
      controller,
      getBackingNote(voice1.beats[1])
    );
    const slotElements = controller.trackElement.getNoteElementsForNoteSlot(
      getNoteElement(controller, inactiveHalfNote)
    );

    expect(slotElements).toContain(matchingVoice1Element);
    expect(slotElements).not.toContain(previousVoice1Element);
  });

  test("active filled slot keeps the active hit rect", () => {
    const { track, bar } = createScoreGraph();
    const voice1 = bar.getVoiceBar(1);
    const voice2 = bar.insertVoiceBar(2);
    if (voice1 === null) {
      throw Error("Expected voice 1");
    }
    const activeNote = getBackingNote(voice1.beats[0]);
    const inactiveNote = getBackingNote(voice2.beats[0]);
    activeNote.fret = 3;
    inactiveNote.fret = 5;

    const controller = createLaidOutController(track);

    expect(shouldRenderHitRect(controller, activeNote)).toBe(true);
    expect(shouldRenderHitRect(controller, inactiveNote)).toBe(false);
  });

  test("all-empty slot keeps the active empty hit rect", () => {
    const { track, bar } = createScoreGraph();
    const voice1 = bar.getVoiceBar(1);
    const voice2 = bar.insertVoiceBar(2);
    if (voice1 === null) {
      throw Error("Expected voice 1");
    }
    const activeNote = getBackingNote(voice1.beats[0]);
    const inactiveNote = getBackingNote(voice2.beats[0]);

    const controller = createLaidOutController(track);

    expect(shouldRenderHitRect(controller, activeNote)).toBe(true);
    expect(shouldRenderHitRect(controller, inactiveNote)).toBe(false);
  });
});
