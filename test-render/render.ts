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
  const minNoteSize = 12;
  const gap = 2;
  const durationsHeight = 50;
  const dim = new TabWindowDim(
    width,
    minNoteSize,
    gap,
    durationsHeight,
    guitar.stringsCount
  );

  const tabWindow = new TabWindow(tab, dim);

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
                           fill-opacity = "0"
                           stroke = "black" />`);

      if (barElement.showSignature) {
        html.push(`<g>
                     <text x = "${barElement.timeSigRect.x}"
                           y = "${barElement.timeSigRect.x}"
                           width = "${barElement.timeSigRect.width}"
                           height = "${barElement.timeSigRect.height}"
                     >
                       ${barElement.bar.beats}
                     </text>
           
                     <text x = "${barElement.timeSigRect.x}"
                           y = "${
                             barElement.timeSigRect.y +
                             barElement.timeSigRect.height / 2
                           }"
                           width = "${barElement.timeSigRect.width}"
                           height = "${barElement.timeSigRect.height}"
                     >
                       ${1 / barElement.bar.duration}
                     </text>
                   </g>`);
      }

      if (barElement.showTempo) {
        html.push(`<text x = "${barElement.tempoRect.x}"
                         y = "${barElement.tempoRect.y}"
                         >
                     Tempo: ${barElement.bar.tempo}
                   </text>`);
      }

      for (const chordElement of barElement.chordElements) {
        html.push(`
          <rect x = "${chordElement.durationRect.x}"
                y = "${chordElement.durationRect.y}"
                width = "${chordElement.durationRect.width}"
                height = "${chordElement.durationRect.height}"
                fill-opacity = "0"
                stroke = "black" />`);

        for (const noteElement of chordElement.noteElements) {
          html.push(`<rect x = "${noteElement.rect.x}"
                           y = "${noteElement.rect.y}"
                           width = "${noteElement.rect.width}"
                           height = "${noteElement.rect.height}"
                           fill-opacity = "0"
                           stroke = "black" />`);

          if (tabWindow.selectedElement) {
            html.push("<g>");

            if (noteElement === tabWindow.selectedElement.noteElement) {
              html.push(`<text x = "${noteElement.textCoords.x}"
                               y = "${noteElement.textCoords.y}">
                           S: ${noteElement.note.fret}
                         </text>`);
            } else {
              html.push(`<text x = "${noteElement.textCoords.x}"
                               y = "${noteElement.textCoords.y}">
                           NS: ${noteElement.note.fret}
                         </text>`);
            }

            html.push("</g>");
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
