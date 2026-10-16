/** @jest-environment jsdom */

import { TabNoteSlotElement } from "../../../src/notation/controller/element/note/tab-note-slot-element";
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

function renderNote(controller: TrackController, note: GuitarNote) {
  const renderer = new SVGTabNoteRenderer(
    controller,
    getNoteElement(controller, note),
    { baseUrl: "", variant: "light" }
  );

  renderer.render();
  return renderer.ensureContainerGroup();
}

function hasHitRect(controller: TrackController, note: GuitarNote) {
  const rect = renderNote(controller, note).querySelector('[id^="note-rect-"]');
  if (rect !== null) {
    expect(rect.getAttribute("pointer-events")).toBe("all");
  }
  return rect !== null;
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

describe("Tab note slots", () => {
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

    expect(hasHitRect(controller, activeEmptyNote)).toBe(false);
    expect(hasHitRect(controller, voice2Note)).toBe(true);
    expect(hasHitRect(controller, voice4Note)).toBe(false);
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
    expect(hasHitRect(controller, activeEmptyNote)).toBe(false);
    expect(hasHitRect(controller, inactiveNote)).toBe(true);
  });

  test("quarter and half voices share hit targets by attack time, not beat index", () => {
    const { track, bar } = createScoreGraph();
    const voice1 = bar.getVoiceBar(1);
    const voice2 = bar.insertVoiceBar(2);
    if (voice1 === null) {
      throw Error("Expected voice 1");
    }
    voice1.appendBeats();
    voice1.appendBeats();
    voice1.appendBeats();
    voice1.rebuildTiming();

    voice2.beats[0].baseDuration = NoteDuration.Half;
    voice2.appendBeats();
    voice2.rebuildTiming();
    const inactiveHalfNote = getBackingNote(voice2.beats[1]);
    inactiveHalfNote.fret = 5;

    const matchingQuarterNote = getBackingNote(voice1.beats[2]);
    const previousQuarterNote = getBackingNote(voice1.beats[1]);
    const controller = createLaidOutController(track);

    expect(hasHitRect(controller, matchingQuarterNote)).toBe(false);
    expect(hasHitRect(controller, previousQuarterNote)).toBe(true);
    expect(hasHitRect(controller, inactiveHalfNote)).toBe(true);
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

    expect(hasHitRect(controller, activeNote)).toBe(true);
    expect(hasHitRect(controller, inactiveNote)).toBe(false);
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

    expect(hasHitRect(controller, activeNote)).toBe(true);
    expect(hasHitRect(controller, inactiveNote)).toBe(false);
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
    const group = renderNote(controller, note);

    expect(group.querySelector("text")?.textContent).toBe("(5)");
    const background = group.querySelector('[id^="note-bck-"]');
    expect(Number(background?.getAttribute("width"))).toBeGreaterThan(12);
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

    const selectionGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    const overlay = new SelectionOverlayRenderer(selectionGroup, controller);

    for (const element of [normalElement, letRingElement]) {
      controller.selectNoteElement(element);
      overlay.render();

      const outline = selectionGroup.querySelector("rect");
      expect(Number(outline?.getAttribute("width"))).toBeCloseTo(23.94);
      expect(Number(outline?.getAttribute("height"))).toBeCloseTo(23.94);
    }
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
    const selectionGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    const overlay = new SelectionOverlayRenderer(selectionGroup, controller);

    overlay.showSelectionPreview(noteElement);
    overlay.render();

    expect(selectionGroup.querySelectorAll("rect")).toHaveLength(2);
    const preview = selectionGroup.querySelector("#selectionPreview");
    const selected = selectionGroup.querySelector('rect[fill="none"]');
    expect(preview).not.toBeNull();
    expect(selected).not.toBeNull();
    for (const attribute of ["width", "height", "x", "y"]) {
      expect(preview?.hasAttribute(attribute)).toBe(true);
      expect(preview?.getAttribute(attribute)).toBe(
        selected?.getAttribute(attribute)
      );
    }
  });
});
