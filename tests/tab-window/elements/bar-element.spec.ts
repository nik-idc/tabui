import {
  Bar,
  BarElement,
  Chord,
  ChordElement,
  Guitar,
  GuitarNote,
  Note,
  NoteDuration,
  NoteElement,
  Point,
  Rect,
  Tab,
  TabWindowDim,
} from "../../../src";
import { SelectedElement } from "../../../src/tab-window/elements/selected-element";

const stringsCount = 6;
const fretsCount = 24;
const guitar = new Guitar(
  stringsCount,
  [Note.E, Note.B, Note.G, Note.D, Note.A, Note.E],
  fretsCount
);

const width = 1200;
const noteTextSize = 12;
const infoTextSize = 24;
const durationsHeight = 50;
const dim = new TabWindowDim(
  width,
  noteTextSize,
  infoTextSize,
  durationsHeight,
  stringsCount
);

describe("Bar element tests", () => {
  test("Bar element calc with time signature test", () => {
    // Expected width ratios where all of these
    // are multiplied by min note size
    const chords = [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ];
    const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, chords);
    const barCoords = new Point(0, 0);
    const barElement = new BarElement(dim, barCoords, bar, true, true);

    // Make expected results
    const expectedSigRect = new Rect(
      barCoords.x,
      barCoords.y + dim.durationsHeight + dim.noteRectHeight / 2,
      dim.infoWidth,
      dim.timeSigRectHeight
    );
    const expectedTempoRect = new Rect(
      barCoords.x,
      barCoords.y,
      dim.infoWidth,
      dim.durationsHeight
    );

    let chordsWidth = 0;
    for (const chordElement of barElement.chordElements) {
      chordsWidth += chordElement.rect.width;
    }
    const expectedRect = new Rect(
      barCoords.x,
      barCoords.y,
      expectedSigRect.width + chordsWidth,
      dim.tabLineHeight
    );

    // Calc
    barElement.calc();

    // Test
    expect(barElement.timeSigRect).toStrictEqual(expectedSigRect);
    expect(barElement.tempoRect).toStrictEqual(expectedTempoRect);
    expect(barElement.rect).toStrictEqual(expectedRect);
  });

  test("Bar element calc without time signature test", () => {
    // Expected width ratios where all of these
    // are multiplied by min note size
    const chords = [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ];
    const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, chords);
    const barCoords = new Point(0, 0);
    const barElement = new BarElement(dim, barCoords, bar, false, true);

    // Make expected results
    const expectedSigRect = new Rect(
      barCoords.x,
      barCoords.y + dim.durationsHeight + dim.noteRectHeight / 2,
      0,
      dim.timeSigRectHeight
    );
    const expectedTempoRect = new Rect(
      barCoords.x,
      barCoords.y,
      dim.infoWidth,
      dim.durationsHeight
    );

    let chordsWidth = 0;
    for (const chordElement of barElement.chordElements) {
      chordsWidth += chordElement.rect.width;
    }
    const expectedRect = new Rect(
      barCoords.x,
      barCoords.y,
      expectedTempoRect.width + chordsWidth,
      dim.tabLineHeight
    );

    // Calc
    barElement.calc();

    // Test
    expect(barElement.timeSigRect).toStrictEqual(expectedSigRect);
    expect(barElement.tempoRect).toStrictEqual(expectedTempoRect);
    expect(barElement.rect).toStrictEqual(expectedRect);
  });

  test("Scale horizontally test", () => {
    const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]);
    const barCoords = new Point(0, 0);
    let showSignature = true;
    let showTempo = true;
    const barElement = new BarElement(
      dim,
      barCoords,
      bar,
      showSignature,
      showTempo
    );

    // Make expected results
    const scale = 1.5;
    const expectedSigRect = new Rect(
      barElement.timeSigRect.x * scale,
      barElement.timeSigRect.y,
      barElement.timeSigRect.width * scale,
      barElement.timeSigRect.height
    );
    const expectedTempoRect = new Rect(
      barElement.tempoRect.x * scale,
      barElement.tempoRect.y,
      barElement.tempoRect.width * scale,
      barElement.tempoRect.height
    );
    const expectedRect = new Rect(
      barElement.rect.x * scale,
      barElement.rect.y,
      barElement.rect.width * scale,
      barElement.rect.height
    );

    // Scale
    let result = barElement.scaleBarHorBy(scale);

    // Test
    expect(result).toBe(true);
    expect(barElement.timeSigRect).toStrictEqual(expectedSigRect);
    expect(barElement.tempoRect).toStrictEqual(expectedTempoRect);
    expect(barElement.rect).toStrictEqual(expectedRect);
  });

  test("Translate test", () => {
    const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]);
    const barCoords = new Point(0, 0);
    let showSignature = true;
    let showTempo = true;
    const barElement = new BarElement(
      dim,
      barCoords,
      bar,
      showSignature,
      showTempo
    );

    // Make expected results
    const dx = 15;
    const dy = 30;
    const expectedSigRect = new Rect(
      barElement.timeSigRect.x + dx,
      barElement.timeSigRect.y + dy,
      barElement.timeSigRect.width,
      barElement.timeSigRect.height
    );
    const expectedTempoRect = new Rect(
      barElement.tempoRect.x + dx,
      barElement.tempoRect.y + dy,
      barElement.tempoRect.width,
      barElement.tempoRect.height
    );
    const expectedRect = new Rect(
      barElement.rect.x + dx,
      barElement.rect.y + dy,
      barElement.rect.width,
      barElement.rect.height
    );

    // Scale (unsuccesful)
    barElement.translateBy(dx, dy);

    // Test
    expect(barElement.timeSigRect).toStrictEqual(expectedSigRect);
    expect(barElement.tempoRect).toStrictEqual(expectedTempoRect);
    expect(barElement.rect).toStrictEqual(expectedRect);
  });

  test("Insert chord test", () => {
    const bar1 = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
    ]);
    const bar1Coords = new Point(0, 0);
    const barElement1 = new BarElement(dim, bar1Coords, bar1, true, true);
    const bar2 = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
    ]);
    const bar2Coords = new Point(barElement1.rect.x, 0);
    const barElement2 = new BarElement(dim, bar2Coords, bar2, true, true);

    // Insert at index
    barElement1.insertEmptyChord(2);

    // Test
    expect(barElement1.rect).toStrictEqual(barElement2.rect);
    expect(barElement1.chordElements[2].chord.duration).toBe(
      barElement2.chordElements[2].chord.duration
    );
  });

  test("Prepend chord test", () => {
    const bar1 = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
    ]);
    const bar1Coords = new Point(0, 0);
    const barElement1 = new BarElement(dim, bar1Coords, bar1, true, true);
    const bar2 = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
    ]);
    const bar2Coords = new Point(barElement1.rect.x, 0);
    const barElement2 = new BarElement(dim, bar2Coords, bar2, true, true);

    // Prepend
    barElement1.prependChord();

    // Test
    expect(barElement1.rect).toStrictEqual(barElement2.rect);
    expect(barElement1.chordElements[0].chord.duration).toBe(
      barElement2.chordElements[0].chord.duration
    );
  });

  test("Append chord test", () => {
    const bar1 = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
    ]);
    const bar1Coords = new Point(0, 0);
    const barElement1 = new BarElement(dim, bar1Coords, bar1, true, true);
    const bar2 = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Quarter),
    ]);
    const bar2Coords = new Point(barElement1.rect.x, 0);
    const barElement2 = new BarElement(dim, bar2Coords, bar2, true, true);

    // Append
    barElement1.appendChord();

    // Test
    expect(barElement1.rect).toStrictEqual(barElement2.rect);
    expect(barElement1.chordElements[4].chord.duration).toBe(
      barElement2.chordElements[4].chord.duration
    );
  });

  test("Remove chord test", () => {
    const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Sixteenth),
    ]);
    const barCoords = new Point(0, 0);
    const barElement = new BarElement(dim, barCoords, bar, true, true);

    // Calc expected width
    const chordElement = new ChordElement(
      dim,
      new Point(0, 0),
      new Chord(guitar, NoteDuration.Quarter)
    );
    const expectedWidth = barElement.rect.width - chordElement.rect.width;

    // Remove at index
    barElement.removeChord(2);

    // Test
    expect(barElement.rect.width).toBeCloseTo(expectedWidth);
    expect(barElement.chordElements.length).toBe(3);
    expect(barElement.chordElements[2].chord.duration).toBe(
      NoteDuration.Sixteenth
    );
  });

  test("Change chord duration test", () => {
    const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Sixteenth),
    ]);
    const barCoords = new Point(0, 0);
    const barElement = new BarElement(dim, barCoords, bar, true, true);

    // Calc expected width
    const prevWidth = barElement.chordElements[2].rect.width;
    const chordElement = new ChordElement(
      dim,
      new Point(0, 0),
      new Chord(guitar, NoteDuration.Sixteenth)
    );
    const expectedWidth =
      barElement.rect.width - prevWidth + chordElement.rect.width;

    // Change chord duration
    barElement.changeChordDuration(
      barElement.chordElements[2].chord,
      NoteDuration.Sixteenth
    );

    // Test
    expect(barElement.rect.width).toBeCloseTo(expectedWidth);
    expect(barElement.chordElements[2].chord.duration).toBe(
      NoteDuration.Sixteenth
    );
  });

  test("Change bar beats test: no show -> show", () => {
    const prevBar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Sixteenth),
    ]);
    const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Sixteenth),
    ]);
    const barCoords = new Point(0, 0);
    const barElement = new BarElement(dim, barCoords, bar, false, true);

    // Calc expected rect
    const expectedSigRect = new Rect(
      barCoords.x,
      barCoords.y + dim.durationsHeight + dim.noteRectHeight / 2,
      dim.infoWidth,
      dim.timeSigRectHeight
    );
    const expectedTempoRect = new Rect(
      barCoords.x,
      barCoords.y,
      dim.infoWidth,
      dim.durationsHeight
    );
    const expectedRect = new Rect(
      barElement.rect.x,
      barElement.rect.y,
      barElement.rect.width,
      barElement.rect.height
    );

    // Change chord duration
    const newBeats = 3;
    barElement.changeBarBeats(newBeats, prevBar);

    // Test
    expect(barElement.timeSigRect).toStrictEqual(expectedSigRect);
    expect(barElement.tempoRect).toStrictEqual(expectedTempoRect);
    expect(barElement.rect).toStrictEqual(expectedRect);
    expect(barElement.bar.beats).toBe(newBeats);
    expect(barElement.showSignature).toBe(true);
  });

  test("Change bar beats test: show -> no show", () => {
    const prevBar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Sixteenth),
    ]);
    const bar = new Bar(guitar, 120, 3, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Sixteenth),
    ]);
    const barCoords = new Point(0, 0);
    const barElement = new BarElement(dim, barCoords, bar, true, true);

    // Calc expected rect
    const expectedSigRect = new Rect(
      barCoords.x,
      barCoords.y + dim.durationsHeight + dim.noteRectHeight / 2,
      0,
      dim.timeSigRectHeight
    );
    const expectedTempoRect = new Rect(
      barCoords.x,
      barCoords.y,
      dim.infoWidth,
      dim.durationsHeight
    );
    const expectedRect = new Rect(
      barElement.rect.x,
      barElement.rect.y,
      barElement.rect.width,
      barElement.rect.height
    );

    // Change chord duration
    const newBeats = 4;
    barElement.changeBarBeats(newBeats, prevBar);

    // Test
    expect(barElement.timeSigRect).toStrictEqual(expectedSigRect);
    expect(barElement.tempoRect).toStrictEqual(expectedTempoRect);
    expect(barElement.rect).toStrictEqual(expectedRect);
    expect(barElement.bar.beats).toBe(newBeats);
    expect(barElement.showSignature).toBe(false);
  });

  test("Change bar duration test: no show -> show", () => {
    const prevBar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Sixteenth),
    ]);
    const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Sixteenth),
    ]);
    const barCoords = new Point(0, 0);
    const barElement = new BarElement(dim, barCoords, bar, false, true);

    // Calc expected rect
    const expectedSigRect = new Rect(
      barCoords.x,
      barCoords.y + dim.durationsHeight + dim.noteRectHeight / 2,
      dim.infoWidth,
      dim.timeSigRectHeight
    );
    const expectedTempoRect = new Rect(
      barCoords.x,
      barCoords.y,
      dim.infoWidth,
      dim.durationsHeight
    );
    const expectedRect = new Rect(
      barElement.rect.x,
      barElement.rect.y,
      barElement.rect.width,
      barElement.rect.height
    );

    // Change chord duration
    const newDuration = NoteDuration.Eighth;
    barElement.changeBarDuration(newDuration, prevBar);

    // Test
    expect(barElement.timeSigRect).toStrictEqual(expectedSigRect);
    expect(barElement.tempoRect).toStrictEqual(expectedTempoRect);
    expect(barElement.rect).toStrictEqual(expectedRect);
    expect(barElement.bar.duration).toBe(newDuration);
    expect(barElement.showSignature).toBe(true);
  });

  test("Change bar duration test: show -> no show", () => {
    const prevBar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Sixteenth),
    ]);
    const bar = new Bar(guitar, 120, 4, NoteDuration.Eighth, [
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Sixteenth),
    ]);
    const barCoords = new Point(0, 0);
    const barElement = new BarElement(dim, barCoords, bar, true, true);

    // Calc expected rect
    const expectedSigRect = new Rect(
      barCoords.x,
      barCoords.y + dim.durationsHeight + dim.noteRectHeight / 2,
      0,
      dim.timeSigRectHeight
    );
    const expectedTempoRect = new Rect(
      barCoords.x,
      barCoords.y,
      dim.infoWidth,
      dim.durationsHeight
    );
    const expectedRect = new Rect(
      barElement.rect.x,
      barElement.rect.y,
      barElement.rect.width,
      barElement.rect.height
    );

    // Change chord duration
    const newDuration = NoteDuration.Quarter;
    barElement.changeBarDuration(newDuration, prevBar);

    // Test
    expect(barElement.timeSigRect).toStrictEqual(expectedSigRect);
    expect(barElement.tempoRect).toStrictEqual(expectedTempoRect);
    expect(barElement.rect).toStrictEqual(expectedRect);
    expect(barElement.bar.duration).toBe(newDuration);
    expect(barElement.showSignature).toBe(false);
  });

  test("Change bar tempo test", () => {
    const prevBar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Sixteenth),
    ]);
    const bar = new Bar(guitar, 120, 4, NoteDuration.Eighth, [
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Sixteenth),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Sixteenth),
    ]);
    const barCoords = new Point(0, 0);
    const barElement = new BarElement(dim, barCoords, bar, true, true);

    // Change tempo
    let newTempo = 110;
    barElement.changeTempo(newTempo, prevBar);

    // Test
    expect(barElement.bar.tempo).toBe(newTempo);
    expect(barElement.showTempo).toBe(true);

    // Change tempo
    newTempo = 120;
    barElement.changeTempo(newTempo, prevBar);

    // Test
    expect(barElement.bar.tempo).toBe(newTempo);
    expect(barElement.showTempo).toBe(false);
  });
});
