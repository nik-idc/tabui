import { NotationElement, TrackController } from "../../controller";
import { createSVGG, createSVGRect, createSVGText } from "../../../shared";
import { TabNoteSlotElement } from "../../controller/element/note/tab-note-slot-element";
import { SVGNoteRenderer } from "./svg-note-renderer";
import { NoteValue, VoiceNumber } from "../../model";

/**
 * Class for rendering a note element using SVG
 */
export class SVGTabNoteRenderer implements SVGNoteRenderer {
  /** Track controller */
  readonly trackController: TrackController;
  /** Guitar note element */
  noteElement: TabNoteSlotElement;

  /** Container SVG group */
  private _containerGroupSVG?: SVGGElement;

  /** SVG bounding box rectangle */
  private _boundingBoxSVG?: SVGRectElement;
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
   * @param assetsPath Unused. Kept for uniform renderer constructor signature.
   */
  constructor(
    trackController: TrackController,
    noteElement: TabNoteSlotElement,
    assetsPath: string
  ) {
    this.trackController = trackController;
    this.noteElement = noteElement;
    void assetsPath;
  }

  /**
   * Ensures renderer's container group exists and returns it.
   * @returns Renderer's container SVG group element
   */
  public ensureContainerGroup(): SVGGElement {
    if (this._containerGroupSVG !== undefined) {
      return this._containerGroupSVG;
    }

    const noteUUID = this.noteElement.getStableIdentity();
    this._containerGroupSVG = createSVGG();
    this._containerGroupSVG.setAttribute("id", `note-${noteUUID}`);

    return this._containerGroupSVG;
  }

  public detachContainerGroup(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    this.detachAllMouseEvents();

    this._containerGroupSVG.parentNode?.removeChild(this._containerGroupSVG);
  }

  public updateElementReference(element: TabNoteSlotElement): void {
    this.noteElement = element;
  }

  /**
   * Renders the group element which will contain all the
   * data about the note
   */
  private renderGroup(): void {
    this.ensureContainerGroup();
  }

  private getSlotOwnerVoiceNumber(activeVoiceNumber: VoiceNumber): VoiceNumber {
    const slotElements =
      this.trackController.trackElement.getNoteElementsForNoteSlot(
        this.noteElement
      );
    const activeNoteElement = slotElements.find(
      (element) =>
        element.beatElement.beat.voiceBar.voiceNumber === activeVoiceNumber
    );

    if (activeNoteElement?.note?.fret != null) {
      return activeVoiceNumber;
    }

    let lowestFilledVoiceNumber: VoiceNumber | null = null;
    for (const noteElement of slotElements) {
      if (noteElement.note?.fret == null) {
        continue;
      }

      const voiceNumber = noteElement.beatElement.beat.voiceBar.voiceNumber;

      if (
        lowestFilledVoiceNumber === null ||
        voiceNumber < lowestFilledVoiceNumber
      ) {
        lowestFilledVoiceNumber = voiceNumber;
      }
    }

    return lowestFilledVoiceNumber ?? activeVoiceNumber;
  }

  public shouldRenderHitRect(): boolean {
    return (
      this.noteElement.beatElement.beat.voiceBar.voiceNumber ===
      this.getSlotOwnerVoiceNumber(this.trackController.activeVoiceNumber)
    );
  }

  /**
   * Render note outer rect
   */
  private renderNoteRect(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render note rect when SVG group undefined");
    }

    if (!this.shouldRenderHitRect()) {
      this.unrenderNoteRect();
      return;
    }

    const noteUUID = this.noteElement.getStableIdentity();
    if (this._boundingBoxSVG === undefined) {
      this._boundingBoxSVG = createSVGRect();

      // Set only-set-once attributes
      this._boundingBoxSVG.setAttribute("fill", "transparent");
      this._boundingBoxSVG.setAttribute("fill-opacity", "0");
      this._boundingBoxSVG.setAttribute("stroke", "none");
      this._boundingBoxSVG.setAttribute("stroke-opacity", "0");

      // Set id
      this._boundingBoxSVG.setAttribute("id", `note-rect-${noteUUID}`);

      // Add element to root SVG element
      this._containerGroupSVG.appendChild(this._boundingBoxSVG);
    }

    const isActiveVoice =
      this.noteElement.beatElement.beat.voiceBar.voiceNumber ===
      this.trackController.activeVoiceNumber;
    const isEmpty = this.noteElement.note?.noteValue === NoteValue.None;
    const isInteractable = isActiveVoice || !isEmpty;

    const hitRect =
      this.noteElement.note === null
        ? this.noteElement.barLocalBoundingBox
        : this.noteElement.textRectBarLocal;
    const x = `${hitRect.x}`;
    const y = `${hitRect.y}`;
    const width = `${hitRect.width}`;
    const height = `${hitRect.height}`;
    this._boundingBoxSVG.setAttribute("x", x);
    this._boundingBoxSVG.setAttribute("y", y);
    this._boundingBoxSVG.setAttribute("width", width);
    this._boundingBoxSVG.setAttribute("height", height);
    this._boundingBoxSVG.setAttribute(
      "pointer-events",
      isInteractable ? "all" : "none"
    );
  }

  /**
   * Unrender background of the text
   */
  private unrenderNoteRect(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to unrender note rect when SVG group undefined");
    }

    if (this._boundingBoxSVG === undefined) {
      return;
    }

    this._containerGroupSVG.removeChild(this._boundingBoxSVG);
    this._boundingBoxSVG = undefined;
  }

  /**
   * Renders the selection rectangle for the note
   */
  private renderSelectionRect(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error(
        "Tried to render note selection rect when SVG group undefined"
      );
    }
    if (this._selectionRectSVG === undefined) {
      this._selectionRectSVG = createSVGRect();
      this._selectionRectSVG.setAttribute(
        "id",
        `note-selection-${this.noteElement.getStableIdentity()}`
      );
      this._selectionRectSVG.setAttribute(
        "fill",
        "var(--tu-notation-selection-fill)"
      );
      this._selectionRectSVG.setAttribute(
        "stroke",
        "var(--tu-notation-selection-stroke)"
      );
      this._selectionRectSVG.setAttribute("stroke-width", "1");
      this._selectionRectSVG.setAttribute("rx", "3");
      this._selectionRectSVG.setAttribute("ry", "3");
      this._containerGroupSVG.appendChild(this._selectionRectSVG);
    }

    const x = `${this.noteElement.selectionRect.x}`;
    const y = `${this.noteElement.selectionRect.y}`;
    const width = `${this.noteElement.selectionRect.width}`;
    const height = `${this.noteElement.selectionRect.height}`;
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
      if (this._containerGroupSVG === undefined) {
        throw Error(
          "Tried to unrender note selection rect when SVG group undefined"
        );
      }
      this._containerGroupSVG.removeChild(this._selectionRectSVG);
      this._selectionRectSVG = undefined;
    }
  }

  /**
   * Render the rect behind note's text
   * @param noteOffset Note element global offset
   */
  private renderNoteBackground(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to unrender note background when SVG group undefined");
    }

    if (this.noteElement.note?.fret == null) {
      throw Error("Tried to render note bckg when note value is undefined");
    }

    const noteUUID = this.noteElement.getStableIdentity();
    if (this._backgroundSVG === undefined) {
      this._backgroundSVG = createSVGRect();

      // Set only-set-once attributes
      this._backgroundSVG.setAttribute(
        "fill",
        "var(--tu-notation-note-background)"
      );
      this._backgroundSVG.setAttribute("fill-opacity", "1");
      this._backgroundSVG.setAttribute("pointer-events", "none");

      // Set id
      this._backgroundSVG.setAttribute("id", `note-bck-${noteUUID}`);

      // Add element to root SVG element
      this._containerGroupSVG.appendChild(this._backgroundSVG);
    }

    const x = `${this.noteElement.textRectBarLocal.x}`;
    const y = `${this.noteElement.textRectBarLocal.y}`;
    const width = `${this.noteElement.textRect.width}`;
    const height = `${this.noteElement.textRect.height}`;
    this._backgroundSVG.setAttribute("x", x);
    this._backgroundSVG.setAttribute("y", y);
    this._backgroundSVG.setAttribute("width", width);
    this._backgroundSVG.setAttribute("height", height);
    this._containerGroupSVG.appendChild(this._backgroundSVG);
  }

  /**
   * Unrender background of the text
   */
  private unrenderNoteBackground(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to unrender note bckg when SVG group undefined");
    }

    if (this._backgroundSVG === undefined) {
      return;
    }

    this._containerGroupSVG.removeChild(this._backgroundSVG);
    this._backgroundSVG = undefined;
  }

  /**
   * Render note's value as text
   */
  private renderNoteText(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to render note text when SVG group undefined");
    }

    const note = this.noteElement.note;
    if (note === null || note.fret === null) {
      throw Error("Tried to render note text when note value is undefined");
    }

    const noteUUID = this.noteElement.getStableIdentity();
    if (this._textSVG === undefined) {
      this._textSVG = createSVGText();

      // Set only-set-once attributes
      const fontSize = `${this.trackController.layoutDimensions.NOTE_TEXT_SIZE}px`;
      this._textSVG.setAttribute("font-size", fontSize);
      this._textSVG.setAttribute("text-anchor", "middle");
      this._textSVG.setAttribute("dominant-baseline", "middle");
      this._textSVG.setAttribute("pointer-events", "none");

      // Set id
      this._textSVG.setAttribute("id", `note-text-${noteUUID}`);

      // Add element to root SVG element
      this._containerGroupSVG.appendChild(this._textSVG);
    }

    const x = `${this.noteElement.textCoordsBarLocal.x}`;
    const y = `${this.noteElement.textCoordsBarLocal.y}`;
    this._textSVG.setAttribute("x", x);
    this._textSVG.setAttribute("y", y);
    this._textSVG.setAttribute("fill", "var(--tu-notation-text)");
    this._textSVG.textContent = this.noteElement.noteText;
    this._containerGroupSVG.appendChild(this._textSVG);
  }

  /**
   * Unrender text
   */
  private unrenderNoteText(): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to unrender note text when SVG group undefined");
    }

    if (this._textSVG === undefined) {
      return;
    }

    this._containerGroupSVG.removeChild(this._textSVG);
    this._textSVG = undefined;
  }

  /**
   * Render the full note element
   */
  public render(): void {
    this.renderGroup();

    if (this._containerGroupSVG === undefined) {
      throw Error("Note group SVG undefined after render attempt");
    }

    this.renderNoteRect();
    this.unrenderSelectionRect();

    // Render note value stuff if note value defined, remove it otherwise
    if (this.noteElement.note?.fret != null) {
      this.renderNoteBackground();
      this.renderNoteText();
    } else {
      this.unrenderNoteBackground();
      this.unrenderNoteText();
    }
  }

  /**
   * Unrender all note element's DOM element
   */
  public unrender(): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    this.unrenderSelectionRect();
    this.unrenderNoteRect();
    this.unrenderNoteBackground();
    this.unrenderNoteText();
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
      noteElement: TabNoteSlotElement
    ) => void
  ): void {
    if (this._containerGroupSVG === undefined) {
      throw Error("Tried to add note click event when SVG group undefined");
    }

    const listener = (event: Event) => {
      eventHandler(event as SVGElementEventMap[K], this.noteElement);
    };

    if (this._attachedEvents.has(eventType)) {
      this._containerGroupSVG.removeEventListener(
        eventType,
        this._attachedEvents.get(eventType)!
      );
    }

    this._containerGroupSVG.addEventListener(eventType, listener);
    this._attachedEvents.set(eventType, listener);
  }

  public detachMouseEvent<K extends keyof SVGElementEventMap>(
    eventType: K
  ): void {
    if (this._containerGroupSVG === undefined) {
      return;
    }

    const listener = this._attachedEvents.get(eventType);
    if (listener === undefined) {
      return;
    }

    this._containerGroupSVG.removeEventListener(eventType, listener);
    this._attachedEvents.delete(eventType);
  }

  public detachAllMouseEvents(): void {
    if (this._containerGroupSVG === undefined) {
      this._attachedEvents.clear();
      return;
    }

    for (const [eventType, listener] of this._attachedEvents) {
      this._containerGroupSVG.removeEventListener(eventType, listener);
    }
    this._attachedEvents.clear();
  }
}
