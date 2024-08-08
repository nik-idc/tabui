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

let tabWindow: TabWindow;

describe("Tab window tests", () => {
  test("Tab window calc test: calc SVG path", () => {
    tabWindow = new TabWindow(tab, dim);

    // Prepare expected SVG path
    const expectedSVGPath =
      `M0,${dim.durationsHeight + dim.noteRectHeight / 2}v${
        dim.timeSigRectHeight
      }` +
      `M1200,${dim.durationsHeight + dim.noteRectHeight / 2}v${
        dim.timeSigRectHeight
      }` +
      `M0,${
        dim.durationsHeight + dim.noteRectHeight * 0 + dim.noteRectHeight / 2
      }H1200` +
      `M0,${
        dim.durationsHeight + dim.noteRectHeight * 1 + dim.noteRectHeight / 2
      }H1200` +
      `M0,${
        dim.durationsHeight + dim.noteRectHeight * 2 + dim.noteRectHeight / 2
      }H1200` +
      `M0,${
        dim.durationsHeight + dim.noteRectHeight * 3 + dim.noteRectHeight / 2
      }H1200` +
      `M0,${
        dim.durationsHeight + dim.noteRectHeight * 4 + dim.noteRectHeight / 2
      }H1200` +
      `M0,${
        dim.durationsHeight + dim.noteRectHeight * 5 + dim.noteRectHeight / 2
      }H1200` +
      `M0,${dim.tabLineHeight + dim.durationsHeight + dim.noteRectHeight / 2}v${
        dim.timeSigRectHeight
      }` +
      `M1200,${
        dim.tabLineHeight + dim.durationsHeight + dim.noteRectHeight / 2
      }v${dim.timeSigRectHeight}` +
      `M0,${
        dim.tabLineHeight +
        dim.durationsHeight +
        dim.noteRectHeight * 0 +
        dim.noteRectHeight / 2
      }H1200` +
      `M0,${
        dim.tabLineHeight +
        dim.durationsHeight +
        dim.noteRectHeight * 1 +
        dim.noteRectHeight / 2
      }H1200` +
      `M0,${
        dim.tabLineHeight +
        dim.durationsHeight +
        dim.noteRectHeight * 2 +
        dim.noteRectHeight / 2
      }H1200` +
      `M0,${
        dim.tabLineHeight +
        dim.durationsHeight +
        dim.noteRectHeight * 3 +
        dim.noteRectHeight / 2
      }H1200` +
      `M0,${
        dim.tabLineHeight +
        dim.durationsHeight +
        dim.noteRectHeight * 4 +
        dim.noteRectHeight / 2
      }H1200` +
      `M0,${
        dim.tabLineHeight +
        dim.durationsHeight +
        dim.noteRectHeight * 5 +
        dim.noteRectHeight / 2
      }H1200`;

    // Calc
    tabWindow.calc();

    // Test
    expect(tabWindow.linesPath).toBe(expectedSVGPath);
  });
});
