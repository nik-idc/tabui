import { Bar } from "../src/models/bar";
import { Chord } from "../src/models/chord";
import { Guitar } from "../src/models/guitar";
import { Note } from "../src/models/note";
import { NoteDuration } from "../src/models/note-duration";
import { Tab } from "../src/models/tab";
import { TabWindow } from "../src/tab-window/tab-window";
import { TabWindowDim } from "../src/tab-window/tab-window-dim";

import * as fs from "fs";

function prepareTabWindow(): TabWindow {
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

  const width = 1200;
  const noteTextSize = 12;
  const durationsHeight = 50;
  const dim = new TabWindowDim(
    width,
    noteTextSize,
    durationsHeight,
    guitar.stringsCount
  );

  const tabWindow = new TabWindow(tab, dim);

  tabWindow.calc();

  const tabLineElement = tabWindow.tabLineElements[0];
  const barElement = tabLineElement.barElements[1];
  const chordElement = barElement.chordElements[2];
  const noteElement = chordElement.noteElements[3];
  tabWindow.selectNoteElement(
    noteElement,
    chordElement,
    barElement,
    tabLineElement
  );
  return tabWindow;
}

function render(tabWindow: TabWindow): string {
  const html = new Array<string>();
  for (const tabLineElement of tabWindow.tabLineElements) {
    html.push(
      `<svg viewBox="0 0 ${tabWindow.dim.width} ${tabWindow.dim.tabLineHeight}">`
    );
    html.push("<g>");

    html.push(`<path d="${tabWindow.linesPath}" stroke="black" />`);

    for (const barElement of tabLineElement.barElements) {
      html.push(`<rect x="${barElement.rect.x}"
                       y="${barElement.rect.y}"
                       width="${barElement.rect.width}"
                       height="${barElement.rect.height}"
                       fill-opacity="0"
                       stroke="purple" />`);

      if (barElement.showSignature) {
        html.push(`<g>
                     <rect x="${barElement.beatsRect.x}"
                           y="${barElement.beatsRect.y}"
                           width="${barElement.beatsRect.width}"
                           height="${barElement.beatsRect.height}"
                           fill-opacity="0"
                           stroke="blue" />
                     <text x="${barElement.beatsTextCoords.x}"
                           y="${barElement.beatsTextCoords.y}"
                           text-anchor="middle"
                     >
                       ${barElement.bar.beats}
                     </text>
           
                     <rect x="${barElement.measureRect.x}"
                           y="${barElement.measureRect.y}"
                           width="${barElement.measureRect.width}"
                           height="${barElement.measureRect.height}"
                           fill-opacity="0"
                           stroke="blue" />
                     <text x="${barElement.measureTextCoords.x}"
                           y="${barElement.measureTextCoords.y}"
                           text-anchor="middle"
                     >
                       ${1 / barElement.bar.duration}
                     </text>
                   </g>`);
      }

      if (barElement.showTempo) {
        html.push(`<rect x="${barElement.tempoRect.x}"
                           y="${barElement.tempoRect.y}"
                           width="${barElement.tempoRect.width}"
                           height="${barElement.tempoRect.height}"
                           fill-opacity="0"
                           stroke="brown" />
                   <text x="${barElement.tempoTextCoords.x}"
                         y="${barElement.tempoTextCoords.y}"
                         text-anchor="middle"
                         >
                     ${barElement.bar.tempo}
                   </text>`);
      }

      for (const chordElement of barElement.chordElements) {
        html.push(`
          <rect x="${chordElement.durationRect.x}"
                y="${chordElement.durationRect.y}"
                width="${chordElement.durationRect.width}"
                height="${chordElement.durationRect.height}"
                fill-opacity="0"
                stroke="green" />`);

        for (const noteElement of chordElement.noteElements) {
          html.push(`<rect x="${noteElement.rect.x}"
                           y="${noteElement.rect.y}"
                           width="${noteElement.rect.width}"
                           height="${noteElement.rect.height}"
                           fill-opacity="0"
                           stroke="red" />`);

          if (
            tabWindow.selectedElement &&
            noteElement === tabWindow.selectedElement.noteElement
          ) {
            html.push("<g>");

            html.push(`<text x="${noteElement.textRect.x}"
                             y="${noteElement.textRect.y}"
                             stroke="orange"
                             text-anchor="middle">
                         S: ${
                           noteElement.note.fret ? noteElement.note.fret : ""
                         }
                       </text>`);

            html.push("</g>");
          } else {
            html.push(`<text x="${noteElement.textRect.x}"
                             y="${noteElement.textRect.y}"
                             text-anchor="middle">
                         NS: ${
                           noteElement.note.fret ? noteElement.note.fret : ""
                         }
                       </text>`);
          }
        }
      }
    }

    html.push("</g>");
    html.push("</svg>");
  }

  return html.join("");
}

function saveHTML(html: string): void {
  fs.writeFileSync("./test-render/index.html", html);
}

function main(): void {
  const tabWindow = prepareTabWindow();
  const html = render(tabWindow);
  saveHTML(html);
}

main();
