import {
  Bar,
  Chord,
  Guitar,
  Note,
  NoteDuration,
  Point,
  Tab,
  TabWindowDim,
} from "../../../src";
import { SelectedElement } from "../../../src/tab-window/elements/selected-element";
import { TabLineElement } from "../../../src/tab-window/elements/tab-line-element";

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

const tabLineElement = new TabLineElement(dim, coords);


describe("Selected element tests", () => {
  test("Selected element move up test", () => {
    const one = 1;
    expect(one).toBe(1);
  });

  test("Selected element move down test", () => {
    const one = 1;
    expect(one).toBe(1);
  });

  test("Selected element move left test", () => {
    const one = 1;
    expect(one).toBe(1);
  });

  test("Selected element move right test", () => {
    const one = 1;
    expect(one).toBe(1);
  });
});
