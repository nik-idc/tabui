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
import { TabWindowRenderer } from "../src/tab-window/render/tab-window-renderer";
import { TabWindowHTMLRenderer } from "../src";

function saveHTML(fileName: string, html: string): void {
  fs.writeFileSync(`./test-render/result/${fileName}`, html);
}

function main(): void {
  const htmlNormal: string[] = [];
  for (let i = 0; i < testData.testCases.length; i++) {
    const testCase = testData.testCases[i];
    testCase.tabWindow.tab.name = `Test case №${i + 1}: ${testCase.caption}`;
    const rendererNew = new TabWindowHTMLRenderer(
      testCase.tabWindow,
      "../assets",
      undefined,
      false
    );

    rendererNew.render(false, true, true);

    htmlNormal.push(rendererNew.result);
  }
  saveHTML("index.html", htmlNormal.join("\n"));

  const htmlDetailed: string[] = [];
  for (let i = 0; i < testData.testCases.length; i++) {
    const testCase = testData.testCases[i];
    testCase.tabWindow.tab.name = `Test case №${i + 1}: ${testCase.caption}`;
    const rendererNew = new TabWindowHTMLRenderer(
      testCase.tabWindow,
      "../assets",
      undefined,
      true
    );

    rendererNew.render(false, true, true);

    htmlNormal.push(rendererNew.result);
  }
  saveHTML("index-detailed.html", htmlDetailed.join("\n"));
}

main();
