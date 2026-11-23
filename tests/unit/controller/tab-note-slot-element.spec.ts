/** @jest-environment jsdom */

import { TabNoteSlotElement } from "../../../src/notation/controller/element/note/tab-note-slot-element";
import { TrackController } from "../../../src/notation/controller/track-controller";
import { SVGTabNoteRenderer } from "../../../src/notation/render/svg/svg-tab-note-renderer";
import { SVGTechniqueRenderer } from "../../../src/notation/render/svg/svg-technique-renderer";
import { SelectionOverlayRenderer } from "../../../src/notation/render/svg/selection-overlay-renderer";
import {
  Beat,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteDuration,
  DEFAULT_MASTER_BAR,
} from "../../../src/notation/model";
import { createScoreGraph } from "../model/helpers";
import { createTestTrackController } from "./helpers";
import { EditorLayoutDimensions } from "../../../src/notation/controller/editor-layout-dimensions";

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
  test("adding and removing Tie hides and restores the fret number", () => {
    const { track, bar } = createScoreGraph();
    const voice = bar.ensureVoiceBar(1);
    voice.appendBeats();
    const source = getBackingNote(voice.beats[0]);
    const continuation = getBackingNote(voice.beats[1]);
    source.setFret(2);
    continuation.setFret(2);
    const controller = createLaidOutController(track);
    const renderer = new SVGTabNoteRenderer(
      controller,
      getNoteElement(controller, continuation),
      { baseUrl: "", variant: "light" }
    );
    renderer.render();
    const group = renderer.ensureContainerGroup();
    expect(group.textContent).toBe("2");
    expect(group.querySelector('[id^="note-bck-"]')).not.toBeNull();

    continuation.setTechnique(GuitarTechniqueType.Tie);
    controller.trackElement.update();
    renderer.updateElementReference(getNoteElement(controller, continuation));
    renderer.render();
    expect(group.querySelector('[id^="note-text-"]')).toBeNull();
    expect(group.querySelector('[id^="note-bck-"]')).toBeNull();
    expect(group.querySelector('[id^="note-rect-"]')).not.toBeNull();

    continuation.removeTechnique(GuitarTechniqueType.Tie);
    controller.trackElement.update();
    renderer.updateElementReference(getNoteElement(controller, continuation));
    renderer.render();
    expect(group.textContent).toBe("2");
    expect(group.querySelector('[id^="note-bck-"]')).not.toBeNull();
  });

  test("cross-bar ties show frets and draw wrapped curves with unique SVG IDs", () => {
    const { track, bar, score } = createScoreGraph();
    const voice = bar.getVoiceBar(1);
    if (voice === null) {
      throw Error("Expected voice");
    }
    voice.appendBeats();
    score.appendMasterBar(DEFAULT_MASTER_BAR);
    const nextBeat = track.staves[0].bars[1].getVoiceBar(1)?.beats[0];
    if (nextBeat === undefined) {
      throw Error("Expected next bar beat");
    }
    const source = getBackingNote(voice.beats[0]);
    const continuation = getBackingNote(voice.beats[1]);
    const acrossBar = getBackingNote(nextBeat);
    for (const note of [source, continuation, acrossBar]) {
      note.setFret(5);
    }
    continuation.setTechnique(GuitarTechniqueType.Tie);
    acrossBar.setTechnique(GuitarTechniqueType.Tie);
    const controller = createLaidOutController(track);
    expect(getNoteElement(controller, acrossBar).noteText).toBe("5");
    expect(renderNote(controller, acrossBar).textContent).toBe("5");
    const tie = getNoteElement(controller, continuation).techniqueElements[0];
    expect(tie.pathDescriptors?.[0].d).toContain("C");
    const wrapped = new TrackController(
      track,
      new EditorLayoutDimensions({
        width: 200,
        noteTextSize: 12,
        timeSigTextSize: 48,
        tempoTextSize: 24,
        durationsHeight: 30,
        horizontalPadding: 12,
      })
    );
    wrapped.trackElement.update();
    expect(wrapped.trackElement.trackLineElements.length).toBeGreaterThan(1);
    const sourcePaths = getNoteElement(
      wrapped,
      continuation
    ).techniqueElements.flatMap((t) => t.pathDescriptors ?? []);
    const incomingPaths = getNoteElement(
      wrapped,
      acrossBar
    ).techniqueElements.flatMap((t) => t.pathDescriptors ?? []);
    expect(sourcePaths).toHaveLength(2);
    expect(incomingPaths).toHaveLength(1);
    expect(incomingPaths[0].d).not.toMatch(/NaN|Infinity/);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    for (const note of [source, continuation, acrossBar]) {
      for (const technique of getNoteElement(wrapped, note).techniqueElements) {
        const renderer = new SVGTechniqueRenderer(wrapped, technique, {
          baseUrl: "",
          variant: "light",
        });
        renderer.render();
        svg.append(renderer.ensureContainerGroup());
      }
    }
    const ids = [...svg.querySelectorAll("[id]")].map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
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
    voice2Note.setFret(3);
    voice4Note.setFret(5);

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
    inactiveNote.setFret(3);

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
    inactiveHalfNote.setFret(5);

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
    activeNote.setFret(3);
    inactiveNote.setFret(5);

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

  test("Let Ring notes render plain fret numbers", () => {
    const { track, bar } = createScoreGraph();
    const note = bar.getVoiceBar(1)?.beats[0].notes?.[0];
    if (!(note instanceof GuitarNote)) {
      throw Error("Expected guitar note");
    }
    note.setFret(5);
    note.addTechnique(new GuitarTechnique(note, GuitarTechniqueType.LetRing));

    const controller = createLaidOutController(track);
    const group = renderNote(controller, note);

    expect(group.querySelector("text")?.textContent).toBe("5");
    const background = group.querySelector('[id^="note-bck-"]');
    expect(Number(background?.getAttribute("width"))).toBeGreaterThan(0);
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
    normalNote.setFret(12);
    letRingNote.setFret(12);
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
    note.setFret(12);
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
