import { TrackController } from "../../../src/notation/controller/track-controller";
import { SelectedMoveDirection } from "../../../src/notation/controller";
import { BeatGuitarTechniqueElement } from "../../../src/notation/controller/element/technique/beat-technique/beat-guitar-technique-element";
import { TabBeatElement } from "../../../src/notation/controller/element/beat/tab-beat-element";
import {
  Beat,
  Guitar,
  GuitarNote,
  GuitarTechnique,
  GuitarTechniqueType,
  NoteDuration,
  StrokeDirection,
} from "../../../src/notation/model";
import { createBarWithBeats, createBeat } from "../model/helpers";
import { TEST_LAYOUT_DIMENSIONS } from "./helpers";
import { required } from "../required";

type PathPoint = [number, number];

/**
 * Returns every coordinate pair of a path, including curve control points,
 * as absolute points. Lowercase `m` and `l` are relative; others are absolute.
 */
function getPathPoints(d: string): PathPoint[] {
  const tokens = d.match(/[a-zA-Z]|-?\d+(?:\.\d+)?(?:e-?\d+)?/g) ?? [];
  const points: PathPoint[] = [];
  let command = "M";
  let x = 0;
  let y = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (/[a-zA-Z]/.test(tokens[i])) {
      command = tokens[i];
      continue;
    }
    const dx = Number(tokens[i]);
    const dy = Number(tokens[i + 1]);
    i++;
    const isRelative = command === "m" || command === "l";
    x = isRelative ? x + dx : dx;
    y = isRelative ? y + dy : dy;
    points.push([x, y]);
  }
  return points;
}

/** Returns all points of an element's paths in global coordinates. */
function getGlobalPoints(
  element: BeatGuitarTechniqueElement | { pathDescriptors?: { d: string }[] },
  origin: { x: number; y: number }
): PathPoint[] {
  return (element.pathDescriptors ?? []).flatMap((p) =>
    getPathPoints(p.d).map(([x, y]): PathPoint => [origin.x + x, origin.y + y])
  );
}

/** Creates a controller for one bar whose beats have the given frets per string number. */
function createController(frets: Array<Record<number, number>>): {
  controller: TrackController;
  beats: Beat<Guitar>[];
} {
  const { track, beats } = createBarWithBeats(
    frets.map(() => ({ baseDuration: NoteDuration.Quarter }))
  );
  for (const [i, beatFrets] of frets.entries()) {
    for (const [stringNumber, fret] of Object.entries(beatFrets)) {
      const note = required(beats[i].notes)[Number(stringNumber) - 1];
      (note as GuitarNote).setFret(fret);
    }
  }
  const controller = new TrackController(track, TEST_LAYOUT_DIMENSIONS);
  return { controller, beats };
}

function getBeatElement(
  controller: TrackController,
  beat: Beat
): TabBeatElement {
  const element = controller.trackElement.getBeatElement(beat);
  if (!(element instanceof TabBeatElement)) {
    throw Error("Expected a tab beat element");
  }
  return element;
}

function getStrokeElement(
  controller: TrackController,
  beat: Beat
): BeatGuitarTechniqueElement {
  return required(getBeatElement(controller, beat).beatTechniqueElements[0]);
}

describe("BeatGuitarTechniqueElement stroke", () => {
  test.each([
    { name: "down", direction: StrokeDirection.Down, pointing: "up", tip: 1 },
    { name: "up", direction: StrokeDirection.Up, pointing: "down", tip: 6 },
  ])(
    "draws the $name stroke inside the beat technique slot, pointing $pointing to string $tip",
    ({ direction, tip: tipString }) => {
      const { controller, beats } = createController([{ 2: 3, 4: 0, 5: 2 }]);
      controller.toggleStroke(direction);

      const beatElement = getBeatElement(controller, beats[0]);
      const stroke = getStrokeElement(controller, beats[0]);
      const points = getGlobalPoints(stroke, stroke.beatElement.globalCoords);
      const xs = points.map(([x]) => x);
      const ys = points.map(([, y]) => y);

      // Inside the reserved slot and left of every fret text.
      const slotLeft = beatElement.globalCoords.x;
      const slotRight = slotLeft + TEST_LAYOUT_DIMENSIONS.beatTechniqueWidth;
      expect(Math.min(...xs)).toBeGreaterThanOrEqual(slotLeft);
      expect(Math.max(...xs)).toBeLessThanOrEqual(slotRight);
      for (const slot of beatElement.noteElements) {
        expect(Math.max(...xs)).toBeLessThan(slot.textRectGlobal.left);
      }

      // Spans every string, even though only strings 2 to 5 have frets.
      const top = beatElement.noteElements[0].globalBoundingBox;
      const bottom = beatElement.noteElements[5].globalBoundingBox;
      expect(Math.min(...ys)).toBeGreaterThanOrEqual(top.y);
      expect(Math.min(...ys)).toBeLessThan(top.middleY);
      expect(Math.max(...ys)).toBeLessThanOrEqual(bottom.bottom);
      expect(Math.max(...ys)).toBeGreaterThan(bottom.middleY);

      // The filled arrowhead is at the end of the stroke, on its last string.
      const arrowhead = required(
        stroke.pathDescriptors.find(
          (p) => p.attrs?.fill === "var(--tu-notation-ink)"
        )
      );
      const headYs = getPathPoints(arrowhead.d).map(
        ([, y]) => stroke.beatElement.globalCoords.y + y
      );
      const tipY =
        direction === StrokeDirection.Down
          ? Math.min(...headYs)
          : Math.max(...headYs);
      const tipSlot = beatElement.noteElements[tipString - 1].globalBoundingBox;
      expect(tipY).toBeGreaterThanOrEqual(tipSlot.y);
      expect(tipY).toBeLessThanOrEqual(tipSlot.bottom);
    }
  );

  test.each<{
    name: string;
    frets: Record<number, number>;
    first: number;
    last: number;
  }>([
    { name: "one played note", frets: { 3: 7 }, first: 1, last: 6 },
    { name: "no played notes", frets: {}, first: 1, last: 6 },
  ])("with $name, spans strings $first to $last", ({ frets, first, last }) => {
    const { controller, beats } = createController([frets]);
    controller.toggleStroke(StrokeDirection.Down);

    const beatElement = getBeatElement(controller, beats[0]);
    const stroke = getStrokeElement(controller, beats[0]);
    const ys = getGlobalPoints(stroke, stroke.beatElement.globalCoords).map(
      ([, y]) => y
    );
    const top = beatElement.noteElements[first - 1].globalBoundingBox;
    const bottom = beatElement.noteElements[last - 1].globalBoundingBox;
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(top.y);
    expect(Math.min(...ys)).toBeLessThan(top.middleY);
    expect(Math.max(...ys)).toBeLessThanOrEqual(bottom.bottom);
    expect(Math.max(...ys)).toBeGreaterThan(bottom.middleY);
  });

  test("follows stroke edits, undo, and removal with one stable element identity", () => {
    const { controller, beats } = createController([{ 1: 0, 6: 0 }]);
    const ownedNodes = () =>
      controller.trackElement.trackLineElements[0].ownedNotationNodes.filter(
        (n) => n instanceof BeatGuitarTechniqueElement
      );
    expect(ownedNodes()).toHaveLength(0);

    controller.toggleStroke(StrokeDirection.Down);
    const down = getStrokeElement(controller, beats[0]);
    const downHash = down.stateHash;
    expect(ownedNodes()).toEqual([down]);

    controller.toggleStroke(StrokeDirection.Up);
    const up = getStrokeElement(controller, beats[0]);
    expect(up.getStableIdentity()).toBe(down.getStableIdentity());
    expect(up.stateHash).not.toBe(downHash);

    controller.undo();
    expect(getStrokeElement(controller, beats[0]).stateHash).toBe(downHash);

    controller.toggleStroke(StrokeDirection.Down);
    expect(getBeatElement(controller, beats[0]).beatTechniqueElements).toEqual(
      []
    );
    expect(ownedNodes()).toHaveLength(0);
  });
});

describe("note visuals next to a stroke", () => {
  /** Global left edge of the stroke on the beat. */
  function strokeLeft(controller: TrackController, beat: Beat): number {
    const stroke = getStrokeElement(controller, beat);
    const points = getGlobalPoints(stroke, stroke.beatElement.globalCoords);
    return Math.min(...points.map(([x]) => x));
  }

  test.each([
    { name: "slide", type: GuitarTechniqueType.Slide },
    { name: "legato", type: GuitarTechniqueType.Legato },
  ])("a $name into a stroke beat ends before the stroke arrow", ({ type }) => {
    const { controller, beats } = createController([{ 1: 5 }, { 1: 7, 2: 7 }]);
    const source = required(beats[0].notes)[0] as GuitarNote;
    source.addTechnique(new GuitarTechnique(source, type));
    controller.moveSelectedNote(SelectedMoveDirection.Right);
    controller.toggleStroke(StrokeDirection.Down);

    const sourceSlot = getBeatElement(controller, beats[0]).noteElements[0];
    const transition = required(sourceSlot.techniqueElements[0]);
    const xs = getGlobalPoints(transition, sourceSlot.globalCoords).map(
      ([x]) => x
    );
    expect(Math.max(...xs)).toBeLessThan(strokeLeft(controller, beats[1]));
  });

  test("a tie into a stroke beat ends before the stroke arrow", () => {
    const { controller, beats } = createController([{ 1: 5 }, { 1: 5, 2: 7 }]);
    const continuation = required(beats[1].notes)[0] as GuitarNote;
    continuation.addTechnique(
      new GuitarTechnique(continuation, GuitarTechniqueType.Tie)
    );
    controller.moveSelectedNote(SelectedMoveDirection.Right);
    controller.toggleStroke(StrokeDirection.Down);

    const slot = getBeatElement(controller, beats[1]).noteElements[0];
    const tie = required(
      slot.techniqueElements.find(
        (t) => t.technique.type === GuitarTechniqueType.Tie
      )
    );
    // Curve control points can sit past the end, so check the end point.
    const end = required(getGlobalPoints(tie, slot.globalCoords).at(-1));
    expect(end[0]).toBeLessThan(strokeLeft(controller, beats[1]));
  });

  test.each([
    { name: "natural", type: GuitarTechniqueType.NaturalHarmonic },
    { name: "pinch", type: GuitarTechniqueType.PinchHarmonic },
  ])(
    "a $name harmonic diamond on a stroke beat stays left of the arrow",
    ({ type }) => {
      const { controller, beats } = createController([{ 1: 12, 2: 12 }]);
      const note = required(beats[0].notes)[0] as GuitarNote;
      note.addTechnique(new GuitarTechnique(note, type));
      controller.toggleStroke(StrokeDirection.Down);

      const slot = getBeatElement(controller, beats[0]).noteElements[0];
      const diamond = required(slot.techniqueElements[0]);
      const diamondXs = getGlobalPoints(diamond, slot.globalCoords).map(
        ([x]) => x
      );
      expect(Math.max(...diamondXs)).toBeLessThan(
        strokeLeft(controller, beats[0])
      );
      // On the first beat, it also stays inside the bar content.
      const contentStart = slot.beatElement.voiceBarContainer.globalCoords.x;
      expect(Math.min(...diamondXs)).toBeGreaterThanOrEqual(contentStart);
    }
  );
});

describe("note visuals next to a stroke in another voice", () => {
  /**
   * Creates voice 1 with a stroke on its second beat, and voice 2 with
   * notes on string 1 in the same two rhythm columns.
   */
  function createTwoVoiceController(): {
    controller: TrackController;
    voice1: Beat[];
    voice2: Beat[];
  } {
    const { controller, beats: voice1 } = createController([
      { 2: 5 },
      { 2: 7, 3: 7 },
    ]);
    const voiceBar2 = voice1[0].voiceBar.bar.ensureVoiceBar(2);
    const voice2 = [0, 1].map(() =>
      createBeat(voiceBar2, NoteDuration.Quarter)
    );
    voiceBar2.beats.splice(0, voiceBar2.beats.length, ...voice2);
    voiceBar2.rebuildTiming();
    for (const beat of voice2) {
      beat.makeBeatWithNotes();
      (required(beat.notes)[0] as GuitarNote).setFret(5);
    }
    controller.trackElement.update();

    controller.moveSelectedNote(SelectedMoveDirection.Right);
    controller.toggleStroke(StrokeDirection.Down);
    expect(voice1[1].beatTechniques).toHaveLength(1);
    return { controller, voice1, voice2 };
  }

  /** Global left edge of the stroke on a voice 1 beat. */
  function strokeLeft(controller: TrackController, beat: Beat): number {
    const stroke = getStrokeElement(controller, beat);
    const points = getGlobalPoints(stroke, stroke.beatElement.globalCoords);
    return Math.min(...points.map(([x]) => x));
  }

  test("a voice 2 tie into the stroke column ends before the voice 1 arrow", () => {
    const { controller, voice1, voice2 } = createTwoVoiceController();
    const continuation = required(voice2[1].notes)[0] as GuitarNote;
    continuation.addTechnique(
      new GuitarTechnique(continuation, GuitarTechniqueType.Tie)
    );
    controller.trackElement.update();

    const slot = getBeatElement(controller, voice2[1]).noteElements[0];
    const tie = required(
      slot.techniqueElements.find(
        (t) => t.technique.type === GuitarTechniqueType.Tie
      )
    );
    const end = required(getGlobalPoints(tie, slot.globalCoords).at(-1));
    expect(end[0]).toBeLessThan(strokeLeft(controller, voice1[1]));
  });

  test("a voice 2 slide into the stroke column ends before the voice 1 arrow", () => {
    const { controller, voice1, voice2 } = createTwoVoiceController();
    (required(voice2[1].notes)[0] as GuitarNote).setFret(7);
    const source = required(voice2[0].notes)[0] as GuitarNote;
    source.addTechnique(new GuitarTechnique(source, GuitarTechniqueType.Slide));
    controller.trackElement.update();

    const sourceSlot = getBeatElement(controller, voice2[0]).noteElements[0];
    const slide = required(sourceSlot.techniqueElements[0]);
    const xs = getGlobalPoints(slide, sourceSlot.globalCoords).map(([x]) => x);
    expect(Math.max(...xs)).toBeLessThan(strokeLeft(controller, voice1[1]));
  });

  test("a voice 2 harmonic diamond in the stroke column stays left of the voice 1 arrow", () => {
    const { controller, voice1, voice2 } = createTwoVoiceController();
    const note = required(voice2[1].notes)[0] as GuitarNote;
    note.addTechnique(
      new GuitarTechnique(note, GuitarTechniqueType.NaturalHarmonic)
    );
    controller.trackElement.update();

    const slot = getBeatElement(controller, voice2[1]).noteElements[0];
    const diamond = required(slot.techniqueElements[0]);
    const xs = getGlobalPoints(diamond, slot.globalCoords).map(([x]) => x);
    expect(Math.max(...xs)).toBeLessThan(strokeLeft(controller, voice1[1]));
  });
});
