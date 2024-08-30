import { Bar } from "../src/models/bar";
import { Chord } from "../src/models/chord";
import { Guitar } from "../src/models/guitar";
import { Note } from "../src/models/note";
import { NoteDuration } from "../src/models/note-duration";
import { Tab } from "../src/models/tab";
import { TabWindow } from "../src/tab-window/tab-window";
import { TabWindowDim } from "../src/tab-window/tab-window-dim";

import * as fs from "fs";

import { testData } from "./test-cases";

function render(
  tabWindows: TabWindow[],
  calcSpeed: number | undefined,
  detailed: boolean | undefined = false
): string {
  const html = new Array<string>();

  if (calcSpeed) {
    html.push(`<div>Test case 4 calc speed: ${calcSpeed}ms</div>`);
  }

  for (const tabWindow of tabWindows) {
    html.push("<div>");
    html.push(`Test case ${tabWindows.indexOf(tabWindow) + 1}`);
    html.push("<div>");
    const tabWindowHeight =
      tabWindow.dim.tabLineHeight * tabWindow.barElementLines.length;
    html.push(`<svg viewBox="0 0 ${tabWindow.dim.width} ${tabWindowHeight}"
                    width="${tabWindow.dim.width}"
                    height="${tabWindowHeight}">`);
    // html.push(`<path d="${tabWindow.linesPath}" stroke="black" />`);
    for (const barElementLine of tabWindow.barElementLines) {
      html.push("<g>");

      for (const barElement of barElementLine) {
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
            if (detailed) {
              html.push(`<rect x="${barElement.timeSigRect.x}"
                               y="${barElement.timeSigRect.y}"
                               width="${barElement.timeSigRect.width}"
                               height="${barElement.timeSigRect.height}"
                               fill="purple"
                               fill-opacity="0.25"
                               stroke="black"
                               stroke-opacity="1" />`);
            }
            html.push(`<g>
                       <text x="${barElement.beatsTextCoords.x}"
                             y="${barElement.beatsTextCoords.y}"
                             text-anchor="middle"
                             font-size="${tabWindow.dim.timeSigTextSize}">
                         ${barElement.bar.beats}
                       </text>
             
                       <text x="${barElement.measureTextCoords.x}"
                             y="${barElement.measureTextCoords.y}"
                             text-anchor="middle"
                             font-size="${tabWindow.dim.timeSigTextSize}">
                         ${1 / barElement.bar.duration}
                       </text>
                     </g>`);
          }

          if (barElement.showTempo) {
            if (detailed) {
              html.push(`<rect x="${barElement.tempoRect.x}"
                               y="${barElement.tempoRect.y}"
                               width="${barElement.tempoRect.width}"
                               height="${barElement.tempoRect.height}"
                               fill="green"
                               fill-opacity="0.25"
                               stroke="black"
                               stroke-opacity="1" />`);
            }

            html.push(`<image x="${barElement.tempoImageRect.x}"
                              y="${barElement.tempoImageRect.y}"
                              width="${barElement.tempoImageRect.width}"
                              height="${barElement.tempoImageRect.height}"
                              href="./assets/img/notes/4.svg" />`);
            html.push(`<text x="${barElement.tempoTextCoords.x}"
                             y="${barElement.tempoTextCoords.y}"
                             text-anchor="start"
                             font-size="${tabWindow.dim.tempoTextSize}">
                       = ${barElement.bar.tempo}
                     </text>`);
          }
        }

        for (const chordElement of barElement.chordElements) {
          if (detailed) {
            const color = chordElement.inSelection ? "blue" : "red";
            html.push(`<rect x="${chordElement.rect.x}"
                             y="${chordElement.rect.y}"
                             width="${chordElement.rect.width}"
                             height="${chordElement.rect.height}"
                             fill="${color}"
                             fill-opacity="0.25"
                             stroke="black"
                             stroke-opacity="1" />`);
          }
          // else {
          //   if (chordElement.inSelection) {
          //     html.push(`<rect x="${chordElement.rect.x}"
          //                      y="${chordElement.rect.y}"
          //                      width="${chordElement.rect.width}"
          //                      height="${chordElement.rect.height}"
          //                      fill="blue"
          //                      fill-opacity="0.25" />`);
          //   }
          // }

          html.push(`<image x="${chordElement.durationRect.x}"
                            y="${chordElement.durationRect.y}"
                            width="${chordElement.durationRect.width}"
                            height="${chordElement.durationRect.height}"
                            href="./assets/img/notes/${
                              1 / chordElement.chord.duration
                            }.svg" />`);

          for (const noteElement of chordElement.noteElements) {
            if (detailed) {
              html.push(`<rect x="${noteElement.rect.x}"
                               y="${noteElement.rect.y}"
                               width="${noteElement.rect.width}"
                               height="${noteElement.rect.height}"
                               fill="orange"
                               fill-opacity="0.25"
                               stroke="blue"
                               stroke-opacity="1" />`);
            }

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
          
          if (!detailed && chordElement.inSelection) {
            html.push(`<rect x="${chordElement.rect.x}"
                             y="${chordElement.rect.y}"
                             width="${chordElement.rect.width}"
                             height="${chordElement.rect.height}"
                             fill="blue"
                             fill-opacity="0.25" />`);
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

function saveHTML(fileName: string, html: string): void {
  fs.writeFileSync(`./test-render/${fileName}`, html);
}

function main(): void {
  const htmlNormal = render(testData.tabWindows, testData.calcSpeed, false);
  saveHTML("index.html", htmlNormal);

  const htmlDetailed = render(testData.tabWindows, testData.calcSpeed, true);
  saveHTML("index-detailed.html", htmlDetailed);
}

main();
