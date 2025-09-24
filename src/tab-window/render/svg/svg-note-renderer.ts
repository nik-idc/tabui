import {
  createSVGG,
  createSVGRect,
  createSVGText,
} from "../../../misc/svg-creators";
import { GuitarEffectElement } from "../../elements/effects/guitar-effect-element";
import { NoteElement } from "../../elements/note-element";
import { Point } from "../../shapes/point";
import { TabWindow } from "../../tab-window";
import { SVGEffectRenderer } from "./svg-guitar-effect-renderer";

/**
 * Class for rendering a note element using SVG
 */
export class SVGNoteRenderer {
  private _tabWindow: TabWindow;
  private _noteElement: NoteElement;
  private _beatNotesOffset: Point;
  private _assetsPath: string;
  private _parentElement: SVGGElement;

  private _renderedEffects: Map<number, SVGEffectRenderer>;

  private _groupSVG?: SVGGElement;
  private _rectSVG?: SVGRectElement;
  private _textSVG?: SVGTextElement;
  private _backgroundSVG?: SVGRectElement;
  private _selectionRectSVG?: SVGRectElement;

  private _attachedEvents: Map<string, EventListener> = new Map();

  /**
   * Class for rendering a note element using SVG
   * @param tabWindow Tab window
   * @param noteElement Note element
   * @param beatNotesOffset Global offset of the beat notes element
   * @param assetsPath Path to assets
   * @param parentElement SVG parent element (a beat element in this case)
   */
  constructor(
    tabWindow: TabWindow,
    noteElement: NoteElement,
    beatNotesOffset: Point,
    assetsPath: string,
    parentElement: SVGGElement
  ) {
    this._tabWindow = tabWindow;
    this._noteElement = noteElement;
    this._beatNotesOffset = beatNotesOffset;
    this._assetsPath = assetsPath;
    this._parentElement = parentElement;

    this._renderedEffects = new Map();
    this._attachedEvents = new Map();
  }

  /**
   * Renders the group element which will contain all the
   * data about the note
   */
  private renderGroup(): void {
    if (this._groupSVG !== undefined) {
      return;
    }

    const noteUUID = this._noteElement.note.uuid;
    this._groupSVG = createSVGG();
    this._groupSVG.setAttribute("id", `note-${noteUUID}`);
    this._parentElement.appendChild(this._groupSVG);
  }

  /**
   * Render note outer rect
   */
  private renderNoteRect(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render note rect when SVG group undefined");
    }

    const noteUUID = this._noteElement.note.uuid;
    if (this._rectSVG === undefined) {
      this._rectSVG = createSVGRect();

      // Set only-set-once attributes
      this._rectSVG.setAttribute("fill", "transparent");
      this._rectSVG.setAttribute("fill-opacity", "0");
      this._rectSVG.setAttribute("stroke", "none");
      this._rectSVG.setAttribute("stroke-opacity", "0");

      // Set id
      this._rectSVG.setAttribute("id", `note-rect-${noteUUID}`);

      // Add element to root SVG element
      this._groupSVG.appendChild(this._rectSVG);
    }

    const x = `${this._beatNotesOffset.x + this._noteElement.rect.x}`;
    const y = `${this._beatNotesOffset.y + this._noteElement.rect.y}`;
    const width = `${this._noteElement.rect.width}`;
    const height = `${this._noteElement.rect.height}`;
    this._rectSVG.setAttribute("x", x);
    this._rectSVG.setAttribute("y", y);
    this._rectSVG.setAttribute("width", width);
    this._rectSVG.setAttribute("height", height);
  }

  /**
   * Unrender background of the text
   */
  private unrenderNoteRect(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender note rect when SVG group undefined");
    }

    if (this._rectSVG === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._rectSVG);
    this._rectSVG = undefined;
  }

  /**
   * Renders the selection rectangle for the note
   */
  private renderSelectionRect(): void {
    if (this._groupSVG === undefined) {
      throw Error(
        "Tried to render note selection rect when SVG group undefined"
      );
    }
    if (this._selectionRectSVG === undefined) {
      this._selectionRectSVG = createSVGRect();
      this._selectionRectSVG.setAttribute(
        "id",
        `note-selection-${this._noteElement.note.uuid}`
      );
      this._selectionRectSVG.setAttribute("fill", "white");
      this._selectionRectSVG.setAttribute("stroke", "orange");
      this._selectionRectSVG.setAttribute("stroke-width", "1");
      this._selectionRectSVG.setAttribute("rx", "3");
      this._selectionRectSVG.setAttribute("ry", "3");
      this._groupSVG.appendChild(this._selectionRectSVG);
    }
    const padding = 2;
    const x = `${
      this._beatNotesOffset.x + this._noteElement.textRect.x - padding
    }`;
    const y = `${
      this._beatNotesOffset.y + this._noteElement.textRect.y - padding
    }`;
    const width = `${this._noteElement.textRect.width + padding * 2}`;
    const height = `${this._noteElement.textRect.height + padding * 2}`;
    this._selectionRectSVG.setAttribute("x", x);
    this._selectionRectSVG.setAttribute("y", y);
    this._selectionRectSVG.setAttribute("width", width);
    this._selectionRectSVG.setAttribute("height", height);
  }

  /**
   * Unrenders the selection rectangle for the note
   */
  private unrenderSelectionRect(): void {
    if (this._selectionRectSVG !== undefined) {
      if (this._groupSVG === undefined) {
        throw Error(
          "Tried to unrender note selection rect when SVG group undefined"
        );
      }
      this._groupSVG.removeChild(this._selectionRectSVG);
      this._selectionRectSVG = undefined;
    }
  }

  /**
   * Render the rect behind note's text
   * @param noteOffset Note elements global offset
   */
  private renderNoteBackground(noteOffset: Point): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender note background when SVG group undefined");
    }

    if (this._noteElement.note.fret === undefined) {
      throw Error("Tried to render note bckg when note value is undefined");
    }

    const noteUUID = this._noteElement.note.uuid;
    if (this._backgroundSVG === undefined) {
      this._backgroundSVG = createSVGRect();

      // Set only-set-once attributes
      this._backgroundSVG.setAttribute("fill", "white");
      this._backgroundSVG.setAttribute("fill-opacity", "1");
      this._backgroundSVG.setAttribute("pointer-events", "none");

      // Set id
      this._backgroundSVG.setAttribute("id", `note-bck-${noteUUID}`);

      // Add element to root SVG element
      this._groupSVG.appendChild(this._backgroundSVG);
    }

    const x = `${noteOffset.x + this._noteElement.textRect.x}`;
    const y = `${noteOffset.y + this._noteElement.textRect.y}`;
    const width = `${this._noteElement.textRect.width}`;
    const height = `${this._noteElement.textRect.height}`;
    this._backgroundSVG.setAttribute("x", x);
    this._backgroundSVG.setAttribute("y", y);
    this._backgroundSVG.setAttribute("width", width);
    this._backgroundSVG.setAttribute("height", height);
    this._groupSVG.appendChild(this._backgroundSVG);
  }

  /**
   * Unrender background of the text
   */
  private unrenderNoteBackground(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender note bckg when SVG group undefined");
    }

    if (this._backgroundSVG === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._backgroundSVG);
    this._backgroundSVG = undefined;
  }

  /**
   * Render note's value as text
   * @param noteOffset Note elements global offset
   * @param noteElement Note element
   * @param selected True if note is selected, false otherwise
   */
  private renderNoteText(noteOffset: Point): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render note text when SVG group undefined");
    }

    if (this._noteElement.note.fret === undefined) {
      throw Error("Tried to render note text when note value is undefined");
    }

    const noteUUID = this._noteElement.note.uuid;
    if (this._textSVG === undefined) {
      this._textSVG = createSVGText();

      // Set only-set-once attributes
      const fontSize = `${this._tabWindow.dim.noteTextSize}px`;
      this._textSVG.setAttribute("font-size", fontSize);
      this._textSVG.setAttribute("text-anchor", "middle");
      this._textSVG.setAttribute("dominant-baseline", "middle");
      this._textSVG.setAttribute("fill", "black");
      this._textSVG.setAttribute("pointer-events", "none");
      this._textSVG.setAttribute("fill", "black");

      // Set id
      this._textSVG.setAttribute("id", `note-text-${noteUUID}`);

      // Add element to root SVG element
      this._groupSVG.appendChild(this._textSVG);
    }

    const x = `${noteOffset.x + this._noteElement.textCoords.x}`;
    const y = `${noteOffset.y + this._noteElement.textCoords.y}`;
    this._textSVG.setAttribute("x", x);
    this._textSVG.setAttribute("y", y);
    this._textSVG.textContent = `${this._noteElement.note.fret}`;
    this._groupSVG.appendChild(this._textSVG);
  }

  /**
   * Unrender text
   */
  private unrenderNoteText(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender note text when SVG group undefined");
    }

    if (this._textSVG === undefined) {
      return;
    }

    this._groupSVG.removeChild(this._textSVG);
    this._textSVG = undefined;
  }

  /**
   * Render the full note element
   * @param newBeatNotesOffset Optional new beat notes offset
   */
  public renderNoteElement(newBeatNotesOffset?: Point): void {
    this.renderGroup();

    if (this._groupSVG === undefined) {
      throw Error("Note group SVG undefined after render attempt");
    }

    if (newBeatNotesOffset !== undefined) {
      this._beatNotesOffset = new Point(
        newBeatNotesOffset.x,
        newBeatNotesOffset.y
      );
    }
    const noteOffset = new Point(
      this._beatNotesOffset.x,
      this._beatNotesOffset.y
    );

    this.renderNoteRect();

    const selected =
      this._tabWindow.getSelectedElement()?.note.uuid ===
      this._noteElement.note.uuid;

    if (selected) {
      this.renderSelectionRect();
    } else {
      this.unrenderSelectionRect();
    }

    // Render note value stuff if note value defined, remove it otherwise
    if (this._noteElement.note.fret !== undefined) {
      this.renderNoteBackground(noteOffset);
      this.renderNoteText(noteOffset);
    } else {
      this.unrenderNoteBackground();
      this.unrenderNoteText();
    }

    // Check if there are any effects to remove
    const curEffectElementUUIDs = new Set(
      this._noteElement.guitarEffectElements.map((e) => e.effect.uuid)
    );
    for (const [uuid, renderer] of this._renderedEffects) {
      if (!curEffectElementUUIDs.has(uuid)) {
        renderer.unrender();
        this._renderedEffects.delete(uuid);
      }
    }

    // Add & render new guitar effect elements
    for (const effectElement of this._noteElement.guitarEffectElements) {
      const renderedEffect = this._renderedEffects.get(
        effectElement.effect.uuid
      );
      if (renderedEffect === undefined) {
        const renderer = new SVGEffectRenderer(
          this._tabWindow,
          effectElement,
          noteOffset,
          this._assetsPath,
          this._groupSVG
        );
        renderer.renderEffect();
        this._renderedEffects.set(effectElement.effect.uuid, renderer);
      } else {
        renderedEffect.renderEffect(noteOffset);
      }
    }
  }

  /**
   * Unrender all note element's DOM elements
   */
  public unrender(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender note elem when SVG group undefined");
    }

    for (const [uuid, renderer] of this._renderedEffects) {
      renderer.unrender();
    }

    this.unrenderSelectionRect();
    this.unrenderNoteRect();
    this.unrenderNoteBackground();
    this.unrenderNoteText();

    this._parentElement.removeChild(this._groupSVG);
    this._groupSVG = undefined;
  }

  /**
   * Attaches a mouse event to the note element
   * @param eventType Type of event ('click', 'move' etc)
   * @param event Event handler itself
   */
  public attachMouseEvent<K extends keyof SVGElementEventMap>(
    eventType: K,
    eventHandler: (
      event: SVGElementEventMap[K],
      noteElement: NoteElement
    ) => void
  ): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to add note click event when SVG group undefined");
    }

    const listener = (event: Event) => {
      eventHandler(event as SVGElementEventMap[K], this._noteElement);
    };

    if (this._attachedEvents.has(eventType)) {
      this._groupSVG.removeEventListener(
        eventType,
        this._attachedEvents.get(eventType)!
      );
    }

    this._groupSVG.addEventListener(eventType, listener);
    this._attachedEvents.set(eventType, listener);
  }
}