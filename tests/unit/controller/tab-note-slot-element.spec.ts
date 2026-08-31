import {
  SELECTION_SIZE_FACTOR,
  TabNoteSlotElement,
} from "../../../src/notation/controller/element/note/tab-note-slot-element";
import { TrackController } from "../../../src/notation/controller/track-controller";
import { SVGTabNoteRenderer } from "../../../src/notation/render/svg/svg-tab-note-renderer";
import { SelectionOverlayRenderer } from "../../../src/notation/render/svg/selection-overlay-renderer";
import {
  Beat,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteDuration,
} from "../../../src/notation/model";
import { createScoreGraph } from "../model/helpers";
import { createTestTrackController } from "./helpers";

function getNoteElement(controller: TrackController, note: GuitarNote) {
  const noteElement = controller.trackElement.trackLineElements
    .flatMap((line) => line.ownedNotationNodes)
    .find((element) => {
      return element instanceof TabNoteSlotElement && element.note === note;
    });
  if (!(noteElement instanceof TabNoteSlotElement)) {
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
  const note = beat.notes?.[0];
  if (!(note instanceof GuitarNote)) {
    throw Error("Expected guitar note");
  }

  return note;
}

function createLaidOutController(
  track: ConstructorParameters<typeof TrackController>[0]
) {
  const controller = createTestTrackController(track);
  controller.trackElement.update();

  return controller;
}

describe("SVGTabNoteRenderer", () => {
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
    const activeElementNote = activeElement.note;
    const inactiveElementNote = inactiveElement.note;
    if (activeElementNote === null || inactiveElementNote === null) {
      throw Error("Expected tab note elements with notes");
    }

    expect(controller.activeVoiceNumber).toBe(1);
    expect(activeEmptyNote.stringNum).toBe(inactiveNote.stringNum);
    expect(inactiveElementNote.beat.voiceBar.voiceNumber).toBe(2);
    expect(inactiveElementNote.fret).toBe(3);
    expect(activeElementNote.beat.startTick).toBe(
      inactiveElementNote.beat.startTick
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

  test("Let Ring notes render their fret in parentheses", () => {
    const { track, bar } = createScoreGraph();
    const note = bar.getVoiceBar(1)?.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note");
    }
    note.fret = 5;
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.LetRing));

    const controller = createLaidOutController(track);
    const noteElement = getNoteElement(controller, note);

    expect(noteElement.noteText).toBe("(5)");
    expect(noteElement.textRect.width).toBeGreaterThan(
      controller.layoutDimensions.NOTE_TEXT_SIZE
    );
  });

  test("normal and Let Ring notes use the same larger square selection geometry", () => {
    const { track, bar } = createScoreGraph();
    const voiceBar = bar.getVoiceBar(1);
    if (voiceBar === null) {
      throw Error("Expected voice bar");
    }
    voiceBar.appendBeats();
    const normalNote = getBackingNote(voiceBar.beats[0]);
    const letRingNote = getBackingNote(voiceBar.beats[1]);
    normalNote.fret = 12;
    letRingNote.fret = 12;
    letRingNote.addTechnique(
      new GuitarTechnique(letRingNote, GuitarTechniqueType.LetRing)
    );
    const controller = createLaidOutController(track);
    const normalElement = getNoteElement(controller, normalNote);
    const letRingElement = getNoteElement(controller, letRingNote);

    expect(normalElement.selectionRect.width).toBe(
      letRingElement.selectionRect.width
    );
    expect(normalElement.selectionRect.height).toBe(
      letRingElement.selectionRect.height
    );
    expect(normalElement.selectionRect.width).toBe(
      normalElement.selectionRect.height
    );
    expect(normalElement.selectionRect.width).toBe(
      controller.layoutDimensions.NOTE_TEXT_SIZE * 1.5 * SELECTION_SIZE_FACTOR
    );
  });

  test("selection preview and cursor outline use identical geometry", () => {
    const { track, bar } = createScoreGraph();
    const note = bar.getVoiceBar(1)?.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note");
    }
    note.fret = 12;
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.LetRing));
    const controller = createLaidOutController(track);
    const noteElement = getNoteElement(controller, note);
    controller.selectNoteElement(noteElement);
    const originalDocument = globalThis.document;
    const elements: Array<{
      attrs: Map<string, string>;
      setAttribute: (name: string, value: string) => void;
    }> = [];
    const selectionGroup = {
      appendChild: jest.fn(),
      removeChild: jest.fn(),
    } as unknown as SVGGElement;
    (
      globalThis as unknown as {
        document: { createElementNS: () => SVGRectElement };
      }
    ).document = {
      createElementNS: () => {
        const attrs = new Map<string, string>();
        const element = {
          attrs,
          setAttribute: (name: string, value: string) => attrs.set(name, value),
        };
        elements.push(element);
        return element as unknown as SVGRectElement;
      },
    };
    const overlay = new SelectionOverlayRenderer(selectionGroup, controller);

    overlay.showSelectionPreview(noteElement);
    overlay.render();

    const preview = elements[0]?.attrs;
    const selected = elements[1]?.attrs;
    expect(preview?.get("width")).toBe(selected?.get("width"));
    expect(preview?.get("height")).toBe(selected?.get("height"));
    expect(preview?.get("x")).toBe(selected?.get("x"));
    expect(preview?.get("y")).toBe(selected?.get("y"));

    if (originalDocument === undefined) {
      delete (globalThis as unknown as { document?: Document }).document;
    } else {
      globalThis.document = originalDocument;
    }
  });
});
