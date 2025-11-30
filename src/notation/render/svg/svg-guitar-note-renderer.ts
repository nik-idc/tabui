import { TabLayoutDimensions, TrackController } from "@/notation/controller";
import { Point, createSVGG, createSVGRect, createSVGText } from "@/shared";
import { ElementRenderer } from "../element-renderer";
import { GuitarNoteElement } from "@/notation/controller/element/guitar-note-element";
import { SVGTechniqueRenderer } from "./svg-technique-renderer";
import { SVGNoteRenderer } from "./svg-note-renderer";

/**
 * Class for rendering a note element using SVG
 */
export class SVGGuitarNoteRenderer implements SVGNoteRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Guitar note element */
  readonly noteElement: GuitarNoteElement;

  /** Path to any assets */
  private _assetsPath: string;
  /** Parent SVG group element */
  private _parentElement: SVGGElement;

  /** Rendered techniques map */
  private _renderedTechniques: Map<number, SVGTechniqueRenderer>;

  /** Container SVG group */
  private _groupSVG?: SVGGElement;
  /** SVG rectangle element */
  private _rectSVG?: SVGRectElement;
  /** SVG text element */
  private _textSVG?: SVGTextElement;
  /** SVG background rectangle */
  private _backgroundSVG?: SVGRectElement;

  /** SVG selection rectangle */
  private _selectionRectSVG?: SVGRectElement;

  /** Any events attached to the rendered group */
  private _attachedEvents: Map<string, EventListener> = new Map();

  /**
   * Class for rendering a note element using SVG
   * @param trackController Track controller
   * @param noteElement Note element
   * @param assetsPath Path to assets
   * @param parentElement SVG parent element (a beat element in this case)
   */
  constructor(
    trackController: TrackController,
    noteElement: GuitarNoteElement,
    assetsPath: string,
    parentElement: SVGGElement
  ) {
    this.trackController = trackController;
    this.noteElement = noteElement;

    this._assetsPath = assetsPath;
    this._parentElement = parentElement;

    this._renderedTechniques = new Map();
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

    const noteUUID = this.noteElement.note.uuid;
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

    const noteUUID = this.noteElement.note.uuid;
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

    const x = `${this.noteElement.globalCoords.x}`;
    const y = `${this.noteElement.globalCoords.y}`;
    const width = `${this.noteElement.rect.width}`;
    const height = `${this.noteElement.rect.height}`;
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
        `note-selection-${this.noteElement.note.uuid}`
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
      this.noteElement.globalCoords.x + this.noteElement.textRect.x - padding
    }`;
    const y = `${
      this.noteElement.globalCoords.y + this.noteElement.textRect.y - padding
    }`;
    const width = `${this.noteElement.textRect.width + padding * 2}`;
    const height = `${this.noteElement.textRect.height + padding * 2}`;
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
   * @param noteOffset Note element global offset
   */
  private renderNoteBackground(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender note background when SVG group undefined");
    }

    if (this.noteElement.note.fret === null) {
      throw Error("Tried to render note bckg when note value is undefined");
    }

    const noteUUID = this.noteElement.note.uuid;
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

    const x = `${
      this.noteElement.globalCoords.x + this.noteElement.textRect.x
    }`;
    const y = `${
      this.noteElement.globalCoords.y + this.noteElement.textRect.y
    }`;
    const width = `${this.noteElement.textRect.width}`;
    const height = `${this.noteElement.textRect.height}`;
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
   */
  private renderNoteText(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to render note text when SVG group undefined");
    }

    if (this.noteElement.note.fret === null) {
      throw Error("Tried to render note text when note value is undefined");
    }

    const noteUUID = this.noteElement.note.uuid;
    if (this._textSVG === undefined) {
      this._textSVG = createSVGText();

      // Set only-set-once attributes
      const fontSize = `${TabLayoutDimensions.NOTE_TEXT_SIZE}px`;
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

    const x = `${
      this.noteElement.globalCoords.x + this.noteElement.textCoords.x
    }`;
    const y = `${
      this.noteElement.globalCoords.y + this.noteElement.textCoords.y
    }`;
    this._textSVG.setAttribute("x", x);
    this._textSVG.setAttribute("y", y);
    this._textSVG.textContent = `${this.noteElement.note.fret}`;
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
   */
  public render(): void {
    this.renderGroup();

    if (this._groupSVG === undefined) {
      throw Error("Note group SVG undefined after render attempt");
    }

    this.renderNoteRect();

    const selectedNote =
      this.trackController.trackControllerEditor.selectionManager.selectedNote;
    if (this.noteElement.note === selectedNote?.note) {
      this.renderSelectionRect();
    } else {
      this.unrenderSelectionRect();
    }

    // Render note value stuff if note value defined, remove it otherwise
    if (this.noteElement.note.fret !== null) {
      this.renderNoteBackground();
      this.renderNoteText();
    } else {
      this.unrenderNoteBackground();
      this.unrenderNoteText();
    }

    // Check if there are any techniques to remove
    const curTechniqueElementUUIDs = new Set(
      this.noteElement.guitarTechniqueElements.map((e) => e.technique.uuid)
    );
    for (const [uuid, renderer] of this._renderedTechniques) {
      if (!curTechniqueElementUUIDs.has(uuid)) {
        renderer.unrender();
        this._renderedTechniques.delete(uuid);
      }
    }

    // Add & render new guitar technique element
    for (const techniqueElement of this.noteElement.guitarTechniqueElements) {
      const renderedTechnique = this._renderedTechniques.get(
        techniqueElement.technique.uuid
      );
      if (renderedTechnique === undefined) {
        const renderer = new SVGTechniqueRenderer(
          this.trackController,
          techniqueElement,
          this._assetsPath,
          this._groupSVG
        );
        renderer.render();
        this._renderedTechniques.set(techniqueElement.technique.uuid, renderer);
      } else {
        renderedTechnique.render();
      }
    }
  }

  /**
   * Unrender all note element's DOM element
   */
  public unrender(): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to unrender note elem when SVG group undefined");
    }

    for (const [uuid, renderer] of this._renderedTechniques) {
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
      noteElement: GuitarNoteElement
    ) => void
  ): void {
    if (this._groupSVG === undefined) {
      throw Error("Tried to add note click event when SVG group undefined");
    }

    const listener = (event: Event) => {
      eventHandler(event as SVGElementEventMap[K], this.noteElement);
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
