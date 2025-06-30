import { DURATION_TO_NAME } from "../../models/note-duration";
import { BarElement } from "../elements/bar-element";
import { BeatElement } from "../elements/beat-element";
import { BeatNotesElement } from "../elements/beat-notes-element";
import { GuitarEffectElement } from "../elements/effects/guitar-effect-element";
import { NoteElement } from "../elements/note-element";
import { TabLineElement } from "../elements/tab-line-element";
import { TonejsDurationMap } from "../player/tab-player";
import { Point } from "../shapes/point";
import { Rect } from "../shapes/rect";
import { TabWindow } from "../tab-window";
import * as Tone from "tone";
import { TabWindowRenderer } from "./tab-window-renderer";
import { EffectLabelElement } from "../elements/effects/effect-label-element";

/**
 *
 * General algorithm:
 * - Render every element
 * - If element is not drawn yet draw it and set all its attributes
 * - If element is already drawn just change its attributes (only the necessary ones)
 *
 */

/**
 * Render a tab window using SVG
 */
export class TabWindowSVGRenderer implements TabWindowRenderer {
  private _tabWindow: TabWindow;
  private _assetsPath: string;
  private _container: HTMLElement | undefined;

  private _credentials: string;
  private _renderedLines: string;
  private _result: string;

  // Note SVGs
  private _noteRectSVGs: Map<number, SVGRectElement>;
  private _noteEffectRectSVGs: Map<number, SVGRectElement>;
  private _noteEffectFullHTMLSVGs: Map<number, SVGGElement>;
  private _noteTextSVGs: Map<number, SVGTextElement>;
  private _noteBackgroundSVGs: Map<number, SVGRectElement>;
  // Beat SVGs
  private _effectLabelSVGs: Map<number, SVGGElement>;
  private _beatDurationSVGs: Map<number, SVGImageElement>;
  private _beatSelectionSVGs: Map<number, SVGRectElement>;
  // Bar SVGs
  private _barStaffLineSVGs: Map<number, SVGLineElement[]>;
  private _barSigSVGs: Map<number, SVGTextElement[]>;
  private _barTempoSVGs: Map<
    number,
    { image: SVGImageElement; text: SVGTextElement }
  >;

  /**
   * Render a tab window using SVG
   * @param tabWindow Tab window
   * @param assetsPath Path to assets
   * @param container HTML Element container
   */
  constructor(
    tabWindow: TabWindow,
    assetsPath: string,
    container: HTMLElement | undefined
  ) {
    this._tabWindow = tabWindow;
    this._assetsPath = assetsPath;
    this._container = container;

    this._credentials = "";
    this._renderedLines = "";
    this._result = "";

    this._noteRectSVGs = new Map();
    this._noteEffectRectSVGs = new Map();
    this._noteEffectFullHTMLSVGs = new Map();
    this._noteTextSVGs = new Map();
    this._noteBackgroundSVGs = new Map();
    this._effectLabelSVGs = new Map();
    this._beatDurationSVGs = new Map();
    this._beatSelectionSVGs = new Map();
    this._barStaffLineSVGs = new Map();
    this._barSigSVGs = new Map();
    this._barTempoSVGs = new Map();
  }

  /**
   * Render note detail
   * @param beatNotesOffset Global offset of beat notes' element
   * @param noteElement Note element
   */
  private renderNoteRect(
    beatNotesOffset: Point,
    noteElement: NoteElement
  ): void {
    const noteUUID = noteElement.note.uuid;
    const existingNoteDetail = this._noteRectSVGs.get(noteUUID);
    const noteDetailExists = existingNoteDetail !== undefined;
    const noteDetailSVG = noteDetailExists
      ? existingNoteDetail
      : new SVGRectElement();

    const x = `${beatNotesOffset.x + noteElement.rect.x}`;
    const y = `${beatNotesOffset.y + noteElement.rect.y}`;
    const width = `${noteElement.rect.width}`;
    const height = `${noteElement.rect.height}`;
    noteDetailSVG.setAttribute("x", x);
    noteDetailSVG.setAttribute("y", y);
    noteDetailSVG.setAttribute("width", width);
    noteDetailSVG.setAttribute("height", height);

    if (!noteDetailExists) {
      noteDetailSVG.setAttribute("fill", "transparent");
      noteDetailSVG.setAttribute("fill-opacity", "0");
      noteDetailSVG.setAttribute("stroke", "none");
      noteDetailSVG.setAttribute("stroke-opacity", "0");
      this._noteRectSVGs.set(noteUUID, noteDetailSVG);
    }
  }

  /**
   * Render effect's SVG rect element
   * @param noteOffset Note elements global offset
   * @param noteElement Note element
   * @param effectElement Effect element
   */
  private renderEffectRect(
    noteOffset: Point,
    noteElement: NoteElement,
    effectElement: GuitarEffectElement
  ): void {
    if (effectElement.rect === undefined) {
      throw Error("Attempted to render effect rect with undefined rect");
    }

    const effectUUID = effectElement.effect.uuid;
    const existingEffectRect = this._noteEffectRectSVGs.get(effectUUID);
    const noteEffectRectExists = existingEffectRect !== undefined;
    const noteEffectRectSVG = noteEffectRectExists
      ? existingEffectRect
      : new SVGRectElement();

    const x = `${noteOffset.x + effectElement.rect.x}`;
    const y = `${noteOffset.y + effectElement.rect.y}`;
    const width = `${effectElement.rect.width}`;
    const height = `${effectElement.rect.height}`;
    noteEffectRectSVG.setAttribute("x", x);
    noteEffectRectSVG.setAttribute("y", y);
    noteEffectRectSVG.setAttribute("width", width);
    noteEffectRectSVG.setAttribute("height", height);

    if (!noteEffectRectExists) {
      noteEffectRectSVG.setAttribute("fill", "white");
      noteEffectRectSVG.setAttribute("stroke-opacity", "0");
      this._noteEffectRectSVGs.set(effectUUID, noteEffectRectSVG);
    }
  }

  /**
   * Render effect's raw SVG
   * @param noteOffset Note elements global offset
   * @param noteElement Note element
   * @param effectElement Effect element
   */
  private renderEffectHTML(
    noteOffset: Point,
    noteElement: NoteElement,
    effectElement: GuitarEffectElement
  ): void {
    if (effectElement.fullHTML === undefined) {
      throw Error("Attempted to render effect HTML with undefined HTML");
    }

    const effectUUID = effectElement.effect.uuid;
    const existingEffectHTML = this._noteEffectFullHTMLSVGs.get(effectUUID);
    const noteEffectHTMLExists = existingEffectHTML !== undefined;
    const noteEffectHTMLSVG = noteEffectHTMLExists
      ? existingEffectHTML
      : new SVGGElement();

    noteEffectHTMLSVG.setAttribute(
      "transform",
      `translate(${noteOffset.x}, ${noteOffset.y})`
    );
    noteEffectHTMLSVG.innerHTML = effectElement.fullHTML; // May lead to performance issues
    if (!noteEffectHTMLExists) {
      this._noteEffectFullHTMLSVGs.set(effectUUID, noteEffectHTMLSVG);
    }
  }

  /**
   * Render a note's effect
   * @param noteOffset Note elements global offset
   * @param noteElement Note element
   * @param effectElement Effect element
   */
  private renderEffect(
    noteOffset: Point,
    noteElement: NoteElement,
    effectElement: GuitarEffectElement
  ): void {
    // The reason for 2 ifs: bends DO NOT have a rect, but DO have full HTML
    if (effectElement.rect !== undefined) {
      this.renderEffectRect(noteOffset, noteElement, effectElement);
    }
    if (effectElement.fullHTML !== undefined) {
      this.renderEffectHTML(noteOffset, noteElement, effectElement);
    }
  }

  //   private renderEffectRects(noteOffset: Point, noteElement: NoteElement): void {
  //     for (const effectElement of noteElement.guitarEffectElements) {
  //       this.renderEffect(noteOffset, noteElement, effectElement);
  //     }
  //   }

  /**
   * Render note's value as text
   * @param noteOffset Note elements global offset
   * @param noteElement Note element
   * @param selected True if note is selected, false otherwise
   */
  private renderNoteText(
    noteOffset: Point,
    noteElement: NoteElement,
    selected: boolean
  ): void {
    if (noteElement.note.fret === undefined) {
      throw Error("Attempted to render note text when note value is undefined");
    }

    const noteUUID = noteElement.note.uuid;
    const existingNoteText = this._noteTextSVGs.get(noteUUID);
    const noteTextExists = existingNoteText !== undefined;
    const noteTextSVG = noteTextExists
      ? existingNoteText
      : new SVGTextElement();

    const x = `${noteOffset.x + noteElement.textCoords.x}`;
    const y = `${noteOffset.y + noteElement.textCoords.y}`;
    const fontSize = `${this._tabWindow.dim.noteTextSize}px`;
    noteTextSVG.setAttribute("x", x);
    noteTextSVG.setAttribute("y", y);
    noteTextSVG.textContent = `${noteElement.note.fret}`;
    if (selected) {
      noteTextSVG.setAttribute("stroke", "orange");
    }

    if (!noteTextExists) {
      noteTextSVG.setAttribute("font-size", fontSize);
      noteTextSVG.setAttribute("text-anchor", "middle");
      noteTextSVG.setAttribute("dominant-baseline", "middle");
      this._noteTextSVGs.set(noteUUID, noteTextSVG);
    }
  }

  /**
   * Render the rect behind note's text
   * @param noteOffset Note elements global offset
   * @param noteElement Note element
   */
  private renderNoteBackground(
    noteOffset: Point,
    noteElement: NoteElement
  ): void {
    if (noteElement.note.fret === undefined) {
      throw Error(
        "Attempted to render note background when note value is undefined"
      );
    }

    const noteUUID = noteElement.note.uuid;
    const existingNoteBackground = this._noteBackgroundSVGs.get(noteUUID);
    const noteBackgroundExists = existingNoteBackground !== undefined;
    const noteBackgroundSVG = noteBackgroundExists
      ? existingNoteBackground
      : new SVGRectElement();

    const x = `${noteOffset.x + noteElement.textRect.x}`;
    const y = `${noteOffset.y + noteElement.textRect.y}`;
    const width = `${noteElement.textRect.width}`;
    const height = `${noteElement.textRect.height}`;
    noteBackgroundSVG.setAttribute("x", x);
    noteBackgroundSVG.setAttribute("y", y);
    noteBackgroundSVG.setAttribute("width", width);
    noteBackgroundSVG.setAttribute("height", height);

    if (!noteBackgroundExists) {
      noteBackgroundSVG.setAttribute("fill", "white");
      noteBackgroundSVG.setAttribute("fill-opacity", "1");
      this._noteBackgroundSVGs.set(noteUUID, noteBackgroundSVG);
    }
  }

  /**
   * Render the full note element
   * @param beatNotesOffset
   * @param noteElement
   */
  private renderNoteElement(
    beatNotesOffset: Point,
    noteElement: NoteElement
  ): void {
    const noteOffset = new Point(beatNotesOffset.x, beatNotesOffset.y);

    this.renderNoteRect(beatNotesOffset, noteElement);
    for (const effectElement of noteElement.guitarEffectElements) {
      this.renderEffect(noteOffset, noteElement, effectElement);
    }
    this.renderNoteBackground(noteOffset, noteElement);
    this.renderNoteText(
      noteOffset,
      noteElement,
      this._tabWindow.getSelectedElement()?.note.uuid === noteElement.note.uuid
    );
  }

  /**
   * Render beat notes element (renders all notes of a beat)
   * @param beatOffset Global offset of the beat
   * @param beatNotesElement Beat notes element
   */
  private renderBeatNotesElement(
    beatOffset: Point,
    beatNotesElement: BeatNotesElement
  ): void {
    const beatNotesOffset = new Point(
      beatOffset.x + beatNotesElement.rect.x,
      beatOffset.y + beatNotesElement.rect.y
    );

    for (const noteElement of beatNotesElement.noteElements) {
      this.renderNoteElement(beatNotesOffset, noteElement);
    }
  }

  /**
   * Render an effect label
   * @param beatOffset Global offset of the beat
   * @param beatElement Beat element
   * @param effectLabelElement Effect label element to render
   */
  private renderEffectLabel(
    beatOffset: Point,
    beatElement: BeatElement,
    effectLabelElement: EffectLabelElement
  ): void {
    if (effectLabelElement.fullHTML === undefined) {
      throw Error("Effect label render error: effect HTML undefined");
    }

    const effectUUID = effectLabelElement.effect.uuid;
    const existingLabel = this._effectLabelSVGs.get(effectUUID);
    const labelExists = existingLabel !== undefined;
    const labelSVG = labelExists ? existingLabel : new SVGGElement();

    labelSVG.setAttribute(
      "transform",
      `translate(${beatOffset.x}, ${beatOffset.y})`
    );
    labelSVG.innerHTML = `${effectLabelElement.fullHTML}`;

    if (!labelExists) {
      this._effectLabelSVGs.set(effectUUID, labelSVG);
    }
  }

  /**
   * Render a beat's duration
   * @param beatOffset Global offset of the beat
   * @param beatElement Beat element
   */
  private renderBeatDuration(
    beatOffset: Point,
    beatElement: BeatElement
  ): void {
    const beatUUID = beatElement.beat.uuid;
    const existingDurationSVG = this._beatDurationSVGs.get(beatUUID);
    const durationSVGExists = existingDurationSVG !== undefined;
    const durationSVG = durationSVGExists
      ? existingDurationSVG
      : new SVGImageElement();

    const x = `${beatOffset.x + beatElement.durationRect.x}`;
    const y = `${beatOffset.y + beatElement.durationRect.y}`;
    const width = `${beatElement.durationRect.width}`;
    const height = `${beatElement.durationRect.height}`;
    const refName = DURATION_TO_NAME[beatElement.beat.duration];
    const href = `${this._assetsPath}/img/notes/${refName}.svg`;
    durationSVG.setAttribute("x", x);
    durationSVG.setAttribute("y", y);
    durationSVG.setAttribute("width", width);
    durationSVG.setAttribute("height", height);
    durationSVG.setAttribute("href", href);

    if (!durationSVGExists) {
      this._beatDurationSVGs.set(beatUUID, durationSVG);
    }
  }

  /**
   * Render beat selection
   * @param barOffset Global offset of the bar
   * @param beatElement Beat element
   */
  private renderBeatSelection(
    barOffset: Point,
    beatElement: BeatElement
  ): void {
    if (!beatElement.selected) {
      throw Error(
        "Attempted to render selection of an unselected beat element"
      );
    }

    const beatUUID = beatElement.beat.uuid;
    const existingSelectionSVG = this._beatSelectionSVGs.get(beatUUID);
    const selectionSVGExists = existingSelectionSVG !== undefined;
    const selectionSVG = selectionSVGExists
      ? existingSelectionSVG
      : new SVGRectElement();

    const x = `${barOffset.x + beatElement.rect.x}`;
    const y = `${barOffset.y + beatElement.rect.y}`;
    const width = `${beatElement.rect.width}`;
    const height = `${beatElement.rect.height}`;
    selectionSVG.setAttribute("x", x);
    selectionSVG.setAttribute("y", y);
    selectionSVG.setAttribute("width", width);
    selectionSVG.setAttribute("height", height);

    if (!selectionSVGExists) {
      selectionSVG.setAttribute("fill", "blue");
      selectionSVG.setAttribute("fill-opacity", "0.25");
      this._beatSelectionSVGs.set(beatUUID, selectionSVG);
    }
  }

  /**
   * Render a full beat
   * @param barOffset Global offset of the bar
   * @param beatElement Beat element
   */
  private renderBeatElement(barOffset: Point, beatElement: BeatElement): void {
    // Calc offset for each element inside of this beat element
    const beatOffset = new Point(
      barOffset.x + beatElement.rect.x,
      barOffset.y + beatElement.rect.y
    );

    for (const labelElement of beatElement.effectLabelElements) {
      this.renderEffectLabel(beatOffset, beatElement, labelElement);
    }
    this.renderBeatDuration(beatOffset, beatElement);
    this.renderBeatNotesElement(beatOffset, beatElement.beatNotesElement);
    this.renderBeatSelection(barOffset, beatElement);
  }

  /**
   * Render bar staff lines
   * @param barOffset Global offset of the bar
   * @param barElement Bar element
   */
  private renderBarStaffLines(barOffset: Point, barElement: BarElement): void {
    const barUUID = barElement.bar.uuid;
    const existingStaffLines = this._barStaffLineSVGs.get(barUUID);
    const staffLinesExists = existingStaffLines !== undefined;
    const staffLines = staffLinesExists
      ? existingStaffLines
      : new Array<SVGLineElement>(barElement.bar.guitar.stringsCount);

    const strokeColor = barElement.durationsFit ? "black" : "red";
    for (let i = 0; i < barElement.staffLines.length; i++) {
      const line = barElement.staffLines[i];
      staffLines[i].setAttribute("x1", `${barOffset.x + line[0].x}`);
      staffLines[i].setAttribute("y1", `${barOffset.y + line[0].y}`);
      staffLines[i].setAttribute("x2", `${barOffset.x + line[1].x}`);
      staffLines[i].setAttribute("y2", `${barOffset.y + line[1].y}`);
      staffLines[i].setAttribute("stroke", strokeColor);
    }

    if (!staffLinesExists) {
      this._barStaffLineSVGs.set(barUUID, staffLines);
    }
  }

  /**
   * Render bar signature
   * @param barOffset Global offset of the bar
   * @param barElement Bar element
   */
  private renderBarSig(barOffset: Point, barElement: BarElement): void {
    if (!barElement.showSignature) {
      return;
    }

    const barUUID = barElement.bar.uuid;
    const existingSigSVG = this._barSigSVGs.get(barUUID);
    const sigSVGExists = existingSigSVG !== undefined;
    const sigSVG = sigSVGExists ? existingSigSVG : new Array<SVGTextElement>(2);

    const topX = `${barOffset.x + barElement.beatsTextCoords.x}`;
    const topY = `${barOffset.y + barElement.beatsTextCoords.y}`;
    sigSVG[0].setAttribute("x", topX);
    sigSVG[0].setAttribute("y", topY);
    sigSVG[0].textContent = `${barElement.bar.beatsCount}`;

    const bottomX = `${barOffset.x + barElement.measureTextCoords.x}`;
    const bottomY = `${barOffset.y + barElement.measureTextCoords.y}`;
    sigSVG[1].setAttribute("x", bottomX);
    sigSVG[1].setAttribute("y", bottomY);
    sigSVG[1].textContent = `${1 / barElement.bar.duration}`;

    if (!sigSVGExists) {
      const fontSize = `${this._tabWindow.dim.timeSigTextSize}`;

      sigSVG[0].setAttribute("text-anchor", "middle");
      sigSVG[0].setAttribute("font-size", fontSize);
      sigSVG[1].setAttribute("text-anchor", "middle");
      sigSVG[1].setAttribute("font-size", fontSize);
      this._barSigSVGs.set(barUUID, sigSVG);
    }
  }

  /**
   * Render bar tempo
   * @param barOffset Global offset of the bar
   * @param barElement Bar element
   */
  private renderBarTempo(barOffset: Point, barElement: BarElement): void {
    if (!barElement.showTempo) {
      return;
    }

    const barUUID = barElement.bar.uuid;
    const existingTempoSVG = this._barTempoSVGs.get(barUUID);
    const tempoSVGExists = existingTempoSVG !== undefined;
    const tempoSVG = tempoSVGExists
      ? existingTempoSVG
      : { image: new SVGImageElement(), text: new SVGTextElement() };

    const imageX = `${barOffset.x + barElement.tempoImageRect.x}`;
    const imageY = `${barOffset.y + barElement.tempoImageRect.y}`;
    const imageWidth = `${barElement.tempoImageRect.width}`;
    const imageHeight = `${barElement.tempoImageRect.height}`;
    tempoSVG.image.setAttribute("x", imageX);
    tempoSVG.image.setAttribute("y", imageY);
    tempoSVG.image.setAttribute("width", imageWidth);
    tempoSVG.image.setAttribute("height", imageHeight);

    const textX = `${barOffset.x + barElement.tempoTextCoords.x}`;
    const textY = `${barOffset.x + barElement.tempoTextCoords.x}`;
    tempoSVG.text.setAttribute("x", textX);
    tempoSVG.text.setAttribute("y", textY);
    tempoSVG.text.textContent = `= ${barElement.bar.tempo}`;

    if (!tempoSVGExists) {
      const fontSize = `${this._tabWindow.dim.timeSigTextSize}`;
      const href = `${this._assetsPath}/img/notes/4.svg`;

      tempoSVG.image.setAttribute("href", href);
      tempoSVG.text.setAttribute("text-anchor", "start");
      tempoSVG.text.setAttribute("font-size", fontSize);
      this._barTempoSVGs.set(barUUID, tempoSVG);
    }
  }

  private renderBarElement(tleOffset: Point, barElement: BarElement): string {
    // Calc offset for every element inside this bar
    const barOffset = new Point(barElement.rect.x, tleOffset.y);

    const renderedStaffLines = this.renderBarStaffLines(barOffset, barElement);
    const renderedBarSig = this.renderBarSig(barOffset, barElement);
    const renderedBarTempo = this.renderBarTempo(barOffset, barElement);
    const renderedBeatElements = this.renderBarBeats(barOffset, barElement);

    return `
      <g>
        <line x1="${barOffset.x + barElement.barLeftBorderLine[0].x}"
              y1="${barOffset.y + barElement.barLeftBorderLine[0].y}"
              x2="${barOffset.x + barElement.barLeftBorderLine[1].x}"
              y2="${barOffset.y + barElement.barLeftBorderLine[1].y}"
              stroke="black" />

        ${renderedStaffLines}
        ${renderedBarSig}
        ${renderedBarTempo}
        ${renderedBeatElements}

        <line x1="${barOffset.x + barElement.barRightBorderLine[0].x}"
              y1="${barOffset.y + barElement.barRightBorderLine[0].y}"
              x2="${barOffset.x + barElement.barRightBorderLine[1].x}"
              y2="${barOffset.y + barElement.barRightBorderLine[1].y}"
              stroke="black" />
      </g>
    `;
  }

  private renderTabLine(tabLineElement: TabLineElement): string {
    const tleOffset = new Point(0, tabLineElement.rect.y);

    const renderedBarElements = [];
    for (const barElement of tabLineElement.barElements) {
      renderedBarElements.push(this.renderBarElement(tleOffset, barElement));
    }

    return `
      ${renderedBarElements.join("")}
    `;
  }

  private renderTabLines(): string {
    // Render lines first
    const renderedLines = [];
    const tabLineElements = this._tabWindow.getTabLineElements();
    for (const tabLineElement of tabLineElements) {
      renderedLines.push(this.renderTabLine(tabLineElement));
    }

    return renderedLines.join("");
  }

  private renderTabInfo(
    showTabCredits: boolean = false,
    showTabName: boolean = false,
    showGuitarInfo: boolean = false
  ): string {
    const creds = [];

    // if (showTabCredits) {
    //   creds.push(`
    //       <p>${this._tabWindow.tab.artist} - ${this._tabWindow.tab.song}</p>
    //     `);
    // }

    if (showTabName) {
      creds.push(`
          <p>${this._tabWindow.tab.name}</p>
        `);
    }

    if (showGuitarInfo) {
      creds.push(`
        <p>Tuning: ${this._tabWindow.tab.guitar.getTuningStr()}</p>
      `);
    }

    return creds.join("");
  }

  private renderPlayerOverlay(): string {
    const currentBeatElement = this._tabWindow.getPlayerCurrentBeatElement();

    let cursorRect: Rect;
    if (currentBeatElement === undefined) {
      cursorRect = new Rect(0, 0, 0, 0);
    } else {
      const beatElementCoords =
        this._tabWindow.getBeatElementGlobalCoords(currentBeatElement);

      const playerCursorWidth = 5;
      const playerCursorAddHeight = 10;

      cursorRect = new Rect(
        beatElementCoords.x + currentBeatElement.rect.width / 2,
        beatElementCoords.y - playerCursorAddHeight,
        playerCursorWidth,
        currentBeatElement.rect.height + playerCursorAddHeight
      );
    }

    return `
      <rect id="playerCursor"
            x="${cursorRect.x}"
            y="${cursorRect.y}"
            width="${cursorRect.width}"
            height="${cursorRect.height}"
            stroke="black"
            fill="purple">

      </rect>
    `;
  }

  public render(
    showTabCredits: boolean = false,
    showTabName: boolean = false,
    showGuitarInfo: boolean = false
  ): void {
    // Calc tab window height
    let tabWindowHeight = 0;
    const tabLineElements = this._tabWindow.getTabLineElements();
    for (const tabLineElement of tabLineElements) {
      tabWindowHeight += tabLineElement.rect.height;
    }

    // Render lines first
    this._renderedLines = this.renderTabLines();

    // Form credentials
    this._credentials = this.renderTabInfo(
      showTabCredits,
      showTabName,
      showGuitarInfo
    );

    // Player overlay rect
    const overlay = this.renderPlayerOverlay();

    const rendered = `
        <div>
          ${this._credentials}
          <div>
            <svg viewBox="0 0 ${this._tabWindow.dim.width} ${tabWindowHeight}"
                 width="${this._tabWindow.dim.width}"
                 height="${tabWindowHeight}"
                 class="tabSVG">
              ${this._renderedLines}
              ${overlay}
            </svg>
          </div>
        </div>
    `;

    this._result = rendered;

    if (this._container !== undefined) {
      this._container.innerHTML = "";
      this._container.innerHTML = rendered;
    }
  }

  /**
   * Changes whether to draw additional details
   * @param newDetailed
   */
  public setDetailed(newDetailed: boolean): void {
    this._detailed = newDetailed;
  }

  public get result(): string {
    return this._result;
  }
}
