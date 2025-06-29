import {
  Bar,
  BarElement,
  Beat,
  BeatElement,
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
const timeSigTextSize = 24;
const tempoTextSize = 36;
const durationsHeight = 50;
const dim = new TabWindowDim(
  width,
  noteTextSize,
  timeSigTextSize,
  tempoTextSize,
  durationsHeight,
  stringsCount
);

describe("Bar element tests", () => {
  test("Bar element calc with time signature test", () => {
    // Expected width ratios where all of these
    // are multiplied by min note size
    const beats = [
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
    ];
    const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, beats);
    const barCoords = new Point(0, 0);
    const barElement = new BarElement(dim, barCoords, bar, true, true);

    // Make expected results
    const expectedSigRect = new Rect(
      barCoords.x,
      barCoords.y +
        dim.tempoRectHeight +
        dim.durationsHeight +
        dim.noteRectHeight / 2,
      dim.timeSigRectWidth,
      dim.timeSigRectHeight
    );
    const expectedTempoRect = new Rect(
      barCoords.x,
      barCoords.y,
      dim.tempoRectWidth,
      dim.durationsHeight
    );

    let beatsWidth = 0;
    for (const beatElement of barElement.beatElements) {
      beatsWidth += beatElement.rect.width;
    }
    const expectedRect = new Rect(
      barCoords.x,
      barCoords.y,
      expectedSigRect.width + beatsWidth,
      dim.tabLineMinHeight
    );

    let expectedLines = new Array<Array<Point>>();
    let y = expectedSigRect.y;
    for (let i = 0; i < guitar.stringsCount; i++) {
      expectedLines.push([
        new Point(expectedRect.x, y),
        new Point(expectedRect.rightTop.x, y),
      ]);

      y += dim.noteRectHeight;
    }

    // Calc
    barElement.calc();

    // Test
    expect(barElement.timeSigRect).toStrictEqual(expectedSigRect);
    expect(barElement.tempoRect).toStrictEqual(expectedTempoRect);
    expect(barElement.rect).toStrictEqual(expectedRect);
    for (let i = 0; i < guitar.stringsCount; i++) {
      expect(barElement.lines[i][0]).toStrictEqual(expectedLines[i][0]);
      expect(barElement.lines[i][1]).toStrictEqual(expectedLines[i][1]);
    }
  });

  test("Bar element calc without time signature test", () => {
    // Expected width ratios where all of these
    // are multiplied by min note size
    const beats = [
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
    ];
    const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, beats);
    const barCoords = new Point(0, 0);
    const barElement = new BarElement(dim, barCoords, bar, false, true);

    // Make expected results
    const expectedSigRect = new Rect(
      barCoords.x,
      barCoords.y +
        dim.tempoRectHeight +
        dim.durationsHeight +
        dim.noteRectHeight / 2,
      0,
      dim.timeSigRectHeight
    );
    const expectedTempoRect = new Rect(
      barCoords.x,
      barCoords.y,
      dim.tempoRectWidth,
      dim.durationsHeight
    );

    let beatsWidth = 0;
    for (const beatElement of barElement.beatElements) {
      beatsWidth += beatElement.rect.width;
    }
    const expectedRect = new Rect(
      barCoords.x,
      barCoords.y,
      beatsWidth,
      dim.tabLineMinHeight
    );

    let expectedLines = new Array<Array<Point>>();
    let y = expectedSigRect.y;
    for (let i = 0; i < guitar.stringsCount; i++) {
      expectedLines.push([
        new Point(expectedRect.x, y),
        new Point(expectedRect.rightTop.x, y),
      ]);

      y += dim.noteRectHeight;
    }

    // Calc
    barElement.calc();

    // Test
    expect(barElement.timeSigRect).toStrictEqual(expectedSigRect);
    expect(barElement.tempoRect).toStrictEqual(expectedTempoRect);
    expect(barElement.rect).toStrictEqual(expectedRect);
    for (let i = 0; i < guitar.stringsCount; i++) {
      expect(barElement.lines[i][0]).toStrictEqual(expectedLines[i][0]);
      expect(barElement.lines[i][1]).toStrictEqual(expectedLines[i][1]);
    }
  });

  test("Scale horizontally test", () => {
    const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
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
    let expectedLines = new Array<Array<Point>>();
    for (let i = 0; i < guitar.stringsCount; i++) {
      expectedLines.push([
        new Point(barElement.lines[i][0].x * scale, barElement.lines[i][0].y),
        new Point(barElement.lines[i][1].x * scale, barElement.lines[i][1].y),
      ]);
    }

    // Scale
    let result = barElement.scaleBarHorBy(scale);

    // Test
    expect(result).toBe(true);
    expect(barElement.timeSigRect).toStrictEqual(expectedSigRect);
    expect(barElement.tempoRect).toStrictEqual(expectedTempoRect);
    expect(barElement.rect).toStrictEqual(expectedRect);
    for (let i = 0; i < guitar.stringsCount; i++) {
      expect(barElement.lines[i][0]).toStrictEqual(expectedLines[i][0]);
      expect(barElement.lines[i][1]).toStrictEqual(expectedLines[i][1]);
    }
  });

  test("Translate test", () => {
    const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Quarter),
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
    let expectedLines = new Array<Array<Point>>();
    for (let i = 0; i < guitar.stringsCount; i++) {
      expectedLines.push([
        new Point(barElement.lines[i][0].x + dx, barElement.lines[i][0].y + dy),
        new Point(barElement.lines[i][1].x + dx, barElement.lines[i][1].y + dy),
      ]);
    }

    // Scale (unsuccesful)
    barElement.translateBy(dx, dy);

    // Test
    expect(barElement.timeSigRect).toStrictEqual(expectedSigRect);
    expect(barElement.tempoRect).toStrictEqual(expectedTempoRect);
    expect(barElement.rect).toStrictEqual(expectedRect);
    for (let i = 0; i < guitar.stringsCount; i++) {
      expect(barElement.lines[i][0]).toStrictEqual(expectedLines[i][0]);
      expect(barElement.lines[i][1]).toStrictEqual(expectedLines[i][1]);
    }
  });

  test("Insert beat test", () => {
    const bar1 = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
    ]);
    const bar1Coords = new Point(0, 0);
    const barElement1 = new BarElement(dim, bar1Coords, bar1, true, true);
    const bar2 = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
    ]);
    const bar2Coords = new Point(barElement1.rect.x, 0);
    const barElement2 = new BarElement(dim, bar2Coords, bar2, true, true);

    // Insert at index
    barElement1.insertEmptyBeat(2);

    // Test
    expect(barElement1.rect).toStrictEqual(barElement2.rect);
    expect(barElement1.beatElements[2].beat.duration).toBe(
      barElement2.beatElements[2].beat.duration
    );
  });

  test("Prepend beat test", () => {
    const bar1 = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
    ]);
    const bar1Coords = new Point(0, 0);
    const barElement1 = new BarElement(dim, bar1Coords, bar1, true, true);
    const bar2 = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
    ]);
    const bar2Coords = new Point(barElement1.rect.x, 0);
    const barElement2 = new BarElement(dim, bar2Coords, bar2, true, true);

    // Prepend
    barElement1.prependBeat();

    // Test
    expect(barElement1.rect).toStrictEqual(barElement2.rect);
    expect(barElement1.beatElements[0].beat.duration).toBe(
      barElement2.beatElements[0].beat.duration
    );
  });

  test("Append beat test", () => {
    const bar1 = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
    ]);
    const bar1Coords = new Point(0, 0);
    const barElement1 = new BarElement(dim, bar1Coords, bar1, true, true);
    const bar2 = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Quarter),
    ]);
    const bar2Coords = new Point(barElement1.rect.x, 0);
    const barElement2 = new BarElement(dim, bar2Coords, bar2, true, true);

    // Append
    barElement1.appendBeat();

    // Test
    expect(barElement1.rect).toStrictEqual(barElement2.rect);
    expect(barElement1.beatElements[4].beat.duration).toBe(
      barElement2.beatElements[4].beat.duration
    );
  });

  test("Remove beat test", () => {
    const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Sixteenth),
    ]);
    const barCoords = new Point(0, 0);
    const barElement = new BarElement(dim, barCoords, bar, true, true);

    // Calc expected width
    const beatElement = new BeatElement(
      dim,
      new Point(0, 0),
      new Beat(guitar, NoteDuration.Quarter)
    );
    const expectedWidth = barElement.rect.width - beatElement.rect.width;

    // Remove at index
    barElement.removeBeat(2);

    // Test
    expect(barElement.rect.width).toBeCloseTo(expectedWidth);
    expect(barElement.beatElements.length).toBe(3);
    expect(barElement.beatElements[2].beat.duration).toBe(
      NoteDuration.Sixteenth
    );
  });

  test("Change beat duration test", () => {
    const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Sixteenth),
    ]);
    const barCoords = new Point(0, 0);
    const barElement = new BarElement(dim, barCoords, bar, true, true);

    // Calc expected width
    const prevWidth = barElement.beatElements[2].rect.width;
    const beatElement = new BeatElement(
      dim,
      new Point(0, 0),
      new Beat(guitar, NoteDuration.Sixteenth)
    );
    const expectedWidth =
      barElement.rect.width - prevWidth + beatElement.rect.width;

    // Change beat duration
    barElement.changeBeatDuration(
      barElement.beatElements[2].beat,
      NoteDuration.Sixteenth
    );

    // Test
    expect(barElement.rect.width).toBeCloseTo(expectedWidth);
    expect(barElement.beatElements[2].beat.duration).toBe(
      NoteDuration.Sixteenth
    );
  });

  test("Change bar beats test: no show -> show", () => {
    const prevBar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Sixteenth),
    ]);
    const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Sixteenth),
    ]);
    const barCoords = new Point(0, 0);
    const barElement = new BarElement(dim, barCoords, bar, false, true);

    // Calc expected rect
    const expectedSigRect = new Rect(
      barCoords.x,
      barCoords.y +
        dim.tempoRectHeight +
        dim.durationsHeight +
        dim.noteRectHeight / 2,
      dim.timeSigRectWidth,
      dim.timeSigRectHeight
    );
    const expectedTempoRect = new Rect(
      barCoords.x,
      barCoords.y,
      dim.tempoRectWidth,
      dim.durationsHeight
    );
    const expectedRect = new Rect(
      barElement.rect.x,
      barElement.rect.y,
      barElement.rect.width + expectedSigRect.width,
      barElement.rect.height
    );
    let expectedLines = new Array<Array<Point>>();
    for (let i = 0; i < guitar.stringsCount; i++) {
      expectedLines.push([
        new Point(barElement.lines[i][0].x, barElement.lines[i][0].y),
        new Point(
          barElement.lines[i][1].x + expectedSigRect.width,
          barElement.lines[i][1].y
        ),
      ]);
    }

    // Change beat duration
    const newBeatsCount = 3;
    barElement.changeBarBeats(newBeatsCount, prevBar);

    // Test
    expect(barElement.timeSigRect).toStrictEqual(expectedSigRect);
    expect(barElement.tempoRect).toStrictEqual(expectedTempoRect);
    expect(barElement.rect).toStrictEqual(expectedRect);
    for (let i = 0; i < guitar.stringsCount; i++) {
      expect(barElement.lines[i][0]).toStrictEqual(expectedLines[i][0]);
      expect(barElement.lines[i][1]).toStrictEqual(expectedLines[i][1]);
    }
    expect(barElement.bar.beatsCount).toBe(newBeatsCount);
    expect(barElement.showSignature).toBe(true);
  });

  test("Change bar beats test: show -> no show", () => {
    const prevBar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Sixteenth),
    ]);
    const bar = new Bar(guitar, 120, 3, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Sixteenth),
    ]);
    const barCoords = new Point(0, 0);
    const barElement = new BarElement(dim, barCoords, bar, true, true);

    // Calc expected rect
    const expectedSigRect = new Rect(
      barCoords.x,
      barCoords.y +
        dim.tempoRectHeight +
        dim.durationsHeight +
        dim.noteRectHeight / 2,
      0,
      dim.timeSigRectHeight
    );
    const expectedTempoRect = new Rect(
      barCoords.x,
      barCoords.y,
      dim.tempoRectWidth,
      dim.durationsHeight
    );
    const expectedRect = new Rect(
      barElement.rect.x,
      barElement.rect.y,
      barElement.rect.width - dim.timeSigRectWidth,
      barElement.rect.height
    );
    let expectedLines = new Array<Array<Point>>();
    for (let i = 0; i < guitar.stringsCount; i++) {
      expectedLines.push([
        new Point(barElement.lines[i][0].x, barElement.lines[i][0].y),
        new Point(
          barElement.lines[i][1].x - dim.timeSigRectWidth,
          barElement.lines[i][1].y
        ),
      ]);
    }

    // Change beat duration
    const newBeatsCount = 4;
    barElement.changeBarBeats(newBeatsCount, prevBar);

    // Test
    expect(barElement.timeSigRect).toStrictEqual(expectedSigRect);
    expect(barElement.tempoRect).toStrictEqual(expectedTempoRect);
    expect(barElement.rect).toStrictEqual(expectedRect);
    for (let i = 0; i < guitar.stringsCount; i++) {
      expect(barElement.lines[i][0]).toStrictEqual(expectedLines[i][0]);
      expect(barElement.lines[i][1]).toStrictEqual(expectedLines[i][1]);
    }
    expect(barElement.bar.beatsCount).toBe(newBeatsCount);
    expect(barElement.showSignature).toBe(false);
  });

  test("Change bar duration test: no show -> show", () => {
    const prevBar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Sixteenth),
    ]);
    const bar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Sixteenth),
    ]);
    const barCoords = new Point(0, 0);
    const barElement = new BarElement(dim, barCoords, bar, false, true);

    // Calc expected rect
    const expectedSigRect = new Rect(
      barCoords.x,
      barCoords.y +
        dim.tempoRectHeight +
        dim.durationsHeight +
        dim.noteRectHeight / 2,
      dim.timeSigRectWidth,
      dim.timeSigRectHeight
    );
    const expectedTempoRect = new Rect(
      barCoords.x,
      barCoords.y,
      dim.tempoRectWidth,
      dim.durationsHeight
    );
    const expectedRect = new Rect(
      barElement.rect.x,
      barElement.rect.y,
      barElement.rect.width + dim.timeSigRectWidth,
      barElement.rect.height
    );
    let expectedLines = new Array<Array<Point>>();
    for (let i = 0; i < guitar.stringsCount; i++) {
      expectedLines.push([
        new Point(barElement.lines[i][0].x, barElement.lines[i][0].y),
        new Point(
          barElement.lines[i][1].x + dim.timeSigRectWidth,
          barElement.lines[i][1].y
        ),
      ]);
    }

    // Change beat duration
    const newDuration = NoteDuration.Eighth;
    barElement.changeBarDuration(newDuration, prevBar);

    // Test
    expect(barElement.timeSigRect).toStrictEqual(expectedSigRect);
    expect(barElement.tempoRect).toStrictEqual(expectedTempoRect);
    expect(barElement.rect).toStrictEqual(expectedRect);
    for (let i = 0; i < guitar.stringsCount; i++) {
      expect(barElement.lines[i][0]).toStrictEqual(expectedLines[i][0]);
      expect(barElement.lines[i][1]).toStrictEqual(expectedLines[i][1]);
    }
    expect(barElement.bar.duration).toBe(newDuration);
    expect(barElement.showSignature).toBe(true);
  });

  test("Change bar duration test: show -> no show", () => {
    const prevBar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Sixteenth),
    ]);
    const bar = new Bar(guitar, 120, 4, NoteDuration.Eighth, [
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Sixteenth),
    ]);
    const barCoords = new Point(0, 0);
    const barElement = new BarElement(dim, barCoords, bar, true, true);

    // Calc expected rect
    const expectedSigRect = new Rect(
      barCoords.x,
      barCoords.y +
        dim.tempoRectHeight +
        dim.durationsHeight +
        dim.noteRectHeight / 2,
      0,
      dim.timeSigRectHeight
    );
    const expectedTempoRect = new Rect(
      barCoords.x,
      barCoords.y,
      dim.tempoRectWidth,
      dim.durationsHeight
    );
    const expectedRect = new Rect(
      barElement.rect.x,
      barElement.rect.y,
      barElement.rect.width - dim.timeSigRectWidth,
      barElement.rect.height
    );
    let expectedLines = new Array<Array<Point>>();
    for (let i = 0; i < guitar.stringsCount; i++) {
      expectedLines.push([
        new Point(barElement.lines[i][0].x, barElement.lines[i][0].y),
        new Point(
          barElement.lines[i][1].x - dim.timeSigRectWidth,
          barElement.lines[i][1].y
        ),
      ]);
    }

    // Change beat duration
    const newDuration = NoteDuration.Quarter;
    barElement.changeBarDuration(newDuration, prevBar);

    // Test
    expect(barElement.timeSigRect).toStrictEqual(expectedSigRect);
    expect(barElement.tempoRect).toStrictEqual(expectedTempoRect);
    expect(barElement.rect).toStrictEqual(expectedRect);
    for (let i = 0; i < guitar.stringsCount; i++) {
      expect(barElement.lines[i][0]).toStrictEqual(expectedLines[i][0]);
      expect(barElement.lines[i][1]).toStrictEqual(expectedLines[i][1]);
    }
    expect(barElement.bar.duration).toBe(newDuration);
    expect(barElement.showSignature).toBe(false);
  });

  test("Change bar tempo test", () => {
    const prevBar = new Bar(guitar, 120, 4, NoteDuration.Quarter, [
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Sixteenth),
    ]);
    const bar = new Bar(guitar, 120, 4, NoteDuration.Eighth, [
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Sixteenth),
      new Beat(guitar, NoteDuration.Quarter),
      new Beat(guitar, NoteDuration.Sixteenth),
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
