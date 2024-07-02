import {
  Bar,
  Chord,
  Guitar,
  Note,
  NoteDuration,
  Point,
  Tab,
  TabWindowDim,
} from "../../src";
import { TabWindow } from "../../src";

const stringsCount = 6;
const fretsCount = 24;
const guitar = new Guitar(
  stringsCount,
  [Note.E, Note.B, Note.G, Note.D, Note.A, Note.E],
  fretsCount
);
const tabId = 1;
const tabName = "Random";
const tabArtist = "Me";
const tabSong = "Song";
const tab = new Tab(tabId, tabName, tabArtist, tabSong, guitar, [
  new Bar(guitar, 120, 4, NoteDuration.Quarter, [
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
  ]),
  new Bar(guitar, 120, 4, NoteDuration.Quarter, [
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
  ]),
  new Bar(guitar, 120, 4, NoteDuration.Quarter, [
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
  ]),
  new Bar(guitar, 120, 4, NoteDuration.Quarter, [
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
  ]),
  new Bar(guitar, 120, 4, NoteDuration.Quarter, [
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
  ]),
  new Bar(guitar, 120, 4, NoteDuration.Quarter, [
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
    new Chord(guitar, NoteDuration.Quarter),
  ]),
]);

const coords = new Point(0, 0);

const width = 1200;
const minNoteSize = 12;
const gap = 10;
const durationsHeight = 50;
const dim = new TabWindowDim(
  width,
  minNoteSize,
  gap,
  durationsHeight,
  stringsCount
);

let tabWindow: TabWindow;

describe("Tab window tests", () => {
  test("Tab window calc test: calc SVG path", () => {
    tabWindow = new TabWindow(tab, dim);

    // Prepare expected SVG path
    const expectedSVGPath =
      "M0,50H1200" +
      "M0,62H1200" +
      "M0,74H1200" +
      "M0,86H1200" +
      "M0,98H1200" +
      "M0,110H1200" +
      `M0,${dim.lineHeight + dim.durationsHeight + 12 * 0}H1200` +
      `M0,${dim.lineHeight + dim.durationsHeight + 12 * 1}H1200` +
      `M0,${dim.lineHeight + dim.durationsHeight + 12 * 2}H1200` +
      `M0,${dim.lineHeight + dim.durationsHeight + 12 * 3}H1200` +
      `M0,${dim.lineHeight + dim.durationsHeight + 12 * 4}H1200` +
      `M0,${dim.lineHeight + dim.durationsHeight + 12 * 5}H1200`;

    // Calc
    tabWindow.calc();

    // Test
    expect(tabWindow.linesPath).toBe(expectedSVGPath);
  });

  // TODO: Figure out how to test this!!
  test("Tab window calc test: calc elements", () => {
    tabWindow = new TabWindow(tab, dim);

    // Calc
    tabWindow.calc();

    // Placeholder test
    expect(1).toBe(1);
  });
});
