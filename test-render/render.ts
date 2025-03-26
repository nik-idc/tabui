import { Bar } from "../src/models/bar";
import { Beat } from "../src/models/beat";
import { Guitar } from "../src/models/guitar";
import { Note } from "../src/models/note";
import { NoteDuration } from "../src/models/note-duration";
import { Tab } from "../src/models/tab";
import { TabWindow } from "../src/tab-window/tab-window";
import { TabWindowDim } from "../src/tab-window/tab-window-dim";

import * as fs from "fs";

import { testData, TestCase } from "./test-cases";
import { Point } from "../src/tab-window/shapes/point";
import { TabLineElement } from "../src/tab-window/elements/tab-line-element";
import { BarElement } from "../src/tab-window/elements/bar-element";
import { BeatElement } from "../src/tab-window/elements/beat-element";
import { NoteElement } from "../src/tab-window/elements/note-element";

export class TestRenderer {
  readonly testCases: TestCase[];
  private _detailed: boolean = false;

  constructor(testCases: TestCase[]) {
    this.testCases = testCases;
  }

  private renderNoteElement(
    tabWindow: TabWindow,
    tleOffset: Point,
    noteElement: NoteElement
  ): string {
    const html: string[] = [];

    if (this._detailed) {
      html.push(`<rect x="${tleOffset.x + noteElement.rect.x}"
                       y="${tleOffset.y + noteElement.rect.y}"
                       width="${noteElement.rect.width}"
                       height="${noteElement.rect.height}"
                       fill="orange"
                       fill-opacity="0.25"
                       stroke="blue"
                       stroke-opacity="1" />`);
    }

    for (const effectElement of noteElement.guitarEffectElements) {
      if (effectElement.rect !== undefined) {
        html.push(`<rect x="${tleOffset.x + effectElement.rect.x}"
                         y="${tleOffset.y + effectElement.rect.y}"
                         width="${effectElement.rect.width}"
                         height="${effectElement.rect.height}"
                         fill="white"
                         stroke-opacity="0" />`);
      }
      if (effectElement.fullHTML !== undefined) {
        html.push(effectElement.fullHTML);
      }
    }

    if (noteElement.note.fret !== undefined) {
      html.push("<g>");
      html.push(`<rect x="${tleOffset.x + noteElement.textRect.x}"
                       y="${tleOffset.y + noteElement.textRect.y}"
                       width="${noteElement.textRect.width}"
                       height="${noteElement.textRect.height}"
                       fill="white"
                       fill-opacity="1" />`);
      if (
        tabWindow.selectedElement &&
        tabWindow.isNoteElementSelected(noteElement)
      ) {
        html.push(`<text x="${tleOffset.x + noteElement.textCoords.x}"
                         y="${tleOffset.y + noteElement.textCoords.y}"
                         font-size="${tabWindow.dim.noteTextSize}px"
                         text-anchor="middle"
                         dominant-baseline="middle"
                         stroke="orange">
                           ${noteElement.note.fret}
                   </text>`);
      } else {
        html.push(`<text x="${tleOffset.x + noteElement.textCoords.x}"
                         y="${tleOffset.y + noteElement.textCoords.y}"
                         font-size="${tabWindow.dim.noteTextSize}px"
                         text-anchor="middle"
                         dominant-baseline="middle">
                           ${noteElement.note.fret}
                   </text>`);
      }
      html.push("</g>");
    }

    return html.join("");
  }

  private renderBeatElement(
    tabWindow: TabWindow,
    tleOffset: Point,
    beatElement: BeatElement
  ): string {
    const html: string[] = [];

    for (const effectLabelElement of beatElement.effectLabelElements) {
      html.push(`<rect x="${tleOffset.x + effectLabelElement.rect.x}"
                       y="${tleOffset.y + effectLabelElement.rect.y}"
                       width="${effectLabelElement.rect.width}"
                       height="${effectLabelElement.rect.height}"
                       fill="red"`);
    }

    if (this._detailed) {
      // const color = beatElement ? "blue" : "red";
      html.push(`<rect x="${tleOffset.x + beatElement.rect.x}"
                       y="${tleOffset.y + beatElement.rect.y}"
                       width="${beatElement.rect.width}"
                       height="${beatElement.rect.height}"
                       fill="red"
                       fill-opacity="0.25"
                       stroke="black"
                       stroke-opacity="1" />`);
    }

    html.push(`<image x="${tleOffset.x + beatElement.durationRect.x}"
                      y="${tleOffset.y + beatElement.durationRect.y}"
                      width="${beatElement.durationRect.width}"
                      height="${beatElement.durationRect.height}"
                      href="../assets/img/notes/${
                        1 / beatElement.beat.duration
                      }.svg" />`);

    for (const noteElement of beatElement.noteElements) {
      html.push(this.renderNoteElement(tabWindow, tleOffset, noteElement));
    }

    return html.join("");
  }

  private renderBarElement(
    tabWindow: TabWindow,
    tleOffset: Point,
    barElement: BarElement
  ): string {
    const html: string[] = [];

    // const tleOffset = new Point(tleOffset.x + barElement.rect.x, tleOffset.y);
    html.push("<g>");

    html.push(`<line x1="${tleOffset.x + barElement.barLeftBorderLine[0].x}"
                     y1="${tleOffset.y + barElement.barLeftBorderLine[0].y}"
                     x2="${tleOffset.x + barElement.barLeftBorderLine[1].x}"
                     y2="${tleOffset.y + barElement.barLeftBorderLine[1].y}"
                     stroke="black" />`);

    for (const line of barElement.staffLines) {
      const strokeColor = barElement.durationsFit() ? "black" : "red";
      html.push(`<line x1="${tleOffset.x + line[0].x}"
                       y1="${tleOffset.y + line[0].y}"
                       x2="${tleOffset.x + line[1].x}"
                       y2="${tleOffset.y + line[1].y}"
                       stroke="${strokeColor}" />`);
    }

    if (barElement.showSignature) {
      if (this._detailed) {
        html.push(`<rect x="${tleOffset.x + barElement.timeSigRect.x}"
                         y="${tleOffset.y + barElement.timeSigRect.y}"
                         width="${barElement.timeSigRect.width}"
                         height="${barElement.timeSigRect.height}"
                         fill="purple"
                         fill-opacity="0.25"
                         stroke="black"
                         stroke-opacity="1" />`);
      }

      html.push(`<g>
                   <text x="${tleOffset.x + barElement.beatsTextCoords.x}"
                         y="${tleOffset.y + barElement.beatsTextCoords.y}"
                         text-anchor="middle"
                         font-size="${tabWindow.dim.timeSigTextSize}">
                     ${barElement.bar.beatsCount}
                   </text>
               
                   <text x="${tleOffset.x + barElement.measureTextCoords.x}"
                         y="${tleOffset.y + barElement.measureTextCoords.y}"
                         text-anchor="middle"
                         font-size="${tabWindow.dim.timeSigTextSize}">
                     ${1 / barElement.bar.duration}
                   </text>
                 </g>`);
    }

    if (barElement.showTempo) {
      if (this._detailed) {
        html.push(`<rect x="${tleOffset.x + barElement.tempoRect.x}"
                         y="${tleOffset.y + barElement.tempoRect.y}"
                         width="${barElement.tempoRect.width}"
                         height="${barElement.tempoRect.height}"
                         fill="green"
                         fill-opacity="0.25"
                         stroke="black"
                         stroke-opacity="1" />`);
      }

      html.push(`<image x="${tleOffset.x + barElement.tempoImageRect.x}"
                        y="${tleOffset.y + barElement.tempoImageRect.y}"
                        width="${barElement.tempoImageRect.width}"
                        height="${barElement.tempoImageRect.height}"
                        href="../assets/img/notes/4.svg" />`);
      html.push(`<text x="${tleOffset.x + barElement.tempoTextCoords.x}"
                       y="${tleOffset.y + barElement.tempoTextCoords.y}"
                       text-anchor="start"
                       font-size="${tabWindow.dim.tempoTextSize}">
                         = ${barElement.bar.tempo}
                 </text>`);
    }

    for (const beatElement of barElement.beatElements) {
      html.push(this.renderBeatElement(tabWindow, tleOffset, beatElement));
    }

    html.push(`<line x1="${tleOffset.x + barElement.barRightBorderLine[0].x}"
                     y1="${tleOffset.y + barElement.barRightBorderLine[0].y}"
                     x2="${tleOffset.x + barElement.barRightBorderLine[1].x}"
                     y2="${tleOffset.y + barElement.barRightBorderLine[1].y}"
                     stroke="black" />`);
    html.push("</g>");

    return html.join("");
  }

  private renderTabLine(
    tabWindow: TabWindow,
    tabLineElementIndex: number
  ): string {
    const html: string[] = [];

    const tle = tabWindow.tabLineElements[tabLineElementIndex];
    const tleOffset = new Point(tle.rect.x, tle.rect.y);

    for (const barElement of tle.barElements) {
      html.push(this.renderBarElement(tabWindow, tleOffset, barElement));
    }

    const rect = tabWindow.selectionRects[tabLineElementIndex];
    if (rect) {
      html.push(`<rect x="${rect.x}"
                       y="${rect.y}"
                       width="${rect.width}"
                       height="${rect.height}"
                       fill="blue"
                       fill-opacity="0.25"
                       stroke-opacity="1" />`);
    }

    return html.join("");
  }

  public render(testCaseIndex: number): string {
    const testCase = this.testCases[testCaseIndex];

    const html: string[] = [];

    const tabWindow = testCase.tabWindow;

    html.push("<div>");
    html.push(`Test case №${testCaseIndex + 1}: ${testCase.caption}`);
    html.push("<div>");
    const tabWindowHeight =
      tabWindow.dim.tabLineMinHeight * tabWindow.tabLineElements.length;
    html.push(`<svg viewBox="0 0 ${tabWindow.dim.width} ${tabWindowHeight}"
                    width="${tabWindow.dim.width}"
                    height="${tabWindowHeight}">`);
    for (let i = 0; i < tabWindow.tabLineElements.length; i++) {
      html.push(this.renderTabLine(tabWindow, i));
    }

    html.push("</svg>");
    html.push("</div>");
    html.push("</div>");

    return html.join("");
  }

  public renderAll(detailed: boolean = false): string {
    this._detailed = detailed;

    const html: string[] = [];
    for (let i = 0; i < this.testCases.length; i++) {
      html.push(this.render(i));
    }

    return html.join("");
  }
}

const renderer = new TestRenderer(testData.testCases);

function saveHTML(fileName: string, html: string): void {
  fs.writeFileSync(`./test-render/result/${fileName}`, html);
}

function main(): void {
  const htmlNormal = renderer.renderAll(false);
  saveHTML("index.html", htmlNormal);

  const htmlDetailed = renderer.renderAll(true);
  saveHTML("index-detailed.html", htmlDetailed);
}

main();
