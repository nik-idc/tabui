import { DURATION_TO_NAME } from "../../models/note-duration";
import { BarElement } from "../elements/bar-element";
import { BeatElement } from "../elements/beat-element";
import { BeatNotesElement } from "../elements/beat-notes-element";
import { NoteElement } from "../elements/note-element";
import { TabLineElement } from "../elements/tab-line-element";
import { TonejsDurationMap } from "../player/tab-player";
import { Point } from "../shapes/point";
import { Rect } from "../shapes/rect";
import { TabWindow } from "../tab-window";
import * as Tone from "tone";

export class TabWindowHTMLRenderer {
  private _tabWindow: TabWindow;
  private _assetsPath: string;
  private _container: HTMLElement | undefined;
  private _detailed: boolean;

  private _credentials: string;
  private _renderedLines: string;
  private _result: string;

  constructor(
    tabWindow: TabWindow,
    assetsPath: string,
    container: HTMLElement | undefined,
    detailed: boolean = false
  ) {
    this._tabWindow = tabWindow;
    this._assetsPath = assetsPath;
    this._container = container;
    this._detailed = detailed;

    this._credentials = "";
    this._renderedLines = "";
    this._result = "";
  }

  private renderNoteDetail(
    beatNotesOffset: Point,
    noteElement: NoteElement
  ): string {
    if (this._detailed) {
      return `<rect x="${beatNotesOffset.x + noteElement.rect.x}"
                    y="${beatNotesOffset.y + noteElement.rect.y}"
                    width="${noteElement.rect.width}"
                    height="${noteElement.rect.height}"
                    fill="orange"
                    fill-opacity="0.25"
                    stroke="blue"
                    stroke-opacity="1" />`;
    } else {
      // return "";
      return `<rect x="${beatNotesOffset.x + noteElement.rect.x}"
                    y="${beatNotesOffset.y + noteElement.rect.y}"
                    width="${noteElement.rect.width}"
                    height="${noteElement.rect.height}"
                    fill="transparent"
                    fill-opacity="0"
                    stroke="none"
                    stroke-opacity="0" />`;
    }
  }

  private renderNoteEffects(
    noteOffset: Point,
    noteElement: NoteElement
  ): string {
    const renderedNoteEffects = [];
    for (const effectElement of noteElement.guitarEffectElements) {
      // The reason for 2 ifs: bends DO NOT have a rect, but DO have full HTML
      if (effectElement.rect !== undefined) {
        renderedNoteEffects.push(`
          <rect x="${noteOffset.x + effectElement.rect.x}"
                y="${noteOffset.y + effectElement.rect.y}"
                width="${effectElement.rect.width}"
                height="${effectElement.rect.height}"
                fill="white"
                stroke-opacity="0" />`);
      }
      if (effectElement.fullHTML !== undefined) {
        renderedNoteEffects.push(`
            <g transform="translate(${noteOffset.x}, ${noteOffset.y})">
              ${effectElement.fullHTML}
            </g>
          `);
      }
    }

    return renderedNoteEffects.join("");
  }

  private renderNormalNoteBackground(
    noteOffset: Point,
    noteElement: NoteElement
  ): string {
    return `
      <text x="${noteOffset.x + noteElement.textCoords.x}"
            y="${noteOffset.y + noteElement.textCoords.y}"
            font-size="${this._tabWindow.dim.noteTextSize}px"
            text-anchor="middle"
            dominant-baseline="middle">
              ${noteElement.note.fret}
      </text>
    `;
  }

  private renderSelectedNoteBackground(
    noteOffset: Point,
    noteElement: NoteElement
  ): string {
    return `
      <text x="${noteOffset.x + noteElement.textCoords.x}"
            y="${noteOffset.y + noteElement.textCoords.y}"
            font-size="${this._tabWindow.dim.noteTextSize}px"
            text-anchor="middle"
            dominant-baseline="middle"
            stroke="orange">
              ${noteElement.note.fret}
      </text>
    `;
  }

  private renderNoteValue(noteOffset: Point, noteElement: NoteElement): string {
    if (noteElement.note.fret === undefined) {
      return "";
    }

    const isSelected =
      this._tabWindow.getSelectedElement() !== undefined &&
      this._tabWindow.isNoteElementSelected(noteElement);
    const renderedNoteBackground = isSelected
      ? this.renderSelectedNoteBackground(noteOffset, noteElement)
      : this.renderNormalNoteBackground(noteOffset, noteElement);

    return `
      <g>
        <rect x="${noteOffset.x + noteElement.textRect.x}"
              y="${noteOffset.y + noteElement.textRect.y}"
              width="${noteElement.textRect.width}"
              height="${noteElement.textRect.height}"
              fill="white"
              fill-opacity="1" />
        ${renderedNoteBackground}
      </g>
    `;
  }

  private renderNoteElement(
    beatNotesOffset: Point,
    noteElement: NoteElement
  ): string {
    const noteOffset = new Point(beatNotesOffset.x, beatNotesOffset.y);

    const renderedNoteDetail = this.renderNoteDetail(
      beatNotesOffset,
      noteElement
    );
    const renderedNoteEffects = this.renderNoteEffects(noteOffset, noteElement);
    const renderedNoteValue = this.renderNoteValue(noteOffset, noteElement);

    return `
      <g id="note-${noteElement.note.uuid}">
        ${renderedNoteDetail}
        ${renderedNoteEffects}
        ${renderedNoteValue}
      </g>
    `;
  }

  private renderBeatNotesDetail(
    beatOffset: Point,
    beatNotesElement: BeatNotesElement
  ): string {
    if (!this._detailed) {
      return "";
    }

    return `<rect x="${beatOffset.x + beatNotesElement.rect.x}"
                  y="${beatOffset.y + beatNotesElement.rect.y}"
                  width="${beatNotesElement.rect.width}"
                  height="${beatNotesElement.rect.height}"
                  fill="aqua"
                  fill-opacity="0.25"
                  stroke="black"
                  stroke-opacity="1" />`;
  }

  private renderNoteElements(
    beatNotesOffset: Point,
    beatNotesElement: BeatNotesElement
  ): string {
    const renderedNoteElements = [];
    for (const noteElement of beatNotesElement.noteElements) {
      renderedNoteElements.push(
        this.renderNoteElement(beatNotesOffset, noteElement)
      );
    }

    return renderedNoteElements.join("");
  }

  private renderBeatNotesElement(
    beatOffset: Point,
    beatNotesElement: BeatNotesElement
  ): string {
    const beatNotesOffset = new Point(
      beatOffset.x + beatNotesElement.rect.x,
      beatOffset.y + beatNotesElement.rect.y
    );

    const renderedBeatNotesDetail = this.renderBeatNotesDetail(
      beatOffset,
      beatNotesElement
    );
    const renderedNotes = this.renderNoteElements(
      beatNotesOffset,
      beatNotesElement
    );

    return `
      ${renderedBeatNotesDetail}
      ${renderedNotes}
    `;
  }

  private renderEffectLabels(
    beatOffset: Point,
    beatElement: BeatElement
  ): string {
    // Render beat effect labels
    const renderedEffectLabels = [];
    for (const effectLabelElement of beatElement.effectLabelElements) {
      renderedEffectLabels.push(`
        <g transform="translate(${beatOffset.x}, ${beatOffset.y})">
          ${effectLabelElement.fullHTML}
        </g>
      `);
    }

    return renderedEffectLabels.join("");
  }

  private renderBeatDetail(barOffset: Point, beatElement: BeatElement): string {
    if (!this._detailed) {
      return "";
    }

    return `
      <rect x="${barOffset.x + beatElement.rect.x}"
            y="${barOffset.y + beatElement.rect.y}"
            width="${beatElement.rect.width}"
            height="${beatElement.rect.height}"
            fill="red"
            fill-opacity="0.25"
            stroke="black"
            stroke-opacity="1" />
    `;
  }

  private renderBeatDuration(
    beatOffset: Point,
    beatElement: BeatElement
  ): string {
    const refName = DURATION_TO_NAME[beatElement.beat.duration];
    return `
      <image x="${beatOffset.x + beatElement.durationRect.x}"
             y="${beatOffset.y + beatElement.durationRect.y}"
             width="${beatElement.durationRect.width}"
             height="${beatElement.durationRect.height}"
             href="${this._assetsPath}/img/notes/${refName}.svg" />
    `;
  }

  private renderBeatSelection(
    barOffset: Point,
    beatElement: BeatElement
  ): string {
    if (!beatElement.selected) {
      return "";
    }

    return `
        <rect x="${barOffset.x + beatElement.rect.x}"
              y="${barOffset.y + beatElement.rect.y}"
              width="${beatElement.rect.width}"
              height="${beatElement.rect.height}"
              fill="blue"
              fill-opacity="0.25" />
    `;
  }

  private renderBeatElement(
    barOffset: Point,
    beatElement: BeatElement
  ): string {
    // Calc offset for each element inside of this beat element
    const beatOffset = new Point(
      barOffset.x + beatElement.rect.x,
      barOffset.y + beatElement.rect.y
    );

    const renderedLabels = this.renderEffectLabels(beatOffset, beatElement);
    const renderedDetail = this.renderBeatDetail(barOffset, beatElement);
    const renderedDuration = this.renderBeatDuration(beatOffset, beatElement);
    const renderedBeatNotes = this.renderBeatNotesElement(
      beatOffset,
      beatElement.beatNotesElement
    );
    const renderedSelectionRect = this.renderBeatSelection(
      barOffset,
      beatElement
    );

    return `
      <g id="beat-${beatElement.beat.uuid}">
        ${renderedLabels}
        ${renderedDetail}
        ${renderedDuration}
        ${renderedBeatNotes}
        ${renderedSelectionRect}
      </g>
    `;
  }

  private renderBarStaffLines(
    barOffset: Point,
    barElement: BarElement
  ): string {
    const staffLines = [];
    for (const line of barElement.staffLines) {
      const strokeColor = barElement.durationsFit ? "black" : "red";
      staffLines.push(`
        <line x1="${barOffset.x + line[0].x}"
              y1="${barOffset.y + line[0].y}"
              x2="${barOffset.x + line[1].x}"
              y2="${barOffset.y + line[1].y}"
              stroke="${strokeColor}" />
        `);
    }

    return staffLines.join("");
  }

  private renderBarSig(barOffset: Point, barElement: BarElement): string {
    if (!barElement.showSignature) {
      return "";
    }

    // Render bar signature
    let barSigDetailRect = "";
    if (this._detailed) {
      barSigDetailRect = `
          <rect x="${barOffset.x + barElement.timeSigRect.x}"
                y="${barOffset.y + barElement.timeSigRect.y}"
                width="${barElement.timeSigRect.width}"
                height="${barElement.timeSigRect.height}"
                fill="purple"
                fill-opacity="0.25"
                stroke="black"
                stroke-opacity="1" />
      `;
    }

    return `
      ${barSigDetailRect}
      <g>
         <text x="${barOffset.x + barElement.beatsTextCoords.x}"
               y="${barOffset.y + barElement.beatsTextCoords.y}"
               text-anchor="middle"
               font-size="${this._tabWindow.dim.timeSigTextSize}">
           ${barElement.bar.beatsCount}
         </text>
         
         <text x="${barOffset.x + barElement.measureTextCoords.x}"
               y="${barOffset.y + barElement.measureTextCoords.y}"
               text-anchor="middle"
               font-size="${this._tabWindow.dim.timeSigTextSize}">
           ${1 / barElement.bar.duration}
         </text>
      </g>
    `;
  }

  private renderBarTempo(barOffset: Point, barElement: BarElement): string {
    if (!barElement.showTempo) {
      return "";
    }

    let barTempoDetailRect = "";
    if (this._detailed) {
      barTempoDetailRect = `
          <rect x="${barOffset.x + barElement.tempoRect.x}"
                y="${barOffset.y + barElement.tempoRect.y}"
                width="${barElement.tempoRect.width}"
                height="${barElement.tempoRect.height}"
                fill="green"
                fill-opacity="0.25"
                stroke="black"
                stroke-opacity="1" />
      `;
    }

    return `
      ${barTempoDetailRect}
      <image x="${barOffset.x + barElement.tempoImageRect.x}"
             y="${barOffset.y + barElement.tempoImageRect.y}"
             width="${barElement.tempoImageRect.width}"
             height="${barElement.tempoImageRect.height}"
             href="${this._assetsPath}/img/notes/4.svg" />
      <text x="${barOffset.x + barElement.tempoTextCoords.x}"
            y="${barOffset.y + barElement.tempoTextCoords.y}"
            text-anchor="start"
            font-size="${this._tabWindow.dim.tempoTextSize}">
          = ${barElement.bar.tempo}
      </text>
    `;
  }

  private renderBarBeats(barOffset: Point, barElement: BarElement): string {
    const renderedBeatElements = [];
    for (const beatElement of barElement.beatElements) {
      renderedBeatElements.push(this.renderBeatElement(barOffset, beatElement));
    }

    return renderedBeatElements.join();
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
