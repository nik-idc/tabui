import { Bar } from "../src/models/bar";
import { Chord } from "../src/models/chord";
import { Guitar } from "../src/models/guitar";
import { Note } from "../src/models/note";
import { NoteDuration } from "../src/models/note-duration";
import { Tab } from "../src/models/tab";
import { TabWindow } from "../src/tab-window/tab-window";
import { TabWindowDim } from "../src/tab-window/tab-window-dim";

import * as fs from "fs";

let calcSpeed: number | undefined = undefined;

const width = 1200;
const noteTextSize = 12;
const infoTextSize = 36;
const durationsHeight = 50;

function randomFrets(tab: Tab, allStrings: boolean = false): void {
  for (const bar of tab.bars) {
    for (const chord of bar.chords) {
      for (const note of chord.notes) {
        if (allStrings) {
          note.fret = Math.floor(Math.random() * 24);
        } else {
          note.fret =
            Math.random() <= 0.2 ? Math.floor(Math.random() * 24) : undefined;
        }
      }
    }
  }
}

function selectNote(
  tabWindow: TabWindow,
  tabLineId: number,
  barElementId: number,
  chordElementId: number,
  stringNum: number
): void {
  // const tabLineElement = tabWindow.tabLineElements[tabLineId];
  // const barElement = tabLineElement.barElements[barElementId];
  // const chordElement = barElement.chordElements[chordElementId];
  // const noteElement = chordElement.noteElements[stringNum - 1];
  tabWindow.selectNoteElement(
    tabLineId,
    barElementId,
    chordElementId,
    stringNum - 1
  );
}

function prepareTestCase1(): TabWindow {
  const stringsCount = 6;
  const tuning = [Note.E, Note.A, Note.D, Note.G, Note.B, Note.E];
  const fretsCount = 24;
  const guitar = new Guitar(stringsCount, tuning, fretsCount);

  const bars = [
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
    new Bar(guitar, 120, 3, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 180, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
  ];

  const tab = new Tab(1, "test", "Unknown", "Unknown", guitar, bars, true);

  const dim = new TabWindowDim(
    width,
    noteTextSize,
    infoTextSize,
    durationsHeight,
    guitar.stringsCount
  );
  const tabWindow = new TabWindow(tab, dim);
  tabWindow.calc();
  selectNote(tabWindow, 0, 3, 3, 4);
  tabWindow.moveSelectedNoteRight();
  tabWindow.moveSelectedNoteRight();
  tabWindow.moveSelectedNoteRight();
  tabWindow.moveSelectedNoteRight();
  tabWindow.moveSelectedNoteRight();
  tabWindow.moveSelectedNoteRight();

  randomFrets(tab, true);

  tabWindow.moveSelectedNoteLeft();
  tabWindow.moveSelectedNoteLeft();

  return tabWindow;
}

function prepareTestCase2(): TabWindow {
  const stringsCount = 6;
  const tuning = [Note.E, Note.A, Note.D, Note.G, Note.B, Note.E];
  const fretsCount = 24;
  const guitar = new Guitar(stringsCount, tuning, fretsCount);
  const bars = [];
  const tab = new Tab(1, "test", "Unknown", "Unknown", guitar, bars, true);

  const dim = new TabWindowDim(
    width,
    noteTextSize,
    infoTextSize,
    durationsHeight,
    guitar.stringsCount
  );
  const tabWindow = new TabWindow(tab, dim);

  tabWindow.calc();
  return tabWindow;
}

function prepareTestCase3(): TabWindow {
  const stringsCount = 6;
  const tuning = [Note.E, Note.A, Note.D, Note.G, Note.B, Note.E];
  const fretsCount = 24;
  const guitar = new Guitar(stringsCount, tuning, fretsCount);
  const bars = [
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
    new Bar(guitar, 120, 3, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 180, 4, NoteDuration.Quarter, [
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
    new Bar(guitar, 120, 3, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 130, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 180, 5, NoteDuration.Quarter, [
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
    new Bar(guitar, 120, 3, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 180, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
    new Bar(guitar, 180, 4, NoteDuration.Quarter, [
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
      new Chord(guitar, NoteDuration.Quarter),
    ]),
  ];
  const tab = new Tab(1, "test", "Unknown", "Unknown", guitar, bars, true);
  randomFrets(tab);

  const dim = new TabWindowDim(
    width,
    noteTextSize,
    infoTextSize,
    durationsHeight,
    guitar.stringsCount
  );
  const tabWindow = new TabWindow(tab, dim);
  tabWindow.calc();
  selectNote(tabWindow, 0, 1, 2, 4);
  return tabWindow;
}

function prepareTestCase4(): TabWindow {
  const stringsCount = 7;
  const tuning = [Note.A, Note.E, Note.A, Note.D, Note.G, Note.B, Note.E];
  const fretsCount = 24;
  const guitar = new Guitar(stringsCount, tuning, fretsCount);
  let bars = new Array<Bar>();
  for (let i = 0; i < 300; i++) {
    bars.push(
      new Bar(guitar, 120, 4, NoteDuration.Quarter, [
        new Chord(guitar, NoteDuration.Quarter),
        new Chord(guitar, NoteDuration.Quarter),
        new Chord(guitar, NoteDuration.Quarter),
        new Chord(guitar, NoteDuration.Quarter),
      ])
    );
  }
  const tab = new Tab(1, "test", "Unknown", "Unknown", guitar, bars, true);
  randomFrets(tab);

  const dim = new TabWindowDim(
    width,
    noteTextSize,
    infoTextSize,
    durationsHeight,
    guitar.stringsCount
  );
  const tabWindow = new TabWindow(tab, dim);

  const before = performance.now();
  tabWindow.calc();
  const after = performance.now();
  calcSpeed = after - before;

  selectNote(tabWindow, 0, 1, 2, 4);
  return tabWindow;
}

function render(tabWindows: TabWindow[]): string {
  const html = new Array<string>();

  if (calcSpeed) {
    html.push(`<div>Test case 4 calc speed: ${calcSpeed}ms</div>`);
  }

  for (const tabWindow of tabWindows) {
    html.push("<div>");
    html.push(`Test case ${tabWindows.indexOf(tabWindow) + 1}`);
    html.push("<div>");
    const tabWindowHeight =
      tabWindow.dim.tabLineHeight * tabWindow.tabLineElements.length;
    html.push(`<svg viewBox="0 0 ${tabWindow.dim.width} ${tabWindowHeight}"
                    width="${tabWindow.dim.width}"
                    height="${tabWindowHeight}">`);
    // html.push(`<path d="${tabWindow.linesPath}" stroke="black" />`);
    for (const tabLineElement of tabWindow.tabLineElements) {
      html.push("<g>");

      for (const barElement of tabLineElement.barElements) {
        html.push(`<line x1="${barElement.barLeftBorderLine[0].x}"
                y1="${barElement.barLeftBorderLine[0].y}"
                x2="${barElement.barLeftBorderLine[1].x}"
                y2="${barElement.barLeftBorderLine[1].y}"
                stroke="black" />`);

        const strokeColor = !barElement.durationsFit() ? "red" : "black";
        for (const line of barElement.lines) {
          html.push(`<line x1="${line[0].x}"
                          y1="${line[0].y}"
                          x2="${line[1].x}"
                          y2="${line[1].y}"
                          stroke="${strokeColor}" />`);

          if (barElement.showSignature) {
            html.push(`<g>
                       <text x="${barElement.beatsTextCoords.x}"
                             y="${barElement.beatsTextCoords.y}"
                             text-anchor="middle"
                             font-size="${tabWindow.dim.infoTextSize}"
                       >
                         ${barElement.bar.beats}
                       </text>
             
                       <text x="${barElement.measureTextCoords.x}"
                             y="${barElement.measureTextCoords.y}"
                             text-anchor="middle"
                             font-size="${tabWindow.dim.infoTextSize}"
                       >
                         ${1 / barElement.bar.duration}
                       </text>
                     </g>`);
          }

          if (barElement.showTempo) {
            html.push(`<text x="${barElement.tempoTextCoords.x}"
                           y="${barElement.tempoTextCoords.y}"
                           text-anchor="middle"
                           >
                       ${barElement.bar.tempo}
                     </text>`);
          }
        }

        for (const chordElement of barElement.chordElements) {
          html.push(`<image x="${chordElement.durationRect.x}"
                            y="${chordElement.durationRect.y}"
                            width="${chordElement.durationRect.width}"
                            height="${chordElement.durationRect.height}"
                            href="./assets/img/notes/${
                              1 / chordElement.chord.duration
                            }.svg" />`);

          for (const noteElement of chordElement.noteElements) {
            if (noteElement.note.fret) {
              html.push("<g>");
              html.push(`<rect x="${noteElement.textRect.x}"
                               y="${noteElement.textRect.y}"
                               width="${noteElement.textRect.width}"
                               height="${noteElement.textRect.height}"
                               fill="white"
                               stroke-opacity="0" />`);
              if (
                tabWindow.selectedElement &&
                noteElement === tabWindow.selectedElement.noteElement
              ) {
                html.push(`<text x="${noteElement.textCoords.x}"
                                 y="${noteElement.textCoords.y}"
                                 font-size="${tabWindow.dim.noteTextSize}px"
                                 text-anchor="middle"
                                 dominant-baseline="middle"
                                 stroke="orange">
                             ${noteElement.note.fret}
                           </text>`);
              } else {
                html.push(`<text x="${noteElement.textCoords.x}"
                                 y="${noteElement.textCoords.y}"
                                 font-size="${tabWindow.dim.noteTextSize}px"
                                 text-anchor="middle"
                                 dominant-baseline="middle">
                              ${noteElement.note.fret}
                           </text>`);
              }
              html.push("</g>");
            }
          }
        }

        html.push(`<line x1="${barElement.barRightBorderLine[0].x}"
                         y1="${barElement.barRightBorderLine[0].y}"
                         x2="${barElement.barRightBorderLine[1].x}"
                         y2="${barElement.barRightBorderLine[1].y}"
                         stroke="black" />`);
      }

      html.push("</g>");
    }
    html.push("</svg>");
    html.push("</div>");
    html.push("</div>");
  }

  return html.join("");
}

function saveHTML(html: string): void {
  fs.writeFileSync("./test-render/index.html", html);
}

function main(): void {
  const tabWindows = [
    prepareTestCase1(),
    prepareTestCase2(),
    prepareTestCase3(),
    prepareTestCase4(),
  ];
  const html = render(tabWindows);
  saveHTML(html);
}

main();
