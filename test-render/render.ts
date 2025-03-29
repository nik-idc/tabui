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
import { BeatNotesElement } from "../src/tab-window/elements/beat-notes-element";

export class TestRenderer {
  readonly testCases: TestCase[];
  private _detailed: boolean = false;

  constructor(testCases: TestCase[]) {
    this.testCases = testCases;
  }

  private renderNoteElement(
    tabWindow: TabWindow,
    beatNotesOffset: Point,
    noteElement: NoteElement
  ): string {
    const html: string[] = [];

    const noteOffset = new Point(beatNotesOffset.x, beatNotesOffset.y);
    if (this._detailed) {
      html.push(`<rect x="${beatNotesOffset.x + noteElement.rect.x}"
                       y="${beatNotesOffset.y + noteElement.rect.y}"
                       width="${noteElement.rect.width}"
                       height="${noteElement.rect.height}"
                       fill="orange"
                       fill-opacity="0.25"
                       stroke="blue"
                       stroke-opacity="1" />`);
    }

    for (const effectElement of noteElement.guitarEffectElements) {
      if (effectElement.rect !== undefined) {
        html.push(`<rect x="${noteOffset.x + effectElement.rect.x}"
                         y="${noteOffset.y + effectElement.rect.y}"
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
      html.push(`<rect x="${noteOffset.x + noteElement.textRect.x}"
                       y="${noteOffset.y + noteElement.textRect.y}"
                       width="${noteElement.textRect.width}"
                       height="${noteElement.textRect.height}"
                       fill="white"
                       fill-opacity="1" />`);
      if (
        tabWindow.selectedElement &&
        tabWindow.isNoteElementSelected(noteElement)
      ) {
        html.push(`<text x="${noteOffset.x + noteElement.textCoords.x}"
                         y="${noteOffset.y + noteElement.textCoords.y}"
                         font-size="${tabWindow.dim.noteTextSize}px"
                         text-anchor="middle"
                         dominant-baseline="middle"
                         stroke="orange">
                           ${noteElement.note.fret}
                   </text>`);
      } else {
        html.push(`<text x="${noteOffset.x + noteElement.textCoords.x}"
                         y="${noteOffset.y + noteElement.textCoords.y}"
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

  private renderBeatNotesElement(
    tabWindow: TabWindow,
    beatOffset: Point,
    beatNotesElement: BeatNotesElement
  ): string {
    const html: string[] = [];

    if (this._detailed) {
      // const color = beatElement ? "blue" : "red";
      html.push(`<rect x="${beatOffset.x + beatNotesElement.rect.x}"
                       y="${beatOffset.y + beatNotesElement.rect.y}"
                       width="${beatNotesElement.rect.width}"
                       height="${beatNotesElement.rect.height}"
                       fill="aqua"
                       fill-opacity="0.25"
                       stroke="black"
                       stroke-opacity="1" />`);
    }

    const beatNotesOffset = new Point(
      beatOffset.x + beatNotesElement.rect.x,
      beatOffset.y + beatNotesElement.rect.y
    );
    for (const noteElement of beatNotesElement.noteElements) {
      html.push(
        this.renderNoteElement(tabWindow, beatNotesOffset, noteElement)
      );
    }

    return html.join("");
  }

  private renderBeatElement(
    tabWindow: TabWindow,
    barOffset: Point,
    beatElement: BeatElement
  ): string {
    const html: string[] = [];

    const beatOffset = new Point(
      barOffset.x + beatElement.rect.x,
      barOffset.y + beatElement.rect.y
    );
    for (const effectLabelElement of beatElement.effectLabelElements) {
      html.push(`<rect x="${beatOffset.x + effectLabelElement.rect.x}"
                       y="${beatOffset.y + effectLabelElement.rect.y}"
                       width="${effectLabelElement.rect.width}"
                       height="${effectLabelElement.rect.height}"
                       fill="red"`);
    }

    if (this._detailed) {
      // const color = beatElement ? "blue" : "red";
      html.push(`<rect x="${barOffset.x + beatElement.rect.x}"
                       y="${barOffset.y + beatElement.rect.y}"
                       width="${beatElement.rect.width}"
                       height="${beatElement.rect.height}"
                       fill="red"
                       fill-opacity="0.25"
                       stroke="black"
                       stroke-opacity="1" />`);
    }

    html.push(`<image x="${beatOffset.x + beatElement.durationRect.x}"
                      y="${beatOffset.y + beatElement.durationRect.y}"
                      width="${beatElement.durationRect.width}"
                      height="${beatElement.durationRect.height}"
                      href="../assets/img/notes/${
                        1 / beatElement.beat.duration
                      }.svg" />`);

    html.push(
      this.renderBeatNotesElement(
        tabWindow,
        beatOffset,
        beatElement.beatNotesElement
      )
    );

    return html.join("");
  }

  private renderBarElement(
    tabWindow: TabWindow,
    tleOffset: Point,
    barElement: BarElement
  ): string {
    const html: string[] = [];

    const barOffset = new Point(barElement.rect.x, tleOffset.y);
    // const tleOffset = new Point(tleOffset.x + barElement.rect.x, tleOffset.y);
    html.push("<g>");

    html.push(`<line x1="${barOffset.x + barElement.barLeftBorderLine[0].x}"
                     y1="${barOffset.y + barElement.barLeftBorderLine[0].y}"
                     x2="${barOffset.x + barElement.barLeftBorderLine[1].x}"
                     y2="${barOffset.y + barElement.barLeftBorderLine[1].y}"
                     stroke="black" />`);

    for (const line of barElement.staffLines) {
      const strokeColor = barElement.durationsFit() ? "black" : "red";
      html.push(`<line x1="${barOffset.x + line[0].x}"
                       y1="${barOffset.y + line[0].y}"
                       x2="${barOffset.x + line[1].x}"
                       y2="${barOffset.y + line[1].y}"
                       stroke="${strokeColor}" />`);
    }

    if (barElement.showSignature) {
      if (this._detailed) {
        html.push(`<rect x="${barOffset.x + barElement.timeSigRect.x}"
                         y="${barOffset.y + barElement.timeSigRect.y}"
                         width="${barElement.timeSigRect.width}"
                         height="${barElement.timeSigRect.height}"
                         fill="purple"
                         fill-opacity="0.25"
                         stroke="black"
                         stroke-opacity="1" />`);
      }

      html.push(`<g>
                   <text x="${barOffset.x + barElement.beatsTextCoords.x}"
                         y="${barOffset.y + barElement.beatsTextCoords.y}"
                         text-anchor="middle"
                         font-size="${tabWindow.dim.timeSigTextSize}">
                     ${barElement.bar.beatsCount}
                   </text>
               
                   <text x="${barOffset.x + barElement.measureTextCoords.x}"
                         y="${barOffset.y + barElement.measureTextCoords.y}"
                         text-anchor="middle"
                         font-size="${tabWindow.dim.timeSigTextSize}">
                     ${1 / barElement.bar.duration}
                   </text>
                 </g>`);
    }

    if (barElement.showTempo) {
      if (this._detailed) {
        html.push(`<rect x="${barOffset.x + barElement.tempoRect.x}"
                         y="${barOffset.y + barElement.tempoRect.y}"
                         width="${barElement.tempoRect.width}"
                         height="${barElement.tempoRect.height}"
                         fill="green"
                         fill-opacity="0.25"
                         stroke="black"
                         stroke-opacity="1" />`);
      }

      html.push(`<image x="${barOffset.x + barElement.tempoImageRect.x}"
                        y="${barOffset.y + barElement.tempoImageRect.y}"
                        width="${barElement.tempoImageRect.width}"
                        height="${barElement.tempoImageRect.height}"
                        href="../assets/img/notes/4.svg" />`);
      html.push(`<text x="${barOffset.x + barElement.tempoTextCoords.x}"
                       y="${barOffset.y + barElement.tempoTextCoords.y}"
                       text-anchor="start"
                       font-size="${tabWindow.dim.tempoTextSize}">
                         = ${barElement.bar.tempo}
                 </text>`);
    }

    for (const beatElement of barElement.beatElements) {
      html.push(this.renderBeatElement(tabWindow, barOffset, beatElement));
    }

    html.push(`<line x1="${barOffset.x + barElement.barRightBorderLine[0].x}"
                     y1="${barOffset.y + barElement.barRightBorderLine[0].y}"
                     x2="${barOffset.x + barElement.barRightBorderLine[1].x}"
                     y2="${barOffset.y + barElement.barRightBorderLine[1].y}"
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
    const tleOffset = new Point(0, tle.rect.y);

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
